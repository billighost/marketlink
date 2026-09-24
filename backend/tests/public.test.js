/**
 * T2.171 - T2.180: Public discovery, categories, and announcements test suite.
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { setupTestEnvironment, teardownTestEnvironment, request, loginUser } from './helpers.js';

describe('Public & Guest Discovery Suite (T2.171 - T2.180)', () => {
  before(async () => {
    await setupTestEnvironment();
  });

  after(async () => {
    await teardownTestEnvironment();
  });

  it('T2.171: GET /api/categories returns active categories with cached productCount and cache headers', async () => {
    const res = await request('/api/categories');
    assert.equal(res.status, 200);

    const cacheHeader = res.headers.get('cache-control');
    assert.ok(cacheHeader && cacheHeader.includes('public'));
    assert.ok(cacheHeader.includes('max-age=60'));

    const body = await res.json();
    assert.ok(Array.isArray(body.data));
    assert.ok(body.data.length >= 7);

    // Verify sortOrder
    for (let i = 1; i < body.data.length; i++) {
      assert.ok(body.data[i].sortOrder >= body.data[i - 1].sortOrder);
    }

    // Verify structure
    const first = body.data[0];
    assert.ok(first.id);
    assert.ok(first.name);
    assert.ok(first.slug);
    assert.equal(typeof first.productCount, 'number');
    assert.ok(first.productCount > 0);
  });

  it('T2.172: GET /api/public/home returns landing board without token and exposes no private fields', async () => {
    const res = await request('/api/public/home');
    assert.equal(res.status, 200);

    const cacheHeader = res.headers.get('cache-control');
    assert.ok(cacheHeader && cacheHeader.includes('public'));

    const body = await res.json();
    assert.ok(body.data);
    const { board, farmers, announcements } = body.data;

    // Board verification
    assert.ok(board);
    assert.ok(board.market);
    assert.ok(board.market.name);
    assert.ok(Array.isArray(board.items));
    assert.ok(board.items.length <= 6);

    // Ensure no _id or passwords leak in board
    const rawStr = JSON.stringify(body);
    assert.equal(rawStr.includes('_id'), false, 'Response must never leak _id');
    assert.equal(rawStr.includes('passwordHash'), false, 'Response must never leak passwordHash');
    assert.equal(rawStr.includes('tokenHash'), false, 'Response must never leak tokenHash');

    // Farmers verification (3 top farmers)
    assert.ok(Array.isArray(farmers));
    assert.equal(farmers.length, 3);
    for (const f of farmers) {
      assert.ok(f.id);
      assert.ok(f.stallName);
      assert.equal(f.phone, undefined, 'Farmer phone must not leak on public card');
      assert.equal(f.email, undefined, 'Farmer email must not leak on public card');
    }

    // Announcements
    assert.ok(Array.isArray(announcements));
  });

  it('T2.173: GET /api/announcements filters audience according to authentication status', async () => {
    // Unauthenticated guest request
    const guestRes = await request('/api/announcements');
    assert.equal(guestRes.status, 200);
    const guestBody = await guestRes.json();
    assert.ok(Array.isArray(guestBody.data));

    // Guests only see audience 'all'
    for (const a of guestBody.data) {
      assert.equal(a.audience, 'all');
    }

    // Authenticated Farmer request sees 'all' and 'farmer'
    const farmerAuth = await loginUser('riverbend@example.com');
    const farmerRes = await request('/api/announcements', {
      headers: { Authorization: `Bearer ${farmerAuth.accessToken}` },
    });
    assert.equal(farmerRes.status, 200);
    const farmerBody = await farmerRes.json();
    const audiences = farmerBody.data.map((a) => a.audience);
    assert.ok(audiences.includes('farmer') || audiences.includes('all'));
  });
});
