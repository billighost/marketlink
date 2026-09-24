/**
 * Database schema, index coverage, and seed integrity test suite.
 * Confirms collection schemas, index existence, IXSCAN query plans (no COLLSCAN),
 * and referential integrity across all seeded entities.
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { ObjectId } from 'mongodb';
import { setupTestEnvironment, teardownTestEnvironment } from './helpers.js';
import { COLLECTIONS } from '../src/db/collections.js';

describe('Database Architecture & Query Performance Suite', () => {
  let db;

  before(async () => {
    const env = await setupTestEnvironment();
    db = env.db;
  });

  after(async () => {
    await teardownTestEnvironment();
  });

  // Helper to detect if COLLSCAN is present anywhere in an execution plan
  function containsCollScan(stage) {
    if (!stage) return false;
    if (stage.stage === 'COLLSCAN') return true;
    if (stage.inputStage && containsCollScan(stage.inputStage)) return true;
    if (stage.inputStages) {
      return stage.inputStages.some(containsCollScan);
    }
    return false;
  }

  // ── 1. Collections & Validators ──
  it('all required collections exist with schema validators', async () => {
    const colls = await db.listCollections().toArray();
    const collNames = new Set(colls.map((c) => c.name));

    for (const name of Object.values(COLLECTIONS)) {
      assert.ok(collNames.has(name), `Collection ${name} must exist`);
      const collInfo = colls.find((c) => c.name === name);
      assert.ok(
        collInfo.options?.validator,
        `Collection ${name} must have a schema validator defined`
      );
    }
  });

  // ── 2. Index Existence ──
  it('all indexes specified in Section 5 exist across collections', async () => {
    // 1. Users indexes
    const userIndexes = await db.collection(COLLECTIONS.USERS).indexes();
    const userIndexNames = userIndexes.map((i) => i.name);
    assert.ok(userIndexNames.includes('idx_users_email_unique'));
    assert.ok(userIndexNames.includes('idx_users_role_status_created'));

    // 2. Farmers indexes
    const farmerIndexes = await db.collection(COLLECTIONS.FARMERS).indexes();
    const farmerIndexNames = farmerIndexes.map((i) => i.name);
    assert.ok(farmerIndexNames.includes('idx_farmers_userId_unique'));
    assert.ok(farmerIndexNames.includes('idx_farmers_listing_markets_rating'));
    assert.ok(farmerIndexNames.includes('idx_farmers_listing_topseller_sales'));
    assert.ok(farmerIndexNames.includes('idx_farmers_location_2dsphere'));
    assert.ok(farmerIndexNames.includes('idx_farmers_text_search'));

    // 3. Markets indexes
    const marketIndexes = await db.collection(COLLECTIONS.MARKETS).indexes();
    const marketIndexNames = marketIndexes.map((i) => i.name);
    assert.ok(marketIndexNames.includes('idx_markets_slug_unique'));
    assert.ok(marketIndexNames.includes('idx_markets_location_2dsphere'));
    assert.ok(marketIndexNames.includes('idx_markets_status_name'));

    // 4. Products indexes
    const prodIndexes = await db.collection(COLLECTIONS.PRODUCTS).indexes();
    const prodIndexNames = prodIndexes.map((i) => i.name);
    assert.ok(prodIndexNames.includes('idx_products_farmer_availability'));
    assert.ok(prodIndexNames.includes('idx_products_browse_filters'));
    assert.ok(prodIndexNames.includes('idx_products_market_created'));
    assert.ok(prodIndexNames.includes('idx_products_bestsellers_partial'));
    assert.ok(prodIndexNames.includes('idx_products_text_search'));

    // 5. Orders indexes
    const orderIndexes = await db.collection(COLLECTIONS.ORDERS).indexes();
    const orderIndexNames = orderIndexes.map((i) => i.name);
    assert.ok(orderIndexNames.includes('idx_orders_orderNumber_unique'));
    assert.ok(orderIndexNames.includes('idx_orders_customer_created'));
    assert.ok(orderIndexNames.includes('idx_orders_customer_status_created'));
    assert.ok(orderIndexNames.includes('idx_orders_farmer_status_created'));
    assert.ok(orderIndexNames.includes('idx_orders_farmer_pickup_schedule'));
    assert.ok(orderIndexNames.includes('idx_orders_checkoutId'));
    assert.ok(orderIndexNames.includes('idx_orders_customer_idempotency_unique'));
    assert.ok(orderIndexNames.includes('idx_orders_slotKey_status'));

    // 5b. Checkouts indexes
    const checkoutIndexes = await db.collection(COLLECTIONS.CHECKOUTS).indexes();
    const checkoutIndexNames = checkoutIndexes.map((i) => i.name);
    assert.ok(checkoutIndexNames.includes('idx_checkouts_customer_idempotency_unique'));
    assert.ok(checkoutIndexNames.includes('idx_checkouts_created'));

    // 5c. Favorites indexes
    const favIndexes = await db.collection(COLLECTIONS.FAVORITES).indexes();
    const favIndexNames = favIndexes.map((i) => i.name);
    assert.ok(favIndexNames.includes('idx_favorites_targetType_targetId'));

    // 5d. Notifications indexes
    const notifIndexes = await db.collection(COLLECTIONS.NOTIFICATIONS).indexes();
    const notifIndexNames = notifIndexes.map((i) => i.name);
    assert.ok(notifIndexNames.includes('idx_notifications_user_type_created'));
    assert.ok(notifIndexes.some((i) => i.name === 'idx_notifications_ttl_90d' && i.expireAfterSeconds === 7776000));

    // 6. TTL Indexes
    const sessionIndexes = await db.collection(COLLECTIONS.SESSIONS).indexes();
    assert.ok(sessionIndexes.some((i) => i.name === 'idx_sessions_ttl' && i.expireAfterSeconds === 0));

    const resetIndexes = await db.collection(COLLECTIONS.PASSWORD_RESETS).indexes();
    assert.ok(resetIndexes.some((i) => i.name === 'idx_passwordResets_ttl' && i.expireAfterSeconds === 0));

    const searchIndexes = await db.collection(COLLECTIONS.SEARCH_HISTORY).indexes();
    assert.ok(searchIndexes.some((i) => i.name === 'idx_searchHistory_ttl_60d' && i.expireAfterSeconds === 5184000));

    // 16. Audit Log indexes
    const auditIndexes = await db.collection(COLLECTIONS.AUDIT_LOG).indexes();
    const auditIndexNames = auditIndexes.map((i) => i.name);
    assert.ok(auditIndexNames.includes('idx_auditLog_at'));
    assert.ok(auditIndexNames.includes('idx_auditLog_target'));
    assert.ok(auditIndexes.some((i) => i.name === 'idx_auditLog_ttl_365d' && i.expireAfterSeconds === 31536000));

    // 17. Reports indexes
    const reportIndexes = await db.collection(COLLECTIONS.REPORTS).indexes();
    const reportIndexNames = reportIndexes.map((i) => i.name);
    assert.ok(reportIndexNames.includes('idx_reports_generatedAt'));

    // 18. Contact Messages status index
    const contactIndexes = await db.collection(COLLECTIONS.CONTACT_MESSAGES).indexes();
    const contactIndexNames = contactIndexes.map((i) => i.name);
    assert.ok(contactIndexNames.includes('idx_contactMessages_status_created'));

    // 19. Stage 4 Orders reporting and insight indexes
    assert.ok(orderIndexNames.includes('idx_orders_farmer_status_completed'));
    assert.ok(orderIndexNames.includes('idx_orders_farmer_created'));
    assert.ok(orderIndexNames.includes('idx_orders_status_created'));
    assert.ok(orderIndexNames.includes('idx_orders_market_status_created'));
  });

  // ── 3. Unique Index Concurrency ──
  it('unique index prevents duplicate emails under concurrent double insert', async () => {
    const testEmail = `concurrent.double.${Date.now()}@example.com`;
    const doc1 = {
      role: 'customer',
      name: 'Double 1',
      email: testEmail,
      passwordHash: 'dummy',
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const doc2 = {
      role: 'customer',
      name: 'Double 2',
      email: testEmail,
      passwordHash: 'dummy',
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const results = await Promise.allSettled([
      db.collection(COLLECTIONS.USERS).insertOne(doc1),
      db.collection(COLLECTIONS.USERS).insertOne(doc2),
    ]);

    const fulfilled = results.filter((r) => r.status === 'fulfilled');
    const rejected = results.filter((r) => r.status === 'rejected');

    assert.equal(fulfilled.length, 1, 'Exactly one concurrent insert must succeed');
    assert.equal(rejected.length, 1, 'Exactly one concurrent insert must be rejected');
    assert.equal(rejected[0].reason.code, 11000, 'Rejection must be a duplicate key error (11000)');
  });

  // ── 4. Explain Plan Proof (No COLLSCAN) ──
  describe('Explain Plan Verification (No COLLSCAN)', () => {
    it('login user lookup by email uses IXSCAN and examines <= 1 document', async () => {
      const explain = await db
        .collection(COLLECTIONS.USERS)
        .find({ email: 'george@example.com' })
        .explain('executionStats');

      const stage = explain.executionStats.executionStages;
      assert.equal(containsCollScan(stage), false, 'Login lookup must not use COLLSCAN');
      assert.equal(explain.executionStats.nReturned, 1);
      assert.equal(explain.executionStats.totalDocsExamined, 1);
    });

    it('session lookup by tokenHash uses IXSCAN', async () => {
      const explain = await db
        .collection(COLLECTIONS.SESSIONS)
        .find({ tokenHash: 'dummy_nonexistent_hash_for_test' })
        .explain('executionStats');

      const stage = explain.executionStats.executionStages;
      assert.equal(containsCollScan(stage), false, 'Session lookup must not use COLLSCAN');
    });

    it('customer order history lookup uses IXSCAN and no COLLSCAN', async () => {
      const user = await db.collection(COLLECTIONS.USERS).findOne({ email: 'george@example.com' });
      const explain = await db
        .collection(COLLECTIONS.ORDERS)
        .find({ customerId: user._id })
        .sort({ createdAt: -1 })
        .explain('executionStats');

      const stage = explain.executionStats.executionStages;
      assert.equal(containsCollScan(stage), false, 'Order history lookup must not use COLLSCAN');
    });
  });

  // ── 5. Seed Referential Integrity ──
  describe('Seed Referential Integrity', () => {
    it('every product has a valid farmerId referencing an existing farmer', async () => {
      const products = await db.collection(COLLECTIONS.PRODUCTS).find().toArray();
      const farmerIds = new Set((await db.collection(COLLECTIONS.FARMERS).find().toArray()).map((f) => f._id.toString()));

      for (const p of products) {
        assert.ok(farmerIds.has(p.farmerId.toString()), `Product ${p.name} references invalid farmerId`);
      }
    });

    it('every order item references an existing product', async () => {
      const orders = await db.collection(COLLECTIONS.ORDERS).find().toArray();
      const productIds = new Set((await db.collection(COLLECTIONS.PRODUCTS).find().toArray()).map((p) => p._id.toString()));

      for (const o of orders) {
        for (const item of o.items) {
          assert.ok(productIds.has(item.productId.toString()), `Order ${o.orderNumber} item references invalid product`);
        }
      }
    });

    it('every review references an existing order', async () => {
      const reviews = await db.collection(COLLECTIONS.REVIEWS).find().toArray();
      const orderIds = new Set((await db.collection(COLLECTIONS.ORDERS).find().toArray()).map((o) => o._id.toString()));

      for (const r of reviews) {
        assert.ok(orderIds.has(r.orderId.toString()), `Review references non-existent order`);
      }
    });

    it('markets.farmerCount matches the exact count of active farmers at that market', async () => {
      const markets = await db.collection(COLLECTIONS.MARKETS).find().toArray();
      for (const m of markets) {
        const actualCount = await db.collection(COLLECTIONS.FARMERS).countDocuments({
          marketIds: m._id,
          listingEnabled: true,
        });
        assert.equal(m.farmerCount, actualCount, `farmerCount on market ${m.name} must match active farmers`);
      }
    });

    it('no orphan favorites exist in seed', async () => {
      const favorites = await db.collection(COLLECTIONS.FAVORITES).find().toArray();
      const users = new Set((await db.collection(COLLECTIONS.USERS).find().toArray()).map((u) => u._id.toString()));
      const products = new Set((await db.collection(COLLECTIONS.PRODUCTS).find().toArray()).map((p) => p._id.toString()));
      const farmers = new Set((await db.collection(COLLECTIONS.FARMERS).find().toArray()).map((f) => f._id.toString()));

      for (const fav of favorites) {
        assert.ok(users.has(fav.userId.toString()), 'Favorite must belong to existing user');
        if (fav.targetType === 'product') {
          assert.ok(products.has(fav.targetId.toString()), 'Product favorite must reference valid product');
        } else if (fav.targetType === 'farmer') {
          assert.ok(farmers.has(fav.targetId.toString()), 'Farmer favorite must reference valid farmer');
        }
      }
    });

    it('order number sequence counter is strictly greater than the largest seeded order number', async () => {
      const orders = await db.collection(COLLECTIONS.ORDERS).find().toArray();
      let maxNum = 0;
      for (const o of orders) {
        const num = parseInt(o.orderNumber.replace('ML-', ''), 10);
        if (num > maxNum) maxNum = num;
      }

      const counter = await db.collection(COLLECTIONS.COUNTERS).findOne({ _id: 'orderNumber' });
      assert.ok(counter);
      assert.ok(
        counter.seq > maxNum,
        `Counter sequence (${counter.seq}) must be greater than max seeded order number (${maxNum})`
      );
    });
  });
});
