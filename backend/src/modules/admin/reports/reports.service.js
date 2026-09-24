/**
 * Admin Reports service layer.
 * Aggregates platform-wide summaries (market revenues, active farmers, daily series, top products, new signups)
 * and streams cursor-based CSV exports.
 */

import { ObjectId } from 'mongodb';
import { getDb } from '../../../db/client.js';
import { COLLECTIONS } from '../../../db/collections.js';
import { toObjectId } from '../../../utils/ids.js';
import { AppError } from '../../../utils/errors.js';
import { writeAudit } from '../../../utils/audit.js';
import { streamCsv } from './csv.js';
import { getDateSeries } from '../../farmer/insights/insights.service.js';

export function parseReportRange(rangeStr = '30d') {
  let days = 30;
  if (typeof rangeStr === 'string' && rangeStr.endsWith('d')) {
    days = parseInt(rangeStr.slice(0, -1), 10);
  } else if (!Number.isNaN(parseInt(rangeStr, 10))) {
    days = parseInt(rangeStr, 10);
  }

  if (Number.isNaN(days) || days <= 0) {
    days = 30;
  }

  if (days > 366) {
    throw new AppError(422, 'RANGE_TOO_LARGE', 'Report date range cannot exceed 366 days.');
  }

  return days;
}

/**
 * Generates the executive admin reports summary.
 *
 * @param {string} [rangeStr='30d']
 * @param {object} [options]
 * @param {Date} [options.now=new Date()]
 * @returns {Promise<object>}
 */
export async function getAdminReportsSummary(rangeStr = '30d', { now = new Date() } = {}) {
  const db = getDb();
  const days = parseReportRange(rangeStr);
  const since = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  const tz = 'America/New_York';

  const [ordersFacetResult, newMembersAgg] = await Promise.all([
    // 1. Orders facet pipeline
    db
      .collection(COLLECTIONS.ORDERS)
      .aggregate([
        { $match: { createdAt: { $gte: since } } },
        {
          $facet: {
            totals: [
              {
                $group: {
                  _id: '$status',
                  count: { $sum: 1 },
                  revenue: {
                    $sum: { $cond: [{ $eq: ['$status', 'completed'] }, '$totalCents', 0] },
                  },
                },
              },
            ],
            byDay: [
              { $match: { status: { $ne: 'cancelled' } } },
              {
                $group: {
                  _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: tz } },
                  orders: { $sum: 1 },
                  revenue: {
                    $sum: { $cond: [{ $eq: ['$status', 'completed'] }, '$totalCents', 0] },
                  },
                },
              },
              { $sort: { _id: 1 } },
            ],
            byMarket: [
              { $match: { status: 'completed' } },
              {
                $group: {
                  _id: '$marketId',
                  orders: { $sum: 1 },
                  revenueCents: { $sum: '$totalCents' },
                },
              },
              { $sort: { revenueCents: -1 } },
            ],
            byFarmer: [
              { $match: { status: 'completed' } },
              {
                $group: {
                  _id: '$farmerId',
                  orders: { $sum: 1 },
                },
              },
              { $sort: { orders: -1 } },
              { $limit: 10 },
            ],
            topProducts: [
              { $match: { status: 'completed' } },
              { $unwind: '$items' },
              {
                $group: {
                  _id: '$items.productId',
                  name: { $first: '$items.name' },
                  quantity: { $sum: '$items.quantity' },
                  revenueCents: { $sum: '$items.lineTotalCents' },
                },
              },
              { $sort: { quantity: -1 } },
              { $limit: 10 },
            ],
          },
        },
      ])
      .toArray(),

    // 2. New signups per week
    db
      .collection(COLLECTIONS.USERS)
      .aggregate([
        { $match: { createdAt: { $gte: since }, role: { $in: ['customer', 'farmer'] } } },
        {
          $group: {
            _id: {
              week: { $dateToString: { format: '%G-W%V', date: '$createdAt', timezone: tz } },
              role: '$role',
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { '_id.week': 1 } },
      ])
      .toArray(),
  ]);

  const facet = ordersFacetResult[0] || {};

  // Totals
  let totalOrders = 0;
  let revenueCents = 0;
  if (facet.totals) {
    for (const t of facet.totals) {
      totalOrders += t.count;
      if (t._id === 'completed') {
        revenueCents = t.revenue;
      }
    }
  }

  // Revenue by market enrichment
  const marketIds = (facet.byMarket || []).map((m) => toObjectId(m._id));
  const markets = await db
    .collection(COLLECTIONS.MARKETS)
    .find({ _id: { $in: marketIds } }, { projection: { _id: 1, name: 1 } })
    .toArray();
  const marketMap = new Map(markets.map((m) => [m._id.toString(), m.name]));

  const revenueByMarket = (facet.byMarket || []).map((m) => ({
    marketId: m._id ? m._id.toString() : '',
    name: m._id ? marketMap.get(m._id.toString()) || 'Unknown Market' : 'Unknown Market',
    revenueCents: m.revenueCents,
    orders: m.orders,
  }));

  // Most active farmers enrichment
  const farmerIds = (facet.byFarmer || []).map((f) => toObjectId(f._id));
  const farmers = await db
    .collection(COLLECTIONS.FARMERS)
    .find({ _id: { $in: farmerIds } }, { projection: { _id: 1, stallName: 1 } })
    .toArray();
  const farmerMap = new Map(farmers.map((f) => [f._id.toString(), f.stallName]));

  const mostActiveFarmers = (facet.byFarmer || []).map((f) => ({
    farmerId: f._id ? f._id.toString() : '',
    stallName: f._id ? farmerMap.get(f._id.toString()) || 'Unknown Farmer' : 'Unknown Farmer',
    orders: f.orders,
  }));

  // Fill missing days
  const existingDays = new Map();
  for (const d of facet.byDay || []) {
    existingDays.set(d._id, { orders: d.orders, revenueCents: d.revenue });
  }

  const dateSeries = getDateSeries(since, now, tz);
  const ordersByDay = dateSeries.map((dStr) => {
    const existing = existingDays.get(dStr);
    return {
      date: dStr,
      orders: existing ? existing.orders : 0,
      revenueCents: existing ? existing.revenueCents : 0,
    };
  });

  // Top products
  const topProducts = (facet.topProducts || []).map((p) => ({
    productId: p._id ? p._id.toString() : '',
    name: p.name || 'Product',
    quantity: p.quantity,
    revenueCents: p.revenueCents,
  }));

  // New members weekly breakdown
  const memberWeekMap = new Map();
  for (const item of newMembersAgg) {
    const week = item._id.week;
    if (!memberWeekMap.has(week)) {
      memberWeekMap.set(week, { week, customers: 0, farmers: 0 });
    }
    const entry = memberWeekMap.get(week);
    if (item._id.role === 'customer') entry.customers += item.count;
    else if (item._id.role === 'farmer') entry.farmers += item.count;
  }
  const newMembers = Array.from(memberWeekMap.values()).sort((a, b) => a.week.localeCompare(b.week));

  return {
    totalOrders,
    revenueCents,
    revenueByMarket,
    mostActiveFarmers,
    ordersByDay,
    topProducts,
    newMembers,
  };
}

/**
 * Streams exported CSV reports with audit logging and history recording.
 *
 * @param {object} adminActor
 * @param {import('express').Response} res
 * @param {import('express').Request} req
 * @param {object} query
 */
export async function exportCsvReport(adminActor, res, req, query = {}) {
  const type = query.type || 'orders';
  const days = parseReportRange(query.range || '30d');
  const now = new Date();
  const since = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

  const db = getDb();

  // Record report generation entry in reports collection
  await db.collection(COLLECTIONS.REPORTS).insertOne({
    _id: new ObjectId(),
    generatedBy: toObjectId(adminActor.id),
    reportType: type,
    params: { range: query.range || '30d', type },
    generatedAt: now,
  });

  const dateStr = now.toISOString().slice(0, 10);
  const filename = `marketlink-${type}-${dateStr}.csv`;

  if (type === 'orders') {
    const headers = [
      'orderNumber',
      'createdAt',
      'status',
      'customerName',
      'farmerName',
      'market',
      'pickupStart',
      'itemCount',
      'totalUSD',
    ];

    const cursor = db
      .collection(COLLECTIONS.ORDERS)
      .find({ createdAt: { $gte: since } })
      .sort({ createdAt: -1 });

    const rowFormatter = (o) => {
      const itemCount = (o.items || []).reduce((s, it) => s + (it.quantity || 0), 0);
      const totalUSD = ((o.totalCents || 0) / 100).toFixed(2);
      const pickupStart = o.pickup?.start instanceof Date ? o.pickup.start.toISOString() : (o.pickup?.start || '');
      const createdAt = o.createdAt instanceof Date ? o.createdAt.toISOString() : o.createdAt;

      return [
        o.orderNumber,
        createdAt,
        o.status,
        o.customerName,
        o.farmerName || '',
        o.pickup?.marketName || '',
        pickupStart,
        itemCount,
        totalUSD,
      ];
    };

    await streamCsv(res, req, filename, headers, cursor, rowFormatter);
  } else if (type === 'revenue') {
    const headers = ['date', 'market', 'orders', 'revenueUSD'];

    const summary = await getAdminReportsSummary(query.range || '30d', { now });
    // Transform ordersByDay to stream
    async function* revenueGen() {
      for (const d of summary.ordersByDay) {
        yield d;
      }
    }

    const rowFormatter = (d) => [
      d.date,
      'All Markets',
      d.orders,
      ((d.revenueCents || 0) / 100).toFixed(2),
    ];

    await streamCsv(res, req, filename, headers, revenueGen(), rowFormatter);
  } else if (type === 'farmers') {
    const headers = ['stallName', 'status', 'orders', 'revenueUSD', 'rating'];

    const cursor = db.collection(COLLECTIONS.FARMERS).find({}).sort({ stallName: 1 });

    const rowFormatter = (f) => [
      f.stallName,
      f.listingEnabled ? 'active' : 'inactive',
      f.salesCount || 0,
      '0.00',
      f.ratingAvg ? f.ratingAvg.toFixed(1) : '0.0',
    ];

    await streamCsv(res, req, filename, headers, cursor, rowFormatter);
  } else {
    throw AppError.validation(`Invalid report type '${type}'. Allowed: orders, revenue, farmers`, { field: 'type' });
  }

  await writeAudit(
    adminActor,
    'report.export',
    { type: 'report', id: null },
    { reportType: type, range: query.range || '30d' }
  );
}
