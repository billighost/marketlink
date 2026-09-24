/**
 * T2.181 - T2.200: Performance, Explain Plans, and Concurrency Test Suite.
 * Validates index utilization (no COLLSCAN, no in-memory SORT on default paths),
 * SLA response times (reads < 50ms, search < 30ms, feed < 80ms),
 * and handles 50 parallel requests.
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { setupTestEnvironment, teardownTestEnvironment, request, loginUser } from './helpers.js';
import { getDb } from '../src/db/client.js';
import { COLLECTIONS } from '../src/db/collections.js';

describe('Performance and Explain Plan Suite (T2.181 - T2.200)', () => {
  let customerAuth;
  let db;

  before(async () => {
    const env = await setupTestEnvironment();
    db = env.db;
    customerAuth = await loginUser('george@example.com');
  });

  after(async () => {
    await teardownTestEnvironment();
  });

  function authHeaders() {
    return { Authorization: `Bearer ${customerAuth.accessToken}` };
  }

  // Recursive plan scanner to check for COLLSCAN or blocking SORT stages
  function inspectExecutionStages(stage, found = { stages: [], collscan: false, inMemorySort: false }) {
    if (!stage) return found;
    found.stages.push(stage.stage);
    if (stage.stage === 'COLLSCAN') {
      found.collscan = true;
    }
    if (stage.stage === 'SORT') {
      found.inMemorySort = true;
    }
    if (stage.inputStage) {
      inspectExecutionStages(stage.inputStage, found);
    }
    if (Array.isArray(stage.inputStages)) {
      for (const s of stage.inputStages) inspectExecutionStages(s, found);
    }
    return found;
  }

  it('T2.181: Explain /products with each sort uses IXSCAN and has no blocking in-memory SORT', async () => {
    const sorts = [
      { name: 'newest', sort: { createdAt: -1, _id: -1 } },
      { name: 'price_asc', sort: { priceCents: 1, _id: 1 } },
      { name: 'price_desc', sort: { priceCents: -1, _id: -1 } },
      { name: 'popular', sort: { salesCount: -1, _id: -1 } },
      { name: 'featured', sort: { featuredScore: -1, _id: -1 } },
    ];

    for (const s of sorts) {
      const explain = await db
        .collection(COLLECTIONS.PRODUCTS)
        .find({ listed: true, availability: { $in: ['in', 'low'] } })
        .sort(s.sort)
        .limit(20)
        .explain('executionStats');

      const stats = explain.executionStats.executionStages;
      const analysis = inspectExecutionStages(stats);

      assert.equal(
        analysis.collscan,
        false,
        `Sort ${s.name} must not perform COLLSCAN`
      );
      assert.equal(
        analysis.inMemorySort,
        false,
        `Sort ${s.name} must be index-ordered without blocking SORT`
      );
      assert.ok(
        analysis.stages.includes('IXSCAN'),
        `Sort ${s.name} must use IXSCAN`
      );
    }
  });

  it('T2.182: Explain /products with category, minPrice, maxPrice uses IXSCAN', async () => {
    const explain = await db
      .collection(COLLECTIONS.PRODUCTS)
      .find({
        listed: true,
        categorySlug: { $in: ['vegetables'] },
        priceCents: { $gte: 100, $lte: 1000 },
        availability: { $in: ['in', 'low'] },
      })
      .sort({ priceCents: 1, _id: 1 })
      .limit(20)
      .explain('executionStats');

    const analysis = inspectExecutionStages(explain.executionStats.executionStages);
    assert.equal(analysis.collscan, false);
    assert.ok(analysis.stages.includes('IXSCAN'));
  });

  it('T2.183: Explain /farmers with market and sort=top uses IXSCAN', async () => {
    const market = await db.collection(COLLECTIONS.MARKETS).findOne();
    const explain = await db
      .collection(COLLECTIONS.FARMERS)
      .find({ listingEnabled: true, marketIds: market._id })
      .sort({ salesCount: -1, _id: -1 })
      .limit(10)
      .explain('executionStats');

    const analysis = inspectExecutionStages(explain.executionStats.executionStages);
    assert.equal(analysis.collscan, false);
    assert.ok(analysis.stages.includes('IXSCAN'));
  });

  it('T2.184: Explain /markets with geo coordinates uses 2dsphere index', async () => {
    const pipeline = [
      {
        $geoNear: {
          near: { type: 'Point', coordinates: [-74.006, 40.7128] },
          distanceField: 'distanceMeters',
          maxDistance: 25000,
          spherical: true,
          query: { status: 'active' },
        },
      },
      { $limit: 10 },
    ];

    const explain = await db.collection(COLLECTIONS.MARKETS).aggregate(pipeline).explain('executionStats');
    const stagesJson = JSON.stringify(explain);
    assert.ok(
      stagesJson.includes('GEO_NEAR_2DSPHERE') || stagesJson.includes('2dsphere'),
      'Geo aggregation must use 2dsphere index'
    );
  });

  it('T2.185: Explain feed random walker query uses { listed: 1, rnd: 1 } index', async () => {
    const explain = await db
      .collection(COLLECTIONS.PRODUCTS)
      .find({ listed: true, rnd: { $gte: 0.5 } })
      .sort({ rnd: 1 })
      .limit(10)
      .explain('executionStats');

    const analysis = inspectExecutionStages(explain.executionStats.executionStages);
    assert.equal(analysis.collscan, false);
    assert.equal(analysis.inMemorySort, false);
    assert.ok(analysis.stages.includes('IXSCAN'));
  });

  it('T2.186: Performance SLA: warm read endpoints median < 50ms, search < 30ms, feed < 80ms', async () => {
    // Warm-up requests
    await request('/api/products?limit=10', { headers: authHeaders() });
    await request('/api/search/suggestions?q=to', { headers: authHeaders() });
    await request('/api/feed', { headers: authHeaders() });

    // Measure /api/products (10 iterations)
    const productTimes = [];
    for (let i = 0; i < 10; i++) {
      const t0 = performance.now();
      const res = await request('/api/products?limit=20', { headers: authHeaders() });
      assert.equal(res.status, 200);
      productTimes.push(performance.now() - t0);
    }
    productTimes.sort((a, b) => a - b);
    const medianProduct = productTimes[Math.floor(productTimes.length / 2)];
    assert.ok(
      medianProduct < 50,
      `Median /api/products (${medianProduct.toFixed(1)}ms) must be under 50ms`
    );

    // Measure /api/search/suggestions (10 iterations)
    const searchTimes = [];
    for (let i = 0; i < 10; i++) {
      const t0 = performance.now();
      const res = await request('/api/search/suggestions?q=tom', { headers: authHeaders() });
      assert.equal(res.status, 200);
      searchTimes.push(performance.now() - t0);
    }
    searchTimes.sort((a, b) => a - b);
    const medianSearch = searchTimes[Math.floor(searchTimes.length / 2)];
    assert.ok(
      medianSearch < 30,
      `Median /api/search/suggestions (${medianSearch.toFixed(1)}ms) must be under 30ms`
    );

    // Measure /api/feed (10 iterations)
    const feedTimes = [];
    for (let i = 0; i < 10; i++) {
      const t0 = performance.now();
      const res = await request('/api/feed', { headers: authHeaders() });
      assert.equal(res.status, 200);
      feedTimes.push(performance.now() - t0);
    }
    feedTimes.sort((a, b) => a - b);
    const medianFeed = feedTimes[Math.floor(feedTimes.length / 2)];
    assert.ok(
      medianFeed < 80,
      `Median /api/feed (${medianFeed.toFixed(1)}ms) must be under 80ms`
    );
  });

  it('T2.187: Concurrency: 50 parallel requests to /products and 50 to /feed succeed with 200', async () => {
    const productRequests = Array.from({ length: 50 }, () =>
      request('/api/products?limit=10', { headers: authHeaders() })
    );
    const productResults = await Promise.all(productRequests);
    for (const r of productResults) {
      assert.equal(r.status, 200);
    }

    const feedRequests = Array.from({ length: 50 }, () =>
      request('/api/feed', { headers: authHeaders() })
    );
    const feedResults = await Promise.all(feedRequests);
    for (const r of feedResults) {
      assert.equal(r.status, 200);
    }
  });
});
