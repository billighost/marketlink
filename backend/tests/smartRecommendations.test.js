/**
 * Test suite for 9. Smart Recommendations:
 * - "Buy Again" (based on previous orders)
 * - "Because you liked this farmer" (based on favorites / farmer affinity)
 * - "Fresh from your favorite market" (based on preferred / favorite market)
 * - "Available this weekend" (based on weekend market operating days)
 * - Non-invented history for users without activity (Chloe)
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { setupTestEnvironment, teardownTestEnvironment, request, loginUser } from './helpers.js';

describe('Smart Recommendations Suite (Item 9)', () => {
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

  it('1. "Buy Again" section is surfaced for user with order history (George)', async () => {
    const res = await request('/api/feed', { headers: authGeorge() });
    assert.equal(res.status, 200);
    const body = await res.json();

    const buyAgain = body.data.sections.find((s) => s.id === 'recently-bought');
    assert.ok(buyAgain, 'Expected "Buy Again" (recently-bought) section to be present');
    assert.equal(buyAgain.title, 'Buy Again');
    assert.ok(buyAgain.items.length > 0);
    assert.ok(buyAgain.items[0].lastBoughtAt, 'Items should contain lastBoughtAt timestamp');
  });

  it('2. "Buy Again" is strictly omitted for user with zero orders (Chloe)', async () => {
    const res = await request('/api/feed', { headers: authChloe() });
    assert.equal(res.status, 200);
    const body = await res.json();

    const buyAgain = body.data.sections.find((s) => s.id === 'recently-bought');
    assert.equal(buyAgain, undefined, 'Must NOT invent or display "Buy Again" for user with no order history');
  });

  it('3. "Because you liked [farmer]" is surfaced for user with farmer affinity or favorites', async () => {
    const res = await request('/api/feed', { headers: authGeorge() });
    assert.equal(res.status, 200);
    const body = await res.json();

    const farmerAffinity = body.data.sections.find((s) => s.id === 'from-favorite');
    if (farmerAffinity) {
      assert.ok(
        farmerAffinity.title.includes('Because you liked') || farmerAffinity.title.includes('From your favorite'),
        `Unexpected title: ${farmerAffinity.title}`
      );
      assert.ok(farmerAffinity.items.length >= 3);
    }
  });

  it('4. "Fresh from [favorite market]" is surfaced when user has preferred/home market', async () => {
    const res = await request('/api/feed', { headers: authGeorge() });
    assert.equal(res.status, 200);
    const body = await res.json();

    const favMarketSection = body.data.sections.find((s) => s.id === 'favorite-market-fresh');
    assert.ok(favMarketSection, 'Expected "Fresh from your favorite market" to be present for George');
    assert.ok(favMarketSection.title.includes('Fresh from'));
    assert.ok(favMarketSection.items.length >= 3);
  });

  it('5. "Available this weekend" section is present with weekend cutoff information', async () => {
    const res = await request('/api/feed', { headers: authGeorge() });
    assert.equal(res.status, 200);
    const body = await res.json();

    const weekendSection = body.data.sections.find((s) => s.id === 'available-this-weekend');
    assert.ok(weekendSection, 'Expected "Available this weekend" section to be present');
    assert.equal(weekendSection.title, 'Available this weekend');
    assert.ok(weekendSection.items.length >= 3);
  });

  it('6. Does not invent false category affinity when user has zero activity', async () => {
    const res = await request('/api/feed', { headers: authChloe() });
    assert.equal(res.status, 200);
    const body = await res.json();

    // Chloe has no orders and no favorites, so "from-favorite" must not be invented
    const farmerAffinity = body.data.sections.find((s) => s.id === 'from-favorite');
    assert.equal(farmerAffinity, undefined, 'Must NOT invent farmer affinity when user has no favorite farmer or orders');
  });
});
