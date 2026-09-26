/**
 * Stage 3: Buyer Redesign Backend Additive Changes Test Suite.
 * Validates:
 * - Market clock computation, DST boundary resilience, and no-schedule handling
 * - Farmer operatingDayNumbers normalization, openToday, lowStockCount, soldOutCount
 * - Feed meta clock embedding
 * - Grouped cart quote with flat items, multi-farmer groups, pickupWindows, cutoffLabel, issues
 * - Order pickupCode generation, uniqueness, read stability, and tenant isolation (404 on IDOR)
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { setupTestEnvironment, teardownTestEnvironment, request, loginUser } from './helpers.js';
import { computeMarketClock, toOperatingDayNumbers, computeOpenToday, formatCutoffLabel } from '../src/utils/slots.js';
import { generatePickupCode, PICKUP_CODE_ALPHABET } from '../src/utils/pickupCode.js';
import { COLLECTIONS } from '../src/db/collections.js';

describe('Buyer Redesign Stage 3 Suite', () => {
  let db;
  let customerAuth;
  let farmerAuth;
  let otherCustomerAuth;
  let elmMarket;
  let riverbendFarmer;
  let oakmillFarmer;
  let carrotsProduct;
  let tomatoesProduct;
  let sourdoughProduct;

  before(async () => {
    const env = await setupTestEnvironment();
    db = env.db;

    customerAuth = await loginUser('george@example.com', 'market123');
    farmerAuth = await loginUser('riverbend@example.com', 'market123');
    otherCustomerAuth = await loginUser('mia@example.com', 'market123');

    elmMarket = await db.collection(COLLECTIONS.MARKETS).findOne({ slug: 'elm-street-market' });
    riverbendFarmer = await db.collection(COLLECTIONS.FARMERS).findOne({ stallName: 'Riverbend Farm' });
    oakmillFarmer = await db.collection(COLLECTIONS.FARMERS).findOne({ stallName: 'Oak & Mill Bakery' });

    carrotsProduct = await db.collection(COLLECTIONS.PRODUCTS).findOne({ name: 'Rainbow carrots' });
    tomatoesProduct = await db.collection(COLLECTIONS.PRODUCTS).findOne({ name: 'Heirloom tomatoes' });
    sourdoughProduct = await db.collection(COLLECTIONS.PRODUCTS).findOne({ name: 'Sourdough boule' });
  });

  after(async () => {
    await teardownTestEnvironment();
  });

  // ── 1. Unit Tests: computeMarketClock & Timezones ──
  describe('computeMarketClock Unit Tests', () => {
    const testMarket = {
      name: 'Test Market',
      timezone: 'America/New_York',
      schedule: [{ day: 'sat', openMin: 480, closeMin: 780 }], // 8:00 to 13:00 (8am - 1pm)
    };

    it('returns all nulls and openNow=false for market with no schedule', () => {
      const emptyMarket = { timezone: 'America/New_York', schedule: [] };
      const res = computeMarketClock(emptyMarket);
      assert.deepEqual(res, {
        openNow: false,
        todayWindow: null,
        todayProgress: null,
        closesAtLabel: null,
        windowLabel: null,
        nextOpenLabel: null,
        nextOpenAt: null,
      });

      // Also never throws on null / undefined market
      const nullRes = computeMarketClock(null);
      assert.equal(nullRes.openNow, false);
      assert.equal(nullRes.windowLabel, null);
    });

    it('returns openNow: true with todayProgress in [0, 1] when market is open', () => {
      // Saturday 10:00 AM NY time (EDT = UTC-4): 2026-09-26T14:00:00.000Z
      const fixedNow = new Date('2026-09-26T14:00:00.000Z');
      const res = computeMarketClock(testMarket, fixedNow);

      assert.equal(res.openNow, true);
      assert.deepEqual(res.todayWindow, { opensAt: '08:00', closesAt: '13:00' });
      assert.equal(res.closesAtLabel, '13:00');
      assert.equal(res.windowLabel, 'Saturday 8:00–13:00');
      assert.equal(typeof res.todayProgress, 'number');
      assert.ok(res.todayProgress >= 0 && res.todayProgress <= 1, 'todayProgress should be between 0 and 1');
      assert.equal(res.nextOpenLabel, null);
      assert.equal(res.nextOpenAt, null);
    });

    it('returns openNow: false and relative nextOpenLabel when market is closed', () => {
      // Friday 10:00 AM NY time (opens tomorrow)
      const fridayNow = new Date('2026-09-25T14:00:00.000Z');
      const resFri = computeMarketClock(testMarket, fridayNow);
      assert.equal(resFri.openNow, false);
      assert.equal(resFri.nextOpenLabel, 'opens tomorrow');
      assert.equal(resFri.nextOpenAt, '2026-09-26T12:00:00.000Z');
      assert.equal(resFri.windowLabel, 'Saturday 8:00–13:00');
      assert.equal(resFri.todayProgress, null);

      // Thursday 10:00 AM NY time (opens in 2 days)
      const thursdayNow = new Date('2026-09-24T14:00:00.000Z');
      const resThu = computeMarketClock(testMarket, thursdayNow);
      assert.equal(resThu.openNow, false);
      assert.equal(resThu.nextOpenLabel, 'opens in 2 days');

      // Tuesday 10:00 AM NY time (opens Saturday)
      const tuesdayNow = new Date('2026-09-22T14:00:00.000Z');
      const resTue = computeMarketClock(testMarket, tuesdayNow);
      assert.equal(resTue.openNow, false);
      assert.equal(resTue.nextOpenLabel, 'opens Saturday');
    });

    it('computes correctly across DST boundary (Spring forward and Fall back in America/New_York)', () => {
      // Spring forward occurred on Sunday March 8, 2026 (EST UTC-5 -> EDT UTC-4)
      // Test Saturday March 7, 2026: 8:00 AM EST is 13:00 UTC
      const satBeforeDst = new Date('2026-03-07T13:30:00.000Z');
      const resBefore = computeMarketClock(testMarket, satBeforeDst);
      assert.equal(resBefore.openNow, true);
      assert.equal(resBefore.todayWindow.opensAt, '08:00');

      // Test Friday before DST: nextOpenAt must be 13:00 UTC (EST)
      const friBeforeDst = new Date('2026-03-06T14:00:00.000Z');
      const resFriBefore = computeMarketClock(testMarket, friBeforeDst);
      assert.equal(resFriBefore.nextOpenAt, '2026-03-07T13:00:00.000Z');

      // Test Friday March 13, 2026 (after DST shift): nextOpenAt must be 12:00 UTC (EDT)
      const friAfterDst = new Date('2026-03-13T14:00:00.000Z');
      const resFriAfter = computeMarketClock(testMarket, friAfterDst);
      assert.equal(resFriAfter.nextOpenAt, '2026-03-14T12:00:00.000Z');
      assert.equal(resFriAfter.nextOpenLabel, 'opens tomorrow');
    });
  });

  // ── 2. Unit Tests: Farmer operatingDayNumbers & openToday ──
  describe('Farmer operatingDayNumbers and openToday Unit Tests', () => {
    it('always returns a sorted integer array for operatingDayNumbers, even for malformed data', () => {
      assert.deepEqual(toOperatingDayNumbers(['sat', 'sun']), [0, 6]);
      assert.deepEqual(toOperatingDayNumbers(['wed', 'mon', 'fri']), [1, 3, 5]);
      assert.deepEqual(toOperatingDayNumbers(['Saturday', 'Sunday']), [0, 6]);
      assert.deepEqual(toOperatingDayNumbers([6, 0]), [0, 6]);
      // Malformed inputs
      assert.deepEqual(toOperatingDayNumbers(null), []);
      assert.deepEqual(toOperatingDayNumbers(undefined), []);
      assert.deepEqual(toOperatingDayNumbers('invalid'), []);
      assert.deepEqual(toOperatingDayNumbers(['invalid', null, 99, 'wed']), [3]);
    });

    it('computes openToday deterministically using market timezone', () => {
      // Saturday noon UTC in America/New_York (Saturday morning)
      const satNow = new Date('2026-09-26T14:00:00.000Z');
      assert.equal(computeOpenToday([0, 6], 'America/New_York', satNow), true); // 6 is Saturday
      assert.equal(computeOpenToday([1, 2], 'America/New_York', satNow), false); // Monday, Tuesday
    });
  });

  // ── 3. Unit Tests: generatePickupCode ──
  describe('generatePickupCode Unit Tests', () => {
    it('generates 6-character uppercase codes using only the allowed alphabet', () => {
      const code = generatePickupCode();
      assert.equal(typeof code, 'string');
      assert.equal(code.length, 6);
      for (const char of code) {
        assert.ok(PICKUP_CODE_ALPHABET.includes(char), `Character ${char} should be in alphabet`);
      }

      // Proves confusable characters (I, L, O, 0, 1) are never in the alphabet
      const forbidden = ['I', 'L', 'O', '0', '1'];
      for (const f of forbidden) {
        assert.ok(!PICKUP_CODE_ALPHABET.includes(f), `Forbidden char ${f} should not be in alphabet`);
      }
    });
  });

  // ── 4. Integration Tests: Markets API ──
  describe('Markets Endpoints (GET /api/markets, GET /api/markets/:id)', () => {
    it('GET /api/markets returns clock object on marketCard', async () => {
      const res = await request('/api/markets', {
        headers: { Authorization: `Bearer ${customerAuth.accessToken}` },
      });
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.ok(Array.isArray(body.data));
      const market = body.data[0];
      assert.ok(market.clock, 'Market card must have clock');
      assert.equal(typeof market.clock.openNow, 'boolean');
      assert.ok('todayWindow' in market.clock);
      assert.ok('todayProgress' in market.clock);
      assert.ok('closesAtLabel' in market.clock);
      assert.ok('windowLabel' in market.clock);
      assert.ok('nextOpenLabel' in market.clock);
      assert.ok('nextOpenAt' in market.clock);
    });

    it('GET /api/markets/:id returns clock object on marketDetail', async () => {
      const res = await request(`/api/markets/${elmMarket._id.toString()}`, {
        headers: { Authorization: `Bearer ${customerAuth.accessToken}` },
      });
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.ok(body.data.clock, 'Market detail must have clock');
      assert.equal(typeof body.data.clock.openNow, 'boolean');
    });
  });

  // ── 5. Integration Tests: Farmers API ──
  describe('Farmers Endpoints (GET /api/farmers, GET /api/farmers/:id, GET /api/markets/:id/farmers)', () => {
    it('GET /api/farmers returns operatingDayNumbers, openToday, lowStockCount, soldOutCount', async () => {
      const res = await request('/api/farmers', {
        headers: { Authorization: `Bearer ${customerAuth.accessToken}` },
      });
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.ok(Array.isArray(body.data));
      const farmer = body.data[0];

      assert.ok(Array.isArray(farmer.operatingDays), 'operatingDays must still be present');
      assert.ok(Array.isArray(farmer.operatingDayNumbers), 'operatingDayNumbers must be an array');
      for (const num of farmer.operatingDayNumbers) {
        assert.ok(typeof num === 'number' && num >= 0 && num <= 6);
      }
      assert.equal(typeof farmer.openToday, 'boolean');
      assert.equal(typeof farmer.lowStockCount, 'number');
      assert.equal(typeof farmer.soldOutCount, 'number');
    });

    it('GET /api/farmers/:id returns all new fields on farmerDetail', async () => {
      const res = await request(`/api/farmers/${riverbendFarmer._id.toString()}`, {
        headers: { Authorization: `Bearer ${customerAuth.accessToken}` },
      });
      assert.equal(res.status, 200);
      const body = await res.json();
      const farmer = body.data;

      assert.ok(Array.isArray(farmer.operatingDayNumbers));
      assert.equal(typeof farmer.openToday, 'boolean');
      assert.equal(typeof farmer.lowStockCount, 'number');
      assert.equal(typeof farmer.soldOutCount, 'number');
    });

    it('GET /api/markets/:id/farmers returns all new fields', async () => {
      const res = await request(`/api/markets/${elmMarket._id.toString()}/farmers`, {
        headers: { Authorization: `Bearer ${customerAuth.accessToken}` },
      });
      assert.equal(res.status, 200);
      const body = await res.json();
      const farmer = body.data[0];

      assert.ok(Array.isArray(farmer.operatingDayNumbers));
      assert.equal(typeof farmer.openToday, 'boolean');
      assert.equal(typeof farmer.lowStockCount, 'number');
      assert.equal(typeof farmer.soldOutCount, 'number');
    });
  });

  // ── 6. Integration Tests: Feed Meta ──
  describe('Feed Meta Endpoint (GET /api/feed/meta)', () => {
    it('GET /api/feed/meta carries the clock object for homeMarket', async () => {
      const res = await request('/api/feed/meta', {
        headers: { Authorization: `Bearer ${customerAuth.accessToken}` },
      });
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.ok(body.data.clock, 'Feed meta must carry clock');
      assert.equal(typeof body.data.clock.openNow, 'boolean');
      assert.ok(body.data.greetingName);
      assert.ok(body.data.homeMarket);
      assert.ok(body.data.line);
    });
  });

  // ── 7. Integration Tests: POST /cart/quote ──
  describe('Cart Quoting (POST /api/cart/quote)', () => {
    it('POST /cart/quote with items from two different farmers returns two groups', async () => {
      const res = await request('/api/cart/quote', {
        method: 'POST',
        headers: { Authorization: `Bearer ${customerAuth.accessToken}` },
        body: {
          items: [
            { productId: tomatoesProduct._id.toString(), quantity: 2 },
            { productId: sourdoughProduct._id.toString(), quantity: 1 },
          ],
        },
      });
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.ok(Array.isArray(body.data.groups));
      assert.equal(body.data.groups.length, 2, 'Should group items into two vendor groups');

      for (const group of body.data.groups) {
        assert.ok(group.farmer.id, 'Group farmer must have id');
        assert.ok(group.farmer.stallName, 'Group farmer must have stallName');
        assert.ok(group.farmer.name, 'Group farmer must have name');
        assert.ok(Array.isArray(group.items), 'Group must have items array');
        assert.ok(Array.isArray(group.lines), 'Group must keep lines array');
        assert.ok(Array.isArray(group.pickupWindows), 'Group must have pickupWindows');
        assert.equal(typeof group.subtotalCents, 'number');
        if (group.cutoffAt) {
          assert.ok(group.cutoffLabel, 'Group with cutoffAt must have cutoffLabel');
        }
      }
    });

    it('POST /cart/quote with out-of-stock item returns issues entry with readable message', async () => {
      // Find an out-of-stock or zero-quantity product, or create a temporary one
      let outProd = await db.collection(COLLECTIONS.PRODUCTS).findOne({ availability: 'out' });
      if (!outProd) {
        const insertRes = await db.collection(COLLECTIONS.PRODUCTS).insertOne({
          name: 'Sold out squash',
          farmerId: riverbendFarmer._id,
          categorySlug: 'vegetables',
          priceCents: 400,
          unit: 'each',
          availability: 'out',
          quantityAvailable: 0,
          listed: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        outProd = { _id: insertRes.insertedId, name: 'Sold out squash' };
      }

      const res = await request('/api/cart/quote', {
        method: 'POST',
        headers: { Authorization: `Bearer ${customerAuth.accessToken}` },
        body: {
          items: [{ productId: outProd._id.toString(), quantity: 1 }],
        },
      });
      assert.equal(res.status, 200);
      const body = await res.json();
      const group = body.data.groups[0];
      const issue = group.issues.find((i) => i.code === 'OUT_OF_STOCK');
      assert.ok(issue, 'Must include OUT_OF_STOCK issue in group');
      assert.ok(issue.message.includes('out of stock'), `Expected human-readable message, got: ${issue.message}`);
    });
  });

  // ── 8. Integration Tests: Orders & pickupCode ──
  describe('Order Collection Code (pickupCode)', () => {
    let testOrder;

    it('generates 6-character pickupCode at checkout and returns it', async () => {
      // Find upcoming open slot for riverbend
      const slotsRes = await request(`/api/farmers/${riverbendFarmer._id.toString()}/pickup-slots`, {
        headers: { Authorization: `Bearer ${customerAuth.accessToken}` },
      });
      const slots = (await slotsRes.json()).data;
      const openSlot = slots.find((s) => s.isOpen);
      assert.ok(openSlot, 'Must find open pickup slot for checkout test');

      const idempotencyKey = `idemp-stage3-${Date.now()}`;
      const res = await request('/api/orders/checkout', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${customerAuth.accessToken}`,
          'Idempotency-Key': idempotencyKey,
        },
        body: {
          groups: [
            {
              farmerId: riverbendFarmer._id.toString(),
              slotStart: openSlot.start,
              items: [{ productId: carrotsProduct._id.toString(), quantity: 1 }],
            },
          ],
        },
      });

      assert.equal(res.status, 201);
      const body = await res.json();
      testOrder = body.data.orders[0];
      assert.ok(testOrder.pickupCode, 'Order must have pickupCode');
      assert.equal(testOrder.pickupCode.length, 6);
      for (const char of testOrder.pickupCode) {
        assert.ok(PICKUP_CODE_ALPHABET.includes(char));
      }
    });

    it('pickupCode is stable across two reads of GET /api/orders/:id', async () => {
      const read1 = await request(`/api/orders/${testOrder.id}`, {
        headers: { Authorization: `Bearer ${customerAuth.accessToken}` },
      });
      assert.equal(read1.status, 200);
      const body1 = await read1.json();
      assert.equal(body1.data.pickupCode, testOrder.pickupCode);

      const read2 = await request(`/api/orders/${testOrder.id}`, {
        headers: { Authorization: `Bearer ${customerAuth.accessToken}` },
      });
      assert.equal(read2.status, 200);
      const body2 = await read2.json();
      assert.equal(body2.data.pickupCode, testOrder.pickupCode);
    });

    it('owning Farmer can read the order and sees the matching pickupCode', async () => {
      const res = await request(`/api/farmer/orders/${testOrder.id}`, {
        headers: { Authorization: `Bearer ${farmerAuth.accessToken}` },
      });
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.data.pickupCode, testOrder.pickupCode);
    });

    it('a different Customer cannot read the order (returns 404, no pickupCode leak)', async () => {
      const res = await request(`/api/orders/${testOrder.id}`, {
        headers: { Authorization: `Bearer ${otherCustomerAuth.accessToken}` },
      });
      assert.equal(res.status, 404);
      const body = await res.json();
      assert.equal(body.error.code, 'NOT_FOUND');
      assert.equal(body.data, undefined);
    });
  });
});
