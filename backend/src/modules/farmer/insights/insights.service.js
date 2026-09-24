/**
 * Farmer Insights aggregation service.
 * Implements D6 $facet pipeline for sales totals, daily time-series, best-sellers,
 * and repeat customer metrics with zero-filled dates in market timezone.
 */

import { ObjectId } from 'mongodb';
import { getDb } from '../../../db/client.js';
import { COLLECTIONS } from '../../../db/collections.js';
import { toObjectId } from '../../../utils/ids.js';
import { AppError } from '../../../utils/errors.js';

// 30-second in-memory cache
const insightsCache = new Map();

/**
 * Parses range string into days count.
 *
 * @param {string} [rangeStr='30d']
 * @returns {number}
 */
export function parseRangeDays(rangeStr = '30d') {
  if (rangeStr === '7d') return 7;
  if (rangeStr === '30d') return 30;
  if (rangeStr === '90d') return 90;
  if (rangeStr === '365d') return 365;
  return 30;
}

/**
 * Returns an array of YYYY-MM-DD date strings between since and now for the given timezone.
 *
 * @param {Date} sinceDate
 * @param {Date} endDate
 * @param {string} tz
 * @returns {Array<string>}
 */
export function getDateSeries(sinceDate, endDate, tz) {
  const dates = [];
  const curr = new Date(sinceDate);

  // Helper to format in tz
  const fmt = (d) => {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: tz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(d);
  };

  const endStr = fmt(endDate);
  while (true) {
    const s = fmt(curr);
    dates.push(s);
    if (s === endStr || curr >= endDate) break;
    curr.setUTCDate(curr.getUTCDate() + 1);
  }

  return [...new Set(dates)].sort();
}

/**
 * Computes insights metrics for a farmer over a specified range.
 *
 * @param {string|ObjectId} farmerId
 * @param {string} [range='30d']
 * @param {object} [options]
 * @param {Date} [options.now=new Date()]
 * @returns {Promise<object>}
 */
export async function getFarmerInsights(farmerId, range = '30d', { now = new Date() } = {}) {
  const db = getDb();
  const fId = toObjectId(farmerId);
  const days = parseRangeDays(range);
  const since = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

  const cacheKey = `${fId.toString()}:${range}`;
  const cached = insightsCache.get(cacheKey);
  if (cached && Date.now() - cached.cachedAt < 30000) {
    return cached.data;
  }

  // Find farmer's market timezone
  const farmer = await db.collection(COLLECTIONS.FARMERS).findOne({ _id: fId });
  if (!farmer) {
    throw AppError.notFound('Farmer profile not found');
  }

  let tz = 'America/New_York';
  if (Array.isArray(farmer.marketIds) && farmer.marketIds.length > 0) {
    const market = await db
      .collection(COLLECTIONS.MARKETS)
      .findOne({ _id: farmer.marketIds[0] }, { projection: { timezone: 1 } });
    if (market?.timezone) {
      tz = market.timezone;
    }
  }

  // 1. D6 Facet Aggregation
  const [facetResult] = await db
    .collection(COLLECTIONS.ORDERS)
    .aggregate([
      {
        $match: {
          farmerId: fId,
          createdAt: { $gte: since },
        },
      },
      {
        $facet: {
          totals: [
            {
              $group: {
                _id: '$status',
                n: { $sum: 1 },
                revenue: {
                  $sum: {
                    $cond: [{ $eq: ['$status', 'completed'] }, '$totalCents', 0],
                  },
                },
              },
            },
          ],
          byDay: [
            { $match: { status: { $ne: 'cancelled' } } },
            {
              $group: {
                _id: {
                  $dateToString: {
                    format: '%Y-%m-%d',
                    date: '$createdAt',
                    timezone: tz,
                  },
                },
                orders: { $sum: 1 },
                revenue: {
                  $sum: {
                    $cond: [{ $eq: ['$status', 'completed'] }, '$totalCents', 0],
                  },
                },
              },
            },
            { $sort: { _id: 1 } },
          ],
          best: [
            { $match: { status: 'completed' } },
            { $unwind: '$items' },
            {
              $group: {
                _id: '$items.productId',
                name: { $first: '$items.name' },
                qty: { $sum: '$items.quantity' },
                revenue: { $sum: '$items.lineTotalCents' },
              },
            },
            { $sort: { qty: -1 } },
            { $limit: 5 },
          ],
          customers: [
            { $group: { _id: '$customerId', n: { $sum: 1 } } },
            {
              $group: {
                _id: null,
                repeat: {
                  $sum: { $cond: [{ $gt: ['$n', 1] }, 1, 0] },
                },
                total: { $sum: 1 },
              },
            },
          ],
        },
      },
    ])
    .toArray();

  // 2. Pending orders count (overall, not range-limited)
  const pendingOrders = await db.collection(COLLECTIONS.ORDERS).countDocuments({
    farmerId: fId,
    status: 'placed',
  });

  // 3. Process totals
  let totalOrders = 0;
  let completedOrders = 0;
  let cancelledOrders = 0;
  let revenueCents = 0;

  if (facetResult?.totals) {
    for (const t of facetResult.totals) {
      totalOrders += t.n;
      if (t._id === 'completed') {
        completedOrders = t.n;
        revenueCents = t.revenue;
      } else if (t._id === 'cancelled') {
        cancelledOrders = t.n;
      }
    }
  }

  const averageOrderCents = completedOrders > 0 ? Math.round(revenueCents / completedOrders) : 0;
  const repeatCustomers = facetResult?.customers?.[0]?.repeat || 0;

  // 4. Fill missing days in byDay series
  const existingDaysMap = new Map();
  if (facetResult?.byDay) {
    for (const d of facetResult.byDay) {
      existingDaysMap.set(d._id, {
        orders: d.orders,
        revenueCents: d.revenue,
      });
    }
  }

  const fullSeries = getDateSeries(since, now, tz);
  const ordersByDay = fullSeries.map((dateStr) => {
    const existing = existingDaysMap.get(dateStr);
    return {
      date: dateStr,
      orders: existing ? existing.orders : 0,
      revenueCents: existing ? existing.revenueCents : 0,
    };
  });

  // 5. Best sellers
  const bestSellers = (facetResult?.best || []).map((b) => ({
    productId: b._id ? b._id.toString() : '',
    name: b.name || 'Product',
    quantity: b.qty,
    revenueCents: b.revenue,
  }));

  const data = {
    range,
    totalOrders,
    pendingOrders,
    completedOrders,
    cancelledOrders,
    revenueCents,
    averageOrderCents,
    repeatCustomers,
    bestSellers,
    ordersByDay,
  };

  insightsCache.set(cacheKey, { data, cachedAt: Date.now() });

  return data;
}
