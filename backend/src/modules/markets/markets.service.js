/**
 * Markets module service layer.
 * Manages physical market discovery, geospatial $geoNear queries, and attending farmers/products.
 */

import { ObjectId } from 'mongodb';
import { getDb } from '../../db/client.js';
import { COLLECTIONS } from '../../db/collections.js';
import { toObjectId } from '../../utils/ids.js';
import { AppError } from '../../utils/errors.js';
import { toMarketCard, toMarketDetail, toFarmerCard, toProductCard } from '../../utils/shapes.js';
import { encodeCursor, decodeCursor } from '../../utils/cursor.js';
import { zonedTimeToUtc } from '../../utils/slots.js';

/**
 * Computes the next opening start and end timestamps for a market in its timezone.
 *
 * @param {object} market
 * @param {Date} [now=new Date()]
 * @returns {{ start: string, end: string } | null}
 */
export function getNextMarketOpening(market, now = new Date()) {
  if (!market.schedule || market.schedule.length === 0) return null;

  const tz = market.timezone || 'America/New_York';
  const nowMs = now.getTime();

  for (let d = 0; d <= 7; d++) {
    const instant = new Date(nowMs + d * 86400000);
    const p = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      weekday: 'short',
      hourCycle: 'h23',
    }).formatToParts(instant);

    const g = (t) => p.find((x) => x.type === t)?.value;
    const year = Number(g('year'));
    const month = Number(g('month'));
    const day = Number(g('day'));
    const weekdayStr = (g('weekday') || '').toLowerCase().slice(0, 3);

    const matchingSchedule = market.schedule.find((s) => s.day === weekdayStr);
    if (!matchingSchedule) continue;

    const start = zonedTimeToUtc({ year, month, day, minutes: matchingSchedule.openMin }, tz);
    const end = zonedTimeToUtc({ year, month, day, minutes: matchingSchedule.closeMin }, tz);

    if (end.getTime() > nowMs) {
      return {
        start: start.toISOString(),
        end: end.toISOString(),
      };
    }
  }

  return null;
}

/**
 * Lists active markets filtered by day, prefix query, and optional geo coordinates.
 *
 * @param {object} params
 * @returns {Promise<{ data: Array<object>, meta: object }>}
 */
export async function listMarkets({ day, q, lat, lng, radiusKm = 25, cursor, limit = 20 }) {
  const db = getDb();
  const isGeo = lat !== undefined && lng !== undefined;

  const matchQuery = { status: 'active' };
  if (day) {
    matchQuery['schedule.day'] = day;
  }
  if (q) {
    matchQuery.name = new RegExp('^' + q, 'i');
  }

  let docs = [];
  let nextCursor = null;

  if (isGeo) {
    // ── Geospatial near query with $geoNear as the FIRST stage ──
    const sortName = 'distance';
    let cursorPredicate = null;

    if (cursor) {
      const decoded = decodeCursor(cursor, sortName);
      const [lastDist] = decoded.k;
      const targetId = new ObjectId(decoded.id);
      cursorPredicate = {
        $or: [
          { distanceMeters: { $gt: lastDist } },
          { distanceMeters: lastDist, _id: { $gt: targetId } },
        ],
      };
    }

    const pipeline = [
      {
        $geoNear: {
          near: { type: 'Point', coordinates: [Number(lng), Number(lat)] },
          distanceField: 'distanceMeters',
          maxDistance: Number(radiusKm) * 1000,
          spherical: true,
          query: matchQuery,
        },
      },
      { $sort: { distanceMeters: 1, _id: 1 } },
      ...(cursorPredicate ? [{ $match: cursorPredicate }] : []),
      { $limit: limit + 1 },
    ];

    docs = await db.collection(COLLECTIONS.MARKETS).aggregate(pipeline).toArray();

    if (docs.length > limit) {
      const extra = docs.pop();
      const lastReturned = docs[docs.length - 1];
      nextCursor = encodeCursor({
        s: sortName,
        k: [Math.round(lastReturned.distanceMeters)],
        id: lastReturned._id.toString(),
      });
    }
  } else {
    // ── Standard alphabetical sort by name ──
    const sortName = 'name';
    let filter = { ...matchQuery };

    if (cursor) {
      const decoded = decodeCursor(cursor, sortName);
      const [lastName] = decoded.k;
      const targetId = new ObjectId(decoded.id);
      filter = {
        $and: [
          matchQuery,
          {
            $or: [
              { name: { $gt: lastName } },
              { name: lastName, _id: { $gt: targetId } },
            ],
          },
        ],
      };
    }

    docs = await db
      .collection(COLLECTIONS.MARKETS)
      .find(filter)
      .sort({ name: 1, _id: 1 })
      .limit(limit + 1)
      .toArray();

    if (docs.length > limit) {
      const extra = docs.pop();
      const lastReturned = docs[docs.length - 1];
      nextCursor = encodeCursor({
        s: sortName,
        k: [lastReturned.name],
        id: lastReturned._id.toString(),
      });
    }
  }

  const data = docs.map((m) => {
    const opening = getNextMarketOpening(m);
    return toMarketCard(m, { distanceMeters: m.distanceMeters, nextOpening: opening });
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
 * Retrieves market detail by ID.
 * Throws 404 NOT_FOUND if the market does not exist or has status === 'removed'.
 *
 * @param {string} id
 * @returns {Promise<object>}
 */
export async function getMarketDetail(id) {
  const db = getDb();
  const objId = toObjectId(id, 'marketId');

  const market = await db.collection(COLLECTIONS.MARKETS).findOne({ _id: objId });
  if (!market || market.status === 'removed') {
    throw AppError.notFound("We couldn't find that market.");
  }

  const opening = getNextMarketOpening(market);
  return toMarketDetail(market, { nextOpening: opening });
}

/**
 * Lists active attending farmers at a specific market.
 *
 * @param {string} marketId
 * @param {object} params
 * @returns {Promise<{ data: Array<object>, meta: object }>}
 */
export async function listFarmersAtMarket(marketId, { sort = 'rating', cursor, limit = 20 }) {
  const db = getDb();
  const mId = toObjectId(marketId, 'marketId');

  const market = await db.collection(COLLECTIONS.MARKETS).findOne({ _id: mId });
  if (!market || market.status === 'removed') {
    throw AppError.notFound("We couldn't find that market.");
  }

  const baseFilter = {
    marketIds: mId,
    listingEnabled: true,
  };

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
 * Lists products fresh at a specific market.
 *
 * @param {string} marketId
 * @param {object} params
 * @returns {Promise<{ data: Array<object>, meta: object }>}
 */
export async function listProductsAtMarket(marketId, { cursor, limit = 20 }) {
  const db = getDb();
  const mId = toObjectId(marketId, 'marketId');

  const market = await db.collection(COLLECTIONS.MARKETS).findOne({ _id: mId });
  if (!market || market.status === 'removed') {
    throw AppError.notFound("We couldn't find that market.");
  }

  const baseFilter = {
    marketIds: mId,
    listed: true,
    availability: { $in: ['in', 'low'] },
  };

  let filter = { ...baseFilter };
  const sort = 'popular';

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

  const data = products.map((p) => toProductCard(p));

  return {
    data,
    meta: {
      nextCursor,
      limit,
    },
  };
}
