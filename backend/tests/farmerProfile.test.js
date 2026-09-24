/**
 * Farmer Profile and Slots Test Suite (T4.001 - T4.030).
 * Tests GET/PATCH profile, validation matrix, stall rename propagation, market updates,
 * slot closures, checkout closure rejection, and concurrent capacity race enforcement.
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';
import { setupTestEnvironment, teardownTestEnvironment, loginUser, request } from './helpers.js';
import { COLLECTIONS } from '../src/db/collections.js';

describe('Farmer Profile and Slots Suite (T4.001 - T4.030)', () => {
  let db;
  let activeFarmerToken = '';
  let pendingFarmerToken = '';
  let suspendedFarmerToken = '';
  let customerToken = '';
  let activeFarmerUserId = '';
  let activeFarmerDoc = null;
  let activeMarket = null;

  before(async () => {
    const env = await setupTestEnvironment();
    db = env.db;

    // Log in seeded roles
    const farmerRes = await loginUser('riverbend@example.com', 'market123');
    activeFarmerToken = farmerRes.accessToken;
    activeFarmerUserId = farmerRes.user.id;

    const pendingRes = await loginUser('pending.farmer@example.com', 'market123');
    pendingFarmerToken = pendingRes.accessToken;

    // To test suspended farmer access-token window: create active farmer, get token, then suspend in DB
    const suspendedUserId = new ObjectId();
    const tempEmail = `temp.suspended.${Date.now()}@example.com`;
    await db.collection(COLLECTIONS.USERS).insertOne({
      _id: suspendedUserId,
      role: 'farmer',
      name: 'To Be Suspended',
      email: tempEmail,
      passwordHash: await bcrypt.hash('market123', 1),
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await db.collection(COLLECTIONS.FARMERS).insertOne({
      _id: new ObjectId(),
      userId: suspendedUserId,
      stallName: 'Temp Stall',
      email: tempEmail,
      listingEnabled: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const tempLoginRes = await loginUser(tempEmail, 'market123');
    suspendedFarmerToken = tempLoginRes.accessToken;
    // Now suspend the user in the database
    await db.collection(COLLECTIONS.USERS).updateOne({ _id: suspendedUserId }, { $set: { status: 'suspended' } });

    const custRes = await loginUser('george@example.com', 'market123');
    customerToken = custRes.accessToken;

    activeFarmerDoc = await db.collection(COLLECTIONS.FARMERS).findOne({ userId: new ObjectId(activeFarmerUserId) });
    activeMarket = await db.collection(COLLECTIONS.MARKETS).findOne({ status: 'active' });
  });

  after(async () => {
    await teardownTestEnvironment();
  });

  // ── T4.001: GET /api/farmer/profile ──
  it('T4.001: GET /api/farmer/profile returns stall profile and status', async () => {
    const res = await request('/api/farmer/profile', {
      headers: { Authorization: `Bearer ${activeFarmerToken}` },
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.ok(body.data);
    assert.equal(body.data.stallName, 'Riverbend Farm');
    assert.equal(body.data.approvalStatus, 'active');
  });

  it('T4.002: Pending farmer can view and edit profile', async () => {
    const getRes = await request('/api/farmer/profile', {
      headers: { Authorization: `Bearer ${pendingFarmerToken}` },
    });
    assert.equal(getRes.status, 200);
    const getBody = await getRes.json();
    assert.equal(getBody.data.approvalStatus, 'pending');

    const patchRes = await request('/api/farmer/profile', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${pendingFarmerToken}` },
      body: { story: 'Updated pending story for market permit inspection.' },
    });
    assert.equal(patchRes.status, 200);
    const patchBody = await patchRes.json();
    assert.equal(patchBody.data.story, 'Updated pending story for market permit inspection.');
  });

  it('T4.003: Suspended farmer cannot edit profile (403 ACCOUNT_SUSPENDED)', async () => {
    const res = await request('/api/farmer/profile', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${suspendedFarmerToken}` },
      body: { story: 'Trying to update suspended profile.' },
    });
    assert.equal(res.status, 403);
    const body = await res.json();
    assert.equal(body.error.code, 'ACCOUNT_SUSPENDED');
  });

  it('T4.004: Customer receives 403 FORBIDDEN on /api/farmer/profile', async () => {
    const res = await request('/api/farmer/profile', {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    assert.equal(res.status, 403);
  });

  it('T4.005: Unauthenticated request receives 401', async () => {
    const res = await request('/api/farmer/profile');
    assert.equal(res.status, 401);
  });

  it('T4.006: Validation rules: unknown fields and empty body rejected with 422', async () => {
    const emptyRes = await request('/api/farmer/profile', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${activeFarmerToken}` },
      body: {},
    });
    assert.equal(emptyRes.status, 422);

    const unknownRes = await request('/api/farmer/profile', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${activeFarmerToken}` },
      body: { nonExistentField: 'malicious', stallName: 'Riverbend Farm' },
    });
    assert.equal(unknownRes.status, 422);
  });

  it('T4.007: Validation rules: invalid field values rejected with 422', async () => {
    // stallName too short
    const shortName = await request('/api/farmer/profile', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${activeFarmerToken}` },
      body: { stallName: 'A' },
    });
    assert.equal(shortName.status, 422);

    // since out of range
    const invalidSince = await request('/api/farmer/profile', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${activeFarmerToken}` },
      body: { since: 1850 },
    });
    assert.equal(invalidSince.status, 422);

    // cutoffMinutesBefore out of range (<30)
    const lowCutoff = await request('/api/farmer/profile', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${activeFarmerToken}` },
      body: { cutoffMinutesBefore: 10 },
    });
    assert.equal(lowCutoff.status, 422);

    // maxOrdersPerSlot out of range (>200)
    const highCapacity = await request('/api/farmer/profile', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${activeFarmerToken}` },
      body: { maxOrdersPerSlot: 500 },
    });
    assert.equal(highCapacity.status, 422);

    // non-existent imageUrl
    const fakeImg = await request('/api/farmer/profile', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${activeFarmerToken}` },
      body: { imageUrl: '/uploads/nonexistent_image_file.jpg' },
    });
    assert.equal(fakeImg.status, 422);

    // inactive or non-existent marketId
    const fakeMarket = await request('/api/farmer/profile', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${activeFarmerToken}` },
      body: { marketIds: [new ObjectId().toString()] },
    });
    assert.equal(fakeMarket.status, 422);
  });

  it('T4.008: Pickup windows validation: overlapping windows and outside operatingDays rejected', async () => {
    // Window outside operating days
    const outsideRes = await request('/api/farmer/profile', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${activeFarmerToken}` },
      body: {
        operatingDays: ['sat'],
        pickupWindows: [{ day: 'sun', startMin: 480, endMin: 720 }],
      },
    });
    assert.equal(outsideRes.status, 422);

    // Overlapping windows on the same day
    const overlapRes = await request('/api/farmer/profile', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${activeFarmerToken}` },
      body: {
        operatingDays: ['sat'],
        pickupWindows: [
          { day: 'sat', startMin: 480, endMin: 600 },
          { day: 'sat', startMin: 540, endMin: 720 },
        ],
      },
    });
    assert.equal(overlapRes.status, 422);

    // Window duration < 30 minutes
    const shortWin = await request('/api/farmer/profile', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${activeFarmerToken}` },
      body: {
        operatingDays: ['sat'],
        pickupWindows: [{ day: 'sat', startMin: 480, endMin: 495 }],
      },
    });
    assert.equal(shortWin.status, 422);
  });

  it('T4.009: Renaming stall propagates denormalised snapshot to products', async () => {
    const newName = 'Riverbend Organic Farmstead';
    const patchRes = await request('/api/farmer/profile', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${activeFarmerToken}` },
      body: { stallName: newName, stallNumber: 'Stall 4A' },
    });
    assert.equal(patchRes.status, 200);

    // Assert that products of this farmer have updated snapshots
    const farmerProducts = await db
      .collection(COLLECTIONS.PRODUCTS)
      .find({ farmerId: activeFarmerDoc._id })
      .limit(3)
      .toArray();

    assert.ok(farmerProducts.length >= 3);
    for (const p of farmerProducts) {
      assert.equal(p.farmer.stallName, newName);
      assert.equal(p.farmer.stallNumber, 'Stall 4A');
    }

    // Restore stall name
    await request('/api/farmer/profile', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${activeFarmerToken}` },
      body: { stallName: 'Riverbend Farm', stallNumber: 'Stall 4' },
    });
  });

  it('T4.010: Changing markets updates products.marketIds and markets.farmerCount', async () => {
    const markets = await db.collection(COLLECTIONS.MARKETS).find({ status: 'active' }).toArray();
    assert.ok(markets.length >= 2);

    const currentMarketIds = (activeFarmerDoc.marketIds || []).map((id) => id.toString());
    const m1 = markets.find((m) => currentMarketIds.includes(m._id.toString())) || markets[0];
    const m2 = markets.find((m) => !currentMarketIds.includes(m._id.toString())) || markets[1];
    const initialM2Count = m2.farmerCount;

    // Farmer updates marketIds to include m2
    const patchRes = await request('/api/farmer/profile', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${activeFarmerToken}` },
      body: { marketIds: [m1._id.toString(), m2._id.toString()] },
    });
    assert.equal(patchRes.status, 200);

    const m2After = await db.collection(COLLECTIONS.MARKETS).findOne({ _id: m2._id });
    assert.equal(m2After.farmerCount, initialM2Count + 1);

    const prods = await db.collection(COLLECTIONS.PRODUCTS).find({ farmerId: activeFarmerDoc._id }).toArray();
    for (const p of prods) {
      assert.ok(p.marketIds.some((id) => id.toString() === m2._id.toString()));
    }

    // Remove m2
    await request('/api/farmer/profile', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${activeFarmerToken}` },
      body: { marketIds: [m1._id.toString()] },
    });
    const m2Restored = await db.collection(COLLECTIONS.MARKETS).findOne({ _id: m2._id });
    assert.equal(m2Restored.farmerCount, initialM2Count);
  });

  // ── Slots & Closures ──
  it('T4.011: GET /api/farmer/slots returns upcoming slots with capacity and order counts', async () => {
    const res = await request('/api/farmer/slots?days=14', {
      headers: { Authorization: `Bearer ${activeFarmerToken}` },
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.ok(Array.isArray(body.data));
    assert.ok(body.data.length > 0);
    const slot = body.data[0];
    assert.ok(slot.start);
    assert.ok(slot.end);
    assert.ok(typeof slot.capacity === 'number');
    assert.ok(typeof slot.ordersCount === 'number');
    assert.ok(typeof slot.closed === 'boolean');
  });

  it('T4.012: PUT /api/farmer/slots/closures marks dates closed, hides them from customer endpoints, and DELETE reopens', async () => {
    // 1. Get next slot date
    const slotsRes = await request('/api/farmer/slots?days=14', {
      headers: { Authorization: `Bearer ${activeFarmerToken}` },
    });
    const slotsBody = await slotsRes.json();
    const targetSlot = slotsBody.data[0];
    const targetDate = targetSlot.start.slice(0, 10); // YYYY-MM-DD

    // 2. Put closure on that date
    const closeRes = await request('/api/farmer/slots/closures', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${activeFarmerToken}` },
      body: { dates: [targetDate], reason: 'Family wedding' },
    });
    assert.equal(closeRes.status, 200);
    const closeBody = await closeRes.json();
    assert.ok(closeBody.data.slotOverrides.some((ov) => ov.date === targetDate && ov.closed));

    // 3. Customer pickup slots endpoint must hide this date
    const custSlotsRes = await request(`/api/farmers/${activeFarmerDoc._id.toString()}/pickup-slots`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    assert.equal(custSlotsRes.status, 200);
    const custSlotsBody = await custSlotsRes.json();
    assert.ok(
      !custSlotsBody.data.some((s) => s.start.startsWith(targetDate)),
      'Closed date must not appear in customer pickup slots'
    );

    // 4. Checkout attempt for this closed slot must fail
    const p = await db.collection(COLLECTIONS.PRODUCTS).findOne({ farmerId: activeFarmerDoc._id, listed: true, quantityAvailable: { $gt: 5 } });
    assert.ok(p);

    const checkoutRes = await request('/api/orders/checkout', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${customerToken}`,
        'Idempotency-Key': `closure-test-${Date.now()}`,
      },
      body: {
        groups: [
          {
            farmerId: activeFarmerDoc._id.toString(),
            slotStart: targetSlot.start,
            items: [{ productId: p._id.toString(), quantity: 1 }],
          },
        ],
      },
    });
    assert.equal(checkoutRes.status, 409);

    // 5. Reopen the date via DELETE
    const delRes = await request(`/api/farmer/slots/closures/${targetDate}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${activeFarmerToken}` },
    });
    assert.equal(delRes.status, 200);

    // Customer slots should show the date again
    const reopenedSlotsRes = await request(`/api/farmers/${activeFarmerDoc._id.toString()}/pickup-slots`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    assert.equal(reopenedSlotsRes.status, 200);
    const reopenedBody = await reopenedSlotsRes.json();
    assert.ok(
      reopenedBody.data.some((s) => s.start.startsWith(targetDate)),
      'Reopened date must reappear in customer pickup slots'
    );
  });

  it('T4.013: Capacity enforced under a race (capacity 3, 10 parallel checkouts, exactly 3 succeed)', async () => {
    // Set farmer maxOrdersPerSlot = 3
    await db.collection(COLLECTIONS.FARMERS).updateOne(
      { _id: activeFarmerDoc._id },
      { $set: { maxOrdersPerSlot: 3 } }
    );

    // Find an open slot
    const slotsRes = await request('/api/farmer/slots?days=14', {
      headers: { Authorization: `Bearer ${activeFarmerToken}` },
    });
    const slotsBody = await slotsRes.json();
    const openSlot = slotsBody.data.find((s) => s.isOpen && !s.closed);
    assert.ok(openSlot, 'Must have at least one open slot');

    const slotKey = `${activeFarmerDoc._id.toString()}|${openSlot.start}`;

    // Clear any existing orders or counter for this slotKey to start fresh from 0
    await db.collection(COLLECTIONS.ORDERS).deleteMany({ slotKey });
    await db.collection(COLLECTIONS.COUNTERS).deleteOne({ _id: `slot:${slotKey}` });

    // Ensure product has plenty of stock
    const prod = await db.collection(COLLECTIONS.PRODUCTS).findOne({ farmerId: activeFarmerDoc._id, listed: true });
    assert.ok(prod);
    await db.collection(COLLECTIONS.PRODUCTS).updateOne(
      { _id: prod._id },
      { $set: { quantityAvailable: 100, availability: 'in' } }
    );

    // Launch 10 parallel checkout requests
    const parallelRequests = [];
    for (let i = 0; i < 10; i++) {
      const idempotencyKey = `race-capacity-${i}-${Date.now()}`;
      parallelRequests.push(
        request('/api/orders/checkout', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${customerToken}`,
            'Idempotency-Key': idempotencyKey,
          },
          body: {
            groups: [
              {
                farmerId: activeFarmerDoc._id.toString(),
                slotStart: openSlot.start,
                items: [{ productId: prod._id.toString(), quantity: 1 }],
              },
            ],
          },
        })
      );
    }

    const results = await Promise.all(parallelRequests);
    const statuses = await Promise.all(results.map((r) => r.status));

    const succeeded = statuses.filter((s) => s === 201).length;
    const slotFull = statuses.filter((s) => s === 409).length;

    assert.equal(succeeded, 3, `Expected exactly 3 checkouts to succeed, got ${succeeded}`);
    assert.equal(slotFull, 7, `Expected exactly 7 checkouts to fail with 409, got ${slotFull}`);

    // Verify database active orders count is exactly 3
    const activeOrdersCount = await db.collection(COLLECTIONS.ORDERS).countDocuments({
      slotKey,
      status: { $in: ['placed', 'accepted', 'ready'] },
    });
    assert.equal(activeOrdersCount, 3);

    // Restore farmer capacity to 30
    await db.collection(COLLECTIONS.FARMERS).updateOne(
      { _id: activeFarmerDoc._id },
      { $set: { maxOrdersPerSlot: 30 } }
    );
  });
});
