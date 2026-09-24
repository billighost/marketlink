/**
 * Products module service layer.
 * Browse catalog, keyset pagination across 5 sorts, text search caching, product details, and related items.
 */

import crypto from 'node:crypto';
import { ObjectId } from 'mongodb';
import { getDb } from '../../db/client.js';
import { COLLECTIONS } from '../../db/collections.js';
import { toObjectId } from '../../utils/ids.js';
import { AppError } from '../../utils/errors.js';
import { toProductCard, toProductDetail, toReviewItem } from '../../utils/shapes.js';
import { encodeCursor, decodeCursor } from '../../utils/cursor.js';
import { escapeForPrefix } from '../../utils/query.js';
import { getUpcomingSlots, getNextSlotsForAllFarmers } from '../../utils/slots.js';

// 60-second in-memory cache for operating day -> farmer IDs
const dayFarmerIdsCache = new Map();

/**
 * Resolves active farmer IDs operating on a specific day.
 * Cached for 60 seconds to optimize browse queries.
 *
 * @param {string} day - 'mon'..'sun'
 * @returns {Promise<Array<ObjectId>>}
 */
export async function getFarmerIdsForDay(day) {
  const now = Date.now();
  const cached = dayFarmerIdsCache.get(day);
  if (cached && now - cached.time < 60000) {
    return cached.ids;
  }

  const db = getDb();
  const docs = await db
    .collection(COLLECTIONS.FARMERS)
    .find({ operatingDays: day, listingEnabled: true }, { projection: { _id: 1 } })
    .toArray();

  const ids = docs.map((d) => d._id);
  dayFarmerIdsCache.set(day, { ids, time: now });
  return ids;
}

// 30-second cache for full-text search result IDs
const textSearchCache = new Map();

/**
 * Clears expired entries from the text search cache.
 */
function cleanTextSearchCache() {
  const now = Date.now();
  for (const [key, entry] of textSearchCache.entries()) {
    if (now - entry.time > 30000) {
      textSearchCache.delete(key);
    }
  }
}

/**
 * Browses catalog products with filters, keyset pagination, and fast text relevance search.
 *
 * @param {object} params
 * @returns {Promise<{ data: Array<object>, meta: object }>}
 */
export async function listProducts({
  category,
  minPrice,
  maxPrice,
  market,
  day,
  availability,
  includeSoldOut = false,
  tags = [],
  farmer,
  q,
  sort = 'featured',
  cursor,
  limit = 20,
}) {
  const db = getDb();

  // Validate price range if provided
  if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) {
    throw AppError.unprocessable([
      { field: 'minPrice', message: 'minPrice cannot be greater than maxPrice.' },
    ]);
  }

  // Base catalog filter: must always be listed: true
  const baseFilter = { listed: true };

  // Category filter: comma list of slugs (up to 5)
  if (category && category.length > 0) {
    const slugRegex = /^[a-z0-9-]{2,40}$/;
    for (const slug of category) {
      if (!slugRegex.test(slug)) {
        throw AppError.unprocessable([
          { field: 'category', message: `Invalid category slug '${slug}'.` },
        ]);
      }
    }
    baseFilter.categorySlug = { $in: category };
  }

  // Price range in cents
  if (minPrice !== undefined || maxPrice !== undefined) {
    baseFilter.priceCents = {};
    if (minPrice !== undefined) baseFilter.priceCents.$gte = minPrice;
    if (maxPrice !== undefined) baseFilter.priceCents.$lte = maxPrice;
  }

  // Market filter
  if (market) {
    baseFilter.marketIds = toObjectId(market, 'market');
  }

  // Day filter: resolves farmer IDs selling on that weekday
  if (day) {
    const farmerIds = await getFarmerIdsForDay(day);
    baseFilter.farmerId = { $in: farmerIds.slice(0, 500) };
  }

  // Availability filter: default 'in' or 'low', unless includeSoldOut or explicit availability
  if (availability) {
    baseFilter.availability = availability;
  } else if (!includeSoldOut) {
    baseFilter.availability = { $in: ['in', 'low'] };
  } else {
    baseFilter.availability = { $in: ['in', 'low', 'out'] };
  }

  // Tags filter
  if (tags && tags.length > 0) {
    baseFilter.tags = { $all: tags };
  }

  // Farmer filter
  if (farmer) {
    baseFilter.farmerId = toObjectId(farmer, 'farmer');
  }

  // ── Handling Full-Text Search with Relevance Caching (D4) ──
  if (q && q.trim().length >= 3) {
    cleanTextSearchCache();
    const queryTerm = q.trim();
    const cacheKey = crypto
      .createHash('sha256')
      .update(JSON.stringify({ queryTerm, baseFilter }))
      .digest('hex');

    let cachedIds = null;
    let cachedTime = 0;
    if (textSearchCache.has(cacheKey)) {
      const entry = textSearchCache.get(cacheKey);
      if (Date.now() - entry.time < 30000) {
        cachedIds = entry.ids;
        cachedTime = entry.time;
      }
    }

    if (!cachedIds) {
      const searchResults = await db
        .collection(COLLECTIONS.PRODUCTS)
        .find(
          {
            $text: { $search: queryTerm },
            ...baseFilter,
          },
          {
            projection: { _id: 1, score: { $meta: 'textScore' } },
          }
        )
        .sort({ score: { $meta: 'textScore' } })
        .limit(100)
        .toArray();

      cachedIds = searchResults.map((r) => r._id);
      cachedTime = Date.now();
      textSearchCache.set(cacheKey, { ids: cachedIds, time: cachedTime });
    }

    let offset = 0;
    if (cursor) {
      const decoded = decodeCursor(cursor, 'text');
      offset = Number(decoded.k[0]) || 0;
    }

    const pageIds = cachedIds.slice(offset, offset + limit);
    let nextCursor = null;
    if (offset + limit < cachedIds.length) {
      nextCursor = encodeCursor({
        s: 'text',
        k: [offset + limit],
        hash: cacheKey,
      });
    }

    const cards = await db
      .collection(COLLECTIONS.PRODUCTS)
      .find({ _id: { $in: pageIds } })
      .toArray();

    // Re-order by original text score order
    const cardMap = new Map(cards.map((c) => [c._id.toString(), c]));
    const orderedCards = pageIds.map((id) => cardMap.get(id.toString())).filter(Boolean);

    // Fetch next slot cache for cutoffAt
    const slotCache = await getNextSlotsForAllFarmers(db);
    const data = orderedCards.map((p) => {
      const nextSlot = slotCache.get(p.farmerId.toString());
      return toProductCard(p, { cutoffAt: nextSlot?.cutoffAt });
    });

    return {
      data,
      meta: {
        nextCursor,
        limit,
        capped: cachedIds.length >= 100,
      },
    };
  }

  // ── Short Prefix Search for q < 3 characters (D4) ──
  if (q && q.trim().length > 0 && q.trim().length < 3) {
    const esc = escapeForPrefix(q.trim());
    baseFilter.nameLower = new RegExp('^' + esc);
  }

  // ── Standard Keyset Pagination across Sorts (D3) ──
  const sortMap = {
    newest: { field: 'createdAt', dir: 'desc', mongoSort: { createdAt: -1, _id: -1 } },
    price_asc: { field: 'priceCents', dir: 'asc', mongoSort: { priceCents: 1, _id: 1 } },
    price_desc: { field: 'priceCents', dir: 'desc', mongoSort: { priceCents: -1, _id: -1 } },
    popular: { field: 'salesCount', dir: 'desc', mongoSort: { salesCount: -1, _id: -1 } },
    featured: { field: 'featuredScore', dir: 'desc', mongoSort: { featuredScore: -1, _id: -1 } },
  };

  const activeSort = sortMap[sort] || sortMap.featured;
  let filter = { ...baseFilter };

  if (cursor) {
    const decoded = decodeCursor(cursor, sort);
    let [k0] = decoded.k;
    if (activeSort.field === 'createdAt' && typeof k0 === 'number') {
      k0 = new Date(k0);
    }
    const targetId = new ObjectId(decoded.id);
    const op = activeSort.dir === 'desc' ? '$lt' : '$gt';

    // Must combine equality filters with cursor predicate using $and so $or does not clobber
    filter = {
      $and: [
        baseFilter,
        {
          $or: [
            { [activeSort.field]: { [op]: k0 } },
            { [activeSort.field]: k0, _id: { [op]: targetId } },
          ],
        },
      ],
    };
  }

  const [docs, totalCount, slotCache] = await Promise.all([
    db
      .collection(COLLECTIONS.PRODUCTS)
      .find(filter)
      .sort(activeSort.mongoSort)
      .limit(limit + 1)
      .toArray(),
    // total is returned only when request has no q and no day (D3)
    !q && !day
      ? db.collection(COLLECTIONS.PRODUCTS).countDocuments(baseFilter, { limit: 1000 })
      : Promise.resolve(null),
    getNextSlotsForAllFarmers(db),
  ]);

  let nextCursor = null;
  if (docs.length > limit) {
    docs.pop();
    const last = docs[docs.length - 1];
    nextCursor = encodeCursor({
      s: sort,
      k: [last[activeSort.field]],
      id: last._id.toString(),
    });
  }

  const data = docs.map((p) => {
    const nextSlot = slotCache.get(p.farmerId.toString());
    return toProductCard(p, { cutoffAt: nextSlot?.cutoffAt });
  });

  const meta = {
    nextCursor,
    limit,
  };

  if (totalCount !== null) {
    if (totalCount >= 1000) {
      meta.total = 1000;
      meta.totalCapped = true;
    } else {
      meta.total = totalCount;
    }
  }

  return {
    data,
    meta,
  };
}

/**
 * Retrieves full productDetail including farmer cut-off and pickup slots.
 *
 * @param {string} id
 * @returns {Promise<object>}
 */
export async function getProductDetail(id) {
  const db = getDb();
  const prodId = toObjectId(id, 'productId');

  const product = await db.collection(COLLECTIONS.PRODUCTS).findOne({ _id: prodId, listed: true });
  if (!product) {
    throw AppError.notFound("We couldn't find that product.");
  }

  const farmer = await db.collection(COLLECTIONS.FARMERS).findOne({ _id: product.farmerId, listingEnabled: true });
  if (!farmer) {
    throw AppError.notFound("We couldn't find that product.");
  }

  const markets = await db
    .collection(COLLECTIONS.MARKETS)
    .find({ _id: { $in: product.marketIds || [] }, status: 'active' })
    .toArray();

  const slots = getUpcomingSlots(farmer, markets, { days: 14, now: new Date() });
  const firstSlot = slots.find((s) => s.isOpen) || slots[0] || null;

  const farmerCutoff = {
    nextPickupStart: firstSlot?.start || null,
    cutoffAt: firstSlot?.cutoffAt || null,
    isCutoffPassed: firstSlot ? !firstSlot.isOpen : false,
  };

  return toProductDetail(product, {
    markets,
    farmerCutoff,
    nextPickupSlots: slots.slice(0, 3),
  });
}

/**
 * Lists public reviews for a product.
 *
 * @param {string} id
 * @param {object} params
 * @returns {Promise<{ data: Array<object>, meta: object }>}
 */
export async function listProductReviews(id, { cursor, limit = 20 }) {
  const db = getDb();
  const prodId = toObjectId(id, 'productId');

  const product = await db.collection(COLLECTIONS.PRODUCTS).findOne({ _id: prodId, listed: true });
  if (!product) {
    throw AppError.notFound("We couldn't find that product.");
  }

  const baseFilter = {
    productId: prodId,
    status: 'visible',
  };

  const sort = 'newest';
  let filter = { ...baseFilter };

  if (cursor) {
    const decoded = decodeCursor(cursor, sort);
    let [k0] = decoded.k;
    if (typeof k0 === 'number') k0 = new Date(k0);
    const targetId = new ObjectId(decoded.id);

    filter = {
      $and: [
        baseFilter,
        {
          $or: [
            { createdAt: { $lt: k0 } },
            { createdAt: k0, _id: { $lt: targetId } },
          ],
        },
      ],
    };
  }

  const reviews = await db
    .collection(COLLECTIONS.REVIEWS)
    .find(filter)
    .sort({ createdAt: -1, _id: -1 })
    .limit(limit + 1)
    .toArray();

  let nextCursor = null;
  if (reviews.length > limit) {
    reviews.pop();
    const last = reviews[reviews.length - 1];
    nextCursor = encodeCursor({
      s: sort,
      k: [last.createdAt],
      id: last._id.toString(),
    });
  }

  return {
    data: reviews.map((r) => toReviewItem(r, product.name)),
    meta: {
      nextCursor,
      limit,
    },
  };
}

/**
 * Retrieves related products for a product:
 * - moreFromFarmer: up to 8 listed items from same farmer
 * - youMightLike: up to 8 listed items from other farmers in same category
 *
 * @param {string} id
 * @returns {Promise<{ moreFromFarmer: Array<object>, youMightLike: Array<object> }>}
 */
export async function getRelatedProducts(id) {
  const db = getDb();
  const prodId = toObjectId(id, 'productId');

  const product = await db.collection(COLLECTIONS.PRODUCTS).findOne({ _id: prodId, listed: true });
  if (!product) {
    throw AppError.notFound("We couldn't find that product.");
  }

  const [moreFromFarmerDocs, youMightLikeDocs, slotCache] = await Promise.all([
    db
      .collection(COLLECTIONS.PRODUCTS)
      .find({
        farmerId: product.farmerId,
        _id: { $ne: product._id },
        listed: true,
        availability: { $in: ['in', 'low'] },
      })
      .sort({ salesCount: -1, _id: -1 })
      .limit(8)
      .toArray(),
    db
      .collection(COLLECTIONS.PRODUCTS)
      .find({
        categorySlug: product.categorySlug,
        farmerId: { $ne: product.farmerId },
        listed: true,
        availability: { $in: ['in', 'low'] },
      })
      .sort({ salesCount: -1, _id: -1 })
      .limit(8)
      .toArray(),
    getNextSlotsForAllFarmers(db),
  ]);

  return {
    moreFromFarmer: moreFromFarmerDocs.map((p) => {
      const slot = slotCache.get(p.farmerId.toString());
      return toProductCard(p, { cutoffAt: slot?.cutoffAt });
    }),
    youMightLike: youMightLikeDocs.map((p) => {
      const slot = slotCache.get(p.farmerId.toString());
      return toProductCard(p, { cutoffAt: slot?.cutoffAt });
    }),
  };
}
