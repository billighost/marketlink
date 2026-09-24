/**
 * Categories module service layer.
 * Queries taxonomy and maintains an in-memory 60s cached aggregate of product counts.
 */

import { getDb } from '../../db/client.js';
import { COLLECTIONS } from '../../db/collections.js';

let categoryCountsCache = null;
let categoryCountsCacheTime = 0;

/**
 * Retrieves product counts grouped by category slug.
 * Trade-off: Cache for 60 seconds in memory to protect high-traffic guest landing and browse
 * navigation from frequent full-collection aggregations. A slight 60-second delay in inventory
 * count updates is acceptable for catalog taxonomy browsing.
 *
 * @returns {Promise<Map<string, number>>}
 */
export async function getCategoryProductCounts() {
  const now = Date.now();
  if (categoryCountsCache && now - categoryCountsCacheTime < 60000) {
    return categoryCountsCache;
  }

  const db = getDb();
  const counts = await db
    .collection(COLLECTIONS.PRODUCTS)
    .aggregate([
      { $match: { listed: true, availability: { $ne: 'out' } } },
      { $group: { _id: '$categorySlug', count: { $sum: 1 } } },
    ])
    .toArray();

  const countMap = new Map();
  for (const item of counts) {
    countMap.set(item._id, item.count);
  }

  categoryCountsCache = countMap;
  categoryCountsCacheTime = now;
  return countMap;
}

/**
 * Lists all active categories ordered by sortOrder, decorated with cached product counts.
 *
 * @returns {Promise<Array<object>>}
 */
export async function listCategories() {
  const db = getDb();
  const [categories, counts] = await Promise.all([
    db
      .collection(COLLECTIONS.CATEGORIES)
      .find({ active: true }, { projection: { _id: 1, name: 1, slug: 1, sortOrder: 1, art: 1, active: 1 } })
      .sort({ sortOrder: 1 })
      .toArray(),
    getCategoryProductCounts(),
  ]);

  return categories.map((cat) => ({
    id: cat._id.toString(),
    name: cat.name,
    slug: cat.slug,
    sortOrder: cat.sortOrder,
    art: cat.art,
    active: cat.active,
    productCount: counts.get(cat.slug) || 0,
  }));
}
