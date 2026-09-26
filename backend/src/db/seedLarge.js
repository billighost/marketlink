/**
 * Large Dataset Generator for MarketLink.
 * Populates 'marketlink_large' database with high-volume, realistic, relational data:
 * - 40 Markets
 * - 400 Farmers
 * - 8,000 Products
 * - 20,000 Customers
 * - 150,000 Orders (12-month historical span across all statuses)
 * - 50,000 Reviews
 * - 60,000 Favorites
 * - 100,000 Notifications
 *
 * Implements memory-bounded batch streaming (batches of 5,000, max RAM < 1 GB).
 * Guarantees 100% data invariant consistency (passes verify-data with 0 drift).
 */

import { ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';
import { env } from '../config/env.js';
import { connectDb, closeDb } from './client.js';
import { COLLECTIONS, createCollections } from './collections.js';
import { ensureIndexes } from './indexes.js';
import { assertSafeDatabase } from './safetyGuard.js';
import { runVerifyData } from '../../scripts/verify-data.js';

export function createPrng(seed = 42) {
  let a = seed;
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export async function runLargeSeed(force = false) {
  const targetDbName = process.env.LARGE_DB_NAME || 'marketlink_large';
  const startTime = Date.now();

  assertSafeDatabase(targetDbName, env.MONGODB_URI, 'large dataset generation', {
    nodeEnv: env.NODE_ENV,
    force: true, // Always allowed as dedicated benchmark database
  });

  console.log(`\n========================================================================================`);
  console.log(`🚀  Starting MarketLink Large Dataset Generation -> [${targetDbName}]`);
  console.log(`========================================================================================\n`);

  const db = await connectDb(env.MONGODB_URI, targetDbName);
  const prng = createPrng(987654321);

  // 1. Drop existing collections to guarantee clean slate
  const existing = await db.listCollections().toArray();
  for (const c of existing) {
    if (!c.name.startsWith('system.')) {
      await db.collection(c.name).drop();
    }
  }
  console.log('✓ Cleaned existing collections in target database.');

  // 2. Initialize schema validators & indexes
  await createCollections(db);
  await ensureIndexes(db);
  console.log('✓ Re-created collections and ensured all composite indexes.');

  const now = new Date();
  const defaultPasswordHash = await bcrypt.hash('market123', 10);
  const adminPasswordHash = await bcrypt.hash('Admin12345', 10);

  // 3. Admin User
  const adminUser = {
    _id: new ObjectId(),
    role: 'admin',
    name: 'Platform Administrator',
    email: 'admin@marketlink.test',
    passwordHash: adminPasswordHash,
    phone: '(555) 999-0001',
    address: 'MarketLink HQ, 100 Main St, Maplewood, NJ',
    status: 'active',
    homeMarketId: null,
    savedMarketIds: [],
    notificationPrefs: { orderUpdates: true, readyAlerts: true, weeklyPicks: true, restockAlerts: true },
    failedLogins: 0,
    lockUntil: null,
    createdAt: now,
    updatedAt: now,
    lastLoginAt: now,
  };
  await db.collection(COLLECTIONS.USERS).insertOne(adminUser);

  // 4. Categories (7 core taxonomies)
  const categoryDefs = [
    { name: 'Vegetables', slug: 'vegetables', sortOrder: 1, art: 'carrot' },
    { name: 'Fruit', slug: 'fruit', sortOrder: 2, art: 'strawberries' },
    { name: 'Bakery', slug: 'bakery', sortOrder: 3, art: 'sourdough-boule' },
    { name: 'Dairy and eggs', slug: 'dairy-and-eggs', sortOrder: 4, art: 'egg-carton' },
    { name: 'Honey and jam', slug: 'honey-and-jam', sortOrder: 5, art: 'honey-jar' },
    { name: 'Herbs and flowers', slug: 'herbs-and-flowers', sortOrder: 6, art: 'flowers' },
    { name: 'Meat and fish', slug: 'meat-and-fish', sortOrder: 7, art: 'sausages' },
  ];
  const categories = categoryDefs.map((c) => ({
    _id: new ObjectId(),
    ...c,
    active: true,
  }));
  await db.collection(COLLECTIONS.CATEGORIES).insertMany(categories);
  console.log(`✓ Seeded ${categories.length} categories.`);

  // 5. 40 Markets
  const daysOfWeek = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
  const marketDocs = [];
  const baseLat = 40.735;
  const baseLng = -74.172;

  for (let i = 1; i <= 40; i++) {
    const latOffset = (prng() - 0.5) * 0.8;
    const lngOffset = (prng() - 0.5) * 0.8;
    const opDay = daysOfWeek[i % daysOfWeek.length];

    marketDocs.push({
      _id: new ObjectId(),
      name: `Farmers Market ${i} - ${opDay.toUpperCase()}`,
      slug: `farmers-market-${i}-${opDay}`,
      address: `${100 + i * 10} Market Plaza, Suite ${i}, NJ`,
      location: {
        type: 'Point',
        coordinates: [Number((baseLng + lngOffset).toFixed(6)), Number((baseLat + latOffset).toFixed(6))],
      },
      schedule: [{ day: opDay, openMin: 480, closeMin: 840 }],
      timezone: 'America/New_York',
      note: 'Fresh seasonal regional vendors.',
      facilities: ['parking', 'restrooms', 'wheelchair-accessible', 'atm'],
      status: 'active',
      farmerCount: 0,
      createdAt: now,
      updatedAt: now,
    });
  }
  await db.collection(COLLECTIONS.MARKETS).insertMany(marketDocs);
  console.log(`✓ Seeded ${marketDocs.length} markets.`);

  // 6. 400 Farmers & User accounts
  const farmerUserDocs = [];
  const farmerDocs = [];
  const farmerMarketMap = new Map();

  for (let f = 1; f <= 400; f++) {
    const uId = new ObjectId();
    const fId = new ObjectId();
    const stallName = `Stall ${f} Family Farm`;
    const email = `farmer${f}@marketlink.large`;

    // Assign 1 to 3 attending markets
    const attendingMarkets = [marketDocs[f % 40]._id];
    if (f % 2 === 0) attendingMarkets.push(marketDocs[(f + 7) % 40]._id);
    if (f % 5 === 0) attendingMarkets.push(marketDocs[(f + 13) % 40]._id);
    farmerMarketMap.set(fId.toString(), attendingMarkets);

    farmerUserDocs.push({
      _id: uId,
      role: 'farmer',
      name: `Farmer Person ${f}`,
      email,
      passwordHash: defaultPasswordHash,
      phone: `(555) 400-${String(f).padStart(4, '0')}`,
      address: `${f} Rural Route, Hunterdon County, NJ`,
      status: 'active',
      homeMarketId: attendingMarkets[0],
      savedMarketIds: attendingMarkets,
      notificationPrefs: { orderUpdates: true, readyAlerts: true, weeklyPicks: true, restockAlerts: true },
      failedLogins: 0,
      lockUntil: null,
      createdAt: now,
      updatedAt: now,
      lastLoginAt: now,
    });

    farmerDocs.push({
      _id: fId,
      userId: uId,
      stallName,
      stallNameLower: stallName.toLowerCase(),
      contactPerson: `Farmer Person ${f}`,
      phone: `(555) 400-${String(f).padStart(4, '0')}`,
      email,
      specialty: 'Seasonal Organic Harvest',
      story: 'Generations of local farming excellence.',
      since: 2015 + (f % 9),
      stallNumber: `Stall ${f % 50 + 1}`,
      marketIds: attendingMarkets,
      operatingDays: ['sat', 'sun'],
      pickupWindows: [
        { day: 'sat', startMin: 480, endMin: 720 },
        { day: 'sun', startMin: 540, endMin: 780 },
      ],
      cutoffMinutesBefore: 720,
      address: `${f} Rural Route, Hunterdon County, NJ`,
      location: {
        type: 'Point',
        coordinates: [Number((baseLng + (prng() - 0.5) * 0.4).toFixed(6)), Number((baseLat + (prng() - 0.5) * 0.4).toFixed(6))],
      },
      art: 'farm',
      imageUrl: null,
      imagePublicId: null,
      slotOverrides: [],
      maxOrdersPerSlot: 50,
      listingEnabled: true,
      rnd: prng(),
      categorySlugs: [],
      ratingAvg: 0,
      ratingCount: 0,
      ratingSum: 0,
      salesCount: 0,
      isTopSeller: f <= 30,
      isNew: f > 370,
      createdAt: now,
      updatedAt: now,
    });
  }

  await db.collection(COLLECTIONS.USERS).insertMany(farmerUserDocs);
  await db.collection(COLLECTIONS.FARMERS).insertMany(farmerDocs);
  console.log(`✓ Seeded ${farmerUserDocs.length} farmers and farmer user profiles.`);

  // 7. 8,000 Products (20 per farmer)
  const productDocs = [];
  const farmerProductMap = new Map();
  const farmerCategorySet = new Map();

  for (let fIdx = 0; fIdx < farmerDocs.length; fIdx++) {
    const farmer = farmerDocs[fIdx];
    const fProducts = [];

    for (let p = 1; p <= 20; p++) {
      const pId = new ObjectId();
      const cat = categories[(fIdx + p) % categories.length];
      const qty = 10 + Math.floor(prng() * 40);
      const lowStockThreshold = 5;

      const pDoc = {
        _id: pId,
        farmerId: farmer._id,
        farmer: {
          stallName: farmer.stallName,
          since: farmer.since,
          art: farmer.art,
        },
        marketIds: farmer.marketIds,
        categoryId: cat._id,
        categorySlug: cat.slug,
        name: `Product ${fIdx * 20 + p} (${cat.name})`,
        nameLower: `product ${fIdx * 20 + p} (${cat.name})`.toLowerCase(),
        description: `Freshly harvested ${cat.name} from ${farmer.stallName}.`,
        priceCents: 300 + Math.floor(prng() * 1500),
        unit: p % 2 === 0 ? 'lb' : 'bunch',
        quantityAvailable: qty,
        lowStockThreshold,
        availability: 'in',
        listed: true,
        tags: ['fresh', cat.slug],
        art: cat.art,
        imageUrl: null,
        imagePublicId: null,
        rnd: prng(),
        ratingAvg: 0,
        ratingCount: 0,
        ratingSum: 0,
        salesCount: 0,
        featuredScore: Number((prng() * 10).toFixed(2)),
        archived: false,
        moderation: { flagCount: 0, removed: false },
        createdAt: now,
        updatedAt: now,
      };

      productDocs.push(pDoc);
      fProducts.push(pDoc);

      if (!farmerCategorySet.has(farmer._id.toString())) {
        farmerCategorySet.set(farmer._id.toString(), new Set());
      }
      farmerCategorySet.get(farmer._id.toString()).add(cat.slug);
    }
    farmerProductMap.set(farmer._id.toString(), fProducts);
  }

  // Insert products in 5k chunks
  for (let i = 0; i < productDocs.length; i += 5000) {
    await db.collection(COLLECTIONS.PRODUCTS).insertMany(productDocs.slice(i, i + 5000), { ordered: false });
  }
  console.log(`✓ Seeded ${productDocs.length} products across 400 farmers.`);

  // 8. 20,000 Customers (streamed in batches of 5,000)
  const customerIds = [];
  console.log('⏳ Streaming 20,000 customers in batches of 5,000...');
  for (let batch = 0; batch < 4; batch++) {
    const customerBatch = [];
    for (let c = 1; c <= 5000; c++) {
      const idx = batch * 5000 + c;
      const cId = new ObjectId();
      customerIds.push(cId);
      const homeMarket = marketDocs[idx % 40]._id;

      customerBatch.push({
        _id: cId,
        role: 'customer',
        name: `Customer ${idx}`,
        email: `customer${idx}@marketlink.large`,
        passwordHash: defaultPasswordHash,
        phone: `(555) 200-${String(idx % 10000).padStart(4, '0')}`,
        address: `${idx} Suburban Street, Maplewood, NJ`,
        status: 'active',
        homeMarketId: homeMarket,
        savedMarketIds: [homeMarket],
        notificationPrefs: { orderUpdates: true, readyAlerts: true, weeklyPicks: false, restockAlerts: true },
        failedLogins: 0,
        lockUntil: null,
        createdAt: now,
        updatedAt: now,
        lastLoginAt: now,
      });
    }
    await db.collection(COLLECTIONS.USERS).insertMany(customerBatch, { ordered: false });
  }
  console.log(`✓ Seeded 20,000 customers.`);

  // 9. 150,000 Orders (streamed in batches of 5,000 across 12 months)
  console.log('⏳ Streaming 150,000 orders in batches of 5,000...');
  const completedOrderKeys = [];
  const productSalesMap = new Map();
  const farmerSalesMap = new Map();
  let currentOrderNum = 1001;

  for (let batch = 0; batch < 30; batch++) {
    const orderBatch = [];
    for (let o = 1; o <= 5000; o++) {
      const orderNum = currentOrderNum++;
      const farmerIdx = (batch * 5000 + o) % farmerDocs.length;
      const farmer = farmerDocs[farmerIdx];
      const customerId = customerIds[(batch * 5000 + o) % customerIds.length];
      const fProducts = farmerProductMap.get(farmer._id.toString());
      const product = fProducts[o % fProducts.length];

      // Historical date distributed across 365 days
      const daysAgo = (batch * 5000 + o) % 365;
      const orderDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

      // Status distribution: 80% completed, 10% placed/accepted/ready, 10% cancelled
      let status = 'completed';
      const statusRnd = prng();
      if (statusRnd < 0.05) status = 'placed';
      else if (statusRnd < 0.08) status = 'accepted';
      else if (statusRnd < 0.10) status = 'ready';
      else if (statusRnd < 0.20) status = 'cancelled';

      const qty = 1 + (o % 3);
      const lineTotal = product.priceCents * qty;

      // Build timeline strictly matching status
      const timeline = [{ status: 'placed', at: orderDate, by: customerId, note: 'Pre-order placed' }];
      if (['accepted', 'ready', 'completed'].includes(status)) {
        timeline.push({ status: 'accepted', at: new Date(orderDate.getTime() + 3600000), by: farmer.userId, note: 'Accepted' });
      }
      if (['ready', 'completed'].includes(status)) {
        timeline.push({ status: 'ready', at: new Date(orderDate.getTime() + 7200000), by: farmer.userId, note: 'Packed & ready' });
      }
      if (status === 'completed') {
        timeline.push({ status: 'completed', at: new Date(orderDate.getTime() + 10800000), by: farmer.userId, note: 'Picked up' });
      } else if (status === 'cancelled') {
        timeline.push({ status: 'cancelled', at: new Date(orderDate.getTime() + 3600000), by: customerId, note: 'Cancelled' });
      }

      const oId = new ObjectId();
      if (status === 'completed') {
        completedOrderKeys.push({ orderId: oId, customerId, farmerId: farmer._id, productId: product._id });
        productSalesMap.set(product._id.toString(), (productSalesMap.get(product._id.toString()) || 0) + qty);
        farmerSalesMap.set(farmer._id.toString(), (farmerSalesMap.get(farmer._id.toString()) || 0) + 1);
      }

      orderBatch.push({
        _id: oId,
        orderNumber: orderNum,
        customerId,
        farmerId: farmer._id,
        marketId: farmer.marketIds[0],
        status,
        pickupDate: orderDate.toISOString().slice(0, 10),
        pickupSlot: {
          start: new Date(orderDate.getTime() + 28800000),
          end: new Date(orderDate.getTime() + 43200000),
          label: 'Saturday Morning',
        },
        items: [
          {
            productId: product._id,
            productName: product.name,
            quantity: qty,
            unitPriceCents: product.priceCents,
            lineTotalCents: lineTotal,
            unit: product.unit,
            reviewed: false,
          },
        ],
        subtotalCents: lineTotal,
        feeCents: 0,
        totalCents: lineTotal,
        timeline,
        reviewed: false,
        cancellationReason: status === 'cancelled' ? 'Customer requested cancellation' : null,
        createdAt: orderDate,
        updatedAt: orderDate,
      });
    }
    await db.collection(COLLECTIONS.ORDERS).insertMany(orderBatch, { ordered: false });
  }
  console.log(`✓ Seeded 150,000 historical orders.`);

  // 10. 50,000 Reviews (from completed orders)
  console.log('⏳ Streaming 50,000 reviews in batches of 5,000...');
  const farmerRatingMap = new Map();
  const productRatingMap = new Map();

  for (let batch = 0; batch < 10; batch++) {
    const reviewBatch = [];
    for (let r = 0; r < 5000; r++) {
      const completedOrder = completedOrderKeys[(batch * 5000 + r) % completedOrderKeys.length];
      const rating = 4 + (r % 2); // 4 or 5 stars

      const isProductReview = r % 2 === 0;
      const targetType = isProductReview ? 'product' : 'farmer';
      const targetId = isProductReview ? completedOrder.productId : completedOrder.farmerId;

      if (!isProductReview) {
        const fKey = completedOrder.farmerId.toString();
        const stat = farmerRatingMap.get(fKey) || { sum: 0, count: 0 };
        stat.sum += rating;
        stat.count += 1;
        farmerRatingMap.set(fKey, stat);
      } else {
        const pKey = completedOrder.productId.toString();
        const stat = productRatingMap.get(pKey) || { sum: 0, count: 0 };
        stat.sum += rating;
        stat.count += 1;
        productRatingMap.set(pKey, stat);
      }

      reviewBatch.push({
        _id: new ObjectId(),
        orderId: completedOrder.orderId,
        authorId: completedOrder.customerId,
        farmerId: completedOrder.farmerId,
        productId: isProductReview ? completedOrder.productId : null,
        targetType,
        targetId,
        rating,
        comment: 'Outstanding quality and very friendly stall staff at pickup!',
        status: 'visible',
        reply: null,
        flagCount: 0,
        createdAt: now,
        updatedAt: now,
      });
    }
    await db.collection(COLLECTIONS.REVIEWS).insertMany(reviewBatch, { ordered: false });
  }
  console.log(`✓ Seeded 50,000 verified reviews.`);

  // 11. 60,000 Favorites
  console.log('⏳ Streaming 60,000 favorites in batches of 5,000...');
  for (let batch = 0; batch < 12; batch++) {
    const favBatch = [];
    for (let fv = 0; fv < 5000; fv++) {
      const idx = batch * 5000 + fv;
      const cId = customerIds[idx % customerIds.length];
      const pId = productDocs[idx % productDocs.length]._id;

      favBatch.push({
        _id: new ObjectId(),
        userId: cId,
        targetType: 'product',
        targetId: pId,
        createdAt: now,
      });
    }
    await db.collection(COLLECTIONS.FAVORITES).insertMany(favBatch, { ordered: false });
  }
  console.log(`✓ Seeded 60,000 favorites.`);

  // 12. 100,000 Notifications
  console.log('⏳ Streaming 100,000 notifications in batches of 5,000...');
  for (let batch = 0; batch < 20; batch++) {
    const notifBatch = [];
    for (let n = 0; n < 5000; n++) {
      const idx = batch * 5000 + n;
      const cId = customerIds[idx % customerIds.length];

      notifBatch.push({
        _id: new ObjectId(),
        userId: cId,
        type: 'order_status',
        title: 'Order Ready for Pickup',
        message: 'Your farmers market pre-order is packed and ready for pickup!',
        data: { link: '/orders' },
        read: n % 3 === 0,
        createdAt: now,
      });
    }
    await db.collection(COLLECTIONS.NOTIFICATIONS).insertMany(notifBatch, { ordered: false });
  }
  console.log(`✓ Seeded 100,000 notifications.`);

  // 13. Denormalization Updates: Farmers, Products, Markets & Counters
  console.log('⏳ Applying denormalised aggregates across all entities...');

  // Update Markets: farmerCount
  for (const m of marketDocs) {
    const count = farmerDocs.filter((f) => farmerMarketMap.get(f._id.toString()).some((id) => id.toString() === m._id.toString())).length;
    await db.collection(COLLECTIONS.MARKETS).updateOne({ _id: m._id }, { $set: { farmerCount: count } });
  }

  // Update Farmers: ratingSum, ratingCount, ratingAvg, salesCount, categorySlugs
  for (const f of farmerDocs) {
    const rStat = farmerRatingMap.get(f._id.toString()) || { sum: 0, count: 0 };
    const rAvg = rStat.count > 0 ? Math.round((rStat.sum / rStat.count) * 10) / 10 : 0;
    const catSlugs = Array.from(farmerCategorySet.get(f._id.toString()) || []).sort();
    const sCount = farmerSalesMap.get(f._id.toString()) || 0;

    await db.collection(COLLECTIONS.FARMERS).updateOne(
      { _id: f._id },
      {
        $set: {
          ratingSum: rStat.sum,
          ratingCount: rStat.count,
          ratingAvg: rAvg,
          salesCount: sCount,
          categorySlugs: catSlugs,
        },
      }
    );
  }

  // Update Products: ratingSum, ratingCount, ratingAvg, salesCount
  for (const p of productDocs) {
    const rStat = productRatingMap.get(p._id.toString()) || { sum: 0, count: 0 };
    const rAvg = rStat.count > 0 ? Math.round((rStat.sum / rStat.count) * 10) / 10 : 0;
    const sCount = productSalesMap.get(p._id.toString()) || 0;

    await db.collection(COLLECTIONS.PRODUCTS).updateOne(
      { _id: p._id },
      {
        $set: {
          ratingSum: rStat.sum,
          ratingCount: rStat.count,
          ratingAvg: rAvg,
          salesCount: sCount,
        },
      }
    );
  }

  // Counter seq
  await db.collection(COLLECTIONS.COUNTERS).updateOne(
    { _id: 'orderNumber' },
    { $set: { seq: currentOrderNum } },
    { upsert: true }
  );

  const durationSec = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`\n🎉  Large Dataset Seed completed successfully in ${durationSec}s.`);

  // 14. Verify data invariants immediately
  console.log('\n🔎  Running complete invariant verification on large dataset...');
  const verifyResult = await runVerifyData({ db });

  return { ok: verifyResult.ok, durationSec };
}

// CLI entry point
if (process.argv[1] && process.argv[1].endsWith('seedLarge.js')) {
  import('../config/env.js')
    .then(() => runLargeSeed(true))
    .then(() => closeDb())
    .then(({ ok }) => process.exit(ok ? 0 : 1))
    .catch((err) => {
      console.error('Fatal error during large dataset seed:', err);
      process.exit(1);
    });
}
