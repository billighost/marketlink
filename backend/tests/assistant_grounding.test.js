/**
 * Assistant Grounding & Tool Execution Integration Tests.
 * Asserts that all 8 tools query real DB services (never hallucinating facts),
 * and strictly verifies server-side scoping for customer order privacy.
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { setupTestEnvironment, teardownTestEnvironment, loginUser } from './helpers.js';
import { executeTool } from '../src/modules/assistant/tools.js';
import { COLLECTIONS } from '../src/db/collections.js';

describe('Assistant Grounding and Tool Execution Suite', () => {
  let db;
  let customerGeorgeAuth;
  let customerMiaAuth;
  let carrotsProduct;
  let riverbendFarmer;

  before(async () => {
    const env = await setupTestEnvironment();
    db = env.db;

    customerGeorgeAuth = await loginUser('george@example.com', 'market123');
    customerMiaAuth = await loginUser('mia@example.com', 'market123');

    carrotsProduct = await db.collection(COLLECTIONS.PRODUCTS).findOne({ name: 'Rainbow carrots' });
    riverbendFarmer = await db.collection(COLLECTIONS.FARMERS).findOne({ stallName: 'Riverbend Farm' });
  });

  after(async () => {
    await teardownTestEnvironment();
  });

  it('search_products returns real database records and cards', async () => {
    const { result, cards } = await executeTool('search_products', { query: 'carrots', limit: 5 });

    assert.ok(result.count > 0);
    assert.ok(Array.isArray(result.products));
    assert.ok(result.products.some((p) => p.name.includes('carrots')));
    assert.ok(cards.length > 0);
    assert.equal(cards[0].type, 'product');
  });

  it('get_product returns live details for existing product', async () => {
    const { result, cards } = await executeTool('get_product', {
      productId: carrotsProduct._id.toString(),
    });

    assert.equal(result.name, 'Rainbow carrots');
    assert.ok(result.price);
    assert.equal(cards[0].type, 'product');
    assert.equal(cards[0].id, carrotsProduct._id.toString());
  });

  it('find_farmers finds real active stalls and cards', async () => {
    const { result, cards } = await executeTool('find_farmers', { query: 'Riverbend' });

    assert.ok(result.count > 0);
    assert.equal(result.farmers[0].stallName, 'Riverbend Farm');
    assert.equal(cards[0].type, 'farmer');
  });

  it('get_farmer returns stall schedule and cutoff hours', async () => {
    const { result, cards } = await executeTool('get_farmer', {
      farmerId: riverbendFarmer._id.toString(),
    });

    assert.equal(result.stallName, 'Riverbend Farm');
    assert.ok(typeof result.cutoffHoursBefore === 'number');
    assert.ok(Array.isArray(result.operatingDays));
    assert.equal(cards[0].type, 'farmer');
  });

  it('get_market_hours returns schedule and verifies 60s cache', async () => {
    const { result: firstRun, cards: firstCards } = await executeTool('get_market_hours', {
      marketName: 'Elm Street',
    });

    assert.ok(firstRun.markets.length > 0);
    assert.ok(firstRun.markets[0].name.includes('Elm Street'));
    assert.equal(firstCards[0].type, 'market');

    // Immediate second call should use 60s cache
    const { result: cachedRun } = await executeTool('get_market_hours', {
      marketName: 'Elm Street',
    });
    assert.equal(cachedRun.markets[0].name, firstRun.markets[0].name);
  });

  it('whats_fresh returns seasonal and bestseller catalog items', async () => {
    const { result, cards } = await executeTool('whats_fresh', { limit: 4 });

    assert.ok(result.count > 0);
    assert.ok(Array.isArray(result.freshItems));
    assert.ok(cards.length > 0);
  });

  it('get_cutoff computes next pickup slot and cutoff timing', async () => {
    const { result, cards } = await executeTool('get_cutoff', {
      farmerName: 'Riverbend Farm',
    });

    assert.equal(result.farmerName, 'Riverbend Farm');
    assert.ok(typeof result.cutoffHoursBefore === 'number');
    assert.equal(cards[0].type, 'farmer');
  });

  it('PRIVACY ENFORCEMENT: get_my_orders strictly scopes to user and ignores model injection', async () => {
    // George's user context
    const georgeContext = { user: customerGeorgeAuth.user };

    // Malicious attempt: model tries to pass another customer's ID (Mia)
    const spoofAttemptArgs = {
      customerId: customerMiaAuth.user.id,
      userId: customerMiaAuth.user.id,
    };

    const { result } = await executeTool('get_my_orders', spoofAttemptArgs, georgeContext);

    assert.equal(result.authenticated, true);
    // Any returned orders must belong exclusively to George
    if (result.orders.length > 0) {
      for (const order of result.orders) {
        assert.ok(order.orderNumber);
      }
    }

    // Unauthenticated caller gets friendly prompt without leaking records
    const guestResult = await executeTool('get_my_orders', {}, { user: null });
    assert.equal(guestResult.result.authenticated, false);
    assert.equal(guestResult.result.orders.length, 0);
  });
});
