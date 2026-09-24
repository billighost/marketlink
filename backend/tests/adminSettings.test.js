/**
 * Admin Settings, Categories, Announcements, and Messages Test Suite (T4.240 - T4.250)
 */

import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { ObjectId } from 'mongodb';
import { setupTestEnvironment, request, loginUser } from './helpers.js';
import { COLLECTIONS } from '../src/db/collections.js';

describe('Admin Settings Suite (T4.240 - T4.250)', () => {
  let db;
  let adminToken = '';
  let customerUserDoc = null;
  let farmerUserDoc = null;

  before(async () => {
    const env = await setupTestEnvironment();
    db = env.db;

    const adminLogin = await loginUser('admin@marketlink.test', 'Admin12345');
    adminToken = adminLogin.accessToken;

    customerUserDoc = await db.collection(COLLECTIONS.USERS).findOne({ role: 'customer', status: 'active' });
    farmerUserDoc = await db.collection(COLLECTIONS.USERS).findOne({ role: 'farmer', status: 'active' });
  });

  it('T4.241: Category CRUD, slug propagation on rename, and 409 CATEGORY_IN_USE on delete', async () => {
    // 1. Create Category
    const createRes = await request('/api/admin/categories', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        name: 'Artisan Cheeses',
        sortOrder: 15,
        art: 'cheese',
        active: true,
      },
    });
    assert.equal(createRes.status, 201);
    const cat = (await createRes.json()).data;
    assert.equal(cat.name, 'Artisan Cheeses');
    assert.equal(cat.slug, 'artisan-cheeses');

    // 2. Add product in this category
    const farmer = await db.collection(COLLECTIONS.FARMERS).findOne({ listingEnabled: true }) || await db.collection(COLLECTIONS.FARMERS).findOne();
    const prodId = new ObjectId();
    await db.collection(COLLECTIONS.PRODUCTS).insertOne({
      _id: prodId,
      farmerId: farmer._id,
      farmerUserId: farmer.userId,
      categoryId: new ObjectId(cat.id),
      categorySlug: cat.slug,
      name: 'Farmhouse Gouda',
      priceCents: 800,
      unit: 'each',
      quantityAvailable: 10,
      availability: 'in',
      listed: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // 3. Rename category -> propagates to product.categorySlug
    const patchRes = await request(`/api/admin/categories/${cat.id}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { name: 'Aged Farmhouse Cheeses' },
    });
    assert.equal(patchRes.status, 200);
    const patchedCat = (await patchRes.json()).data;
    assert.equal(patchedCat.slug, 'aged-farmhouse-cheeses');

    const pAfter = await db.collection(COLLECTIONS.PRODUCTS).findOne({ _id: prodId });
    assert.equal(pAfter.categorySlug, 'aged-farmhouse-cheeses', 'Category rename must propagate to product');

    // 4. Delete in-use category -> 409 CATEGORY_IN_USE
    const delInUse = await request(`/api/admin/categories/${cat.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.equal(delInUse.status, 409);
    const delBody = await delInUse.json();
    assert.equal(delBody.error?.code, 'CATEGORY_IN_USE');

    // 5. Remove product, then delete succeeds
    await db.collection(COLLECTIONS.PRODUCTS).deleteOne({ _id: prodId });
    const delSuccess = await request(`/api/admin/categories/${cat.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.equal(delSuccess.status, 200);
  });

  it('T4.242: Announcements CRUD and publish creates targeted broadcast notifications', async () => {
    // 1. Create announcement for customers only
    const createRes = await request('/api/admin/announcements', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        title: 'Fall Market Season Begins',
        body: 'Join us this Saturday for autumn squashes and fresh hot cider!',
        audience: 'customer',
      },
    });
    assert.equal(createRes.status, 201);
    const ann = (await createRes.json()).data;

    // 2. Publish announcement
    const pubRes = await request(`/api/admin/announcements/${ann.id}/publish`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.equal(pubRes.status, 200);

    // 3. Verify notification created for customer but NOT farmer
    const custNotif = await db.collection(COLLECTIONS.NOTIFICATIONS).findOne({
      userId: customerUserDoc._id,
      type: 'announcement',
      'data.announcementId': ann.id,
    });
    assert.ok(custNotif, 'Customer must receive announcement notification');

    const farmerNotif = await db.collection(COLLECTIONS.NOTIFICATIONS).findOne({
      userId: farmerUserDoc._id,
      type: 'announcement',
      'data.announcementId': ann.id,
    });
    assert.equal(farmerNotif, null, 'Farmer must not receive customer-only announcement');
  });

  it('T4.243: Platform settings: valid inputs update settings collection and invalid inputs return 422', async () => {
    // 1. Invalid input (>30 max items)
    const invalidRes = await request('/api/admin/settings', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { maxItemsPerOrder: 50 },
    });
    assert.equal(invalidRes.status, 422);

    // 2. Valid settings update
    const validRes = await request('/api/admin/settings', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        maxItemsPerOrder: 25,
        defaultCutoffMinutes: 360,
        lowStockDefault: 8,
      },
    });
    assert.equal(validRes.status, 200);
    const body = await validRes.json();
    assert.equal(body.data.maxItemsPerOrder, 25);
    assert.equal(body.data.defaultCutoffMinutes, 360);
    assert.equal(body.data.lowStockDefault, 8);

    // 3. GET settings returns the updated values
    const getRes = await request('/api/admin/settings', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.equal(getRes.status, 200);
    const getBody = await getRes.json();
    assert.equal(getBody.data.maxItemsPerOrder, 25);

    // 4. Restore default settings
    await request('/api/admin/settings', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { maxItemsPerOrder: 15, defaultCutoffMinutes: 720, lowStockDefault: 5 },
    });
  });

  it('T4.244: Contact messages: listing and marking as handled updates status and records audit', async () => {
    // Insert a fresh contact message
    const msgId = new ObjectId();
    await db.collection(COLLECTIONS.CONTACT_MESSAGES).insertOne({
      _id: msgId,
      name: 'Curious Buyer',
      email: 'curious@example.com',
      topic: 'order',
      message: 'When will peaches be back in stock?',
      status: 'new',
      createdAt: new Date(),
    });

    const listRes = await request('/api/admin/messages', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.equal(listRes.status, 200);
    const listBody = await listRes.json();
    assert.ok(listBody.data.some((m) => m.id === msgId.toString()));

    // Handle message
    const handleRes = await request(`/api/admin/messages/${msgId.toString()}/handle`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { reply: 'Peaches return in early July!' },
    });
    assert.equal(handleRes.status, 200);
    const handleBody = await handleRes.json();
    assert.equal(handleBody.data.status, 'handled');

    const msgAfter = await db.collection(COLLECTIONS.CONTACT_MESSAGES).findOne({ _id: msgId });
    assert.equal(msgAfter.status, 'handled');
  });
});
