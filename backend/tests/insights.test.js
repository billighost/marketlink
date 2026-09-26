/**
 * Farmer Insights and Overview Test Suite (T4.141 - T4.160)
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';
import { setupTestEnvironment, teardownTestEnvironment, request, loginUser } from './helpers.js';
import { COLLECTIONS } from '../src/db/collections.js';

describe('Farmer Insights and Overview Suite (T4.141 - T4.160)', () => {
  let db;
  let farmerToken = '';
  let farmerDoc = null;
  let emptyFarmerToken = '';
  let emptyFarmerDoc = null;

  before(async () => {
    const env = await setupTestEnvironment();
    db = env.db;

    // Active farmer 1 (Riverbend Farm) with seeded orders
    const farmerRes = await loginUser('riverbend@example.com', 'market123');
    farmerToken = farmerRes.accessToken;
    farmerDoc = await db.collection(COLLECTIONS.FARMERS).findOne({ userId: new ObjectId(farmerRes.user.id) });

    // Empty farmer (no orders)
    const emptyUserId = new ObjectId();
    const emptyEmail = `empty.farmer.${Date.now()}@example.com`;
    emptyFarmerDoc = {
      _id: new ObjectId(),
      userId: emptyUserId,
      stallName: 'Fresh Empty Farm',
      email: emptyEmail,
      marketIds: farmerDoc.marketIds,
      listingEnabled: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await db.collection(COLLECTIONS.USERS).insertOne({
      _id: emptyUserId,
      role: 'farmer',
      name: 'Empty Farmer',
      email: emptyEmail,
      passwordHash: await bcrypt.hash('market123', 1),
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await db.collection(COLLECTIONS.FARMERS).insertOne(emptyFarmerDoc);
    const emptyLogin = await loginUser(emptyEmail, 'market123');
    emptyFarmerToken = emptyLogin.accessToken;
  });

  after(async () => {
    await teardownTestEnvironment();
  });

  it('T4.141: GET /api/farmer/insights numbers match independent plain JS calculation over orders', async () => {
    const res = await request('/api/farmer/insights?range=30d', {
      headers: { Authorization: `Bearer ${farmerToken}` },
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    const data = body.data;

    // Independent calculation
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const allOrders = await db
      .collection(COLLECTIONS.ORDERS)
      .find({
        farmerId: farmerDoc._id,
        createdAt: { $gte: thirtyDaysAgo },
      })
      .toArray();

    const expectedTotal = allOrders.length;
    const completed = allOrders.filter((o) => o.status === 'completed');
    const cancelled = allOrders.filter((o) => o.status === 'cancelled');
    const expectedRevenue = completed.reduce((sum, o) => sum + (o.totalCents || 0), 0);
    const expectedAvg = completed.length > 0 ? Math.round(expectedRevenue / completed.length) : 0;

    const customerCounts = new Map();
    for (const o of allOrders) {
      const cid = o.customerId.toString();
      customerCounts.set(cid, (customerCounts.get(cid) || 0) + 1);
    }
    const expectedRepeat = Array.from(customerCounts.values()).filter((n) => n > 1).length;

    assert.equal(data.totalOrders, expectedTotal);
    assert.equal(data.completedOrders, completed.length);
    assert.equal(data.cancelledOrders, cancelled.length);
    assert.equal(data.revenueCents, expectedRevenue);
    assert.equal(data.averageOrderCents, expectedAvg);
    assert.equal(data.repeatCustomers, expectedRepeat);

    // Verify per-day series
    assert.ok(Array.isArray(data.ordersByDay));
    assert.ok(data.ordersByDay.length >= 30, 'Should have entries for all days in range');
    for (const day of data.ordersByDay) {
      assert.ok(typeof day.date === 'string');
      assert.ok(typeof day.orders === 'number');
      assert.ok(typeof day.revenueCents === 'number');
    }
  });

  it('T4.142: Empty farmer returns zero metrics without errors', async () => {
    const res = await request('/api/farmer/insights?range=30d', {
      headers: { Authorization: `Bearer ${emptyFarmerToken}` },
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    const data = body.data;

    assert.equal(data.totalOrders, 0);
    assert.equal(data.pendingOrders, 0);
    assert.equal(data.completedOrders, 0);
    assert.equal(data.revenueCents, 0);
    assert.equal(data.averageOrderCents, 0);
    assert.equal(data.repeatCustomers, 0);
    assert.deepEqual(data.bestSellers, []);
    assert.ok(data.ordersByDay.length >= 30);
  });

  it('T4.143: GET /api/farmer/overview returns executive dashboard cards', async () => {
    const res = await request('/api/farmer/overview', {
      headers: { Authorization: `Bearer ${farmerToken}` },
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    const data = body.data;

    assert.ok(typeof data.pendingOrders === 'number');
    assert.ok(typeof data.todayPickupsCount === 'number');
    assert.ok(typeof data.lowStockCount === 'number');
    assert.ok(typeof data.ratingAvg === 'number');
    assert.ok(typeof data.ratingCount === 'number');
    assert.ok(Array.isArray(data.recentOrders));
    assert.ok(Array.isArray(data.recentReviews));
  });
});
