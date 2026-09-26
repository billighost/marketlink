/**
 * Catalog Discovery Integration Suite.
 * Comprehensive end-to-end tests for discovery flows and privacy contracts.
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { setupTestEnvironment, teardownTestEnvironment, request, loginUser } from './helpers.js';
import { getSeedFacts } from './seedFacts.js';

describe('Catalog Discovery Integration Suite', () => {
  let customerAuth;
  let facts;

  before(async () => {
    const env = await setupTestEnvironment();
    customerAuth = await loginUser('george@example.com');
    facts = await getSeedFacts(env.db);
  });

  after(async () => {
    await teardownTestEnvironment();
  });

  function authHeaders() {
    return { Authorization: `Bearer ${customerAuth.accessToken}` };
  }

  it('Discovery Flow: Guest lands on /api/public/home, sees board, farmers, and announcements', async () => {
    const res = await request('/api/public/home');
    assert.equal(res.status, 200);
    const body = await res.json();

    assert.ok(body.data.board);
    assert.ok(body.data.board.market);
    assert.ok(Array.isArray(body.data.board.items));
    assert.ok(Array.isArray(body.data.farmers));
    assert.ok(Array.isArray(body.data.announcements));

    // Verify privacy: no _id, no passwordHash, no farmer contact info
    for (const farmer of body.data.farmers) {
      assert.equal(farmer._id, undefined);
      assert.equal(farmer.phone, undefined);
      assert.equal(farmer.email, undefined);
    }
  });

  it('Discovery Flow: Customer fetches categories and browses products by category', async () => {
    const catRes = await request('/api/categories');
    assert.equal(catRes.status, 200);
    const catBody = await catRes.json();
    assert.ok(catBody.data.length > 0);

    const firstCat = catBody.data[0];
    const prodRes = await request(`/api/products?category=${firstCat.slug}&sort=price_asc&limit=5`, {
      headers: authHeaders(),
    });
    assert.equal(prodRes.status, 200);
    const prodBody = await prodRes.json();

    for (const p of prodBody.data) {
      assert.equal(p.category.slug, firstCat.slug);
      assert.equal(p._id, undefined);
    }
  });

  it('Discovery Flow: Product detail includes pickup slots and farmer cutoff', async () => {
    const res = await request(`/api/products/${facts.cheapestProduct.id}`, {
      headers: authHeaders(),
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    const prod = body.data;

    assert.equal(prod.id, facts.cheapestProduct.id);
    assert.ok(prod.farmerCutoff);
    assert.ok(Array.isArray(prod.nextPickupSlots));
    assert.ok(prod.nextPickupSlots.length <= 3);

    for (const slot of prod.nextPickupSlots) {
      assert.ok(slot.start);
      assert.ok(slot.end);
      assert.ok(slot.label);
      assert.ok(slot.marketName);
    }
  });

  it('Discovery Flow: Farmer detail contains rating breakdown and hides private contact info', async () => {
    const listRes = await request('/api/farmers?limit=1', { headers: authHeaders() });
    const listBody = await listRes.json();
    const farmerId = listBody.data[0].id;

    const detailRes = await request(`/api/farmers/${farmerId}`, { headers: authHeaders() });
    assert.equal(detailRes.status, 200);
    const detailBody = await detailRes.json();
    const farmer = detailBody.data;

    assert.equal(farmer.id, farmerId);
    assert.ok(farmer.ratingBreakdown);
    assert.equal(farmer._id, undefined);
    assert.equal(farmer.phone, undefined);
    assert.equal(farmer.email, undefined);
  });

  it('Discovery Flow: Market detail contains directionsUrls and associated farmers/products', async () => {
    const marketRes = await request(`/api/markets/${facts.elmMarketId}`, {
      headers: authHeaders(),
    });
    assert.equal(marketRes.status, 200);
    const marketBody = await marketRes.json();
    const market = marketBody.data;

    assert.equal(market.id, facts.elmMarketId);
    assert.ok(market.directionsUrls.google.includes('maps/dir'));
    assert.ok(market.directionsUrls.osm.includes('openstreetmap.org'));

    const farmersRes = await request(`/api/markets/${facts.elmMarketId}/farmers`, {
      headers: authHeaders(),
    });
    assert.equal(farmersRes.status, 200);
    const farmersBody = await farmersRes.json();
    assert.ok(farmersBody.data.length >= 6, 'Elm Street Market must have at least 6 farmers');

    const prodsRes = await request(`/api/markets/${facts.elmMarketId}/products`, {
      headers: authHeaders(),
    });
    assert.equal(prodsRes.status, 200);
    const prodsBody = await prodsRes.json();
    assert.ok(prodsBody.data.length > 0);
  });

  it('Security Contract: No sensitive fields leak across any discovery endpoints', async () => {
    const endpoints = [
      '/api/categories',
      '/api/public/home',
      '/api/announcements',
      '/api/markets',
      `/api/markets/${facts.elmMarketId}`,
      '/api/farmers',
      '/api/products',
      `/api/products/${facts.cheapestProduct.id}`,
      '/api/search/suggestions?q=to',
      '/api/feed',
      '/api/feed/meta',
    ];

    for (const ep of endpoints) {
      const res = await request(ep, { headers: authHeaders() });
      assert.equal(res.status, 200, `Endpoint ${ep} should return 200`);
      const text = await res.text();

      // Assert no MongoDB _id or internal security hashes leaked in JSON keys
      assert.ok(!text.includes('"_id":'), `Endpoint ${ep} leaked MongoDB _id`);
      assert.ok(!text.includes('"passwordHash":'), `Endpoint ${ep} leaked passwordHash`);
      assert.ok(!text.includes('"tokenHash":'), `Endpoint ${ep} leaked tokenHash`);
    }
  });
});
