/**
 * Farmer Weekly Template Test Suite
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { setupTestEnvironment, teardownTestEnvironment, request, loginUser } from './helpers.js';
import { COLLECTIONS } from '../src/db/collections.js';
import { ObjectId } from 'mongodb';

describe('Weekly Template Suite', () => {
  let db;
  let farmerToken = '';
  let farmerDoc = null;
  let customerToken = '';
  let customerDoc = null;

  before(async () => {
    const env = await setupTestEnvironment();
    db = env.db;

    const farmerLogin = await loginUser('riverbend@example.com', 'market123');
    farmerToken = farmerLogin.accessToken;
    farmerDoc = await db.collection(COLLECTIONS.FARMERS).findOne({ userId: new ObjectId(farmerLogin.user.id) });

    const custLogin = await loginUser('george@example.com', 'market123');
    customerToken = custLogin.accessToken;
    customerDoc = await db.collection(COLLECTIONS.USERS).findOne({ _id: new ObjectId(custLogin.user.id) });
  });

  after(async () => {
    await teardownTestEnvironment();
  });

  it('T4.080: GET /api/farmer/weekly-template returns template configs for farmer products', async () => {
    const res = await request('/api/farmer/weekly-template', {
      headers: { Authorization: `Bearer ${farmerToken}` },
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.ok(Array.isArray(body.data));
    assert.ok(body.data.length > 0);
    const item = body.data[0];
    assert.ok(item.productId);
    assert.ok(item.name);
    assert.ok(item.weekly);
    assert.ok(typeof item.weekly.enabled === 'boolean');
    assert.ok(typeof item.weekly.defaultQty === 'number');
  });

  it('T4.081: PUT /api/farmer/weekly-template updates weekly configuration', async () => {
    const listRes = await request('/api/farmer/weekly-template', {
      headers: { Authorization: `Bearer ${farmerToken}` },
    });
    const listBody = await listRes.json();
    const targetProd = listBody.data[0];

    const putRes = await request('/api/farmer/weekly-template', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${farmerToken}` },
      body: {
        items: [
          {
            productId: targetProd.productId,
            enabled: true,
            defaultQty: 45,
          },
        ],
      },
    });
    assert.equal(putRes.status, 200);
    const putBody = await putRes.json();
    assert.equal(putBody.data.updatedCount, 1);

    // Verify in DB
    const updatedProd = await db.collection(COLLECTIONS.PRODUCTS).findOne({
      _id: new ObjectId(targetProd.productId),
    });
    assert.equal(updatedProd.weekly.enabled, true);
    assert.equal(updatedProd.weekly.defaultQty, 45);
  });

  it('T4.082: POST /api/farmer/weekly-template/apply resets quantities and triggers restock alerts', async () => {
    // 1. Pick an unarchived product, set qty=0 and availability='out', enable weekly with defaultQty=25
    const prod = await db.collection(COLLECTIONS.PRODUCTS).findOne({ farmerId: farmerDoc._id, archived: { $ne: true } });
    assert.ok(prod);

    await db.collection(COLLECTIONS.PRODUCTS).updateOne(
      { _id: prod._id },
      {
        $set: {
          quantityAvailable: 0,
          availability: 'out',
          weekly: { enabled: true, defaultQty: 25 },
        },
      }
    );

    // Customer favorites this product
    await db.collection(COLLECTIONS.FAVORITES).updateOne(
      { userId: customerDoc._id, targetType: 'product', targetId: prod._id },
      { $set: { createdAt: new Date() } },
      { upsert: true }
    );

    // Ensure customer has restockAlerts: true
    await db.collection(COLLECTIONS.USERS).updateOne(
      { _id: customerDoc._id },
      { $set: { 'notificationPrefs.restockAlerts': true } }
    );

    // 2. Apply weekly template
    const applyRes = await request('/api/farmer/weekly-template/apply', {
      method: 'POST',
      headers: { Authorization: `Bearer ${farmerToken}` },
    });
    assert.equal(applyRes.status, 200);
    const applyBody = await applyRes.json();
    assert.ok(applyBody.data.appliedCount >= 1);

    // 3. Verify product quantity in DB is reset to defaultQty and availability is 'in'
    const appliedProd = await db.collection(COLLECTIONS.PRODUCTS).findOne({ _id: prod._id });
    assert.equal(appliedProd.quantityAvailable, 25);
    assert.equal(appliedProd.availability, 'in');

    // 4. Verify customer received a restock notification
    const notif = await db.collection(COLLECTIONS.NOTIFICATIONS).findOne({
      userId: customerDoc._id,
      type: 'restock',
      'data.productId': prod._id.toString(),
    });
    assert.ok(notif, 'Customer should receive a restock notification');
    assert.ok(notif.title.includes('in stock'));
  });
});
