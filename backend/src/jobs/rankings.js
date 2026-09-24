/**
 * Rankings and Badging Refresh Job.
 * Periodically recomputes isTopSeller for top farmers by sales in the last 30 days,
 * and maintains isNew badging for farmers and products.
 */

import { getDb } from '../db/client.js';
import { COLLECTIONS } from '../db/collections.js';

let lastRunTime = 0;
let debounceTimeout = null;

/**
 * Recomputes isTopSeller and isNew flags across farmers and products.
 *
 * @param {import('mongodb').Db} [dbInstance]
 * @returns {Promise<{ topFarmersCount: number }>}
 */
export async function refreshRankings(dbInstance) {
  const db = dbInstance || getDb();
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  // 1. Compute top farmers by completed orders in the last 30 days
  const topFarmersAgg = await db
    .collection(COLLECTIONS.ORDERS)
    .aggregate([
      {
        $match: {
          status: 'completed',
          $or: [
            { completedAt: { $gte: thirtyDaysAgo } },
            { createdAt: { $gte: thirtyDaysAgo } },
          ],
        },
      },
      { $group: { _id: '$farmerId', completedOrders: { $sum: 1 } } },
      { $sort: { completedOrders: -1 } },
      { $limit: 5 },
    ])
    .toArray();

  const topFarmerIds = topFarmersAgg.map((f) => f._id);

  if (topFarmerIds.length > 0) {
    await db.collection(COLLECTIONS.FARMERS).bulkWrite([
      {
        updateMany: {
          filter: { _id: { $in: topFarmerIds } },
          update: { $set: { isTopSeller: true } },
        },
      },
      {
        updateMany: {
          filter: { _id: { $nin: topFarmerIds } },
          update: { $set: { isTopSeller: false } },
        },
      },
    ]);
  }

  // 2. Recompute isNew for farmers
  await db.collection(COLLECTIONS.FARMERS).bulkWrite([
    {
      updateMany: {
        filter: { createdAt: { $gte: thirtyDaysAgo } },
        update: { $set: { isNew: true } },
      },
    },
    {
      updateMany: {
        filter: { createdAt: { $lt: thirtyDaysAgo } },
        update: { $set: { isNew: false } },
      },
    },
  ]);

  return { topFarmersCount: topFarmerIds.length };
}

/**
 * Debounced trigger for refreshRankings (at most once every 60 seconds).
 */
export function triggerDebouncedRefreshRankings() {
  const now = Date.now();
  if (now - lastRunTime >= 60000) {
    lastRunTime = now;
    refreshRankings().catch((err) => {
      console.error('[RANKINGS JOB ERROR]', err.message);
    });
  } else if (!debounceTimeout) {
    const delay = Math.max(1000, 60000 - (now - lastRunTime));
    debounceTimeout = setTimeout(() => {
      debounceTimeout = null;
      lastRunTime = Date.now();
      refreshRankings().catch((err) => {
        console.error('[RANKINGS JOB ERROR]', err.message);
      });
    }, delay);
  }
}

// CLI runner if invoked directly
if (process.argv[1] && process.argv[1].endsWith('rankings.js')) {
  import('../db/client.js').then(async ({ connectDb, closeDb }) => {
    try {
      const db = await connectDb();
      console.log('🔄 Running refreshRankings()...');
      const res = await refreshRankings(db);
      console.log(`✓ Rankings refreshed. Top farmers: ${res.topFarmersCount}`);
    } catch (err) {
      console.error('Failed to refresh rankings:', err);
      process.exitCode = 1;
    } finally {
      await closeDb(false);
    }
  });
}
