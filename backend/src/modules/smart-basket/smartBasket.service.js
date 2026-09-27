/**
 * Smart Basket Service.
 * Generates budget-aware product baskets from real inventory.
 * Enforces server-authoritative pricing — frontend prices are never trusted.
 */

import { getDb } from '../../db/client.js';
import { COLLECTIONS } from '../../db/collections.js';
import { toObjectId, isValidObjectId } from '../../utils/ids.js';
import { AppError } from '../../utils/errors.js';
import { getUpcomingSlots } from '../../utils/slots.js';
import { processCheckout } from '../orders/checkout.service.js';

/**
 * Category keyword → categorySlug mappings.
 * Maps common user-facing terms to actual slug values stored in DB:
 * ['vegetables', 'fruit', 'dairy-and-eggs', 'bakery', 'honey-and-jam', 'herbs-and-flowers', 'meat-and-fish']
 */
const CATEGORY_KEYWORD_MAP = {
  vegetables: ['vegetables', 'vegetable', 'veggies', 'greens', 'produce', 'tomatoes', 'carrots', 'spinach', 'kale', 'potatoes', 'corn', 'squash', 'beets', 'mushrooms'],
  fruit: ['fruits', 'fruit', 'berries', 'strawberries', 'blueberries', 'raspberries', 'apples', 'pears', 'cider', 'bananas', 'pineapple', 'oranges'],
  'dairy-and-eggs': ['dairy', 'milk', 'cheese', 'yogurt', 'butter', 'eggs', 'egg', 'poultry', 'cream'],
  bakery: ['bakery', 'bread', 'loaf', 'baked', 'croissant', 'sourdough', 'pastry', 'pastries', 'bagel'],
  'honey-and-jam': ['honey', 'jam', 'preserves', 'marmalade', 'butter', 'chutney'],
  'herbs-and-flowers': ['herbs', 'herb', 'spices', 'flowers', 'plants', 'lavender', 'basil', 'bouquet'],
  'meat-and-fish': ['meat', 'chicken', 'pork', 'beef', 'fish', 'seafood', 'sausages', 'sausage', 'trout', 'bass'],
};

const DAY_MAP = {
  monday: 'mon',
  mon: 'mon',
  tuesday: 'tue',
  tue: 'tue',
  wednesday: 'wed',
  wed: 'wed',
  thursday: 'thu',
  thu: 'thu',
  friday: 'fri',
  fri: 'fri',
  saturday: 'sat',
  sat: 'sat',
  sunday: 'sun',
  sun: 'sun',
};

/**
 * Known item keywords mapped to canonical item names and default category slugs.
 */
const ITEM_KEYWORD_MAP = {
  tomatoes: { canonical: 'tomatoes', slug: 'vegetables' },
  tomato: { canonical: 'tomatoes', slug: 'vegetables' },
  spinach: { canonical: 'spinach', slug: 'vegetables' },
  kale: { canonical: 'kale', slug: 'vegetables' },
  carrots: { canonical: 'carrots', slug: 'vegetables' },
  carrot: { canonical: 'carrots', slug: 'vegetables' },
  potatoes: { canonical: 'potatoes', slug: 'vegetables' },
  potato: { canonical: 'potatoes', slug: 'vegetables' },
  onions: { canonical: 'onions', slug: 'vegetables' },
  onion: { canonical: 'onions', slug: 'vegetables' },
  corn: { canonical: 'corn', slug: 'vegetables' },
  squash: { canonical: 'squash', slug: 'vegetables' },
  mushrooms: { canonical: 'mushrooms', slug: 'vegetables' },
  mushroom: { canonical: 'mushrooms', slug: 'vegetables' },
  beets: { canonical: 'beets', slug: 'vegetables' },
  bananas: { canonical: 'bananas', slug: 'fruit' },
  banana: { canonical: 'bananas', slug: 'fruit' },
  pineapple: { canonical: 'pineapple', slug: 'fruit' },
  pineapples: { canonical: 'pineapple', slug: 'fruit' },
  apples: { canonical: 'apples', slug: 'fruit' },
  apple: { canonical: 'apples', slug: 'fruit' },
  pears: { canonical: 'pears', slug: 'fruit' },
  pear: { canonical: 'pears', slug: 'fruit' },
  berries: { canonical: 'berries', slug: 'fruit' },
  strawberries: { canonical: 'strawberries', slug: 'fruit' },
  blueberries: { canonical: 'blueberries', slug: 'fruit' },
  raspberries: { canonical: 'raspberries', slug: 'fruit' },
  cider: { canonical: 'cider', slug: 'fruit' },
  eggs: { canonical: 'eggs', slug: 'dairy-and-eggs' },
  egg: { canonical: 'eggs', slug: 'dairy-and-eggs' },
  milk: { canonical: 'milk', slug: 'dairy-and-eggs' },
  cheese: { canonical: 'cheese', slug: 'dairy-and-eggs' },
  cheddar: { canonical: 'cheddar', slug: 'dairy-and-eggs' },
  butter: { canonical: 'butter', slug: 'dairy-and-eggs' },
  ricotta: { canonical: 'ricotta', slug: 'dairy-and-eggs' },
  bread: { canonical: 'bread', slug: 'bakery' },
  sourdough: { canonical: 'sourdough', slug: 'bakery' },
  pastry: { canonical: 'pastry', slug: 'bakery' },
  pastries: { canonical: 'pastries', slug: 'bakery' },
  croissant: { canonical: 'croissant', slug: 'bakery' },
  honey: { canonical: 'honey', slug: 'honey-and-jam' },
  jam: { canonical: 'jam', slug: 'honey-and-jam' },
  preserves: { canonical: 'preserves', slug: 'honey-and-jam' },
  trout: { canonical: 'trout', slug: 'meat-and-fish' },
  fish: { canonical: 'fish', slug: 'meat-and-fish' },
  bass: { canonical: 'bass', slug: 'meat-and-fish' },
  chicken: { canonical: 'chicken', slug: 'meat-and-fish' },
  beef: { canonical: 'beef', slug: 'meat-and-fish' },
  pork: { canonical: 'pork', slug: 'meat-and-fish' },
  sausage: { canonical: 'sausage', slug: 'meat-and-fish' },
  sausages: { canonical: 'sausages', slug: 'meat-and-fish' },
  basil: { canonical: 'basil', slug: 'herbs-and-flowers' },
  herbs: { canonical: 'herbs', slug: 'herbs-and-flowers' },
  lavender: { canonical: 'lavender', slug: 'herbs-and-flowers' },
  flowers: { canonical: 'flowers', slug: 'herbs-and-flowers' },
};

/**
 * Parses natural language prompt like:
 * "I have ₦10,000. I need vegetables, fruits and eggs for Saturday."
 * "I need 2 baskets of tomatoes, 1 crate of eggs and 3 bunches of bananas for ₦15,000"
 * Extracts budget, day, categories, itemKeywords, and requestedQuantities.
 *
 * @param {string} prompt
 * @returns {{ budget: number|null, day: string|null, categories: string[], itemKeywords: string[], requestedQuantities: Record<string, number> }}
 */
export function parseNaturalPrompt(prompt) {
  if (!prompt || typeof prompt !== 'string') {
    return { budget: null, day: null, categories: [], itemKeywords: [], requestedQuantities: {} };
  }

  const clean = prompt.toLowerCase().trim();

  // 1. Precise budget extraction
  let budget = null;
  // Match "10k", "5k", "₦15k"
  const kMatch = clean.match(/(?:[₦$#]|budget\s*(?:of|is|:)?\s*|have\s*|within\s*)?\s*(\d+)k\b/i);
  // Match explicit currency symbol: "₦10,000", "$50", "#5000"
  const symMatch = clean.match(/(?:[₦$#]|ngn|naira)\s*([\d,]+(?:\.\d+)?)/i);
  // Match keywords: "budget of 10000", "have 10,000", "within 8000", "spending 5000"
  const kwMatch = clean.match(/(?:budget\s*(?:of|is|:)?\s*|have\s*|within\s*|under\s*|spending\s*)[₦$#]?\s*([\d,]+(?:\.\d+)?)/i);
  // Match trailing currency suffix: "10,000 naira", "5000 ngn"
  const postMatch = clean.match(/([\d,]+(?:\.\d+)?)\s*(?:naira|ngn|kobo)/i);

  if (kMatch && kMatch[1]) {
    budget = parseFloat(kMatch[1]) * 1000;
  } else if (symMatch && symMatch[1]) {
    budget = parseFloat(symMatch[1].replace(/,/g, ''));
  } else if (kwMatch && kwMatch[1]) {
    budget = parseFloat(kwMatch[1].replace(/,/g, ''));
  } else if (postMatch && postMatch[1]) {
    budget = parseFloat(postMatch[1].replace(/,/g, ''));
  } else {
    // Standalone 3-7 digit number >= 100 that is likely budget
    const allNums = clean.match(/\b\d{3,7}\b/g);
    if (allNums && allNums.length > 0) {
      budget = parseFloat(allNums[allNums.length - 1]);
    }
  }

  // 2. Day extraction
  let day = null;
  for (const [dayName, dayCode] of Object.entries(DAY_MAP)) {
    const regex = new RegExp(`\\b${dayName}\\b`, 'i');
    if (regex.test(clean)) {
      day = dayCode;
      break;
    }
  }

  // 3. Requested Quantities extraction
  // e.g. "2 baskets of tomatoes", "3 bunches of bananas", "1 crate of eggs", "2 loaves of bread", "4 apples"
  const requestedQuantities = {};
  const qtyRegex = /(\d+)\s*(?:baskets?|bunches?|crates?|jars?|loaves|loaf|bags?|lbs?|kg|packs?|pieces?|units?|pots?)?\s*(?:of\s+)?([a-z-]+)/gi;
  let match;
  while ((match = qtyRegex.exec(clean)) !== null) {
    const qty = parseInt(match[1], 10);
    const rawWord = match[2].toLowerCase().trim();
    if (qty > 0 && ITEM_KEYWORD_MAP[rawWord]) {
      const canonical = ITEM_KEYWORD_MAP[rawWord].canonical;
      requestedQuantities[canonical] = qty;
    }
  }

  // 4. Category & item keyword extraction
  const categories = new Set();
  const itemKeywords = new Set();

  // Add items from ITEM_KEYWORD_MAP
  for (const [kw, info] of Object.entries(ITEM_KEYWORD_MAP)) {
    const kwRegex = new RegExp(`\\b${kw}\\b`, 'i');
    if (kwRegex.test(clean)) {
      categories.add(info.slug);
      itemKeywords.add(info.canonical);
      if (!requestedQuantities[info.canonical]) {
        requestedQuantities[info.canonical] = 1;
      }
    }
  }

  // Broad category keywords
  for (const [slug, keywords] of Object.entries(CATEGORY_KEYWORD_MAP)) {
    for (const kw of keywords) {
      const kwRegex = new RegExp(`\\b${kw}\\b`, 'i');
      if (kwRegex.test(clean)) {
        categories.add(slug);
        itemKeywords.add(kw);
      }
    }
  }

  return {
    budget,
    day,
    categories: [...categories],
    itemKeywords: [...itemKeywords],
    requestedQuantities,
  };
}

/**
 * Resolves requested category keywords or slugs to actual slugs in DB.
 *
 * @param {string[]} categories
 * @param {import('mongodb').Db} db
 * @returns {Promise<string[]>}
 */
async function resolveCategorySlugs(categories, db) {
  if (!Array.isArray(categories) || categories.length === 0) return [];

  const candidateSlugs = new Set();
  for (const cat of categories) {
    const normalized = String(cat).toLowerCase().trim();
    // Direct slug match
    candidateSlugs.add(normalized);
    // Reverse keyword lookup
    for (const [slug, keywords] of Object.entries(CATEGORY_KEYWORD_MAP)) {
      if (slug === normalized || keywords.includes(normalized)) {
        candidateSlugs.add(slug);
      }
    }
  }

  // Confirm these slugs exist in DB categories collection
  const dbCategories = await db
    .collection(COLLECTIONS.CATEGORIES)
    .find({ slug: { $in: [...candidateSlugs] }, active: true })
    .project({ slug: 1 })
    .toArray();

  return dbCategories.map((c) => c.slug);
}

/**
 * Generates a budget-aware smart basket from live product inventory.
 *
 * @param {object} params
 * @param {string} [params.prompt] - Optional natural language input e.g. "I have ₦10,000..."
 * @param {number} [params.budget] - Budget (e.g. 10000 or 50)
 * @param {string[]} [params.categories] - Requested category names or slugs
 * @param {string} [params.marketId] - Optional market filter
 * @param {string} [params.day] - Optional market operating day e.g. 'sat'
 * @param {string} [params.pickupDate] - Optional pickup date (ISO string or YYYY-MM-DD)
 * @param {string} [params.pickupTime] - Optional preferred pickup time slot
 * @returns {Promise<object>} Basket result with items, totals, market groups, alternatives
 */
export async function generateBasket({
  prompt,
  budget: rawBudget,
  categories: rawCategories,
  marketId,
  day: rawDay,
  pickupDate,
  pickupTime,
}) {
  const db = getDb();

  // If prompt is provided, extract missing fields
  let parsed = { budget: null, day: null, categories: [], itemKeywords: [] };
  if (prompt) {
    parsed = parseNaturalPrompt(prompt);
  }

  const effectiveBudget = rawBudget !== undefined && rawBudget !== null && rawBudget !== ''
    ? Number(rawBudget)
    : parsed.budget || 10000;

  // Determine budget unit
  // In the DB, prices are integers in cents like 450 ($4.50), 600 ($6.00), 1200 ($12.00).
  // If budget >= 1000 (e.g. 5000 for $50.00, or legacy 10000), treat as direct cents.
  // If budget < 1000 (e.g. 50 for $50.00), scale by 100 to convert to cents.
  const budgetCents = effectiveBudget >= 1000
    ? Math.round(effectiveBudget)
    : Math.round(effectiveBudget * 100);

  // Day filter
  let effectiveDay = rawDay || parsed.day || null;
  if (!effectiveDay && pickupDate) {
    const d = new Date(pickupDate);
    if (!isNaN(d.getTime())) {
      const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
      effectiveDay = days[d.getDay()];
    }
  }

  // Categories
  const candidateCategories = Array.isArray(rawCategories) && rawCategories.length > 0
    ? rawCategories
    : parsed.categories;

  // Extract explicit item keywords from candidateCategories as well (e.g. "eggs", "tomatoes", "bananas")
  const explicitItemKeywords = new Set(parsed.itemKeywords || []);
  const explicitRequestedQuantities = { ...(parsed.requestedQuantities || {}) };

  if (Array.isArray(candidateCategories)) {
    for (const cat of candidateCategories) {
      const catLower = String(cat).toLowerCase().trim();
      if (ITEM_KEYWORD_MAP[catLower]) {
        const itemInfo = ITEM_KEYWORD_MAP[catLower];
        explicitItemKeywords.add(itemInfo.canonical);
        if (!explicitRequestedQuantities[itemInfo.canonical]) {
          explicitRequestedQuantities[itemInfo.canonical] = 1;
        }
      }
    }
  }

  // 1. Resolve category slugs from DB
  let slugs = await resolveCategorySlugs(candidateCategories, db);
  const isExplicitCategories = candidateCategories && candidateCategories.length > 0 && slugs.length > 0;

  if (slugs.length === 0) {
    // Fallback: general fresh produce categories
    const fallbackCategories = await db
      .collection(COLLECTIONS.CATEGORIES)
      .find({ active: true })
      .project({ slug: 1 })
      .limit(6)
      .toArray();
    slugs = fallbackCategories.map((c) => c.slug);
  }

  // 2. Fetch matching active markets
  const marketFilter = { status: 'active' };
  if (marketId && isValidObjectId(marketId)) {
    marketFilter._id = toObjectId(marketId);
  } else if (effectiveDay) {
    marketFilter['schedule.day'] = effectiveDay;
  }

  const marketsRaw = await db
    .collection(COLLECTIONS.MARKETS)
    .find(marketFilter)
    .project({ _id: 1, name: 1, address: 1, location: 1, schedule: 1, facilities: 1, city: 1 })
    .toArray();

  const marketMap = new Map(marketsRaw.map((m) => [m._id.toString(), m]));
  const validMarketIds = marketsRaw.map((m) => m._id);

  // 3. Fetch active farmers belonging to these markets (and operating on day if specified)
  const farmerFilter = {
    listingEnabled: { $ne: false },
    acceptingOrders: { $ne: false },
    status: { $ne: 'paused' },
  };

  if (validMarketIds.length > 0) {
    farmerFilter.marketIds = { $in: validMarketIds };
  }
  if (effectiveDay) {
    farmerFilter.operatingDays = effectiveDay;
  }

  const farmersRaw = await db
    .collection(COLLECTIONS.FARMERS)
    .find(farmerFilter)
    .project({
      _id: 1,
      stallName: 1,
      contactPerson: 1,
      marketIds: 1,
      location: 1,
      ratingAvg: 1,
      ratingCount: 1,
      operatingDays: 1,
      pickupWindows: 1,
      imageUrl: 1,
      art: 1,
      specialty: 1,
    })
    .toArray();

  const farmerMap = new Map(farmersRaw.map((f) => [f._id.toString(), f]));
  const validFarmerIds = farmersRaw.map((f) => f._id);

  // 4. Build product query filter
  const productFilter = {
    availability: { $in: ['in', 'low'] },
    quantityAvailable: { $gt: 0 },
    listed: { $ne: false },
    archived: { $ne: true },
  };

  if (validFarmerIds.length > 0) {
    productFilter.farmerId = { $in: validFarmerIds };
  }
  if (validMarketIds.length > 0) {
    productFilter.marketIds = { $in: validMarketIds };
  }

  // Fetch candidate products
  const candidateProducts = await db
    .collection(COLLECTIONS.PRODUCTS)
    .find(productFilter)
    .sort({ featuredScore: -1, ratingAvg: -1, salesCount: -1, priceCents: 1 })
    .limit(300)
    .toArray();

  if (candidateProducts.length === 0) {
    return {
      budget: effectiveBudget,
      budgetCents,
      day: effectiveDay,
      marketId: marketId || null,
      items: [],
      totalCents: 0,
      remainingBudgetCents: budgetCents,
      marketGroups: [],
      message: effectiveDay
        ? `No products available for ${effectiveDay.toUpperCase()} pickup right now. Try another day or market.`
        : 'No products available matching your request right now.',
    };
  }

  // 5. Group candidate products by category slug
  const bySlug = new Map();
  for (const product of candidateProducts) {
    const slug = product.categorySlug || 'other';
    if (!bySlug.has(slug)) bySlug.set(slug, []);
    bySlug.get(slug).push(product);
  }

  // Sort each slug bucket: availability 'in' first, then ratingAvg desc, then priceCents asc
  for (const [, products] of bySlug) {
    products.sort((a, b) => {
      const aIn = a.availability === 'in' ? 0 : 1;
      const bIn = b.availability === 'in' ? 0 : 1;
      if (aIn !== bIn) return aIn - bIn;
      const ratingDiff = (b.ratingAvg || 0) - (a.ratingAvg || 0);
      if (ratingDiff !== 0) return ratingDiff;
      return (a.priceCents || 0) - (b.priceCents || 0);
    });
  }

  // 6. Greedy budget allocation
  const selectedItems = new Map(); // productId → { product, farmer, quantity }
  let spentCents = 0;

  // Ordered slugs: requested slugs first, strictly adhering to requested categories if specified
  const orderedSlugs = isExplicitCategories ? slugs : [...new Set([...slugs, ...bySlug.keys()])];

  // Specific item matching (if prompt or categories mentioned e.g. "tomatoes", "eggs", "apples")
  if (explicitItemKeywords && explicitItemKeywords.size > 0) {
    for (const kw of explicitItemKeywords) {
      const matchedProd = candidateProducts.find((p) => {
        const pName = p.name.toLowerCase();
        return pName.includes(kw) && !selectedItems.has(p._id.toString());
      });

      if (matchedProd) {
        const farmer = farmerMap.get(matchedProd.farmerId.toString());
        if (!farmer) continue;

        // Check if there is an explicit requested quantity
        const desiredQty = explicitRequestedQuantities[kw] || 1;
        const availableStock = typeof matchedProd.quantityAvailable === 'number' ? matchedProd.quantityAvailable : 1;
        const maxFitInBudget = Math.floor((budgetCents - spentCents) / matchedProd.priceCents);
        const assignedQty = Math.min(desiredQty, availableStock, Math.max(1, maxFitInBudget));

        if (assignedQty > 0 && spentCents + matchedProd.priceCents * assignedQty <= budgetCents) {
          selectedItems.set(matchedProd._id.toString(), {
            product: matchedProd,
            farmer,
            quantity: assignedQty,
            explicitQuantity: Boolean(explicitRequestedQuantities[kw]),
          });
          spentCents += matchedProd.priceCents * assignedQty;
        }
      }
    }
  }

  // First pass: pick top 1 product from each ordered slug if budget remains
  for (const slug of orderedSlugs) {
    const products = bySlug.get(slug);
    if (!products || products.length === 0) continue;

    for (const product of products) {
      const productId = product._id.toString();
      if (selectedItems.has(productId)) break; // already picked via keyword
      if (spentCents + product.priceCents > budgetCents) continue;

      const farmer = farmerMap.get(product.farmerId.toString());
      if (!farmer) continue;

      selectedItems.set(productId, { product, farmer, quantity: 1, explicitQuantity: false });
      spentCents += product.priceCents;
      break; // one per slug in first pass
    }
  }

  // Second pass: if budget remains, try to increment quantities or add more variety from orderedSlugs
  let improved = true;
  let safetyLimit = 35;
  while (improved && safetyLimit-- > 0) {
    improved = false;
    const remainingCents = budgetCents - spentCents;
    if (remainingCents <= 0) break;

    // A. Increment quantity of non-explicit existing items if budget allows and stock available
    for (const [, entry] of selectedItems) {
      const { product } = entry;
      const stockLimit = typeof product.quantityAvailable === 'number' ? product.quantityAvailable : 0;
      const canAddMore = !entry.explicitQuantity && entry.quantity < stockLimit && entry.quantity < 5;
      if (canAddMore && product.priceCents <= remainingCents) {
        entry.quantity += 1;
        spentCents += product.priceCents;
        improved = true;
        break;
      }
    }

    // B. If cannot increment, try adding another unique product from orderedSlugs
    if (!improved) {
      for (const slug of orderedSlugs) {
        const products = bySlug.get(slug) || [];
        for (const product of products) {
          const productId = product._id.toString();
          if (selectedItems.has(productId)) continue;
          if (product.priceCents > remainingCents) continue;

          const farmer = farmerMap.get(product.farmerId.toString());
          if (!farmer) continue;

          selectedItems.set(productId, { product, farmer, quantity: 1 });
          spentCents += product.priceCents;
          improved = true;
          break;
        }
        if (improved) break;
      }
    }
  }

  // 7. Shape response items and find alternatives for each item (powers "Replace an item")
  const items = [];
  for (const [, { product, farmer, quantity }] of selectedItems) {
    // Resolve market for this product
    let resolvedMarket = null;
    if (Array.isArray(product.marketIds)) {
      for (const mId of product.marketIds) {
        const m = marketMap.get(mId.toString());
        if (m) {
          if (marketId && mId.toString() === marketId) {
            resolvedMarket = m;
            break;
          }
          if (!resolvedMarket) resolvedMarket = m;
        }
      }
    }

    // Find 3 alternative products in the same category or farmer
    const alternatives = candidateProducts
      .filter((p) =>
        p._id.toString() !== product._id.toString() &&
        !selectedItems.has(p._id.toString()) &&
        (p.categorySlug === product.categorySlug || p.farmerId.toString() === product.farmerId.toString())
      )
      .slice(0, 3)
      .map((alt) => {
        const altFarmer = farmerMap.get(alt.farmerId.toString());
        return {
          productId: alt._id.toString(),
          name: alt.name,
          priceCents: alt.priceCents,
          unit: alt.unit,
          quantityAvailable: alt.quantityAvailable,
          availability: alt.availability,
          categorySlug: alt.categorySlug,
          art: alt.art || null,
          imageUrl: alt.imageUrl || null,
          farmerName: altFarmer?.stallName || 'Local Farm',
        };
      });

    // Resolve farmer pickup windows for the day
    const dayWindows = Array.isArray(farmer.pickupWindows)
      ? farmer.pickupWindows.filter((pw) => !effectiveDay || pw.day === effectiveDay)
      : [];

    items.push({
      productId: product._id.toString(),
      name: product.name,
      description: product.description || null,
      priceCents: product.priceCents,
      unit: product.unit || 'each',
      quantity,
      lineTotalCents: product.priceCents * quantity,
      quantityAvailable: product.quantityAvailable,
      availability: product.availability,
      categorySlug: product.categorySlug,
      art: product.art || null,
      imageUrl: product.imageUrl || null,
      tags: product.tags || [],
      farmerId: farmer._id.toString(),
      farmerName: farmer.stallName,
      farmerContactPerson: farmer.contactPerson || null,
      farmerRatingAvg: farmer.ratingAvg || 0,
      farmerRatingCount: farmer.ratingCount || 0,
      farmerLocation: farmer.location || null,
      farmerImageUrl: farmer.imageUrl || null,
      farmerOperatingDays: farmer.operatingDays || [],
      farmerPickupWindows: dayWindows.length > 0 ? dayWindows : farmer.pickupWindows || [],
      marketId: resolvedMarket ? resolvedMarket._id.toString() : null,
      marketName: resolvedMarket ? resolvedMarket.name : null,
      marketAddress: resolvedMarket ? resolvedMarket.address : null,
      marketSchedule: resolvedMarket ? resolvedMarket.schedule : [],
      alternatives,
    });
  }

  // 8. Build market groups (for visit planner and pickup schedule)
  const marketGroupsMap = new Map();
  for (const item of items) {
    const mId = item.marketId || 'general';
    if (!marketGroupsMap.has(mId)) {
      marketGroupsMap.set(mId, {
        marketId: mId,
        marketName: item.marketName || 'Local Farmers Market',
        marketAddress: item.marketAddress,
        marketSchedule: item.marketSchedule,
        farmers: new Map(),
      });
    }
    const mg = marketGroupsMap.get(mId);
    const fId = item.farmerId;
    if (!mg.farmers.has(fId)) {
      mg.farmers.set(fId, {
        farmerId: fId,
        farmerName: item.farmerName,
        farmerRatingAvg: item.farmerRatingAvg,
        farmerPickupWindows: item.farmerPickupWindows,
        items: [],
      });
    }
    mg.farmers.get(fId).items.push({
      productId: item.productId,
      name: item.name,
      quantity: item.quantity,
      priceCents: item.priceCents,
      unit: item.unit,
      lineTotalCents: item.lineTotalCents,
    });
  }

  const marketGroups = [...marketGroupsMap.values()].map((mg) => ({
    ...mg,
    farmers: [...mg.farmers.values()],
  }));

  const totalCents = spentCents;
  const remainingBudgetCents = Math.max(0, budgetCents - totalCents);

  // Available pickup window options aggregated from farmers
  const pickupWindows = [];
  const seenWindows = new Set();
  for (const item of items) {
    for (const pw of item.farmerPickupWindows) {
      const key = `${pw.day}-${pw.startMin}-${pw.endMin}`;
      if (!seenWindows.has(key)) {
        seenWindows.add(key);
        const formatMin = (m) => {
          const h = Math.floor(m / 60);
          const min = m % 60;
          const ampm = h >= 12 ? 'PM' : 'AM';
          const h12 = h % 12 || 12;
          return `${h12}:${min.toString().padStart(2, '0')} ${ampm}`;
        };
        pickupWindows.push({
          day: pw.day,
          startMin: pw.startMin,
          endMin: pw.endMin,
          label: `${formatMin(pw.startMin)} – ${formatMin(pw.endMin)}`,
        });
      }
    }
  }

  return {
    prompt: prompt || null,
    budget: effectiveBudget,
    budgetCents,
    day: effectiveDay,
    marketId: marketId || null,
    pickupDate: pickupDate || null,
    pickupTime: pickupTime || (pickupWindows[0]?.label || null),
    pickupWindows,
    items,
    itemCount: items.reduce((acc, it) => acc + it.quantity, 0),
    totalCents,
    remainingBudgetCents,
    farmerCount: new Set(items.map((i) => i.farmerId)).size,
    marketCount: new Set(items.map((i) => i.marketId).filter(Boolean)).size,
    marketGroups,
  };
}

/**
 * Searches real DB products for adding to or replacing items in a Smart Basket.
 *
 * @param {object} params
 * @param {string} params.query
 * @param {string} [params.marketId]
 * @param {string} [params.categorySlug]
 * @param {string} [params.day]
 * @returns {Promise<Array<object>>}
 */
export async function searchAvailableProducts({ query, marketId, categorySlug, day }) {
  const db = getDb();
  const filter = {
    availability: { $in: ['in', 'low'] },
    quantityAvailable: { $gt: 0 },
    listed: { $ne: false },
    archived: { $ne: true },
  };

  if (categorySlug && categorySlug !== 'all') {
    filter.categorySlug = categorySlug;
  }

  if (marketId && isValidObjectId(marketId)) {
    filter.marketIds = toObjectId(marketId);
  }

  if (query && typeof query === 'string' && query.trim().length > 0) {
    const cleanQuery = query.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    filter.$or = [
      { name: { $regex: cleanQuery, $options: 'i' } },
      { tags: { $regex: cleanQuery, $options: 'i' } },
      { categorySlug: { $regex: cleanQuery, $options: 'i' } },
    ];
  }

  const products = await db
    .collection(COLLECTIONS.PRODUCTS)
    .find(filter)
    .sort({ featuredScore: -1, ratingAvg: -1, priceCents: 1 })
    .limit(30)
    .toArray();

  if (products.length === 0) return [];

  // Batch-fetch farmers
  const farmerIds = [...new Set(products.map((p) => p.farmerId.toString()))];
  const farmers = await db
    .collection(COLLECTIONS.FARMERS)
    .find({ _id: { $in: farmerIds.map((id) => toObjectId(id)) }, listingEnabled: { $ne: false } })
    .project({ _id: 1, stallName: 1, operatingDays: 1, pickupWindows: 1, location: 1, ratingAvg: 1 })
    .toArray();

  const farmerMap = new Map(farmers.map((f) => [f._id.toString(), f]));

  return products
    .filter((p) => {
      const f = farmerMap.get(p.farmerId.toString());
      if (!f) return false;
      if (day && Array.isArray(f.operatingDays) && !f.operatingDays.includes(day)) {
        return false;
      }
      return true;
    })
    .map((p) => {
      const f = farmerMap.get(p.farmerId.toString());
      return {
        productId: p._id.toString(),
        name: p.name,
        priceCents: p.priceCents,
        unit: p.unit || 'each',
        quantityAvailable: p.quantityAvailable,
        availability: p.availability,
        categorySlug: p.categorySlug,
        art: p.art || null,
        imageUrl: p.imageUrl || null,
        farmerId: f._id.toString(),
        farmerName: f.stallName,
        farmerRatingAvg: f.ratingAvg || 0,
        farmerLocation: f.location || null,
      };
    });
}

/**
 * Returns available markets, categories, and operating days for configuring Smart Basket.
 *
 * @returns {Promise<object>}
 */
export async function getSmartBasketOptions() {
  const db = getDb();

  const [markets, categories] = await Promise.all([
    db.collection(COLLECTIONS.MARKETS)
      .find({ status: 'active' })
      .project({ _id: 1, name: 1, address: 1, city: 1, schedule: 1 })
      .toArray(),
    db.collection(COLLECTIONS.CATEGORIES)
      .find({ active: true })
      .sort({ sortOrder: 1 })
      .project({ _id: 1, name: 1, slug: 1, art: 1 })
      .toArray(),
  ]);

  // Compute operating days from active markets
  const dayNames = {
    mon: 'Monday',
    tue: 'Tuesday',
    wed: 'Wednesday',
    thu: 'Thursday',
    fri: 'Friday',
    sat: 'Saturday',
    sun: 'Sunday',
  };

  const daySet = new Set();
  for (const m of markets) {
    if (Array.isArray(m.schedule)) {
      m.schedule.forEach((s) => daySet.add(s.day));
    }
  }

  // Pre-calculate upcoming market dates for the next 14 days
  const now = new Date();
  const upcomingDays = [];
  const daysOfWeek = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

  for (let i = 0; i < 14; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() + i);
    const dayCode = daysOfWeek[d.getDay()];
    if (daySet.has(dayCode)) {
      upcomingDays.push({
        date: d.toISOString().split('T')[0],
        dayCode,
        dayName: dayNames[dayCode] || dayCode,
        label: `${dayNames[dayCode] || dayCode}, ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
        isToday: i === 0,
        isTomorrow: i === 1,
      });
    }
  }

  return {
    markets: markets.map((m) => ({
      id: m._id.toString(),
      name: m.name,
      address: m.address,
      city: m.city,
      schedule: m.schedule,
    })),
    categories: categories.map((c) => ({
      id: c._id.toString(),
      name: c.name,
      slug: c.slug,
      art: c.art,
    })),
    operatingDays: upcomingDays,
    presetPrompts: [
      'I have $50. I need vegetables, fruits and eggs for Saturday.',
      'Fresh fruit and raw honey for Sunday pickup within $35',
      'Weekend family basket with fresh bakery, eggs and veggies for $65',
      'Organic greens and farm dairy for Wednesday within $40',
    ],
  };
}

/**
 * Finds alternative products in the same category or active pool.
 *
 * @param {string} categorySlug
 * @param {import('mongodb').ObjectId|string} excludeId
 * @param {import('mongodb').Db} db
 * @param {number} [limit=3]
 * @returns {Promise<Array<object>>}
 */
export async function findAlternatives(categorySlug, excludeId, db, limit = 3) {
  if (!categorySlug) return [];
  const query = {
    categorySlug,
    listed: true,
    archived: { $ne: true },
    availability: { $in: ['in', 'low'] },
    quantityAvailable: { $gt: 0 },
  };
  if (excludeId && isValidObjectId(excludeId)) {
    query._id = { $ne: toObjectId(excludeId) };
  }

  const alts = await db
    .collection(COLLECTIONS.PRODUCTS)
    .find(query)
    .sort({ ratingAvg: -1, salesCount: -1, priceCents: 1 })
    .limit(limit)
    .project({
      _id: 1,
      name: 1,
      priceCents: 1,
      unit: 1,
      quantityAvailable: 1,
      availability: 1,
      categorySlug: 1,
      art: 1,
      imageUrl: 1,
      farmerId: 1,
    })
    .toArray();

  if (alts.length === 0) return [];

  const farmerIds = alts.map((a) => a.farmerId).filter(Boolean);
  const farmers = await db
    .collection(COLLECTIONS.FARMERS)
    .find({ _id: { $in: farmerIds }, listingEnabled: { $ne: false } })
    .project({ _id: 1, stallName: 1 })
    .toArray();

  const farmerMap = new Map(farmers.map((f) => [f._id.toString(), f.stallName]));

  return alts.map((a) => ({
    productId: a._id.toString(),
    name: a.name,
    priceCents: a.priceCents,
    unit: a.unit || 'each',
    quantityAvailable: a.quantityAvailable,
    availability: a.availability,
    categorySlug: a.categorySlug,
    art: a.art || null,
    imageUrl: a.imageUrl || null,
    farmerId: a.farmerId?.toString(),
    farmerName: farmerMap.get(a.farmerId?.toString()) || 'Local Farm',
  }));
}

/**
 * Validates current stock and availability for a set of basket items.
 * Re-queries the DB — never trusts frontend-supplied prices or quantities.
 * Gracefully provides alternatives for unavailable or out-of-stock products.
 *
 * @param {Array<{ productId: string, quantity: number }>} items
 * @returns {Promise<{ valid: boolean, issues: Array<object>, items: Array<object>, alternatives: Record<string, Array<object>> }>}
 */
export async function validateBasket(items) {
  if (!Array.isArray(items) || items.length === 0) {
    return { valid: true, issues: [], items: [], alternatives: {} };
  }

  const db = getDb();
  const productIds = items
    .filter((i) => isValidObjectId(i.productId))
    .map((i) => toObjectId(i.productId));

  const products = await db
    .collection(COLLECTIONS.PRODUCTS)
    .find({ _id: { $in: productIds } })
    .project({ _id: 1, name: 1, priceCents: 1, quantityAvailable: 1, availability: 1, listed: 1, archived: 1, unit: 1, farmerId: 1, categorySlug: 1 })
    .toArray();

  const productMap = new Map(products.map((p) => [p._id.toString(), p]));
  const issues = [];
  const validatedItems = [];
  const alternatives = {};

  for (const item of items) {
    const product = productMap.get(item.productId);

    if (!product) {
      issues.push({
        productId: item.productId,
        issue: 'NOT_FOUND',
        message: 'Product is no longer available.',
      });
      continue;
    }

    if (product.availability === 'hidden' || product.listed === false || product.archived === true) {
      issues.push({
        productId: item.productId,
        name: product.name,
        issue: 'UNAVAILABLE',
        message: `${product.name} is no longer listed.`,
      });
      alternatives[item.productId] = await findAlternatives(product.categorySlug, product._id, db);
      continue;
    }

    if (product.availability === 'out' || product.quantityAvailable <= 0) {
      issues.push({
        productId: item.productId,
        name: product.name,
        issue: 'OUT_OF_STOCK',
        message: `${product.name} is currently out of stock.`,
        availableQuantity: 0,
      });
      alternatives[item.productId] = await findAlternatives(product.categorySlug, product._id, db);
      continue;
    }

    if (product.quantityAvailable < item.quantity) {
      const adjustedQty = product.quantityAvailable;
      issues.push({
        productId: item.productId,
        name: product.name,
        issue: 'NOT_ENOUGH_STOCK',
        message: `Only ${adjustedQty} ${product.unit || 'units'} of ${product.name} remaining.`,
        requestedQuantity: item.quantity,
        adjustedQuantity: adjustedQty,
        currentPriceCents: product.priceCents,
      });
      validatedItems.push({
        productId: item.productId,
        name: product.name,
        quantity: adjustedQty,
        priceCents: product.priceCents,
        lineTotalCents: product.priceCents * adjustedQty,
        unit: product.unit,
        farmerId: product.farmerId?.toString(),
        availability: product.availability,
        quantityAvailable: product.quantityAvailable,
      });
      continue;
    }

    validatedItems.push({
      productId: item.productId,
      name: product.name,
      quantity: item.quantity,
      priceCents: product.priceCents,
      lineTotalCents: product.priceCents * item.quantity,
      unit: product.unit,
      farmerId: product.farmerId?.toString(),
      availability: product.availability,
      quantityAvailable: product.quantityAvailable,
    });
  }

  return {
    valid: issues.filter((i) => i.issue === 'OUT_OF_STOCK' || i.issue === 'NOT_FOUND' || i.issue === 'UNAVAILABLE').length === 0,
    issues,
    items: validatedItems,
    alternatives,
  };
}

/**
 * Recalculates basket totals using authoritative DB prices and stock.
 * Never trusts prices or quantities sent from the frontend.
 *
 * @param {object} params
 * @param {Array<{ productId: string, quantity: number }>} params.items
 * @param {number} [params.budget]
 * @param {string} [params.marketId]
 * @param {string} [params.pickupDate]
 * @returns {Promise<object>}
 */
export async function recalculateBasket({ items, budget: rawBudget, marketId, pickupDate }) {
  if (!Array.isArray(items) || items.length === 0) {
    return {
      valid: true,
      items: [],
      itemCount: 0,
      totalCents: 0,
      subtotalCents: 0,
      budgetCents: 0,
      remainingBudgetCents: 0,
      isOverBudget: false,
      issues: [],
      alternatives: {},
    };
  }

  const db = getDb();
  const productIds = items
    .filter((i) => isValidObjectId(i.productId))
    .map((i) => toObjectId(i.productId));

  const [products, farmers] = await Promise.all([
    db
      .collection(COLLECTIONS.PRODUCTS)
      .find({ _id: { $in: productIds } })
      .toArray(),
    db
      .collection(COLLECTIONS.FARMERS)
      .find({ listingEnabled: { $ne: false } })
      .project({ _id: 1, stallName: 1, ratingAvg: 1, location: 1, operatingDays: 1, pickupWindows: 1, marketIds: 1 })
      .toArray(),
  ]);

  const productMap = new Map(products.map((p) => [p._id.toString(), p]));
  const farmerMap = new Map(farmers.map((f) => [f._id.toString(), f]));

  const issues = [];
  const recalculatedItems = [];
  const alternatives = {};
  let totalCents = 0;

  for (const item of items) {
    const product = productMap.get(item.productId);

    if (!product) {
      issues.push({
        productId: item.productId,
        issue: 'NOT_FOUND',
        message: 'Product is no longer available.',
      });
      continue;
    }

    const farmer = farmerMap.get(product.farmerId?.toString());
    const unitPriceCents = product.priceCents; // authoritative DB price!

    if (product.availability === 'hidden' || product.listed === false || product.archived === true) {
      issues.push({
        productId: item.productId,
        name: product.name,
        issue: 'UNAVAILABLE',
        message: `${product.name} is no longer listed.`,
      });
      alternatives[item.productId] = await findAlternatives(product.categorySlug, product._id, db);
      continue;
    }

    if (product.availability === 'out' || product.quantityAvailable <= 0) {
      issues.push({
        productId: item.productId,
        name: product.name,
        issue: 'OUT_OF_STOCK',
        message: `${product.name} is currently out of stock.`,
        availableQuantity: 0,
      });
      alternatives[item.productId] = await findAlternatives(product.categorySlug, product._id, db);
      continue;
    }

    let authoritativeQty = item.quantity;
    if (product.quantityAvailable < item.quantity) {
      authoritativeQty = product.quantityAvailable;
      issues.push({
        productId: item.productId,
        name: product.name,
        issue: 'NOT_ENOUGH_STOCK',
        message: `Only ${product.quantityAvailable} ${product.unit || 'units'} of ${product.name} available. Quantity adjusted.`,
        requestedQuantity: item.quantity,
        availableQuantity: product.quantityAvailable,
      });
    }

    const lineTotalCents = unitPriceCents * authoritativeQty;
    totalCents += lineTotalCents;

    recalculatedItems.push({
      productId: product._id.toString(),
      name: product.name,
      priceCents: unitPriceCents,
      unit: product.unit || 'each',
      quantity: authoritativeQty,
      lineTotalCents,
      quantityAvailable: product.quantityAvailable,
      availability: product.availability,
      categorySlug: product.categorySlug,
      art: product.art || null,
      imageUrl: product.imageUrl || null,
      farmerId: product.farmerId?.toString(),
      farmerName: farmer?.stallName || 'Local Farm',
      farmerLocation: farmer?.location || null,
      farmerRatingAvg: farmer?.ratingAvg || 0,
    });
  }

  const effectiveBudget = rawBudget !== undefined && rawBudget !== null && rawBudget !== ''
    ? Number(rawBudget)
    : null;

  const budgetCents = effectiveBudget !== null
    ? (effectiveBudget >= 100 ? Math.round(effectiveBudget) : Math.round(effectiveBudget * 100))
    : null;

  const remainingBudgetCents = budgetCents !== null ? Math.max(0, budgetCents - totalCents) : null;
  const isOverBudget = budgetCents !== null ? totalCents > budgetCents : false;

  return {
    valid: issues.filter((i) => i.issue === 'OUT_OF_STOCK' || i.issue === 'NOT_FOUND' || i.issue === 'UNAVAILABLE').length === 0,
    items: recalculatedItems,
    itemCount: recalculatedItems.reduce((s, it) => s + it.quantity, 0),
    totalCents,
    subtotalCents: totalCents,
    budgetCents,
    remainingBudgetCents,
    isOverBudget,
    issues,
    alternatives,
  };
}

/**
 * Creates final order / pre-order reservation for Smart Basket.
 * Rechecks stock right before order creation, atomically reserves inventory,
 * and handles any concurrency or stock limits gracefully.
 *
 * @param {object} params
 * @param {object} params.user - Authenticated customer { id, name, email, role }
 * @param {string} params.idempotencyKey
 * @param {Array<{ productId: string, quantity: number }>} params.items
 * @param {string} [params.marketId]
 * @param {string} [params.pickupDate]
 * @param {string} [params.pickupTime]
 * @param {string} [params.slotStart]
 * @param {string} [params.note]
 * @param {string} [params.reqId]
 * @returns {Promise<object>}
 */
export async function createSmartBasketOrder({
  user,
  idempotencyKey,
  items,
  marketId,
  pickupDate,
  pickupTime,
  slotStart,
  note = '',
  reqId = 'smart-basket-order',
}) {
  const db = getDb();

  // 1. Verify customer status
  const customerId = toObjectId(user.id);
  const customerUser = await db.collection(COLLECTIONS.USERS).findOne({ _id: customerId });
  if (!customerUser || customerUser.status !== 'active') {
    throw AppError.accountInactive('Your Customer account is currently inactive.');
  }

  // 2. Recheck stock before order creation directly against fresh DB records
  const productIds = items.map((i) => toObjectId(i.productId));
  const products = await db
    .collection(COLLECTIONS.PRODUCTS)
    .find({ _id: { $in: productIds } })
    .toArray();

  const productMap = new Map(products.map((p) => [p._id.toString(), p]));
  const farmerIds = [...new Set(products.map((p) => p.farmerId?.toString()).filter(Boolean))];

  const stockProblems = [];
  for (const item of items) {
    const prod = productMap.get(item.productId.toString());
    if (!prod || !prod.listed || prod.archived || prod.availability === 'hidden') {
      stockProblems.push({
        productId: item.productId,
        code: 'UNAVAILABLE',
        message: `${prod?.name || 'Product'} is unavailable.`,
      });
    } else if (prod.availability === 'out' || prod.quantityAvailable <= 0) {
      stockProblems.push({
        productId: item.productId,
        code: 'NOT_ENOUGH_STOCK',
        message: `Out of stock for ${prod.name}.`,
        maxQuantity: 0,
      });
    } else if (prod.quantityAvailable < item.quantity) {
      stockProblems.push({
        productId: item.productId,
        code: 'NOT_ENOUGH_STOCK',
        message: `Only ${prod.quantityAvailable} left of ${prod.name}.`,
        maxQuantity: prod.quantityAvailable,
      });
    }
  }

  if (stockProblems.length > 0) {
    const firstCode = stockProblems[0].code;
    throw new AppError(409, firstCode, stockProblems[0].message, stockProblems);
  }

  // 3. Load farmers & markets to determine pickup slots
  const [farmers, markets] = await Promise.all([
    db
      .collection(COLLECTIONS.FARMERS)
      .find({ _id: { $in: farmerIds.map((id) => toObjectId(id)) } })
      .toArray(),
    db
      .collection(COLLECTIONS.MARKETS)
      .find({ status: 'active' })
      .toArray(),
  ]);

  const farmerMap = new Map(farmers.map((f) => [f._id.toString(), f]));
  const now = new Date();

  // 4. Group items by farmerId
  const itemsByFarmer = new Map();
  for (const item of items) {
    const prod = productMap.get(item.productId.toString());
    const fId = prod.farmerId.toString();
    if (!itemsByFarmer.has(fId)) {
      itemsByFarmer.set(fId, []);
    }
    itemsByFarmer.get(fId).push({
      productId: item.productId,
      quantity: item.quantity,
    });
  }

  // 5. Construct vendor order groups and resolve valid pickup slots
  const groups = [];
  for (const [fId, farmerItems] of itemsByFarmer) {
    const farmer = farmerMap.get(fId);
    if (!farmer || !farmer.listingEnabled) {
      throw new AppError(409, 'UNAVAILABLE', `Farmer ${farmer?.stallName || fId} is not accepting orders.`);
    }

    const farmerMarkets = markets.filter((m) =>
      (farmer.marketIds || []).some((fMid) => fMid.toString() === m._id.toString())
    );

    const upcomingSlots = getUpcomingSlots(farmer, farmerMarkets, { days: 14, now });
    let resolvedSlot = null;

    if (slotStart) {
      resolvedSlot = upcomingSlots.find((s) => s.start === slotStart && s.isOpen);
    }

    if (!resolvedSlot && pickupDate) {
      const targetDateStr = pickupDate.split('T')[0];
      resolvedSlot = upcomingSlots.find((s) => s.start.startsWith(targetDateStr) && s.isOpen);
    }

    if (!resolvedSlot) {
      // Pick earliest available open slot
      resolvedSlot = upcomingSlots.find((s) => s.isOpen);
    }

    if (!resolvedSlot) {
      throw new AppError(
        409,
        'NO_SLOTS_AVAILABLE',
        `No available pickup slots for farmer ${farmer.stallName || 'stall'}.`,
        [{ farmerId: fId, code: 'NO_SLOTS_AVAILABLE', message: 'No open pickup slots available.' }]
      );
    }

    groups.push({
      farmerId: fId,
      slotStart: resolvedSlot.start,
      note: note || '',
      items: farmerItems,
      isSmartBasket: true,
      source: 'smart_basket',
    });
  }

  // 6. Execute atomic pre-order checkout with zero overselling guarantees
  const checkoutResult = await processCheckout({
    user,
    idempotencyKey,
    groups,
    now,
    reqId,
  });

  return {
    success: true,
    isReplay: checkoutResult.isReplay,
    checkoutId: checkoutResult.data.checkoutId,
    orders: checkoutResult.data.orders,
    totalCents: checkoutResult.data.orders.reduce((sum, o) => sum + (o.totalCents || 0), 0),
  };
}
