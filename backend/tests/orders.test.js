/**
 * Customer Orders lifecycle integration test suite (T3.071 - T3.110).
 * Tests tabbed list pagination, detail isolation (404 on IDOR), delta stock modifications,
 * cancelation permissions and cutoff enforcement, and reorder preview.
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { ObjectId } from 'mongodb';
import { setupTestEnvironment, teardownTestEnvironment, request, loginUser } from './helpers.js';
import { COLLECTIONS } from '../src/db/collections.js';
import { transitionOrder } from '../src/modules/orders/orderStateMachine.js';

describe('Customer Orders Suite (T3.071 - T3.110)', () => {
  let db;
  let customerGeorgeAuth;
  let customerMiaAuth;
  let farmerRiverbendAuth;
  let riverbendFarmer;
  let carrotsProduct;
  let tomatoesProduct;
  let testOrderGeorge;

  before(async () => {
    const env = await setupTestEnvironment();
    db = env.db;

    customerGeorgeAuth = await loginUser('george@example.com', 'market123');
    customerMiaAuth = await loginUser('mia@example.com', 'market123');
    farmerRiverbendAuth = await loginUser('riverbend@example.com', 'market123');

    riverbendFarmer = await db.collection(COLLECTIONS.FARMERS).findOne({ stallName: 'Riverbend Farm' });
    carrotsProduct = await db.collection(COLLECTIONS.PRODUCTS).findOne({ name: 'Rainbow carrots' });
    tomatoesProduct = await db.collection(COLLECTIONS.PRODUCTS).findOne({ name: 'Heirloom tomatoes' });

    // Find George's seeded placed order (Order 3: ML-1043)
    testOrderGeorge = await db.collection(COLLECTIONS.ORDERS).findOne({
      customerId: toObjectId(customerGeorgeAuth.user.id),
      status: 'placed',
    });
  });

  const createdOrderIds = [];

  after(async () => {
    if (createdOrderIds.length > 0) {
      await db.collection(COLLECTIONS.ORDERS).deleteMany({ _id: { $in: createdOrderIds } });
    }
    await teardownTestEnvironment();
  });

  function toObjectId(id) {
    return typeof id === 'string' ? new ObjectId(id) : id;
  }

  it('T3.071: GET /api/orders?tab=active returns active order summaries', async () => {
    const res = await request('/api/orders?tab=active&limit=10', {
      headers: { Authorization: `Bearer ${customerGeorgeAuth.accessToken}` },
    });

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.ok(Array.isArray(body.data));
    assert.ok(body.data.length > 0);

    const first = body.data[0];
    assert.ok(first.orderNumber);
    assert.ok(['placed', 'accepted', 'ready'].includes(first.status));
    assert.ok(first.farmer.stallName);
    assert.ok(first.pickup.label);
    assert.ok(first.itemsPreview);
    assert.equal(typeof first.canModify, 'boolean');
  });

  it('T3.072: GET /api/orders?tab=past returns past order summaries', async () => {
    const res = await request('/api/orders?tab=past&limit=5', {
      headers: { Authorization: `Bearer ${customerGeorgeAuth.accessToken}` },
    });

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.ok(Array.isArray(body.data));
    assert.ok(body.data.length > 0);

    for (const ord of body.data) {
      assert.ok(['completed', 'cancelled', 'declined'].includes(ord.status));
    }
  });

  it('T3.073: GET /api/orders pagination: cursor pagination navigates active orders without duplicates', async () => {
    const res1 = await request('/api/orders?tab=active&limit=1', {
      headers: { Authorization: `Bearer ${customerGeorgeAuth.accessToken}` },
    });
    const body1 = await res1.json();
    assert.equal(body1.data.length, 1);
    assert.ok(body1.meta.nextCursor);

    const res2 = await request(`/api/orders?tab=active&limit=1&cursor=${encodeURIComponent(body1.meta.nextCursor)}`, {
      headers: { Authorization: `Bearer ${customerGeorgeAuth.accessToken}` },
    });
    const body2 = await res2.json();
    assert.equal(body2.data.length, 1);
    assert.notEqual(body1.data[0].id, body2.data[0].id);
  });

  it('T3.074: IDOR isolation: customer Mia requesting George order receives 404', async () => {
    const res = await request(`/api/orders/${testOrderGeorge._id}`, {
      headers: { Authorization: `Bearer ${customerMiaAuth.accessToken}` },
    });

    assert.equal(res.status, 404);
    const body = await res.json();
    assert.equal(body.error.code, 'NOT_FOUND');
  });

  it('T3.075: GET /api/orders/:id returns full orderDetail for owner', async () => {
    const res = await request(`/api/orders/${testOrderGeorge._id}`, {
      headers: { Authorization: `Bearer ${customerGeorgeAuth.accessToken}` },
    });

    assert.equal(res.status, 200);
    const body = await res.json();
    const d = body.data;
    assert.equal(d.id, testOrderGeorge._id.toString());
    assert.equal(d.orderNumber, testOrderGeorge.orderNumber);
    assert.ok(Array.isArray(d.items));
    assert.ok(Array.isArray(d.timeline));
    assert.ok(d.market);
    assert.ok(d.market.directionsUrls);
    assert.equal(typeof d.canCancel, 'boolean');
    assert.equal(typeof d.canModify, 'boolean');
  });

  it('T3.076: PATCH /api/orders/:id adjusts quantities (increase & decrease delta)', async () => {
    // Create dedicated placed order with 2 carrots (450c) and 2 tomatoes (450c)
    const now = new Date();
    const prodCarrots = await db.collection(COLLECTIONS.PRODUCTS).findOne({ _id: carrotsProduct._id });
    const stockCarrotsBefore = prodCarrots.quantityAvailable;

    const orderDoc = {
      _id: new ObjectId(),
      orderNumber: `ML-MOD-${Date.now()}`,
      checkoutId: new ObjectId().toString(),
      customerId: toObjectId(customerGeorgeAuth.user.id),
      customerName: 'George Adams',
      farmerId: riverbendFarmer._id,
      farmerUserId: riverbendFarmer.userId,
      farmerName: riverbendFarmer.stallName,
      marketId: riverbendFarmer.marketIds[0],
      items: [
        {
          productId: carrotsProduct._id,
          name: carrotsProduct.name,
          unit: carrotsProduct.unit,
          priceCents: 450,
          quantity: 2,
          lineTotalCents: 900,
          art: carrotsProduct.art,
        },
        {
          productId: tomatoesProduct._id,
          name: tomatoesProduct.name,
          unit: tomatoesProduct.unit,
          priceCents: 450,
          quantity: 2,
          lineTotalCents: 900,
          art: tomatoesProduct.art,
        },
      ],
      subtotalCents: 1800,
      totalCents: 1800,
      status: 'placed',
      pickup: {
        start: new Date(now.getTime() + 48 * 3600000),
        end: new Date(now.getTime() + 50 * 3600000),
        stallNumber: '4',
      },
      cutoffAt: new Date(now.getTime() + 24 * 3600000),
      timeline: [{ status: 'placed', at: now, byRole: 'customer' }],
      reviewed: false,
      slotKey: `${riverbendFarmer._id}|${new Date(now.getTime() + 48 * 3600000).toISOString()}`,
      createdAt: now,
      updatedAt: now,
    };
    createdOrderIds.push(orderDoc._id);
    await db.collection(COLLECTIONS.ORDERS).insertOne(orderDoc);

    // Patch: carrots +1 (from 2 to 3), tomatoes -1 (from 2 to 1)
    const patchRes = await request(`/api/orders/${orderDoc._id}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${customerGeorgeAuth.accessToken}` },
      body: {
        items: [
          { productId: carrotsProduct._id.toString(), quantity: 3 },
          { productId: tomatoesProduct._id.toString(), quantity: 1 },
        ],
        note: 'Updated note from customer',
      },
    });

    assert.equal(patchRes.status, 200);
    const patchBody = await patchRes.json();
    assert.equal(patchBody.data.note, 'Updated note from customer');
    assert.equal(patchBody.data.items.find((i) => i.productId === carrotsProduct._id.toString()).quantity, 3);
    assert.equal(patchBody.data.items.find((i) => i.productId === tomatoesProduct._id.toString()).quantity, 1);
    assert.equal(patchBody.data.totalCents, 450 * 3 + 450 * 1);

    // Carrots stock was decremented by 1
    const prodCarrotsAfter = await db.collection(COLLECTIONS.PRODUCTS).findOne({ _id: carrotsProduct._id });
    assert.equal(prodCarrotsAfter.quantityAvailable, stockCarrotsBefore - 1);
  });

  it('T3.077: PATCH /api/orders/:id removing all items returns 409 USE_CANCEL', async () => {
    const now = new Date();
    const orderDoc = {
      _id: new ObjectId(),
      orderNumber: `ML-MOD-EMPTY-${Date.now()}`,
      checkoutId: new ObjectId().toString(),
      customerId: toObjectId(customerGeorgeAuth.user.id),
      customerName: 'George Adams',
      farmerId: riverbendFarmer._id,
      farmerUserId: riverbendFarmer.userId,
      farmerName: riverbendFarmer.stallName,
      marketId: riverbendFarmer.marketIds[0],
      items: [
        {
          productId: carrotsProduct._id,
          name: carrotsProduct.name,
          unit: carrotsProduct.unit,
          priceCents: 450,
          quantity: 2,
          lineTotalCents: 900,
          art: carrotsProduct.art,
        },
      ],
      subtotalCents: 900,
      totalCents: 900,
      status: 'placed',
      pickup: {
        start: new Date(now.getTime() + 48 * 3600000),
        end: new Date(now.getTime() + 50 * 3600000),
        stallNumber: '4',
      },
      cutoffAt: new Date(now.getTime() + 24 * 3600000),
      timeline: [{ status: 'placed', at: now, byRole: 'customer' }],
      reviewed: false,
      slotKey: `${riverbendFarmer._id}|${new Date(now.getTime() + 48 * 3600000).toISOString()}`,
      createdAt: now,
      updatedAt: now,
    };
    createdOrderIds.push(orderDoc._id);
    await db.collection(COLLECTIONS.ORDERS).insertOne(orderDoc);

    const res = await request(`/api/orders/${orderDoc._id}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${customerGeorgeAuth.accessToken}` },
      body: {
        items: [{ productId: carrotsProduct._id.toString(), quantity: 0 }],
      },
    });

    assert.equal(res.status, 409);
    const body = await res.json();
    assert.equal(body.error.code, 'USE_CANCEL');
  });

  it('T3.078: PATCH /api/orders/:id adding new products is rejected (422)', async () => {
    const res = await request(`/api/orders/${testOrderGeorge._id}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${customerGeorgeAuth.accessToken}` },
      body: {
        items: [
          { productId: carrotsProduct._id.toString(), quantity: 1 },
          { productId: new ObjectId().toString(), quantity: 1 },
        ],
      },
    });

    assert.equal(res.status, 422);
  });

  it('T3.079: POST /api/orders/:id/cancel cancels placed order and restores stock', async () => {
    const now = new Date();
    const carrotsBefore = await db.collection(COLLECTIONS.PRODUCTS).findOne({ _id: carrotsProduct._id });
    const stockBefore = carrotsBefore.quantityAvailable;

    const orderDoc = {
      _id: new ObjectId(),
      orderNumber: `ML-CANCEL-${Date.now()}`,
      checkoutId: new ObjectId().toString(),
      customerId: toObjectId(customerGeorgeAuth.user.id),
      customerName: 'George Adams',
      farmerId: riverbendFarmer._id,
      farmerUserId: riverbendFarmer.userId,
      farmerName: riverbendFarmer.stallName,
      marketId: riverbendFarmer.marketIds[0],
      items: [
        {
          productId: carrotsProduct._id,
          name: carrotsProduct.name,
          unit: carrotsProduct.unit,
          priceCents: 450,
          quantity: 3,
          lineTotalCents: 1350,
          art: carrotsProduct.art,
        },
      ],
      subtotalCents: 1350,
      totalCents: 1350,
      status: 'placed',
      pickup: {
        start: new Date(now.getTime() + 48 * 3600000),
        end: new Date(now.getTime() + 50 * 3600000),
        stallNumber: '4',
      },
      cutoffAt: new Date(now.getTime() + 24 * 3600000),
      timeline: [{ status: 'placed', at: now, byRole: 'customer' }],
      reviewed: false,
      slotKey: `${riverbendFarmer._id}|${new Date(now.getTime() + 48 * 3600000).toISOString()}`,
      createdAt: now,
      updatedAt: now,
    };
    createdOrderIds.push(orderDoc._id);
    await db.collection(COLLECTIONS.ORDERS).insertOne(orderDoc);

    const res = await request(`/api/orders/${orderDoc._id}/cancel`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${customerGeorgeAuth.accessToken}` },
      body: { reason: 'Plans changed' },
    });

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.data.status, 'cancelled');
    assert.equal(body.data.cancelReason, 'Plans changed');

    const carrotsAfter = await db.collection(COLLECTIONS.PRODUCTS).findOne({ _id: carrotsProduct._id });
    assert.equal(carrotsAfter.quantityAvailable, stockBefore + 3, 'Stock must be restored by 3');

    // Clean up stock back
    await db.collection(COLLECTIONS.PRODUCTS).updateOne(
      { _id: carrotsProduct._id },
      { $set: { quantityAvailable: stockBefore } }
    );
  });

  it('T3.080: Customer cannot cancel ready or completed orders (409 CANNOT_CANCEL)', async () => {
    // Order 1 is ready in seed
    const readyOrder = await db.collection(COLLECTIONS.ORDERS).findOne({
      customerId: toObjectId(customerGeorgeAuth.user.id),
      status: 'ready',
    });

    const res = await request(`/api/orders/${readyOrder._id}/cancel`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${customerGeorgeAuth.accessToken}` },
      body: { reason: 'Too late' },
    });

    assert.equal(res.status, 409);
    const body = await res.json();
    assert.equal(body.error.code, 'CANNOT_CANCEL');
  });

  it('T3.081: GET /api/orders/:id/reorder-preview returns product availability and current prices', async () => {
    const res = await request(`/api/orders/${testOrderGeorge._id}/reorder-preview`, {
      headers: { Authorization: `Bearer ${customerGeorgeAuth.accessToken}` },
    });

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.ok(Array.isArray(body.data.items));
    assert.ok(body.data.items.length > 0);

    const itm = body.data.items[0];
    assert.ok(itm.productId);
    assert.ok(itm.name);
    assert.equal(typeof itm.isAvailable, 'boolean');
    assert.equal(typeof itm.currentPriceCents, 'number');
    assert.equal(typeof itm.quantityAvailable, 'number');
  });
});
