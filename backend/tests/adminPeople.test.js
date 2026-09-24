/**
 * Admin People and Farmer Lifecycle Test Suite (T4.161 - T4.200)
 */

import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';
import { setupTestEnvironment, request, loginUser } from './helpers.js';
import { COLLECTIONS } from '../src/db/collections.js';

describe('Admin People Suite (T4.161 - T4.200)', () => {
  let db;
  let adminToken = '';
  let adminUserDoc = null;
  let customerToken = '';
  let customerUserDoc = null;
  let activeFarmerToken = '';
  let activeFarmerUserDoc = null;
  let activeFarmerDoc = null;

  before(async () => {
    const env = await setupTestEnvironment();
    db = env.db;

    // Login Admin
    const adminLogin = await loginUser('admin@marketlink.test', 'Admin12345');
    adminToken = adminLogin.accessToken;
    adminUserDoc = await db.collection(COLLECTIONS.USERS).findOne({ email: 'admin@marketlink.test' });

    // Login Customer
    const custLogin = await loginUser('george@example.com', 'market123');
    customerToken = custLogin.accessToken;
    customerUserDoc = await db.collection(COLLECTIONS.USERS).findOne({ email: 'george@example.com' });

    // Login Active Farmer (Riverbend)
    const farmerLogin = await loginUser('riverbend@example.com', 'market123');
    activeFarmerToken = farmerLogin.accessToken;
    activeFarmerUserDoc = await db.collection(COLLECTIONS.USERS).findOne({ email: 'riverbend@example.com' });
    activeFarmerDoc = await db.collection(COLLECTIONS.FARMERS).findOne({ userId: activeFarmerUserDoc._id });
  });

  it('T4.161: Admin can list farmers and customers with status filters and search', async () => {
    // Farmers list
    const fRes = await request('/api/admin/farmers', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.equal(fRes.status, 200);
    const fBody = await fRes.json();
    assert.ok(Array.isArray(fBody.data));
    assert.ok(fBody.data.length >= 1);

    // Filter by pending status
    const pendingRes = await request('/api/admin/farmers?status=pending', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.equal(pendingRes.status, 200);
    const pendingBody = await pendingRes.json();
    for (const f of pendingBody.data) {
      assert.equal(f.status, 'pending');
    }

    // Customers list
    const cRes = await request('/api/admin/customers', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.equal(cRes.status, 200);
    const cBody = await cRes.json();
    assert.ok(Array.isArray(cBody.data));
  });

  it('T4.162: Non-admin receives 403 on /api/admin routes', async () => {
    const custRes = await request('/api/admin/farmers', {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    assert.equal(custRes.status, 403);

    const farmerRes = await request('/api/admin/farmers', {
      headers: { Authorization: `Bearer ${activeFarmerToken}` },
    });
    assert.equal(farmerRes.status, 403);
  });

  it('T4.163: Approve pending farmer: state transitions, catalog propagation, and audit log', async () => {
    // 1. Create a fresh pending farmer with a market and products
    const pendingUserId = new ObjectId();
    const pendingFarmerId = new ObjectId();
    const market = await db.collection(COLLECTIONS.MARKETS).findOne({ status: 'active' });
    assert.ok(market);
    const initialFarmerCount = market.farmerCount || 0;

    await db.collection(COLLECTIONS.USERS).insertOne({
      _id: pendingUserId,
      role: 'farmer',
      name: 'Pending Pete',
      email: `pete.pending.${Date.now()}@example.com`,
      passwordHash: await bcrypt.hash('market123', 1),
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await db.collection(COLLECTIONS.FARMERS).insertOne({
      _id: pendingFarmerId,
      userId: pendingUserId,
      stallName: 'Pete Orchard',
      email: `pete.pending.${Date.now()}@example.com`,
      marketIds: [market._id],
      listingEnabled: false,
      operatingDays: ['sat'],
      categorySlugs: ['fruit'],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const category = await db.collection(COLLECTIONS.CATEGORIES).findOne({ active: true });

    // Seed a product for this pending farmer (initially listed: false)
    const prodId = new ObjectId();
    await db.collection(COLLECTIONS.PRODUCTS).insertOne({
      _id: prodId,
      farmerId: pendingFarmerId,
      farmerUserId: pendingUserId,
      categoryId: category._id,
      categorySlug: category.slug,
      name: 'Pete Crisp Apples',
      nameLower: 'pete crisp apples',
      priceCents: 400,
      unit: 'lb',
      quantityAvailable: 50,
      lowStockThreshold: 5,
      availability: 'in',
      marketIds: [market._id],
      listed: false,
      moderation: { removed: false },
      archived: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // 2. Approve farmer via admin API
    const approveRes = await request(`/api/admin/farmers/${pendingFarmerId.toString()}/approve`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.equal(approveRes.status, 200);
    const approveBody = await approveRes.json();
    assert.equal(approveBody.data.status, 'active');

    // 3. Verify user and farmer updated in DB
    const uAfter = await db.collection(COLLECTIONS.USERS).findOne({ _id: pendingUserId });
    assert.equal(uAfter.status, 'active');

    const fAfter = await db.collection(COLLECTIONS.FARMERS).findOne({ _id: pendingFarmerId });
    assert.equal(fAfter.listingEnabled, true);

    // 4. Verify product is now listed: true
    const pAfter = await db.collection(COLLECTIONS.PRODUCTS).findOne({ _id: prodId });
    assert.equal(pAfter.listed, true, 'Product should be listed after farmer approval');

    // 5. Verify market.farmerCount incremented
    const mAfter = await db.collection(COLLECTIONS.MARKETS).findOne({ _id: market._id });
    assert.equal(mAfter.farmerCount, initialFarmerCount + 1);

    // 6. Verify audit log written
    const audit = await db.collection(COLLECTIONS.AUDIT_LOG).findOne({
      action: 'farmer.approve',
      'targetId': pendingFarmerId,
    });
    assert.ok(audit, 'Audit log entry must be written');

    // 7. Verify notification to farmer
    const notif = await db.collection(COLLECTIONS.NOTIFICATIONS).findOne({
      userId: pendingUserId,
      type: 'account',
    });
    assert.ok(notif, 'Farmer must receive account approved notification');

    // 8. Attempting to approve again returns 409 INVALID_STATE
    const dupApprove = await request(`/api/admin/farmers/${pendingFarmerId.toString()}/approve`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.equal(dupApprove.status, 409);
  });

  it('T4.164: Suspend active farmer: products delisted, session revoked, and 403 on mutating routes', async () => {
    // 1. Create an active farmer with a product
    const activeUserId = new ObjectId();
    const activeFid = new ObjectId();
    const market = await db.collection(COLLECTIONS.MARKETS).findOne({ status: 'active' });
    const initialFarmerCount = market.farmerCount || 0;
    const tempEmail = `suspend.test.${Date.now()}@example.com`;

    await db.collection(COLLECTIONS.USERS).insertOne({
      _id: activeUserId,
      role: 'farmer',
      name: 'To Suspend',
      email: tempEmail,
      passwordHash: await bcrypt.hash('market123', 1),
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await db.collection(COLLECTIONS.FARMERS).insertOne({
      _id: activeFid,
      userId: activeUserId,
      stallName: 'Suspendable Stall',
      email: tempEmail,
      marketIds: [market._id],
      listingEnabled: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Login as this farmer to obtain access token before suspension
    const loginRes = await loginUser(tempEmail, 'market123');
    const farmerAccessToken = loginRes.accessToken;

    const prodId = new ObjectId();
    await db.collection(COLLECTIONS.PRODUCTS).insertOne({
      _id: prodId,
      farmerId: activeFid,
      farmerUserId: activeUserId,
      categoryId: new ObjectId(),
      name: 'Suspendable Melon',
      priceCents: 500,
      unit: 'each',
      quantityAvailable: 10,
      availability: 'in',
      listed: true,
      moderation: { removed: false },
      archived: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // 2. Suspend via Admin API (missing reason returns 422)
    const noReasonRes = await request(`/api/admin/farmers/${activeFid.toString()}/suspend`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {},
    });
    assert.equal(noReasonRes.status, 422);

    const suspendRes = await request(`/api/admin/farmers/${activeFid.toString()}/suspend`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { reason: 'Repeated quality complaints from customers' },
    });
    assert.equal(suspendRes.status, 200);

    // 3. Verify user is suspended and products are delisted
    const uAfter = await db.collection(COLLECTIONS.USERS).findOne({ _id: activeUserId });
    assert.equal(uAfter.status, 'suspended');

    const pAfter = await db.collection(COLLECTIONS.PRODUCTS).findOne({ _id: prodId });
    assert.equal(pAfter.listed, false, 'Products must be delisted immediately upon farmer suspension');

    // 4. Access token window mitigation: mutating route with existing token immediately returns 403 ACCOUNT_SUSPENDED
    const mutateRes = await request('/api/farmer/profile', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${farmerAccessToken}` },
      body: { story: 'Attempt to edit after suspension' },
    });
    assert.equal(mutateRes.status, 403);
    const mutateBody = await mutateRes.json();
    assert.equal(mutateBody.error?.code, 'ACCOUNT_SUSPENDED');

    // 5. Reinstate the farmer
    const reinstateRes = await request(`/api/admin/farmers/${activeFid.toString()}/reinstate`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.equal(reinstateRes.status, 200);

    const pReinstated = await db.collection(COLLECTIONS.PRODUCTS).findOne({ _id: prodId });
    assert.equal(pReinstated.listed, true, 'Products must be relisted after reinstatement');
  });

  it('T4.165: Customer deactivation and activation toggles status and writes audit log', async () => {
    // 1. Deactivate customer
    const deactRes = await request(`/api/admin/customers/${customerUserDoc._id.toString()}/deactivate`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.equal(deactRes.status, 200);

    const cAfter = await db.collection(COLLECTIONS.USERS).findOne({ _id: customerUserDoc._id });
    assert.equal(cAfter.status, 'inactive');

    // Verify audit log
    const auditDeact = await db.collection(COLLECTIONS.AUDIT_LOG).findOne({
      action: 'customer.deactivate',
      'targetId': customerUserDoc._id,
    });
    assert.ok(auditDeact);

    // 2. Reactivate customer
    const actRes = await request(`/api/admin/customers/${customerUserDoc._id.toString()}/activate`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.equal(actRes.status, 200);

    const cRestored = await db.collection(COLLECTIONS.USERS).findOne({ _id: customerUserDoc._id });
    assert.equal(cRestored.status, 'active');
  });

  it('T4.166: Administrator cannot be deactivated or suspended (403 CANNOT_MODERATE_ADMIN)', async () => {
    const res = await request(`/api/admin/customers/${adminUserDoc._id.toString()}/deactivate`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.equal(res.status, 403);
    const body = await res.json();
    assert.equal(body.error?.code, 'CANNOT_MODERATE_ADMIN');
  });
});
