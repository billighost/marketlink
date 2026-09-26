/**
 * Farmer Products Test Suite (T4.031 - T4.085)
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { ObjectId } from 'mongodb';
import { setupTestEnvironment, teardownTestEnvironment, request, loginUser } from './helpers.js';
import { COLLECTIONS } from '../src/db/collections.js';

describe('Farmer Products Suite (T4.031 - T4.085)', () => {
  let db;
  let farmerToken = '';
  let farmerDoc = null;
  let farmer2Token = '';
  let farmer2Doc = null;
  let pendingFarmerToken = '';
  let customerToken = '';
  let customerDoc = null;
  let activeCategory = null;
  let seededProducts = [];
  let seededProducts2 = [];

  before(async () => {
    const env = await setupTestEnvironment();
    db = env.db;

    // Active farmer 1 (Riverbend Farm)
    const farmerRes = await loginUser('riverbend@example.com', 'market123');
    farmerToken = farmerRes.accessToken;
    farmerDoc = await db.collection(COLLECTIONS.FARMERS).findOne({ userId: new ObjectId(farmerRes.user.id) });

    // Active farmer 2 (Oak & Mill Bakery)
    const farmer2Res = await loginUser('oakmill@example.com', 'market123');
    farmer2Token = farmer2Res.accessToken;
    farmer2Doc = await db.collection(COLLECTIONS.FARMERS).findOne({ userId: new ObjectId(farmer2Res.user.id) });

    // Pending farmer
    const pendingRes = await loginUser('pending.farmer@example.com', 'market123');
    pendingFarmerToken = pendingRes.accessToken;

    // Customer
    const custRes = await loginUser('george@example.com', 'market123');
    customerToken = custRes.accessToken;
    customerDoc = await db.collection(COLLECTIONS.USERS).findOne({ _id: new ObjectId(custRes.user.id) });

    // Active category
    activeCategory = await db.collection(COLLECTIONS.CATEGORIES).findOne({ active: true });
    assert.ok(activeCategory);

    // Snapshot original seeded products so that mutation tests do not pollute downstream suites
    seededProducts = await db.collection(COLLECTIONS.PRODUCTS).find({ farmerId: farmerDoc._id }).toArray();
    seededProducts2 = await db.collection(COLLECTIONS.PRODUCTS).find({ farmerId: farmer2Doc._id }).toArray();
  });

  after(async () => {
    await db.collection(COLLECTIONS.PRODUCTS).deleteMany({
      name: { $in: ['Heirloom Purple Carrots', 'Unique Test Spinach', 'Disposable Radishes', 'Archivable Turnips'] },
    });
    await db.collection(COLLECTIONS.ORDERS).deleteMany({
      orderNumber: { $regex: '^TEST-ORD-' },
    });
    for (const p of seededProducts) {
      const { _id, ...rest } = p;
      await db.collection(COLLECTIONS.PRODUCTS).replaceOne({ _id }, rest, { upsert: true });
    }
    for (const p of seededProducts2) {
      const { _id, ...rest } = p;
      await db.collection(COLLECTIONS.PRODUCTS).replaceOne({ _id }, rest, { upsert: true });
    }
    await teardownTestEnvironment();
  });

  it('T4.031: Pending farmer receives 403 FARMER_NOT_APPROVED when attempting to create a product', async () => {
    const res = await request('/api/farmer/products', {
      method: 'POST',
      headers: { Authorization: `Bearer ${pendingFarmerToken}` },
      body: {
        name: 'Pending Product',
        categoryId: activeCategory._id.toString(),
        priceCents: 500,
        unit: 'lb',
        art: 'tomato',
      },
    });
    assert.equal(res.status, 403);
    const body = await res.json();
    assert.equal(body.error?.code, 'FARMER_NOT_APPROVED');
  });

  it('T4.032: Active farmer creates product with all fields; computed fields populated correctly', async () => {
    const res = await request('/api/farmer/products', {
      method: 'POST',
      headers: { Authorization: `Bearer ${farmerToken}` },
      body: {
        name: 'Heirloom Purple Carrots',
        categoryId: activeCategory._id.toString(),
        priceCents: 475,
        unit: 'bunch',
        quantityAvailable: 25,
        lowStockThreshold: 5,
        description: 'Sweet and earthy purple carrots.',
        tags: ['seasonal', 'organic'],
        art: 'carrot',
        weekly: { enabled: true, defaultQty: 30 },
      },
    });
    assert.equal(res.status, 201);
    const body = await res.json();
    const prod = body.data;

    assert.ok(prod.id);
    assert.equal(prod.name, 'Heirloom Purple Carrots');
    assert.equal(prod.priceCents, 475);
    assert.equal(prod.unit, 'bunch');
    assert.equal(prod.quantityAvailable, 25);
    assert.equal(prod.lowStockThreshold, 5);
    assert.equal(prod.availability, 'in');
    assert.equal(prod.listed, true);
    assert.equal(prod.categorySlug, activeCategory.slug);
    assert.equal(prod.weekly.enabled, true);
    assert.equal(prod.weekly.defaultQty, 30);

    // Verify DB internal fields
    const doc = await db.collection(COLLECTIONS.PRODUCTS).findOne({ _id: new ObjectId(prod.id) });
    assert.ok(doc);
    assert.equal(doc.nameLower, 'heirloom purple carrots');
    assert.equal(typeof doc.rnd, 'number');
    assert.equal(doc.farmer.stallName, farmerDoc.stallName);
    assert.equal(doc.archived, false);
    assert.equal(doc.moderation.removed, false);
  });

  it('T4.033: Creating product syncs farmers.categorySlugs', async () => {
    const farmerBefore = await db.collection(COLLECTIONS.FARMERS).findOne({ _id: farmerDoc._id });
    assert.ok(Array.isArray(farmerBefore.categorySlugs));

    // Create product in an active category
    const res = await request('/api/farmer/products', {
      method: 'POST',
      headers: { Authorization: `Bearer ${farmerToken}` },
      body: {
        name: 'Unique Test Spinach',
        categoryId: activeCategory._id.toString(),
        priceCents: 350,
        unit: 'bunch',
        art: 'leafy-greens',
      },
    });
    assert.equal(res.status, 201);

    const farmerAfter = await db.collection(COLLECTIONS.FARMERS).findOne({ _id: farmerDoc._id });
    assert.ok(farmerAfter.categorySlugs.includes(activeCategory.slug));
  });

  it('T4.034: Tenant isolation: Farmer B receives 404 when attempting to access or modify Farmer A\'s product', async () => {
    // Product owned by Farmer A
    const prodA = await db.collection(COLLECTIONS.PRODUCTS).findOne({ farmerId: farmerDoc._id, archived: { $ne: true } });
    assert.ok(prodA);

    // Farmer B GET
    const getRes = await request(`/api/farmer/products/${prodA._id.toString()}`, {
      headers: { Authorization: `Bearer ${farmer2Token}` },
    });
    assert.equal(getRes.status, 404);

    // Farmer B PATCH
    const patchRes = await request(`/api/farmer/products/${prodA._id.toString()}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${farmer2Token}` },
      body: { priceCents: 999 },
    });
    assert.equal(patchRes.status, 404);

    // Farmer B sold-out
    const soldOutRes = await request(`/api/farmer/products/${prodA._id.toString()}/sold-out`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${farmer2Token}` },
    });
    assert.equal(soldOutRes.status, 404);

    // Farmer B DELETE
    const delRes = await request(`/api/farmer/products/${prodA._id.toString()}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${farmer2Token}` },
    });
    assert.equal(delRes.status, 404);
  });

  it('T4.035: Updating product fields updates DB and recomputes nameLower and availability', async () => {
    const prod = await db.collection(COLLECTIONS.PRODUCTS).findOne({ farmerId: farmerDoc._id, archived: { $ne: true }, availability: { $ne: 'hidden' } });
    assert.ok(prod);

    const patchRes = await request(`/api/farmer/products/${prod._id.toString()}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${farmerToken}` },
      body: {
        priceCents: 625,
        quantityAvailable: 3,
        lowStockThreshold: 4,
        description: 'Updated description for testing.',
      },
    });
    assert.equal(patchRes.status, 200);
    const body = await patchRes.json();
    assert.equal(body.data.priceCents, 625);
    assert.equal(body.data.quantityAvailable, 3);
    assert.equal(body.data.availability, 'low');
    assert.equal(body.data.description, 'Updated description for testing.');
  });

  it('T4.036: Quantity from 0 to positive triggers restock notification for favoriters', async () => {
    const prod = await db.collection(COLLECTIONS.PRODUCTS).findOne({ farmerId: farmerDoc._id, archived: { $ne: true } });
    assert.ok(prod);

    // Set product out of stock
    await db.collection(COLLECTIONS.PRODUCTS).updateOne(
      { _id: prod._id },
      { $set: { quantityAvailable: 0, availability: 'out' } }
    );

    // Customer favorites this product
    await db.collection(COLLECTIONS.FAVORITES).updateOne(
      { userId: customerDoc._id, targetType: 'product', targetId: prod._id },
      { $set: { createdAt: new Date() } },
      { upsert: true }
    );

    // Ensure customer has restock alerts enabled
    await db.collection(COLLECTIONS.USERS).updateOne(
      { _id: customerDoc._id },
      { $set: { 'notificationPrefs.restockAlerts': true } }
    );

    // Clear recent notifications for this product
    await db.collection(COLLECTIONS.NOTIFICATIONS).deleteMany({
      userId: customerDoc._id,
      'data.productId': prod._id.toString(),
    });

    // Update quantity to 15
    const patchRes = await request(`/api/farmer/products/${prod._id.toString()}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${farmerToken}` },
      body: { quantityAvailable: 15 },
    });
    assert.equal(patchRes.status, 200);

    // Verify restock notification created
    const notif = await db.collection(COLLECTIONS.NOTIFICATIONS).findOne({
      userId: customerDoc._id,
      type: 'restock',
      'data.productId': prod._id.toString(),
    });
    assert.ok(notif, 'Restock notification should be created');
  });

  it('T4.037: Thresholds: quantity <= lowStockThreshold results in "low", 0 results in "out"', async () => {
    const prod = await db.collection(COLLECTIONS.PRODUCTS).findOne({ farmerId: farmerDoc._id, archived: { $ne: true } });
    assert.ok(prod);

    // Low stock
    const lowRes = await request(`/api/farmer/products/${prod._id.toString()}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${farmerToken}` },
      body: { quantityAvailable: 2, lowStockThreshold: 5 },
    });
    assert.equal(lowRes.status, 200);
    const lowBody = await lowRes.json();
    assert.equal(lowBody.data.availability, 'low');

    // Out of stock
    const outRes = await request(`/api/farmer/products/${prod._id.toString()}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${farmerToken}` },
      body: { quantityAvailable: 0 },
    });
    assert.equal(outRes.status, 200);
    const outBody = await outRes.json();
    assert.equal(outBody.data.availability, 'out');
  });

  it('T4.038: Sold-out and available toggles work properly', async () => {
    const prod = await db.collection(COLLECTIONS.PRODUCTS).findOne({ farmerId: farmerDoc._id, archived: { $ne: true } });
    assert.ok(prod);

    // Sold out
    const soldRes = await request(`/api/farmer/products/${prod._id.toString()}/sold-out`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${farmerToken}` },
    });
    assert.equal(soldRes.status, 200);
    const soldBody = await soldRes.json();
    assert.equal(soldBody.data.availability, 'out');
    assert.equal(soldBody.data.quantityAvailable, 0);

    // Available
    const availRes = await request(`/api/farmer/products/${prod._id.toString()}/available`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${farmerToken}` },
      body: { quantity: 20 },
    });
    assert.equal(availRes.status, 200);
    const availBody = await availRes.json();
    assert.equal(availBody.data.availability, 'in');
    assert.equal(availBody.data.quantityAvailable, 20);
  });

  it('T4.039: Hide and unhide endpoints flip availability to hidden and listed to false', async () => {
    const prod = await db.collection(COLLECTIONS.PRODUCTS).findOne({ farmerId: farmerDoc._id, archived: { $ne: true } });
    assert.ok(prod);

    // Hide
    const hideRes = await request(`/api/farmer/products/${prod._id.toString()}/hide`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${farmerToken}` },
    });
    assert.equal(hideRes.status, 200);
    const hideBody = await hideRes.json();
    assert.equal(hideBody.data.availability, 'hidden');
    assert.equal(hideBody.data.listed, false);

    // Unhide
    const unhideRes = await request(`/api/farmer/products/${prod._id.toString()}/unhide`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${farmerToken}` },
    });
    assert.equal(unhideRes.status, 200);
    const unhideBody = await unhideRes.json();
    assert.ok(unhideBody.data.availability !== 'hidden');
    assert.equal(unhideBody.data.listed, true);
  });

  it('T4.040: Bulk action with mixed set skips foreign products and applies to owned products', async () => {
    const prodA = await db.collection(COLLECTIONS.PRODUCTS).findOne({ farmerId: farmerDoc._id, archived: { $ne: true } });
    const prodB = await db.collection(COLLECTIONS.PRODUCTS).findOne({ farmerId: farmer2Doc._id, archived: { $ne: true } });
    assert.ok(prodA && prodB);

    const bulkRes = await request('/api/farmer/products/bulk', {
      method: 'POST',
      headers: { Authorization: `Bearer ${farmerToken}` },
      body: {
        action: 'mark_sold_out',
        productIds: [prodA._id.toString(), prodB._id.toString()],
      },
    });
    assert.equal(bulkRes.status, 200);
    const bulkBody = await bulkRes.json();

    assert.equal(bulkBody.data.modifiedCount, 1);
    assert.ok(bulkBody.data.skipped.includes(prodB._id.toString()));

    const checkA = await db.collection(COLLECTIONS.PRODUCTS).findOne({ _id: prodA._id });
    assert.equal(checkA.availability, 'out');

    const checkB = await db.collection(COLLECTIONS.PRODUCTS).findOne({ _id: prodB._id });
    assert.notEqual(checkB.availability, 'out');
  });

  it('T4.041: Delete without orders hard-deletes; delete with orders archives (soft delete)', async () => {
    // 1. Create a fresh product without orders -> hard delete
    const createRes = await request('/api/farmer/products', {
      method: 'POST',
      headers: { Authorization: `Bearer ${farmerToken}` },
      body: {
        name: 'Disposable Radishes',
        categoryId: activeCategory._id.toString(),
        priceCents: 200,
        unit: 'bunch',
        art: 'radish-bunch',
      },
    });
    assert.equal(createRes.status, 201);
    const disposable = (await createRes.json()).data;

    const delHardRes = await request(`/api/farmer/products/${disposable.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${farmerToken}` },
    });
    assert.equal(delHardRes.status, 200);
    const delHardBody = await delHardRes.json();
    assert.equal(delHardBody.data.deleted, true);

    const hardCheck = await db.collection(COLLECTIONS.PRODUCTS).findOne({ _id: new ObjectId(disposable.id) });
    assert.equal(hardCheck, null);

    // 2. Product referenced by an order -> soft delete (archived: true)
    const createOrderedRes = await request('/api/farmer/products', {
      method: 'POST',
      headers: { Authorization: `Bearer ${farmerToken}` },
      body: {
        name: 'Archivable Turnips',
        categoryId: activeCategory._id.toString(),
        priceCents: 250,
        unit: 'bunch',
        art: 'radish-bunch',
      },
    });
    assert.equal(createOrderedRes.status, 201);
    const orderedProd = (await createOrderedRes.json()).data;
    const orderedProdId = new ObjectId(orderedProd.id);

    // Insert dummy order referencing orderedProd
    await db.collection(COLLECTIONS.ORDERS).insertOne({
      orderNumber: `TEST-ORD-${Date.now()}`,
      checkoutId: new ObjectId(),
      customerId: customerDoc._id,
      farmerId: farmerDoc._id,
      marketId: farmerDoc.marketIds[0],
      items: [{ productId: orderedProdId, name: orderedProd.name, quantity: 1, unitPriceCents: 100, lineTotalCents: 100 }],
      subtotalCents: 100,
      totalCents: 100,
      status: 'completed',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const delSoftRes = await request(`/api/farmer/products/${orderedProd.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${farmerToken}` },
    });
    assert.equal(delSoftRes.status, 200);
    const delSoftBody = await delSoftRes.json();
    assert.equal(delSoftBody.data.archived, true);

    const softCheck = await db.collection(COLLECTIONS.PRODUCTS).findOne({ _id: orderedProdId });
    assert.equal(softCheck.archived, true);
    assert.equal(softCheck.listed, false);
  });

  it('T4.042: Validation rules: unknown fields, system tags, out-of-range numbers, direct availability rejected with 422', async () => {
    // System tags
    const sysTagRes = await request('/api/farmer/products', {
      method: 'POST',
      headers: { Authorization: `Bearer ${farmerToken}` },
      body: {
        name: 'Invalid Tag Product',
        categoryId: activeCategory._id.toString(),
        priceCents: 500,
        unit: 'lb',
        art: 'tomato',
        tags: ['bestseller'],
      },
    });
    assert.equal(sysTagRes.status, 422);

    // Unknown field
    const unknownRes = await request('/api/farmer/products', {
      method: 'POST',
      headers: { Authorization: `Bearer ${farmerToken}` },
      body: {
        name: 'Invalid Field Product',
        categoryId: activeCategory._id.toString(),
        priceCents: 500,
        unit: 'lb',
        art: 'tomato',
        fooBar: 123,
      },
    });
    assert.equal(unknownRes.status, 422);

    // Direct availability
    const availRes = await request('/api/farmer/products', {
      method: 'POST',
      headers: { Authorization: `Bearer ${farmerToken}` },
      body: {
        name: 'Direct Avail Product',
        categoryId: activeCategory._id.toString(),
        priceCents: 500,
        unit: 'lb',
        art: 'tomato',
        availability: 'in',
      },
    });
    assert.equal(availRes.status, 422);

    // Out of range price
    const highPriceRes = await request('/api/farmer/products', {
      method: 'POST',
      headers: { Authorization: `Bearer ${farmerToken}` },
      body: {
        name: 'Too Expensive Product',
        categoryId: activeCategory._id.toString(),
        priceCents: 2000000,
        unit: 'lb',
        art: 'tomato',
      },
    });
    assert.equal(highPriceRes.status, 422);

    // Empty patch body
    const prod = await db.collection(COLLECTIONS.PRODUCTS).findOne({ farmerId: farmerDoc._id, archived: { $ne: true } });
    const emptyPatchRes = await request(`/api/farmer/products/${prod._id.toString()}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${farmerToken}` },
      body: {},
    });
    assert.equal(emptyPatchRes.status, 422);
  });
});
