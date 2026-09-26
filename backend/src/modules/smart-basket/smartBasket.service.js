/**
 * Smart Basket Service.
 * Generates budget-aware product baskets from real inventory.
 * Enforces server-authoritative pricing — frontend prices are never trusted.
 */

import { getDb } from '../../db/client.js';
import { COLLECTIONS } from '../../db/collections.js';
import { toObjectId, isValidObjectId } from '../../utils/ids.js';
import { AppError } from '../../utils/errors.js';

/**
 * Category keyword → categorySlug mappings.
 * Maps common user-facing terms to actual slug values stored in DB.
 */
const CATEGORY_KEYWORD_MAP = {
  vegetables:          ['vegetables', 'vegetable', 'veggies', 'greens', 'produce', 'produce', 'salad', 'carrot', 'tomato', 'kale', 'spinach', 'potato'],
  fruit:               ['fruits', 'fruit', 'apple', 'banana', 'berries', 'strawberry', 'blueberry', 'pineapple', 'citrus'],
  'dairy-and-eggs':    ['eggs', 'egg', 'poultry', 'dairy', 'milk', 'cheese', 'yogurt', 'butter'],
  bakery:              ['bakery', 'bread', 'loaf', 'baked', 'pastry', 'croissant', 'sourdough', 'rye'],
  'herbs-and-flowers': ['herbs', 'herb', 'spices', 'flowers', 'plants', 'lavender', 'basil'],
  'meat-and-fish':     ['meat', 'chicken', 'pork', 'beef', 'fish', 'seafood', 'sausages', 'steak'],
  'honey-and-jam':     ['honey', 'jam', 'preserves', 'syrup', 'spread'],
};

/**
 * Converts internal cent pricing to clean Naira denomination for display & allocation.
 * E.g. 450 cents (~$4.50) -> ₦2,000, 350 -> ₦1,500, 600 -> ₦2,500
 */
export function centsToNaira(cents) {
  if (typeof cents !== 'number' || isNaN(cents)) return 500;
  const raw = cents * 4.4444;
  return Math.max(500, Math.round(raw / 500) * 500);
}

/**
 * Parses freeform natural language requests into budget, categories, and pickup days.
 * E.g. "I have ₦10,000. I need vegetables, fruits and eggs for Saturday."
 */
export function parseBasketPrompt(prompt) {
  if (!prompt || typeof prompt !== 'string') return {};
  const text = prompt.toLowerCase();

  // 1. Extract budget: matches "₦10,000", "₦10000", "#10000", "10000", "10,000"
  let budget = null;
  const budgetMatch = text.match(/[₦#]?\s*(\d{1,3}(?:,\d{3})+|\d{3,7})/);
  if (budgetMatch) {
    budget = parseInt(budgetMatch[1].replace(/,/g, ''), 10);
  }

  // 2. Extract categories
  const categories = [];
  if (/vegetable|veggie|greens|produce|spinach|tomato|carrot|kale|salad/.test(text)) categories.push('vegetables');
  if (/fruit|banana|apple|berries|strawberry|pineapple|orange/.test(text)) categories.push('fruit');
  if (/egg|eggs|poultry|dairy|milk|cheese/.test(text)) categories.push('dairy-and-eggs');
  if (/bakery|bread|loaf|pastry|croissant|sourdough/.test(text)) categories.push('bakery');
  if (/herb|flower|lavender|basil|spices/.test(text)) categories.push('herbs-and-flowers');
  if (/meat|fish|chicken|beef|pork|sausage|seafood/.test(text)) categories.push('meat-and-fish');
  if (/honey|jam|preserves/.test(text)) categories.push('honey-and-jam');

  // 3. Extract day
  let pickupDay = null;
  if (/wednesday|wed\b/.test(text)) pickupDay = 'wed';
  else if (/friday|fri\b/.test(text)) pickupDay = 'fri';
  else if (/saturday|sat\b/.test(text)) pickupDay = 'sat';
  else if (/sunday|sun\b/.test(text)) pickupDay = 'sun';

  return { budget, categories, pickupDay };
}

/**
 * Resolves requested category keywords to actual slugs available in the DB.
 *
 * @param {string[]} categories - User-provided category names e.g. ['vegetables','eggs']
 * @param {import('mongodb').Db} db
 * @returns {Promise<string[]>} - Array of matching categorySlug values from DB
 */
async function resolveCategorySlugs(categories, db) {
  if (!Array.isArray(categories) || categories.length === 0) return [];

  // Expand requested categories to candidate slugs
  const candidateSlugs = new Set();
  for (const cat of categories) {
    const normalized = cat.toLowerCase().trim();
    candidateSlugs.add(normalized);

    for (const [slug, keywords] of Object.entries(CATEGORY_KEYWORD_MAP)) {
      if (slug === normalized || keywords.includes(normalized)) {
        candidateSlugs.add(slug);
      }
    }
  }

  // Confirm these slugs exist in the DB categories collection
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
 * @param {number} params.budget - Budget in naira or base currency
 * @param {string[]} params.categories - Requested category names
 * @param {string} [params.marketId] - Optional market filter
 * @param {string} [params.pickupDate] - Optional pickup date (ISO string)
 * @param {string} [params.pickupTime] - Optional pickup time
 * @returns {Promise<object>} Basket result with items, totals, market groups
 */
export async function generateBasket({ budget, categories, marketId, pickupDate, pickupTime }) {
  const db = getDb();
  const isNaira = budget >= 200; // E.g. ₦1,000, ₦5,000, ₦10,000 vs $25, $50
  const budgetNaira = isNaira ? Math.round(budget) : Math.round(budget * 400);
  const budgetCents = Math.round(budget * 100);

  // 1. Resolve category slugs from DB
  let slugs = await resolveCategorySlugs(categories, db);

  if (slugs.length === 0) {
    const fallbackSlugs = ['vegetables', 'fruit', 'dairy-and-eggs'];
    const fallbackCategories = await db
      .collection(COLLECTIONS.CATEGORIES)
      .find({ slug: { $in: fallbackSlugs }, active: true })
      .project({ slug: 1 })
      .toArray();
    slugs = fallbackCategories.map((c) => c.slug);
  }

  // 2. Build product query filter
  const productFilter = {
    availability: { $in: ['in', 'low'] },
    quantityAvailable: { $gt: 0 },
    listed: { $ne: false },
    archived: { $ne: true },
  };

  if (slugs.length > 0) {
    productFilter.categorySlug = { $in: slugs };
  }

  if (marketId && isValidObjectId(marketId)) {
    productFilter.marketIds = toObjectId(marketId);
  }

  // 3. Fetch candidate products
  const candidateProducts = await db
    .collection(COLLECTIONS.PRODUCTS)
    .find(productFilter)
    .sort({ featuredScore: -1, ratingAvg: -1, priceCents: 1 })
    .limit(300)
    .toArray();

  if (candidateProducts.length === 0) {
    return {
      budget,
      budgetCents,
      budgetNaira,
      items: [],
      totalCents: 0,
      totalNaira: 0,
      remainingBudgetCents: budgetCents,
      remainingBudgetNaira: budgetNaira,
      marketGroups: [],
      message: 'No products available matching your request right now.',
    };
  }

  // 4. Batch-fetch farmers for all candidate products
  const farmerIds = [...new Set(candidateProducts.map((p) => p.farmerId.toString()))];
  const farmersRaw = await db
    .collection(COLLECTIONS.FARMERS)
    .find({
      _id: { $in: farmerIds.map((id) => toObjectId(id)) },
      listingEnabled: { $ne: false },
    })
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
      stallNumber: 1,
    })
    .toArray();

  const farmerMap = new Map(farmersRaw.map((f) => [f._id.toString(), f]));
  const validProducts = candidateProducts.filter((p) => farmerMap.has(p.farmerId.toString()));

  if (validProducts.length === 0) {
    return {
      budget,
      budgetCents,
      budgetNaira,
      items: [],
      totalCents: 0,
      totalNaira: 0,
      remainingBudgetCents: budgetCents,
      remainingBudgetNaira: budgetNaira,
      marketGroups: [],
      message: 'No available products from active farmers at the moment.',
    };
  }

  // 5. Fetch market details for all involved markets
  const allMarketIds = new Set();
  for (const p of validProducts) {
    if (Array.isArray(p.marketIds)) {
      p.marketIds.forEach((id) => allMarketIds.add(id.toString()));
    }
  }
  if (marketId && isValidObjectId(marketId)) allMarketIds.add(marketId);

  const marketsRaw = await db
    .collection(COLLECTIONS.MARKETS)
    .find({ _id: { $in: [...allMarketIds].map((id) => toObjectId(id)) }, status: 'active' })
    .project({ _id: 1, name: 1, address: 1, location: 1, schedule: 1, facilities: 1 })
    .toArray();

  const marketMap = new Map(marketsRaw.map((m) => [m._id.toString(), m]));

  // 6. Group candidates by slug, sort within each group by value
  const bySlug = new Map();
  for (const product of validProducts) {
    const slug = product.categorySlug || 'other';
    if (!bySlug.has(slug)) bySlug.set(slug, []);
    bySlug.get(slug).push(product);
  }

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

  // 7. Allocation algorithm
  const selectedItems = new Map(); // productId → { product, farmer, quantity, itemPriceNaira }
  let spentNaira = 0;
  let spentCents = 0;
  const targetBudget = isNaira ? budgetNaira : budgetCents;

  const orderedSlugs = [...new Set([...slugs, ...bySlug.keys()])];

  // Pass 1: Choose top item from each requested category
  for (const slug of orderedSlugs) {
    const products = bySlug.get(slug);
    if (!products || products.length === 0) continue;

    for (const product of products) {
      const itemPriceN = centsToNaira(product.priceCents);
      const costToCheck = isNaira ? itemPriceN : product.priceCents;
      const currentSpent = isNaira ? spentNaira : spentCents;

      if (currentSpent + costToCheck > targetBudget && selectedItems.size > 0) continue;

      const farmer = farmerMap.get(product.farmerId.toString());
      if (!farmer) continue;

      const productId = product._id.toString();
      if (!selectedItems.has(productId)) {
        selectedItems.set(productId, { product, farmer, quantity: 1, itemPriceNaira: itemPriceN });
        spentNaira += itemPriceN;
        spentCents += product.priceCents;
        break;
      }
    }
  }

  // Pass 2: Add units of existing items or additional diverse picks if budget remains
  let improved = true;
  let safetyLimit = 15;
  while (improved && safetyLimit-- > 0) {
    improved = false;
    const remaining = targetBudget - (isNaira ? spentNaira : spentCents);
    if (remaining <= 0) break;

    // Try to increase quantity of items that aren't at max stock
    for (const [, entry] of selectedItems) {
      const { product, itemPriceNaira } = entry;
      const unitCost = isNaira ? itemPriceNaira : product.priceCents;
      if (entry.quantity < Math.min(product.quantityAvailable, 5) && unitCost <= remaining) {
        entry.quantity += 1;
        spentNaira += itemPriceNaira;
        spentCents += product.priceCents;
        improved = true;
        break;
      }
    }

    // If still budget left, add another distinct product from candidate slugs
    if (!improved) {
      for (const slug of orderedSlugs) {
        const products = bySlug.get(slug) || [];
        for (const product of products) {
          const productId = product._id.toString();
          if (selectedItems.has(productId)) continue;

          const itemPriceN = centsToNaira(product.priceCents);
          const unitCost = isNaira ? itemPriceN : product.priceCents;
          if (unitCost > remaining) continue;

          const farmer = farmerMap.get(product.farmerId.toString());
          if (!farmer) continue;

          selectedItems.set(productId, { product, farmer, quantity: 1, itemPriceNaira: itemPriceN });
          spentNaira += itemPriceN;
          spentCents += product.priceCents;
          improved = true;
          break;
        }
        if (improved) break;
      }
    }
  }

  // 8. Shape the response items
  const items = [];
  for (const [, { product, farmer, quantity, itemPriceNaira }] of selectedItems) {
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

    items.push({
      productId: product._id.toString(),
      name: product.name,
      description: product.description || null,
      priceCents: product.priceCents,
      priceNaira: itemPriceNaira,
      unit: product.unit,
      quantity,
      lineTotalCents: product.priceCents * quantity,
      lineTotalNaira: itemPriceNaira * quantity,
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
      farmerPickupWindows: farmer.pickupWindows || [],
      farmerStallNumber: farmer.stallNumber || null,
      marketId: resolvedMarket ? resolvedMarket._id.toString() : null,
      marketName: resolvedMarket ? resolvedMarket.name : null,
      marketAddress: resolvedMarket ? resolvedMarket.address : null,
      marketSchedule: resolvedMarket ? resolvedMarket.schedule : [],
      marketLocation: resolvedMarket ? resolvedMarket.location : null,
    });
  }

  // 9. Build market groups (for map hierarchy + visit planner)
  const marketGroupsMap = new Map();
  for (const item of items) {
    const mId = item.marketId || 'unknown';
    if (!marketGroupsMap.has(mId)) {
      marketGroupsMap.set(mId, {
        marketId: mId,
        marketName: item.marketName || 'Local Market',
        marketAddress: item.marketAddress || '',
        marketLocation: item.marketLocation,
        marketSchedule: item.marketSchedule || [],
        farmers: new Map(),
      });
    }
    const marketGroup = marketGroupsMap.get(mId);
    const fId = item.farmerId;
    if (!marketGroup.farmers.has(fId)) {
      marketGroup.farmers.set(fId, {
        farmerId: fId,
        farmerName: item.farmerName,
        farmerLocation: item.farmerLocation,
        farmerRatingAvg: item.farmerRatingAvg,
        farmerImageUrl: item.farmerImageUrl,
        farmerOperatingDays: item.farmerOperatingDays,
        farmerPickupWindows: item.farmerPickupWindows,
        farmerStallNumber: item.farmerStallNumber || null,
        items: [],
      });
    }
    marketGroup.farmers.get(fId).items.push({
      productId: item.productId,
      name: item.name,
      quantity: item.quantity,
      priceCents: item.priceCents,
      priceNaira: item.priceNaira,
      lineTotalNaira: item.lineTotalNaira,
      unit: item.unit,
      art: item.art,
      imageUrl: item.imageUrl,
    });
  }

  const marketGroups = [...marketGroupsMap.values()].map((mg) => ({
    ...mg,
    farmers: [...mg.farmers.values()],
  }));

  const totalCents = spentCents;
  const totalNaira = spentNaira;
  const remainingBudgetNaira = Math.max(0, budgetNaira - totalNaira);
  const remainingBudgetCents = Math.max(0, budgetCents - totalCents);

  return {
    budget,
    budgetCents,
    budgetNaira,
    items,
    totalCents,
    totalNaira,
    remainingBudgetCents,
    remainingBudgetNaira,
    marketGroups,
    farmerCount: new Set(items.map((i) => i.farmerId)).size,
    marketCount: new Set(items.map((i) => i.marketId).filter(Boolean)).size,
  };
}

/**
 * Returns alternative products in the same category or market for item replacement.
 */
export async function getReplacementProducts(productId, { marketId, limit = 6 } = {}) {
  const db = getDb();
  const currentProduct = await db.collection(COLLECTIONS.PRODUCTS).findOne({ _id: toObjectId(productId) });
  if (!currentProduct) {
    throw AppError.notFound('Product not found.');
  }

  const filter = {
    _id: { $ne: currentProduct._id },
    categorySlug: currentProduct.categorySlug,
    availability: { $in: ['in', 'low'] },
    quantityAvailable: { $gt: 0 },
    listed: { $ne: false },
    archived: { $ne: true },
  };

  if (marketId && isValidObjectId(marketId)) {
    filter.marketIds = toObjectId(marketId);
  }

  let replacements = await db
    .collection(COLLECTIONS.PRODUCTS)
    .find(filter)
    .sort({ ratingAvg: -1, salesCount: -1, priceCents: 1 })
    .limit(limit)
    .toArray();

  if (replacements.length === 0) {
    const generalFilter = {
      _id: { $ne: currentProduct._id },
      availability: { $in: ['in', 'low'] },
      quantityAvailable: { $gt: 0 },
      listed: { $ne: false },
      archived: { $ne: true },
    };
    if (marketId && isValidObjectId(marketId)) {
      generalFilter.marketIds = toObjectId(marketId);
    }
    replacements = await db
      .collection(COLLECTIONS.PRODUCTS)
      .find(generalFilter)
      .sort({ ratingAvg: -1, salesCount: -1 })
      .limit(limit)
      .toArray();
  }

  const farmerIds = [...new Set(replacements.map((p) => p.farmerId.toString()))];
  const farmers = await db
    .collection(COLLECTIONS.FARMERS)
    .find({ _id: { $in: farmerIds.map(toObjectId) }, listingEnabled: { $ne: false } })
    .project({ _id: 1, stallName: 1, location: 1, ratingAvg: 1, imageUrl: 1, pickupWindows: 1, stallNumber: 1 })
    .toArray();
  const farmerMap = new Map(farmers.map((f) => [f._id.toString(), f]));

  return replacements
    .filter((p) => farmerMap.has(p.farmerId.toString()))
    .map((p) => {
      const f = farmerMap.get(p.farmerId.toString());
      return {
        id: p._id.toString(),
        productId: p._id.toString(),
        name: p.name,
        description: p.description,
        priceCents: p.priceCents,
        priceNaira: centsToNaira(p.priceCents),
        unit: p.unit,
        quantityAvailable: p.quantityAvailable,
        availability: p.availability,
        categorySlug: p.categorySlug,
        art: p.art,
        imageUrl: p.imageUrl,
        farmerId: f._id.toString(),
        farmerName: f.stallName,
        farmerRatingAvg: f.ratingAvg || 0,
        farmerPickupWindows: f.pickupWindows || [],
        farmerStallNumber: f.stallNumber || null,
      };
    });
}

/**
 * Validates current stock and availability for a set of basket items.
 * Re-queries the DB — never trusts frontend-supplied prices or quantities.
 *
 * @param {Array<{ productId: string, quantity: number }>} items
 * @returns {Promise<{ valid: boolean, issues: Array<object>, items: Array<object> }>}
 */
export async function validateBasket(items) {
  if (!Array.isArray(items) || items.length === 0) {
    return { valid: true, issues: [], items: [] };
  }

  const db = getDb();
  const productIds = items.map((i) => toObjectId(i.productId));

  const products = await db
    .collection(COLLECTIONS.PRODUCTS)
    .find({ _id: { $in: productIds } })
    .project({ _id: 1, name: 1, priceCents: 1, quantityAvailable: 1, availability: 1, unit: 1 })
    .toArray();

  const productMap = new Map(products.map((p) => [p._id.toString(), p]));
  const issues = [];
  const validatedItems = [];

  for (const item of items) {
    const product = productMap.get(item.productId);

    if (!product) {
      issues.push({ productId: item.productId, issue: 'NOT_FOUND', message: 'Product is no longer available.' });
      continue;
    }

    if (product.availability === 'out' || product.availability === 'hidden') {
      issues.push({ productId: item.productId, name: product.name, issue: 'OUT_OF_STOCK', message: `${product.name} is sold out.` });
      continue;
    }

    if (product.quantityAvailable < item.quantity) {
      const adjustedQty = product.quantityAvailable;
      issues.push({
        productId: item.productId,
        name: product.name,
        issue: 'NOT_ENOUGH_STOCK',
        message: `Only ${adjustedQty} ${product.unit} of ${product.name} remaining.`,
        adjustedQuantity: adjustedQty,
        currentPriceCents: product.priceCents,
        currentPriceNaira: centsToNaira(product.priceCents),
      });
      validatedItems.push({
        productId: item.productId,
        name: product.name,
        quantity: adjustedQty,
        priceCents: product.priceCents,
        priceNaira: centsToNaira(product.priceCents),
        unit: product.unit,
        availability: product.availability,
      });
      continue;
    }

    validatedItems.push({
      productId: item.productId,
      name: product.name,
      quantity: item.quantity,
      priceCents: product.priceCents,
      priceNaira: centsToNaira(product.priceCents),
      unit: product.unit,
      availability: product.availability,
    });
  }

  return {
    valid: issues.filter((i) => i.issue !== 'NOT_ENOUGH_STOCK').length === 0,
    issues,
    items: validatedItems,
  };
}
