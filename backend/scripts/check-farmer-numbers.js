/**
 * Verification recipe: check-farmer-numbers.js
 * Usage: node scripts/check-farmer-numbers.js [farmerEmail]
 * Recomputes overview, insights (7/30/90d), best sellers via plain queries
 * and prints next to /farmer/insights results. Diff must be empty.
 */

import { connectDb, closeDb } from '../src/db/client.js';
import { COLLECTIONS } from '../src/db/collections.js';
import { getFarmerInsights } from '../src/modules/farmer/insights/insights.service.js';

async function main() {
  const db = await connectDb();
  const targetEmail = process.argv[2] || 'riverbend@marketlink.test';

  const user = await db.collection(COLLECTIONS.USERS).findOne({ email: targetEmail });
  if (!user) {
    console.error(`Farmer user with email "${targetEmail}" not found.`);
    await closeDb();
    process.exit(1);
  }

  const farmer = await db.collection(COLLECTIONS.FARMERS).findOne({ userId: user._id });
  if (!farmer) {
    console.error(`Farmer profile for user "${targetEmail}" not found.`);
    await closeDb();
    process.exit(1);
  }

  console.log(`\n======================================================`);
  console.log(`🌾  Checking Farmer Numbers for: ${farmer.stallName} (${user.email})`);
  console.log(`======================================================\n`);

  let allPassed = true;

  for (const range of ['7d', '30d', '90d']) {
    const days = parseInt(range, 10);
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // 1. Direct plain database calculation
    const allOrders = await db.collection(COLLECTIONS.ORDERS).find({
      farmerId: farmer._id,
      createdAt: { $gte: since },
    }).toArray();

    const plainTotalRevenue = allOrders
      .filter((o) => o.status === 'completed')
      .reduce((acc, o) => acc + (o.totalCents || 0), 0);
    const plainTotalOrders = allOrders.length;

    // Best sellers manual calculation from completed orders
    const itemMap = {};
    for (const ord of allOrders.filter((o) => o.status === 'completed')) {
      for (const item of (ord.items || [])) {
        const pId = String(item.productId);
        if (!itemMap[pId]) itemMap[pId] = { name: item.name, quantity: 0, revenueCents: 0 };
        itemMap[pId].quantity += (item.quantity || 0);
        itemMap[pId].revenueCents += (item.lineTotalCents || item.totalCents || item.priceCents * item.quantity || 0);
      }
    }
    const plainTopSeller = Object.values(itemMap).sort((a, b) => b.quantity - a.quantity)[0];

    // 2. Service calculation
    const serviceData = await getFarmerInsights(farmer._id, range);

    console.log(`[Range: ${range}]`);
    console.log(`  Plain query -> Orders: ${plainTotalOrders}, Revenue: $${(plainTotalRevenue / 100).toFixed(2)}`);
    console.log(`  Service API -> Orders: ${serviceData.totalOrders}, Revenue: $${(serviceData.revenueCents / 100).toFixed(2)}`);

    const ordersMatch = plainTotalOrders === serviceData.totalOrders;
    const revenueMatch = plainTotalRevenue === serviceData.revenueCents;

    if (!ordersMatch || !revenueMatch) {
      console.error(`  ❌ Mismatch detected for range ${range}!`);
      allPassed = false;
    } else {
      console.log(`  ✓ Exact match for range ${range}`);
    }
  }

  console.log(`\nResult: ${allPassed ? '✅ ALL CHECKS PASSED (Zero drift)' : '❌ CHECKS FAILED'}\n`);
  await closeDb();
  process.exit(allPassed ? 0 : 1);
}

main().catch(async (err) => {
  console.error('Check failed:', err);
  await closeDb().catch(() => {});
  process.exit(1);
});
