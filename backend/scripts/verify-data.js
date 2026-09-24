/**
 * Data invariant verification script.
 * Validates platform integrity rules across products, orders, timelines, and review aggregates.
 * Exits with code 0 on full integrity, code 1 on any violation.
 */

import { connectDb, closeDb } from '../src/db/client.js';
import { COLLECTIONS } from '../src/db/collections.js';

async function verifyData() {
  console.log('\n======================================================');
  console.log('🔍  Verifying MarketLink Data Invariants...');
  console.log('======================================================\n');

  const db = await connectDb();
  let violations = 0;

  function reportViolation(code, msg) {
    violations++;
    console.error(`❌ [INVARIANT VIOLATION] [${code}] ${msg}`);
  }

  try {
    // ── 1. No negative stock quantities ──
    const negativeStockProducts = await db
      .collection(COLLECTIONS.PRODUCTS)
      .find({ quantityAvailable: { $lt: 0 } })
      .toArray();

    if (negativeStockProducts.length > 0) {
      reportViolation(
        'NEGATIVE_STOCK',
        `Found ${negativeStockProducts.length} products with negative quantityAvailable: ${negativeStockProducts.map((p) => p.name).join(', ')}`
      );
    } else {
      console.log('✓ Invariant 1: No negative product stock quantities.');
    }

    // ── 2. Product availability consistency ──
    const products = await db.collection(COLLECTIONS.PRODUCTS).find().toArray();
    let availabilityMismatches = 0;

    for (const p of products) {
      if (p.availability === 'hidden') continue;
      const qty = p.quantityAvailable || 0;
      const threshold = p.lowStockThreshold || 0;

      let expected = 'in';
      if (qty <= 0) {
        expected = 'out';
      } else if (qty <= threshold) {
        expected = 'low';
      }

      if (p.availability !== expected) {
        availabilityMismatches++;
        reportViolation(
          'AVAILABILITY_MISMATCH',
          `Product ${p.name} (id: ${p._id}): qty=${qty}, threshold=${threshold}, expected availability='${expected}', got '${p.availability}'`
        );
      }
    }

    if (availabilityMismatches === 0) {
      console.log('✓ Invariant 2: Product availability state is strictly consistent with quantity and thresholds.');
    }

    // ── 3. Order totals match line item sums ──
    const orders = await db.collection(COLLECTIONS.ORDERS).find().toArray();
    let orderTotalMismatches = 0;
    let timelineMismatches = 0;
    const orderNumbers = new Set();
    let duplicateOrderNumbers = 0;

    for (const o of orders) {
      // Check orderNumber uniqueness
      if (orderNumbers.has(o.orderNumber)) {
        duplicateOrderNumbers++;
        reportViolation('DUPLICATE_ORDER_NUMBER', `Duplicate orderNumber found: ${o.orderNumber}`);
      } else {
        orderNumbers.add(o.orderNumber);
      }

      // Check sum of line totals
      const expectedTotal = (o.items || []).reduce((sum, it) => sum + (it.lineTotalCents || 0), 0);
      if (o.totalCents !== expectedTotal) {
        orderTotalMismatches++;
        reportViolation(
          'ORDER_TOTAL_MISMATCH',
          `Order ${o.orderNumber} (id: ${o._id}): totalCents=${o.totalCents}, sum of line items=${expectedTotal}`
        );
      }

      // Check timeline integrity: last timeline entry status must match order.status
      if (Array.isArray(o.timeline) && o.timeline.length > 0) {
        const lastEntry = o.timeline[o.timeline.length - 1];
        if (lastEntry.status !== o.status) {
          timelineMismatches++;
          reportViolation(
            'TIMELINE_STATUS_MISMATCH',
            `Order ${o.orderNumber} (id: ${o._id}): order status='${o.status}', but last timeline status='${lastEntry.status}'`
          );
        }
      }
    }

    if (orderTotalMismatches === 0) {
      console.log('✓ Invariant 3: Order totalCents matches the exact sum of line items.');
    }

    if (timelineMismatches === 0) {
      console.log('✓ Invariant 4: Order timeline terminal entry matches current order status.');
    }

    if (duplicateOrderNumbers === 0) {
      console.log('✓ Invariant 5: All order numbers are strictly unique.');
    }

    // ── 4. Review aggregates consistency on Farmers and Products ──
    const farmers = await db.collection(COLLECTIONS.FARMERS).find().toArray();
    let farmerRatingMismatches = 0;

    for (const f of farmers) {
      const reviews = await db
        .collection(COLLECTIONS.REVIEWS)
        .find({ farmerId: f._id, targetType: 'farmer', status: 'visible' })
        .toArray();

      const expectedCount = reviews.length;
      const expectedSum = reviews.reduce((sum, r) => sum + r.rating, 0);
      const expectedAvg = expectedCount > 0 ? Math.round((expectedSum / expectedCount) * 10) / 10 : 0;

      const actualSum = f.ratingSum || 0;
      const actualCount = f.ratingCount || 0;
      const actualAvg = f.ratingAvg || 0;

      if (actualSum !== expectedSum || actualCount !== expectedCount || actualAvg !== expectedAvg) {
        farmerRatingMismatches++;
        reportViolation(
          'FARMER_RATING_AGGREGATE_MISMATCH',
          `Farmer ${f.stallName} (id: ${f._id}): expected sum=${expectedSum}, count=${expectedCount}, avg=${expectedAvg} | got sum=${actualSum}, count=${actualCount}, avg=${actualAvg}`
        );
      }
    }

    if (farmerRatingMismatches === 0) {
      console.log('✓ Invariant 6: Farmer review rating aggregates match actual review collections.');
    }

    const reviewedProducts = await db
      .collection(COLLECTIONS.REVIEWS)
      .distinct('productId', { targetType: 'product', status: 'visible', productId: { $ne: null } });

    let productRatingMismatches = 0;
    for (const pid of reviewedProducts) {
      const p = await db.collection(COLLECTIONS.PRODUCTS).findOne({ _id: pid });
      if (!p) continue;

      const reviews = await db
        .collection(COLLECTIONS.REVIEWS)
        .find({ productId: pid, targetType: 'product', status: 'visible' })
        .toArray();

      const expectedCount = reviews.length;
      const expectedSum = reviews.reduce((sum, r) => sum + r.rating, 0);
      const expectedAvg = expectedCount > 0 ? Math.round((expectedSum / expectedCount) * 10) / 10 : 0;

      const actualSum = p.ratingSum || 0;
      const actualCount = p.ratingCount || 0;
      const actualAvg = p.ratingAvg || 0;

      if (actualSum !== expectedSum || actualCount !== expectedCount || actualAvg !== expectedAvg) {
        productRatingMismatches++;
        reportViolation(
          'PRODUCT_RATING_AGGREGATE_MISMATCH',
          `Product ${p.name} (id: ${p._id}): expected sum=${expectedSum}, count=${expectedCount}, avg=${expectedAvg} | got sum=${actualSum}, count=${actualCount}, avg=${actualAvg}`
        );
      }
    }

    if (productRatingMismatches === 0) {
      console.log('✓ Invariant 7: Product review rating aggregates match actual review collections.');
    }

    // ── 5. Product listing state consistency with farmer and moderation (D3) ──
    const farmerMap = new Map(farmers.map((f) => [f._id.toString(), f]));
    let listingStateMismatches = 0;
    let snapshotMismatches = 0;

    for (const p of products) {
      const f = farmerMap.get(p.farmerId?.toString());
      if (!f) continue;

      const shouldBeListed = Boolean(
        f.listingEnabled && !p.moderation?.removed && !p.archived && p.availability !== 'hidden'
      );

      if (Boolean(p.listed) !== shouldBeListed) {
        listingStateMismatches++;
        reportViolation(
          'PRODUCT_LISTED_STATE_MISMATCH',
          `Product ${p.name} (id: ${p._id}): listed=${p.listed}, expected=${shouldBeListed} (farmer.listingEnabled=${f.listingEnabled}, removed=${p.moderation?.removed}, archived=${p.archived}, availability=${p.availability})`
        );
      }

      // Check stall snapshot
      if (p.farmer?.stallName && f.stallName && p.farmer.stallName !== f.stallName) {
        snapshotMismatches++;
        reportViolation(
          'FARMER_SNAPSHOT_MISMATCH',
          `Product ${p.name} (id: ${p._id}): snapshot stallName='${p.farmer.stallName}', farmer stallName='${f.stallName}'`
        );
      }
    }

    if (listingStateMismatches === 0) {
      console.log('✓ Invariant 8: Product listed status is strictly consistent with farmer approval and product state.');
    }
    if (snapshotMismatches === 0) {
      console.log('✓ Invariant 9: Product farmer snapshot stall names match parent farmer documents.');
    }

    // ── 6. Market farmerCount consistency (D3) ──
    const activeMarkets = await db.collection(COLLECTIONS.MARKETS).find({ status: 'active' }).toArray();
    let marketCountMismatches = 0;

    for (const m of activeMarkets) {
      const attendingListedFarmers = farmers.filter(
        (f) => f.listingEnabled && Array.isArray(f.marketIds) && f.marketIds.some((id) => id.toString() === m._id.toString())
      );
      const expectedCount = attendingListedFarmers.length;
      const actualCount = m.farmerCount || 0;

      if (actualCount !== expectedCount) {
        marketCountMismatches++;
        reportViolation(
          'MARKET_FARMER_COUNT_MISMATCH',
          `Market ${m.name} (id: ${m._id}): farmerCount=${actualCount}, expected=${expectedCount} attending listed farmers`
        );
      }
    }

    if (marketCountMismatches === 0) {
      console.log('✓ Invariant 10: Market farmerCount matches attending listed farmers count.');
    }

    // ── 7. Farmer categorySlugs consistency (D3) ──
    let categorySlugMismatches = 0;
    for (const f of farmers) {
      const distinctSlugs = await db
        .collection(COLLECTIONS.PRODUCTS)
        .distinct('categorySlug', {
          farmerId: f._id,
          listed: true,
          categorySlug: { $exists: true, $ne: '' },
        });
      const expectedSlugs = (distinctSlugs || []).sort().join(',');
      const actualSlugs = (f.categorySlugs || []).slice().sort().join(',');

      if (expectedSlugs !== actualSlugs) {
        categorySlugMismatches++;
        reportViolation(
          'FARMER_CATEGORY_SLUGS_MISMATCH',
          `Farmer ${f.stallName} (id: ${f._id}): categorySlugs='${actualSlugs}', expected='${expectedSlugs}'`
        );
      }
    }

    if (categorySlugMismatches === 0) {
      console.log('✓ Invariant 11: Farmer categorySlugs match distinct listed product categories.');
    }

    // ── 8. Category slug propagation consistency (D3) ──
    const allCategories = await db.collection(COLLECTIONS.CATEGORIES).find().toArray();
    const catMap = new Map(allCategories.map((c) => [c._id.toString(), c]));
    let prodCatSlugMismatches = 0;

    for (const p of products) {
      if (!p.categoryId) continue;
      const cat = catMap.get(p.categoryId.toString());
      if (cat && p.categorySlug && p.categorySlug !== cat.slug) {
        prodCatSlugMismatches++;
        reportViolation(
          'CATEGORY_SLUG_MISMATCH',
          `Product ${p.name} (id: ${p._id}): categorySlug='${p.categorySlug}', category '${cat.name}' slug='${cat.slug}'`
        );
      }
    }

    if (prodCatSlugMismatches === 0) {
      console.log('✓ Invariant 12: Product categorySlugs match referenced category slugs.');
    }

    console.log('\n======================================================');
    if (violations === 0) {
      console.log('🎉  ALL DATA INVARIANTS PASSED! Platform is 100% consistent.');
      console.log('======================================================\n');
      process.exit(0);
    } else {
      console.error(`💥  DATA INVARIANT CHECK FAILED WITH ${violations} VIOLATION(S)!`);
      console.log('======================================================\n');
      process.exit(1);
    }
  } catch (err) {
    console.error('Fatal error during invariant verification:', err);
    process.exit(1);
  } finally {
    await closeDb();
  }
}

verifyData();
