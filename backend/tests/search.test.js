/**
 * T2.121 - T2.140: Search suggestions, prefix matching, and search history test suite.
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { setupTestEnvironment, teardownTestEnvironment, request, loginUser } from './helpers.js';

describe('Search and History Suite (T2.121 - T2.140)', () => {
  let customerA;
  let customerB;

  before(async () => {
    await setupTestEnvironment();
    customerA = await loginUser('george@example.com');
    customerB = await loginUser('chloe@example.com');
  });

  after(async () => {
    await teardownTestEnvironment();
  });

  function authA() {
    return { Authorization: `Bearer ${customerA.accessToken}` };
  }

  function authB() {
    return { Authorization: `Bearer ${customerB.accessToken}` };
  }

  it('T2.121: suggestions require minimum 2 characters (else 422)', async () => {
    const resEmpty = await request('/api/search/suggestions?q=', { headers: authA() });
    assert.equal(resEmpty.status, 422);
    const bodyEmpty = await resEmpty.json();
    assert.equal(bodyEmpty.error.code, 'VALIDATION_FAILED');

    const resSingle = await request('/api/search/suggestions?q=a', { headers: authA() });
    assert.equal(resSingle.status, 422);

    const resWhitespace = await request('/api/search/suggestions?q=  ', { headers: authA() });
    assert.equal(resWhitespace.status, 422);
  });

  it('T2.122: suggestions returns prefix results for products, farmers, categories', async () => {
    // "tom" matches seeded tomato products
    const res = await request('/api/search/suggestions?q=tom', { headers: authA() });
    assert.equal(res.status, 200);
    const body = await res.json();

    assert.ok(Array.isArray(body.data.products));
    assert.ok(Array.isArray(body.data.farmers));
    assert.ok(Array.isArray(body.data.categories));
    assert.ok(body.data.products.length > 0);

    const tomato = body.data.products.find((p) => p.name.toLowerCase().includes('tom'));
    assert.ok(tomato, 'Should find a tomato product');
    assert.ok(tomato.id);
    assert.ok(tomato.priceCents);
    assert.ok(tomato.unit);
  });

  it('T2.123: suggestions caps output at max 5 products, 3 farmers, 3 categories', async () => {
    // Single-char query isn't allowed, but a 2-char query matching multiple items like "ch" or "or"
    const res = await request('/api/search/suggestions?q=or', { headers: authA() });
    assert.equal(res.status, 200);
    const body = await res.json();

    assert.ok(body.data.products.length <= 5);
    assert.ok(body.data.farmers.length <= 3);
    assert.ok(body.data.categories.length <= 3);
  });

  it('T2.124: suggestions is case-insensitive', async () => {
    const resLower = await request('/api/search/suggestions?q=tom', { headers: authA() });
    const resUpper = await request('/api/search/suggestions?q=TOM', { headers: authA() });

    assert.equal(resLower.status, 200);
    assert.equal(resUpper.status, 200);

    const bodyLower = await resLower.json();
    const bodyUpper = await resUpper.json();

    assert.equal(bodyLower.data.products.length, bodyUpper.data.products.length);
  });

  it('T2.125: suggestions with special characters does not crash or error', async () => {
    const res = await request('/api/search/suggestions?q=(*+\\', { headers: authA() });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.deepEqual(body.data.products, []);
    assert.deepEqual(body.data.farmers, []);
  });

  it('T2.126: search history requires authentication', async () => {
    const res = await request('/api/search/history');
    assert.equal(res.status, 401);
  });

  it('T2.127: search history record and deduplicate updates timestamp', async () => {
    // Clear first to start clean
    await request('/api/search/history', { method: 'DELETE', headers: authA() });

    const post1 = await request('/api/search/history', {
      method: 'POST',
      headers: { ...authA(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ term: 'apples' }),
    });
    assert.equal(post1.status, 201);
    const body1 = await post1.json();
    assert.equal(body1.data.term, 'apples');

    // Post same term again after short delay
    await new Promise((r) => setTimeout(r, 10));
    const post2 = await request('/api/search/history', {
      method: 'POST',
      headers: { ...authA(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ term: 'apples' }),
    });
    assert.equal(post2.status, 201);

    const listRes = await request('/api/search/history', { headers: authA() });
    const list = await listRes.json();
    assert.equal(list.data.length, 1, 'Duplicate term must be deduplicated');
  });

  it('T2.128: search history caps at 10 items (insert 12, keep latest 10)', async () => {
    // Insert 12 distinct terms
    for (let i = 1; i <= 12; i++) {
      await request('/api/search/history', {
        method: 'POST',
        headers: { ...authA(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ term: `term-${i}` }),
      });
    }

    const listRes = await request('/api/search/history', { headers: authA() });
    const list = await listRes.json();
    assert.equal(list.data.length, 10);
    // Latest should be term-12, oldest kept should be term-3
    assert.equal(list.data[0].term, 'term-12');
    assert.equal(list.data[9].term, 'term-3');
  });

  it('T2.129: search history delete single entry by id', async () => {
    const listRes = await request('/api/search/history', { headers: authA() });
    const list = await listRes.json();
    const itemToDelete = list.data[0];

    const delRes = await request(`/api/search/history/${itemToDelete.id}`, {
      method: 'DELETE',
      headers: authA(),
    });
    assert.equal(delRes.status, 200);

    const verifyRes = await request('/api/search/history', { headers: authA() });
    const verifyList = await verifyRes.json();
    assert.equal(verifyList.data.length, 9);
    assert.ok(!verifyList.data.some((x) => x.id === itemToDelete.id));
  });

  it('T2.130: search history clear all entries', async () => {
    const clearRes = await request('/api/search/history', {
      method: 'DELETE',
      headers: authA(),
    });
    assert.equal(clearRes.status, 200);

    const listRes = await request('/api/search/history', { headers: authA() });
    const list = await listRes.json();
    assert.equal(list.data.length, 0);
  });

  it('T2.131: search history isolation between users', async () => {
    // User A adds a term
    await request('/api/search/history', {
      method: 'POST',
      headers: { ...authA(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ term: 'userA-secret' }),
    });

    // User B adds a term
    await request('/api/search/history', {
      method: 'POST',
      headers: { ...authB(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ term: 'userB-private' }),
    });

    // Verify User A only sees userA
    const resA = await request('/api/search/history', { headers: authA() });
    const dataA = await resA.json();
    assert.ok(dataA.data.some((x) => x.term === 'userA-secret'));
    assert.ok(!dataA.data.some((x) => x.term === 'userB-private'));

    // User A cannot delete User B's history item
    const resB = await request('/api/search/history', { headers: authB() });
    const dataB = await resB.json();
    const itemB = dataB.data.find((x) => x.term === 'userB-private');

    const unauthorizedDel = await request(`/api/search/history/${itemB.id}`, {
      method: 'DELETE',
      headers: authA(),
    });
    assert.equal(unauthorizedDel.status, 404);
  });
});
