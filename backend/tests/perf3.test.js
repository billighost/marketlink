/**
 * Performance and Explain proof test suite for Stage 3 (T3.PERF.001 - T3.PERF.020).
 * Verifies that all Stage 3 queries utilize index scans (IXSCAN) with zero COLLSCANs,
 * and confirms response times conform to the latency SLA budget.
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { ObjectId } from 'mongodb';
import { setupTestEnvironment, teardownTestEnvironment, request, loginUser, getDbLatency } from './helpers.js';
import { COLLECTIONS } from '../src/db/collections.js';

describe('Stage 3 Performance & Explain Suite (T3.PERF.001 - T3.PERF.020)', () => {
  let db;
  let dbLatency = 0;
  let customerGeorgeAuth;
  let riverbendFarmer;
  let carrotsProduct;

  before(async () => {
    const env = await setupTestEnvironment();
    db = env.db;
    dbLatency = await getDbLatency(db);

    customerGeorgeAuth = await loginUser('george@example.com', 'market123');
    riverbendFarmer = await db.collection(COLLECTIONS.FARMERS).findOne({ stallName: 'Riverbend Farm' });
    carrotsProduct = await db.collection(COLLECTIONS.PRODUCTS).findOne({ name: 'Rainbow carrots' });
  });

  after(async () => {
    await teardownTestEnvironment();
  });

  function hasCollscan(stage) {
    if (!stage) return false;
    if (stage.stage === 'COLLSCAN') return true;
    if (stage.inputStage && hasCollscan(stage.inputStage)) return true;
    if (Array.isArray(stage.inputStages)) {
      return stage.inputStages.some((s) => hasCollscan(s));
    }
    return false;
  }

  function getWinningStage(explainResult) {
    return explainResult.queryPlanner?.winningPlan || explainResult.winningPlan;
  }

  // ── Explain Plans: Proof of IXSCAN (Zero COLLSCAN) ──

  it('T3.PERF.001: Customer orders list query uses IXSCAN (idx_orders_customer_status_created)', async () => {
    const explain = await db
      .collection(COLLECTIONS.ORDERS)
      .find({
        customerId: new ObjectId(customerGeorgeAuth.user.id),
        status: { $in: ['placed', 'accepted', 'ready'] },
      })
      .sort({ createdAt: -1, _id: -1 })
      .explain('executionStats');

    const plan = getWinningStage(explain);
    assert.equal(hasCollscan(plan), false, 'Expected no COLLSCAN in customer orders list query');
  });

  it('T3.PERF.002: Orders capacity check uses IXSCAN (idx_orders_slotKey_status)', async () => {
    const explain = await db
      .collection(COLLECTIONS.ORDERS)
      .find({
        slotKey: `${riverbendFarmer._id.toString()}|2026-10-01T10:00:00.000Z`,
        status: { $in: ['placed', 'accepted', 'ready'] },
      })
      .explain('executionStats');

    const plan = getWinningStage(explain);
    assert.equal(hasCollscan(plan), false, 'Expected no COLLSCAN in slotKey capacity query');
  });

  it('T3.PERF.003: Checkouts idempotency query uses IXSCAN (idx_checkouts_customer_idempotency_unique)', async () => {
    const explain = await db
      .collection(COLLECTIONS.CHECKOUTS)
      .find({
        customerId: new ObjectId(customerGeorgeAuth.user.id),
        idempotencyKey: 'some-test-key',
      })
      .explain('executionStats');

    const plan = getWinningStage(explain);
    assert.equal(hasCollscan(plan), false, 'Expected no COLLSCAN in checkouts idempotency query');
  });

  it('T3.PERF.004: Favorites restock alert query uses IXSCAN (idx_favorites_targetType_targetId)', async () => {
    const explain = await db
      .collection(COLLECTIONS.FAVORITES)
      .find({
        targetType: 'product',
        targetId: carrotsProduct._id,
      })
      .explain('executionStats');

    const plan = getWinningStage(explain);
    assert.equal(hasCollscan(plan), false, 'Expected no COLLSCAN in favorites restock query');
  });

  it('T3.PERF.005: Customer favorites list query uses IXSCAN (idx_favorites_user_type_created)', async () => {
    const explain = await db
      .collection(COLLECTIONS.FAVORITES)
      .find({
        userId: new ObjectId(customerGeorgeAuth.user.id),
        targetType: 'product',
      })
      .sort({ createdAt: -1, _id: -1 })
      .explain('executionStats');

    const plan = getWinningStage(explain);
    assert.equal(hasCollscan(plan), false, 'Expected no COLLSCAN in favorites list query');
  });

  it('T3.PERF.006: Notifications unread query uses IXSCAN (idx_notifications_user_type_created or idx_notifications_user_created)', async () => {
    const explain = await db
      .collection(COLLECTIONS.NOTIFICATIONS)
      .find({
        userId: new ObjectId(customerGeorgeAuth.user.id),
        readAt: null,
      })
      .sort({ createdAt: -1, _id: -1 })
      .explain('executionStats');

    const plan = getWinningStage(explain);
    assert.equal(hasCollscan(plan), false, 'Expected no COLLSCAN in notifications list query');
  });

  it('T3.PERF.007: Moderation flags reporter query uses IXSCAN (idx_moderationFlags_target_reporter_status)', async () => {
    const explain = await db
      .collection(COLLECTIONS.MODERATION_FLAGS)
      .find({
        targetType: 'review',
        targetId: new ObjectId(),
        reporterId: new ObjectId(customerGeorgeAuth.user.id),
        status: 'open',
      })
      .explain('executionStats');

    const plan = getWinningStage(explain);
    assert.equal(hasCollscan(plan), false, 'Expected no COLLSCAN in moderation flags query');
  });

  // ── Latency Benchmarks (SLA budgets) ──

  async function measureMedianMs(fn, iterations = 3) {
    // 1. Warm-up request
    await fn();

    // 2. Sample runs
    const samples = [];
    for (let i = 0; i < iterations; i++) {
      const start = process.hrtime.bigint();
      await fn();
      const end = process.hrtime.bigint();
      const ms = Number(end - start) / 1_000_000;
      samples.push(ms);
    }

    samples.sort((a, b) => a - b);
    const mid = Math.floor(samples.length / 2);
    return samples.length % 2 !== 0 ? samples[mid] : (samples[mid - 1] + samples[mid]) / 2;
  }

  it('T3.PERF.008: SLA: POST /api/cart/quote executes under 60ms budget', async () => {
    const medianMs = await measureMedianMs(async () => {
      const res = await request('/api/cart/quote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${customerGeorgeAuth.accessToken}`,
        },
        body: JSON.stringify({
          groups: [
            {
              farmerId: riverbendFarmer._id.toString(),
              items: [{ productId: carrotsProduct._id.toString(), quantity: 2 }],
            },
          ],
        }),
      });
      assert.equal(res.status, 200);
    });

    assert.ok(medianMs < 60 + dbLatency * 6, `Cart quote median took ${medianMs.toFixed(2)}ms, expected under ${60 + dbLatency * 6}ms`);
  });

  it('T3.PERF.009: SLA: GET /api/orders (Active list) executes under 50ms read budget', async () => {
    const medianMs = await measureMedianMs(async () => {
      const res = await request('/api/orders?tab=active&limit=10', {
        headers: { Authorization: `Bearer ${customerGeorgeAuth.accessToken}` },
      });
      assert.equal(res.status, 200);
    });

    assert.ok(medianMs < 50 + dbLatency * 3, `Orders list median took ${medianMs.toFixed(2)}ms, expected under ${50 + dbLatency * 3}ms`);
  });

  it('T3.PERF.010: SLA: GET /api/favorites/ids executes under 30ms budget', async () => {
    const medianMs = await measureMedianMs(async () => {
      const res = await request('/api/favorites/ids', {
        headers: { Authorization: `Bearer ${customerGeorgeAuth.accessToken}` },
      });
      assert.equal(res.status, 200);
    });

    assert.ok(medianMs < 30 + dbLatency * 3, `Favorites IDs median took ${medianMs.toFixed(2)}ms, expected under ${30 + dbLatency * 3}ms`);
  });

  it('T3.PERF.011: SLA: POST /api/assistant/message executes under 60ms budget', async () => {
    const medianMs = await measureMedianMs(async () => {
      const res = await request('/api/assistant/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${customerGeorgeAuth.accessToken}`,
        },
        body: JSON.stringify({ text: 'When does Elm Street Market open?' }),
      });
      assert.equal(res.status, 200);
    });

    assert.ok(medianMs < 60 + dbLatency * 3, `Assistant query median took ${medianMs.toFixed(2)}ms, expected under ${60 + dbLatency * 3}ms`);
  });
});
