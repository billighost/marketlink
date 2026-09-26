/**
 * Verification recipe: check-ratings.js
 * Usage: node scripts/check-ratings.js
 * Recomputes ratings and review aggregates directly from raw reviews collection
 * and verifies that all denormalized farmer and product rating stats match with zero drift.
 */

import { connectDb, closeDb } from '../src/db/client.js';
import { COLLECTIONS } from '../src/db/collections.js';

async function main() {
  const db = await connectDb();
  console.log(`\n======================================================`);
  console.log(`⭐   Checking Ratings & Review Denormalization Integrity`);
  console.log(`======================================================\n`);

  let mismatches = 0;

  // 1. Verify Farmer Rating Aggregates
  const farmers = await db.collection(COLLECTIONS.FARMERS).find({}).toArray();
  console.log(`Auditing ratings across ${farmers.length} farmers...`);

  for (const f of farmers) {
    const reviews = await db.collection(COLLECTIONS.REVIEWS).find({
      farmerId: f._id,
      targetType: 'farmer',
      status: 'visible',
    }).toArray();

    const expectedCount = reviews.length;
    const expectedSum = reviews.reduce((sum, r) => sum + r.rating, 0);
    const expectedAvg = expectedCount > 0 ? Math.round((expectedSum / expectedCount) * 10) / 10 : 0;

    const actualCount = f.ratingCount || 0;
    const actualAvg = f.ratingAvg || 0;

    if (actualCount !== expectedCount || Math.abs(actualAvg - expectedAvg) > 0.01) {
      console.error(`  ❌ Farmer "${f.stallName}" mismatch:`);
      console.error(`     Expected: count=${expectedCount}, avg=${expectedAvg}`);
      console.error(`     Actual:   count=${actualCount}, avg=${actualAvg}`);
      mismatches++;
    }
  }

  // 2. Verify Product Rating Aggregates
  const products = await db.collection(COLLECTIONS.PRODUCTS).find({}).toArray();
  console.log(`Auditing ratings across ${products.length} products...`);

  for (const p of products) {
    const reviews = await db.collection(COLLECTIONS.REVIEWS).find({
      productId: p._id,
      targetType: 'product',
      status: 'visible',
    }).toArray();

    const expectedCount = reviews.length;
    const expectedSum = reviews.reduce((sum, r) => sum + r.rating, 0);
    const expectedAvg = expectedCount > 0 ? Math.round((expectedSum / expectedCount) * 10) / 10 : 0;

    const actualCount = p.ratingCount || 0;
    const actualAvg = p.ratingAvg || 0;

    if (actualCount !== expectedCount || Math.abs(actualAvg - expectedAvg) > 0.01) {
      console.error(`  ❌ Product "${p.name}" mismatch:`);
      console.error(`     Expected: count=${expectedCount}, avg=${expectedAvg}`);
      console.error(`     Actual:   count=${actualCount}, avg=${actualAvg}`);
      mismatches++;
    }
  }

  if (mismatches === 0) {
    console.log('\n✅ All review counts and rating averages match database aggregates with 0 drift!\n');
    await closeDb();
    process.exit(0);
  } else {
    console.error(`\n❌ Found ${mismatches} aggregate mismatches!\n`);
    await closeDb();
    process.exit(1);
  }
}

main().catch(async (err) => {
  console.error('Check failed:', err);
  await closeDb().catch(() => {});
  process.exit(1);
});
