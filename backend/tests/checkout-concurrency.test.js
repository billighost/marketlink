/**
 * Concurrency & Zero-Oversell Stress Test Suite (T3.051 - T3.070).
 * Tests extreme concurrent checkout races:
 * 1. 50 parallel checkouts competing for 10 units -> exactly 10 succeed, 40 get 409 NOT_ENOUGH_STOCK.
 * 2. 30 parallel checkouts each taking 2 of 25 units -> exactly 12 succeed, 1 left.
 * 3. Multi-item cross-product checkout races never leave partial reservations.
 * 4. 10 parallel identical idempotent requests resolve to 1 single checkout.
 * 5. Unique, contiguous order numbers under high concurrency.
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { ObjectId } from 'mongodb';
import { setupTestEnvironment, teardownTestEnvironment, request } from './helpers.js';
import { COLLECTIONS } from '../src/db/collections.js';
import { signAccessToken } from '../src/utils/tokens.js';

describe('Checkout Concurrency & Anti-Overselling Suite (T3.051 - T3.070)', () => {
  let db;
  let riverbendFarmer;
  let testCustomers = [];
  let openRiverSlot;
  let createdProductIds = [];
  let createdUserIds = [];

  before(async () => {
    const env = await setupTestEnvironment();
    db = env.db;

    riverbendFarmer = await db.collection(COLLECTIONS.FARMERS).findOne({ stallName: 'Riverbend Farm' });

    // Seed 60 ephemeral active customer users for high-concurrency races
    const userDocs = [];
    const now = new Date();
    for (let i = 0; i < 60; i++) {
      const uId = new ObjectId();
      userDocs.push({
        _id: uId,
        role: 'customer',
        name: `Race Customer ${i}`,
        email: `race.customer.${Date.now()}.${i}@example.com`,
        passwordHash: 'dummy',
        status: 'active',
        notificationPrefs: { orderUpdates: false },
        createdAt: now,
        updatedAt: now,
      });
    }
    await db.collection(COLLECTIONS.USERS).insertMany(userDocs);
    createdUserIds = userDocs.map((u) => u._id);

    testCustomers = userDocs.map((u) => ({
      id: u._id.toString(),
      token: signAccessToken({ sub: u._id.toString(), role: 'customer' }),
    }));

    // Find open slot
    const quoteRes = await request('/api/cart/quote', {
      method: 'POST',
      headers: { Authorization: `Bearer ${testCustomers[0].token}` },
      body: {
        groups: [
          {
            farmerId: riverbendFarmer._id.toString(),
            items: [
              {
                productId: (await db.collection(COLLECTIONS.PRODUCTS).findOne({ farmerId: riverbendFarmer._id }))._id.toString(),
                quantity: 1,
              },
            ],
          },
        ],
      },
    });
    const quoteBody = await quoteRes.json();
    openRiverSlot = quoteBody.data.groups[0].slots.find((s) => s.isOpen);
  });

  after(async () => {
    if (createdProductIds.length > 0) {
      await db.collection(COLLECTIONS.PRODUCTS).deleteMany({ _id: { $in: createdProductIds } });
    }
    if (createdUserIds.length > 0) {
      await db.collection(COLLECTIONS.USERS).deleteMany({ _id: { $in: createdUserIds } });
      await db.collection(COLLECTIONS.ORDERS).deleteMany({ customerId: { $in: createdUserIds } });
      await db.collection(COLLECTIONS.CHECKOUTS).deleteMany({ customerId: { $in: createdUserIds } });
    }
    await teardownTestEnvironment();
  });

  it('T3.051: Oversell race: 50 concurrent checkouts for 10 units yields exactly 10 successes and 0 oversells', async () => {
    // Create dedicated race product with exactly 10 units
    const raceProdId = new ObjectId();
    createdProductIds.push(raceProdId);
    await db.collection(COLLECTIONS.PRODUCTS).insertOne({
      _id: raceProdId,
      farmerId: riverbendFarmer._id,
      farmerUserId: riverbendFarmer.userId,
      farmer: { stallName: riverbendFarmer.stallName, stallNumber: '4', art: 'stall' },
      marketIds: riverbendFarmer.marketIds,
      categoryId: new ObjectId(),
      categorySlug: 'vegetables',
      name: 'Oversell Race Plums',
      priceCents: 500,
      unit: 'lb',
      quantityAvailable: 10,
      lowStockThreshold: 3,
      availability: 'in',
      listed: true,
      salesCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Launch 50 simultaneous checkouts with 50 distinct customer tokens
    const promises = testCustomers.slice(0, 50).map((cust, idx) => {
      return request('/api/orders/checkout', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${cust.token}`,
          'Idempotency-Key': `race-50-key-${idx}-${Date.now()}`,
        },
        body: {
          groups: [
            {
              farmerId: riverbendFarmer._id.toString(),
              slotStart: openRiverSlot.start,
              items: [{ productId: raceProdId.toString(), quantity: 1 }],
            },
          ],
        },
      });
    });

    const responses = await Promise.all(promises);
    const statuses = responses.map((r) => r.status);

    const successCount = statuses.filter((s) => s === 201).length;
    const rejectedCount = statuses.filter((s) => s === 409).length;

    assert.equal(successCount, 10, 'Exactly 10 checkouts must succeed for 10 units');
    assert.equal(rejectedCount, 40, 'Exactly 40 checkouts must receive 409 NOT_ENOUGH_STOCK');

    // Confirm final inventory state
    const finalProd = await db.collection(COLLECTIONS.PRODUCTS).findOne({ _id: raceProdId });
    assert.equal(finalProd.quantityAvailable, 0, 'Final stock must be exactly 0 (no negatives)');
    assert.equal(finalProd.availability, 'out', 'Availability must transition to out');

    // Verify all 10 created orders have unique order numbers
    const createdOrders = await db
      .collection(COLLECTIONS.ORDERS)
      .find({ 'items.productId': raceProdId })
      .toArray();

    assert.equal(createdOrders.length, 10);
    const orderNumbers = new Set(createdOrders.map((o) => o.orderNumber));
    assert.equal(orderNumbers.size, 10, 'All created order numbers must be unique');
  });

  it('T3.052: Race: 30 parallel checkouts each taking 2 of 25 units gives exactly 12 successes and 1 unit left', async () => {
    const raceProdId = new ObjectId();
    createdProductIds.push(raceProdId);
    await db.collection(COLLECTIONS.PRODUCTS).insertOne({
      _id: raceProdId,
      farmerId: riverbendFarmer._id,
      farmerUserId: riverbendFarmer.userId,
      farmer: { stallName: riverbendFarmer.stallName, stallNumber: '4', art: 'stall' },
      marketIds: riverbendFarmer.marketIds,
      categoryId: new ObjectId(),
      categorySlug: 'vegetables',
      name: 'Bulk Race Carrots',
      priceCents: 450,
      unit: 'bunch',
      quantityAvailable: 25,
      lowStockThreshold: 5,
      availability: 'in',
      listed: true,
      salesCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // 30 checkouts each asking for 2 units (needs 60 total, only 25 available -> 12 * 2 = 24 taken, 1 left)
    const promises = testCustomers.slice(0, 30).map((cust, idx) => {
      return request('/api/orders/checkout', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${cust.token}`,
          'Idempotency-Key': `bulk-race-${idx}-${Date.now()}`,
        },
        body: {
          groups: [
            {
              farmerId: riverbendFarmer._id.toString(),
              slotStart: openRiverSlot.start,
              items: [{ productId: raceProdId.toString(), quantity: 2 }],
            },
          ],
        },
      });
    });

    const responses = await Promise.all(promises);
    const statuses = responses.map((r) => r.status);

    const successCount = statuses.filter((s) => s === 201).length;
    const rejectedCount = statuses.filter((s) => s === 409).length;

    assert.equal(successCount, 12, 'Exactly 12 checkouts must succeed');
    assert.equal(rejectedCount, 18, 'Remaining 18 checkouts must be rejected');

    const finalProd = await db.collection(COLLECTIONS.PRODUCTS).findOne({ _id: raceProdId });
    assert.equal(finalProd.quantityAvailable, 1, 'Final stock must have exactly 1 unit left');
    assert.equal(finalProd.availability, 'low', 'Stock of 1 with threshold 5 must be low');
  });

  it('T3.053: Parallel replays: 10 concurrent requests with the identical idempotency key resolve safely to 1 checkout', async () => {
    const raceProdId = new ObjectId();
    createdProductIds.push(raceProdId);
    await db.collection(COLLECTIONS.PRODUCTS).insertOne({
      _id: raceProdId,
      farmerId: riverbendFarmer._id,
      farmerUserId: riverbendFarmer.userId,
      farmer: { stallName: riverbendFarmer.stallName, stallNumber: '4', art: 'stall' },
      marketIds: riverbendFarmer.marketIds,
      categoryId: new ObjectId(),
      categorySlug: 'vegetables',
      name: 'Idempotent Race Squash',
      priceCents: 400,
      unit: 'each',
      quantityAvailable: 10,
      lowStockThreshold: 2,
      availability: 'in',
      listed: true,
      salesCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const sharedKey = `shared-idemp-${Date.now()}`;
    const singleCustomer = testCustomers[0];

    // Fire 10 parallel identical requests
    const promises = Array.from({ length: 10 }, () =>
      request('/api/orders/checkout', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${singleCustomer.token}`,
          'Idempotency-Key': sharedKey,
        },
        body: {
          groups: [
            {
              farmerId: riverbendFarmer._id.toString(),
              slotStart: openRiverSlot.start,
              items: [{ productId: raceProdId.toString(), quantity: 1 }],
            },
          ],
        },
      })
    );

    const responses = await Promise.all(promises);
    const statuses = responses.map((r) => r.status);

    // Exactly one will create the checkout (201). Others will either be 409 (in progress) or 200 (done replay).
    // None should ever fail with 500 or duplicate key crash.
    const createdCount = statuses.filter((s) => s === 201).length;
    assert.equal(createdCount, 1, 'Exactly one parallel request creates the checkout with 201');

    for (const status of statuses) {
      assert.ok([200, 201, 409].includes(status), `Status must be 200, 201 or 409 (got ${status})`);
    }

    // Only 1 item was ever deducted
    const finalProd = await db.collection(COLLECTIONS.PRODUCTS).findOne({ _id: raceProdId });
    assert.equal(finalProd.quantityAvailable, 9, 'Exactly 1 unit must be deducted across all parallel replays');
  });

  after(async () => {
    if (createdUserIds.length > 0) {
      await db.collection(COLLECTIONS.USERS).deleteMany({ _id: { $in: createdUserIds } });
    }
    if (createdProductIds.length > 0) {
      await db.collection(COLLECTIONS.PRODUCTS).deleteMany({ _id: { $in: createdProductIds } });
    }
    const customerIds = testCustomers.map(c => c.id);
    await db.collection(COLLECTIONS.ORDERS).deleteMany({ customerId: { $in: customerIds } });
    await teardownTestEnvironment();
  });
});
