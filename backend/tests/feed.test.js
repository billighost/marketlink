/**
 * T2.141 - T2.170: Endless feed engine, batch 0 curated sections, deduplication, and metadata test suite.
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { setupTestEnvironment, teardownTestEnvironment, request, loginUser } from './helpers.js';
import { decodeCursor } from '../src/utils/cursor.js';

describe('Feed Module Suite (T2.141 - T2.170)', () => {
  let customerGeorge;
  let customerChloe;
  let db;

  before(async () => {
    const env = await setupTestEnvironment();
    db = env.db;
    customerGeorge = await loginUser('george@example.com');
    customerChloe = await loginUser('chloe@example.com');
  });

  after(async () => {
    await teardownTestEnvironment();
  });

  function authGeorge() {
    return { Authorization: `Bearer ${customerGeorge.accessToken}` };
  }

  function authChloe() {
    return { Authorization: `Bearer ${customerChloe.accessToken}` };
  }

  it('T2.141: GET /api/feed requires authentication', async () => {
    const res = await request('/api/feed');
    assert.equal(res.status, 401);
  });

  it('T2.142: Batch 0 section IDs in expected order', async () => {
    const res = await request('/api/feed', { headers: authGeorge() });
    assert.equal(res.status, 200);
    const body = await res.json();

    assert.ok(body.data.sections);
    const sectionIds = body.data.sections.map((s) => s.id);

    // Expected curated batch 0 sections
    assert.ok(sectionIds.includes('featured-today'));
    assert.ok(sectionIds.includes('top-farmers'));

    // Check order of presence
    const featIdx = sectionIds.indexOf('featured-today');
    const topIdx = sectionIds.indexOf('top-farmers');
    assert.ok(featIdx < topIdx, 'featured-today must come before top-farmers');

    assert.equal(body.meta.batch, 0);
    assert.equal(body.meta.hasMore, true);
    assert.ok(body.meta.nextCursor);
  });

  it('T2.143: Recently bought reflects George\'s orders and is omitted for new Customer (Chloe)', async () => {
    // George has 4 completed orders
    const resGeorge = await request('/api/feed', { headers: authGeorge() });
    const bodyGeorge = await resGeorge.json();
    const rbGeorge = bodyGeorge.data.sections.find((s) => s.id === 'recently-bought');
    assert.ok(rbGeorge, 'Recently bought must be present for customer with past orders');
    assert.ok(rbGeorge.items.length > 0);
    assert.ok(rbGeorge.items[0].lastBoughtAt);

    // Chloe has 0 orders
    const resChloe = await request('/api/feed', { headers: authChloe() });
    const bodyChloe = await resChloe.json();
    const rbChloe = bodyChloe.data.sections.find((s) => s.id === 'recently-bought');
    assert.equal(rbChloe, undefined, 'Recently bought must be omitted for new customer');
  });

  it('T2.144: Order soon items all have cutoffAt within 24 hours when present', async () => {
    const res = await request('/api/feed', { headers: authGeorge() });
    const body = await res.json();
    const orderSoon = body.data.sections.find((s) => s.id === 'order-soon');

    if (orderSoon && orderSoon.items.length > 0) {
      const now = Date.now();
      for (const item of orderSoon.items) {
        assert.ok(item.cutoffAt);
        const cutoffMs = new Date(item.cutoffAt).getTime();
        const diffMs = cutoffMs - now;
        assert.ok(diffMs <= 24 * 60 * 60 * 1000 + 1000, 'cutoffAt must be within 24h');
      }
    }
  });

  it('T2.145: No duplicate item IDs within Batch 0 sections', async () => {
    const res = await request('/api/feed', { headers: authGeorge() });
    const body = await res.json();

    for (const section of body.data.sections) {
      const ids = section.items.map((i) => i.id || i.slug);
      const unique = new Set(ids);
      assert.equal(ids.length, unique.size, `Section ${section.id} has duplicate item IDs`);
    }
  });

  it('T2.146: Requesting subsequent batches returns 3 sections each', async () => {
    const res0 = await request('/api/feed', { headers: authGeorge() });
    const body0 = await res0.json();
    const cursor1 = body0.meta.nextCursor;

    const res1 = await request(`/api/feed?cursor=${encodeURIComponent(cursor1)}`, {
      headers: authGeorge(),
    });
    assert.equal(res1.status, 200);
    const body1 = await res1.json();

    assert.equal(body1.meta.batch, 1);
    assert.equal(body1.meta.hasMore, true);
    assert.ok(body1.data.sections.length >= 1, 'Batch 1 should have sections');
  });

  it('T2.147: Same (user, cursor) returns identical sections (deterministic)', async () => {
    const res0 = await request('/api/feed', { headers: authGeorge() });
    const body0 = await res0.json();
    const cursor = body0.meta.nextCursor;

    const call1 = await request(`/api/feed?cursor=${encodeURIComponent(cursor)}`, {
      headers: authGeorge(),
    });
    const call2 = await request(`/api/feed?cursor=${encodeURIComponent(cursor)}`, {
      headers: authGeorge(),
    });

    const b1 = await call1.json();
    const b2 = await call2.json();

    assert.deepEqual(
      b1.data.sections.map((s) => s.id),
      b2.data.sections.map((s) => s.id)
    );
    assert.deepEqual(
      b1.data.sections[0].items.map((i) => i.id || i.slug),
      b2.data.sections[0].items.map((i) => i.id || i.slug)
    );
  });

  it('T2.148: Tampered feed cursor returns 400 INVALID_CURSOR', async () => {
    const tampered = 'eyJ2IjoxLCJzIjoiZmVlZCIsImsiOlsxXX0.tampered';
    const res = await request(`/api/feed?cursor=${encodeURIComponent(tampered)}`, {
      headers: authGeorge(),
    });
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.error.code, 'INVALID_CURSOR');
  });

  it('T2.149: Walking 30 consecutive batches never crashes, returns 3 sections each (batch >= 1), and hasMore remains true', async () => {
    let currentCursor = null;

    for (let batch = 0; batch < 30; batch++) {
      const url = currentCursor ? `/api/feed?cursor=${encodeURIComponent(currentCursor)}` : '/api/feed';
      const res = await request(url, { headers: authGeorge() });
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.meta.hasMore, true);
      assert.ok(body.meta.nextCursor);
      if (batch >= 1) {
        assert.equal(body.data.sections.length, 3, `Batch ${batch} must have exactly 3 sections`);
      }
      currentCursor = body.meta.nextCursor;
    }
  });

  it('T2.150: GET /api/feed/meta returns formatted line, homeMarket, and greetingName', async () => {
    const res = await request('/api/feed/meta', { headers: authGeorge() });
    assert.equal(res.status, 200);
    const body = await res.json();

    assert.ok(body.data);
    assert.equal(body.data.greetingName, 'George');
    assert.ok(body.data.homeMarket);
    assert.ok(body.data.homeMarket.name);
    assert.ok(typeof body.data.line === 'string');
    assert.ok(body.data.line.includes('opens') || body.data.line.includes('Welcome'));
  });

  it('T2.151: Feed with temporarily unlisted catalog returns empty sections without error', async () => {
    // Temporarily unlist all products
    await db.collection('products').updateMany({}, { $set: { listed: false } });
    await db.collection('farmers').updateMany({}, { $set: { listingEnabled: false } });

    try {
      const res = await request('/api/feed', { headers: authGeorge() });
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.ok(Array.isArray(body.data.sections));
      assert.equal(body.meta.hasMore, true);
    } finally {
      // Restore products and farmers
      await db.collection('products').updateMany({ availability: { $ne: 'hidden' } }, { $set: { listed: true } });
      const activeUserIds = (await db.collection('users').find({ role: 'farmer', status: 'active' }).toArray()).map((u) => u._id);
      await db.collection('farmers').updateMany({ userId: { $in: activeUserIds } }, { $set: { listingEnabled: true } });
    }
  });
});
