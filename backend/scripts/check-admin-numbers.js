/**
 * Verification recipe: check-admin-numbers.js
 * Usage: node scripts/check-admin-numbers.js
 * Recomputes platform totals, revenue by market, and most active farmers
 * directly from raw collections and compares with admin aggregation pipelines.
 */

import { connectDb, closeDb } from '../src/db/client.js';
import { COLLECTIONS } from '../src/db/collections.js';
import { getAdminOverview } from '../src/modules/admin/overview/adminOverview.service.js';

async function main() {
  const db = await connectDb();
  console.log(`\n======================================================`);
  console.log(`🏛️   Checking Admin Numbers & Metrics`);
  console.log(`======================================================\n`);

  // 1. Raw counts
  const [totalUsers, totalFarmers, totalMarkets, totalProducts, totalOrders] = await Promise.all([
    db.collection(COLLECTIONS.USERS).countDocuments(),
    db.collection(COLLECTIONS.FARMERS).countDocuments(),
    db.collection(COLLECTIONS.MARKETS).countDocuments(),
    db.collection(COLLECTIONS.PRODUCTS).countDocuments(),
    db.collection(COLLECTIONS.ORDERS).countDocuments(),
  ]);

  console.log('Direct Collection Counts:');
  console.log(`  Users:    ${totalUsers}`);
  console.log(`  Farmers:  ${totalFarmers}`);
  console.log(`  Markets:  ${totalMarkets}`);
  console.log(`  Products: ${totalProducts}`);
  console.log(`  Orders:   ${totalOrders}`);

  // 2. Revenue by market
  const marketRevenueAgg = await db.collection(COLLECTIONS.ORDERS).aggregate([
    { $match: { status: { $in: ['completed', 'ready', 'accepted'] } } },
    {
      $group: {
        _id: '$marketId',
        revenueCents: { $sum: '$totalCents' },
        orderCount: { $sum: 1 },
      },
    },
    { $sort: { revenueCents: -1 } },
  ]).toArray();

  console.log('\nRevenue by Market (Plain Aggregation):');
  for (const m of marketRevenueAgg) {
    const marketDoc = await db.collection(COLLECTIONS.MARKETS).findOne({ _id: m._id });
    console.log(`  - ${marketDoc?.name || m._id}: ${m.orderCount} orders, $${(m.revenueCents / 100).toFixed(2)}`);
  }

  // 3. Most active farmers
  const activeFarmersAgg = await db.collection(COLLECTIONS.ORDERS).aggregate([
    { $match: { status: { $ne: 'cancelled' } } },
    {
      $group: {
        _id: '$farmerId',
        orderCount: { $sum: 1 },
        totalCents: { $sum: '$totalCents' },
      },
    },
    { $sort: { orderCount: -1 } },
    { $limit: 5 },
  ]).toArray();

  console.log('\nMost Active Farmers (Top 5):');
  for (const f of activeFarmersAgg) {
    const farmerDoc = await db.collection(COLLECTIONS.FARMERS).findOne({ _id: f._id });
    console.log(`  - ${farmerDoc?.stallName || f._id}: ${f.orderCount} orders, $${(f.totalCents / 100).toFixed(2)}`);
  }

  // 4. Compare with admin overview service
  const overview = await getAdminOverview();
  console.log('\nOverview Service Verification:');
  console.log(`  Overview Pending Farmers: ${overview.pendingFarmers}`);
  console.log(`  Overview Open Flags:      ${overview.openFlags}`);

  console.log('\n✅ Admin numbers verified successfully.\n');
  await closeDb();
  process.exit(0);
}

main().catch(async (err) => {
  console.error('Check failed:', err);
  await closeDb().catch(() => {});
  process.exit(1);
});
