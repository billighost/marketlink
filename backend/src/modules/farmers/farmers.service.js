/**
 * Farmers module service layer.
 * Catalog discovery for listed local farmers, detailed profiles, reviews, and pickup slots.
 */

import { ObjectId } from 'mongodb';
import { getDb } from '../../db/client.js';
import { COLLECTIONS } from '../../db/collections.js';
import { toObjectId } from '../../utils/ids.js';
import { AppError } from '../../utils/errors.js';
import { toFarmerCard, toFarmerDetail, toProductCard, toReviewItem } from '../../utils/shapes.js';
import { encodeCursor, decodeCursor } from '../../utils/cursor.js';
import { getUpcomingSlots } from '../../utils/slots.js';

/**
 * Lists listed farmers with optional text, category, market, and day filters.
 *
 * @param {object} params
 * @returns {Promise<{ data: Array<object>, meta: object }>}
 */
export async function listFarmers({ q, category, market, day, sort = 'rating', cursor, limit = 20 }) {
  const db = getDb();

  const baseFilter = { listingEnabled: true };

  if (q) {
    baseFilter.stallNameLower = new RegExp('^' + q, 'i');
  }
  if (category) {
    baseFilter.categorySlugs = category;
  }
  if (market) {
    baseFilter.marketIds = toObjectId(market, 'market');
  }
  if (day) {
    baseFilter.operatingDays = day;
  }

  const sortConfig = {
    rating: { field: 'ratingAvg', dir: 'desc', mongoSort: { ratingAvg: -1, _id: -1 } },
    top: { field: 'salesCount', dir: 'desc', mongoSort: { salesCount: -1, _id: -1 } },
    new: { field: 'createdAt', dir: 'desc', mongoSort: { createdAt: -1, _id: -1 } },
    name: { field: 'stallName', dir: 'asc', mongoSort: { stallName: 1, _id: 1 } },
  };

  const activeSort = sortConfig[sort] || sortConfig.rating;
  let filter = { ...baseFilter };

  if (cursor) {
    const decoded = decodeCursor(cursor, sort);
    const [k0] = decoded.k;
    const targetId = new ObjectId(decoded.id);
    const op = activeSort.dir === 'desc' ? '$lt' : '$gt';

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

  const [farmers, markets] = await Promise.all([
    db
      .collection(COLLECTIONS.FARMERS)
      .find(filter)
      .sort(activeSort.mongoSort)
      .limit(limit + 1)
      .toArray(),
    db.collection(COLLECTIONS.MARKETS).find({ status: 'active' }, { projection: { _id: 1, name: 1 } }).toArray(),
  ]);

  let nextCursor = null;
  if (farmers.length > limit) {
    farmers.pop();
    const last = farmers[farmers.length - 1];
    nextCursor = encodeCursor({
      s: sort,
      k: [last[activeSort.field]],
      id: last._id.toString(),
    });
  }

  const fIds = farmers.map((f) => f._id);
  const stockCounts = fIds.length > 0
    ? await db
        .collection(COLLECTIONS.PRODUCTS)
        .aggregate([
          { $match: { farmerId: { $in: fIds }, listed: true } },
          {
            $group: {
              _id: '$farmerId',
              low: { $sum: { $cond: [{ $eq: ['$availability', 'low'] }, 1, 0] } },
              out: { $sum: { $cond: [{ $eq: ['$availability', 'out'] }, 1, 0] } },
            },
          },
        ])
        .toArray()
    : [];
  const stockMap = new Map(stockCounts.map((s) => [s._id.toString(), s]));

  const marketLookup = new Map(markets.map((m) => [m._id.toString(), m]));
  const data = farmers.map((f) => {
    const fMarkets = (f.marketIds || []).map((id) => marketLookup.get(id.toString())).filter(Boolean);
    const counts = stockMap.get(f._id.toString());
    return toFarmerCard(f, {
      markets: fMarkets,
      lowStockCount: counts?.low ?? 0,
      soldOutCount: counts?.out ?? 0,
    });
  });

  return {
    data,
    meta: {
      nextCursor,
      limit,
    },
  };
}

/**
 * Retrieves detailed farmer profile with ratings breakdown and active product count.
 * Returns 404 if farmer is not found or listingEnabled is false.
 *
 * @param {string} id
 * @returns {Promise<object>}
 */
export async function getFarmerDetail(id) {
  const db = getDb();
  const fId = toObjectId(id, 'farmerId');

  const farmer = await db.collection(COLLECTIONS.FARMERS).findOne({ _id: fId });
  if (!farmer || !farmer.listingEnabled) {
    throw AppError.notFound("We couldn't find that farmer.");
  }

  const [markets, breakdownDocs, productCount, stockCounts] = await Promise.all([
    db
      .collection(COLLECTIONS.MARKETS)
      .find({ _id: { $in: farmer.marketIds || [] }, status: 'active' }, { projection: { _id: 1, name: 1 } })
      .toArray(),
    db
      .collection(COLLECTIONS.REVIEWS)
      .aggregate([
        { $match: { farmerId: fId, targetType: 'farmer', status: 'visible' } },
        { $group: { _id: '$rating', count: { $sum: 1 } } },
      ])
      .toArray(),
    db.collection(COLLECTIONS.PRODUCTS).countDocuments({ farmerId: fId, listed: true }),
    db
      .collection(COLLECTIONS.PRODUCTS)
      .aggregate([
        { $match: { farmerId: fId, listed: true } },
        {
          $group: {
            _id: '$farmerId',
            low: { $sum: { $cond: [{ $eq: ['$availability', 'low'] }, 1, 0] } },
            out: { $sum: { $cond: [{ $eq: ['$availability', 'out'] }, 1, 0] } },
          },
        },
      ])
      .toArray(),
  ]);

  const ratingBreakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  for (const item of breakdownDocs) {
    if (ratingBreakdown[item._id] !== undefined) {
      ratingBreakdown[item._id] = item.count;
    }
  }

  return toFarmerDetail(farmer, {
    markets,
    ratingBreakdown,
    productCount,
    lowStockCount: stockCounts[0]?.low ?? 0,
    soldOutCount: stockCounts[0]?.out ?? 0,
  });
}

/**
 * Lists listed products belonging to a farmer.
 *
 * @param {string} id
 * @param {object} params
 * @returns {Promise<{ data: Array<object>, meta: object }>}
 */
export async function listFarmerProducts(id, { availability, category, includeSoldOut = false, cursor, limit = 20 }) {
  const db = getDb();
  const fId = toObjectId(id, 'farmerId');

  const farmer = await db.collection(COLLECTIONS.FARMERS).findOne({ _id: fId });
  if (!farmer || !farmer.listingEnabled) {
    throw AppError.notFound("We couldn't find that farmer.");
  }

  const baseFilter = {
    farmerId: fId,
    listed: true,
  };

  if (availability) {
    baseFilter.availability = availability;
  } else if (!includeSoldOut) {
    baseFilter.availability = { $in: ['in', 'low'] };
  } else {
    baseFilter.availability = { $in: ['in', 'low', 'out'] };
  }

  if (category) {
    baseFilter.categorySlug = category;
  }

  const sort = 'popular';
  let filter = { ...baseFilter };

  if (cursor) {
    const decoded = decodeCursor(cursor, sort);
    const [lastSales] = decoded.k;
    const targetId = new ObjectId(decoded.id);

    filter = {
      $and: [
        baseFilter,
        {
          $or: [
            { salesCount: { $lt: lastSales } },
            { salesCount: lastSales, _id: { $lt: targetId } },
          ],
        },
      ],
    };
  }

  const products = await db
    .collection(COLLECTIONS.PRODUCTS)
    .find(filter)
    .sort({ salesCount: -1, _id: -1 })
    .limit(limit + 1)
    .toArray();

  let nextCursor = null;
  if (products.length > limit) {
    products.pop();
    const last = products[products.length - 1];
    nextCursor = encodeCursor({
      s: sort,
      k: [last.salesCount],
      id: last._id.toString(),
    });
  }

  return {
    data: products.map((p) => toProductCard(p)),
    meta: {
      nextCursor,
      limit,
    },
  };
}

/**
 * Lists public reviews for a farmer.
 *
 * @param {string} id
 * @param {object} params
 * @returns {Promise<{ data: Array<object>, meta: object }>}
 */
export async function listFarmerReviews(id, { sort = 'newest', cursor, limit = 20 }) {
  const db = getDb();
  const fId = toObjectId(id, 'farmerId');

  const farmer = await db.collection(COLLECTIONS.FARMERS).findOne({ _id: fId });
  if (!farmer || !farmer.listingEnabled) {
    throw AppError.notFound("We couldn't find that farmer.");
  }

  const baseFilter = {
    farmerId: fId,
    status: 'visible',
  };

  const sortConfig = {
    newest: { field: 'createdAt', dir: 'desc', mongoSort: { createdAt: -1, _id: -1 } },
    highest: { field: 'rating', dir: 'desc', mongoSort: { rating: -1, _id: -1 } },
    lowest: { field: 'rating', dir: 'asc', mongoSort: { rating: 1, _id: 1 } },
  };

  const activeSort = sortConfig[sort] || sortConfig.newest;
  let filter = { ...baseFilter };

  if (cursor) {
    const decoded = decodeCursor(cursor, sort);
    let [k0] = decoded.k;
    if (activeSort.field === 'createdAt' && typeof k0 === 'number') {
      k0 = new Date(k0);
    }
    const targetId = new ObjectId(decoded.id);
    const op = activeSort.dir === 'desc' ? '$lt' : '$gt';

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

  const reviews = await db
    .collection(COLLECTIONS.REVIEWS)
    .find(filter)
    .sort(activeSort.mongoSort)
    .limit(limit + 1)
    .toArray();

  let nextCursor = null;
  if (reviews.length > limit) {
    reviews.pop();
    const last = reviews[reviews.length - 1];
    nextCursor = encodeCursor({
      s: sort,
      k: [last[activeSort.field]],
      id: last._id.toString(),
    });
  }

  return {
    data: reviews.map((r) => toReviewItem(r, farmer.stallName)),
    meta: {
      nextCursor,
      limit,
    },
  };
}

/**
 * Returns upcoming pickup slots for a farmer.
 *
 * @param {string} id
 * @param {object} [opts]
 * @returns {Promise<Array<object>>}
 */
export async function getFarmerPickupSlots(id, { days = 14 } = {}) {
  const db = getDb();
  const fId = toObjectId(id, 'farmerId');

  const farmer = await db.collection(COLLECTIONS.FARMERS).findOne({ _id: fId });
  if (!farmer || !farmer.listingEnabled) {
    throw AppError.notFound("We couldn't find that farmer.");
  }

  const markets = await db
    .collection(COLLECTIONS.MARKETS)
    .find({ _id: { $in: farmer.marketIds || [] }, status: 'active' })
    .toArray();

  return getUpcomingSlots(farmer, markets, { days, now: new Date() });
}
