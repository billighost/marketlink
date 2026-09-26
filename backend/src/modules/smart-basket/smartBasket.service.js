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
  vegetables:  ['vegetables', 'vegetable', 'veggies', 'greens', 'produce'],
  fruits:      ['fruits', 'fruit'],
  eggs:        ['eggs', 'egg', 'poultry'],
  dairy:       ['dairy', 'milk', 'cheese', 'yogurt'],
  bakery:      ['bakery', 'bread', 'loaf', 'baked'],
  herbs:       ['herbs', 'herb', 'spices'],
  meat:        ['meat', 'chicken', 'pork', 'beef', 'fish', 'seafood'],
  honey:       ['honey', 'jam', 'preserves'],
  flowers:     ['flowers', 'plants'],
};

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
    // Direct slug match
    candidateSlugs.add(normalized);
    // Keyword expansion
    for (const [slug, keywords] of Object.entries(CATEGORY_KEYWORD_MAP)) {
      if (keywords.includes(normalized)) {
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
 * @param {number} params.budget - Budget in naira (whole number, e.g. 10000)
 * @param {string[]} params.categories - Requested category names
 * @param {string} [params.marketId] - Optional market filter
 * @param {string} [params.pickupDate] - Optional pickup date (ISO string)
 * @returns {Promise<object>} Basket result with items, totals, market groups
 */
export async function generateBasket({ budget, categories, marketId, pickupDate }) {
  const db = getDb();
  const budgetCents = Math.round(budget * 100);

  // 1. Resolve category slugs from DB
  const slugs = await resolveCategorySlugs(categories, db);

  if (slugs.length === 0) {
    // No matching categories — try to return general produce anyway
    const fallbackSlugs = ['vegetables', 'fruits', 'eggs'];
    const fallbackCategories = await db
      .collection(COLLECTIONS.CATEGORIES)
      .find({ slug: { $in: fallbackSlugs }, active: true })
      .project({ slug: 1 })
      .toArray();
    slugs.push(...fallbackCategories.map((c) => c.slug));
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

  // 3. Fetch candidate products (capped at 300 to avoid full-collection scans)
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
      items: [],
      totalCents: 0,
      remainingBudgetCents: budgetCents,
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
    .project({ _id: 1, stallName: 1, contactPerson: 1, marketIds: 1, location: 1, ratingAvg: 1, ratingCount: 1, operatingDays: 1, pickupWindows: 1, imageUrl: 1, art: 1 })
    .toArray();

  const farmerMap = new Map(farmersRaw.map((f) => [f._id.toString(), f]));

  // Filter products to only those with a valid, listed farmer
  const validProducts = candidateProducts.filter((p) => farmerMap.has(p.farmerId.toString()));

  if (validProducts.length === 0) {
    return {
      budget,
      budgetCents,
      items: [],
      totalCents: 0,
      remainingBudgetCents: budgetCents,
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

  // Sort each slug bucket: availability 'in' first, then by ratingAvg desc, then priceCents asc
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

  // 7. Greedy budget allocation algorithm
  //    - One item per slug (best-value pick first)
  //    - Then try to add more units of already-selected items
  //    - Stop when remaining budget < cheapest remaining item

  const selectedItems = new Map(); // productId → { product, farmer, quantity }
  let spentCents = 0;

  // Determine iteration order: requested categories first, then others
  const orderedSlugs = [...new Set([...slugs, ...bySlug.keys()])];

  // First pass: pick the top product from each slug
  for (const slug of orderedSlugs) {
    const products = bySlug.get(slug);
    if (!products || products.length === 0) continue;

    for (const product of products) {
      if (spentCents + product.priceCents > budgetCents) continue; // skip if over budget
      const farmer = farmerMap.get(product.farmerId.toString());
      if (!farmer) continue;

      const productId = product._id.toString();
      if (!selectedItems.has(productId)) {
        selectedItems.set(productId, { product, farmer, quantity: 1 });
        spentCents += product.priceCents;
        break; // one per slug in first pass
      }
    }
  }

  // Second pass: try to add more units of already-selected items (or new items)
  let improved = true;
  let safetyLimit = 20; // prevent infinite loops
  while (improved && safetyLimit-- > 0) {
    improved = false;
    const remainingCents = budgetCents - spentCents;
    if (remainingCents <= 0) break;

    // Try to increment quantities of existing items
    for (const [productId, entry] of selectedItems) {
      const { product } = entry;
      const canAddMore = entry.quantity < product.quantityAvailable;
      if (canAddMore && product.priceCents <= remainingCents) {
        entry.quantity += 1;
        spentCents += product.priceCents;
        improved = true;
        break;
      }
    }

    // Also try to add new items from the pool if budget allows
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

  // 8. Shape the response
  const items = [];
  for (const [, { product, farmer, quantity }] of selectedItems) {
    // Resolve the best market for this product (prefer requested marketId)
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
      unit: product.unit,
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
      farmerPickupWindows: farmer.pickupWindows || [],
      marketId: resolvedMarket ? resolvedMarket._id.toString() : null,
      marketName: resolvedMarket ? resolvedMarket.name : null,
      marketAddress: resolvedMarket ? resolvedMarket.address : null,
      marketSchedule: resolvedMarket ? resolvedMarket.schedule : [],
      marketLocation: resolvedMarket ? resolvedMarket.location : null,
    });
  }

  // 9. Build market groups (for map overlay + visit planner)
  const marketGroupsMap = new Map();
  for (const item of items) {
    const mId = item.marketId || 'unknown';
    if (!marketGroupsMap.has(mId)) {
      marketGroupsMap.set(mId, {
        marketId: mId,
        marketName: item.marketName,
        marketAddress: item.marketAddress,
        marketLocation: item.marketLocation,
        marketSchedule: item.marketSchedule,
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
        items: [],
      });
    }
    marketGroup.farmers.get(fId).items.push({
      productId: item.productId,
      name: item.name,
      quantity: item.quantity,
      priceCents: item.priceCents,
      unit: item.unit,
    });
  }

  // Convert nested Maps to arrays
  const marketGroups = [...marketGroupsMap.values()].map((mg) => ({
    ...mg,
    farmers: [...mg.farmers.values()],
  }));

  const totalCents = spentCents;
  const remainingBudgetCents = budgetCents - totalCents;

  return {
    budget,
    budgetCents,
    items,
    totalCents,
    remainingBudgetCents,
    marketGroups,
    farmerCount: new Set(items.map((i) => i.farmerId)).size,
    marketCount: new Set(items.map((i) => i.marketId).filter(Boolean)).size,
  };
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
      issues.push({ productId: item.productId, name: product.name, issue: 'OUT_OF_STOCK', message: `${product.name} is no longer available.` });
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
      });
      // Still include with adjusted quantity
      validatedItems.push({
        productId: item.productId,
        name: product.name,
        quantity: adjustedQty,
        priceCents: product.priceCents,
        unit: product.unit,
        availability: product.availability,
      });
      continue;
    }

    validatedItems.push({
      productId: item.productId,
      name: product.name,
      quantity: item.quantity,
      priceCents: product.priceCents, // Always use server price
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
