/**
 * Farmer Reviews Test Suite
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { ObjectId } from 'mongodb';
import { setupTestEnvironment, teardownTestEnvironment, request, loginUser } from './helpers.js';
import { COLLECTIONS } from '../src/db/collections.js';

describe('Farmer Reviews Suite', () => {
  let db;
  let farmerToken = '';
  let farmerDoc = null;
  let farmer2Token = '';
  let farmer2Doc = null;
  let customerDoc = null;
  let testReview = null;

  before(async () => {
    const env = await setupTestEnvironment();
    db = env.db;

    const farmerRes = await loginUser('riverbend@example.com', 'market123');
    farmerToken = farmerRes.accessToken;
    farmerDoc = await db.collection(COLLECTIONS.FARMERS).findOne({ userId: new ObjectId(farmerRes.user.id) });

    const farmer2Res = await loginUser('oakmill@example.com', 'market123');
    farmer2Token = farmer2Res.accessToken;
    farmer2Doc = await db.collection(COLLECTIONS.FARMERS).findOne({ userId: new ObjectId(farmer2Res.user.id) });

    const custRes = await loginUser('george@example.com', 'market123');
    customerDoc = await db.collection(COLLECTIONS.USERS).findOne({ _id: new ObjectId(custRes.user.id) });

    // Seed test review for Farmer A
    testReview = {
      _id: new ObjectId(),
      targetType: 'farmer',
      farmerId: farmerDoc._id,
      productId: null,
      customerId: customerDoc._id,
      customerName: customerDoc.name,
      orderId: new ObjectId(),
      rating: 5,
      comment: 'Best heirloom tomatoes in the county!',
      reply: null,
      status: 'visible',
      createdAt: new Date(),
    };
    await db.collection(COLLECTIONS.REVIEWS).insertOne(testReview);
  });

  after(async () => {
    await teardownTestEnvironment();
  });

  it('T4.120: GET /api/farmer/reviews returns list and rating breakdown summary', async () => {
    const res = await request('/api/farmer/reviews', {
      headers: { Authorization: `Bearer ${farmerToken}` },
    });
    assert.equal(res.status, 200);
    const body = await res.json();

    assert.ok(Array.isArray(body.data));
    assert.ok(body.meta?.summary);
    assert.ok(typeof body.meta.summary.ratingAvg === 'number');
    assert.ok(typeof body.meta.summary.ratingCount === 'number');
    assert.ok(body.meta.summary.breakdown);
    assert.ok(body.meta.summary.breakdown[5] >= 1);
  });

  it('T4.121: POST /api/farmer/reviews/:id/reply creates reply and notifies customer', async () => {
    const replyRes = await request(`/api/farmer/reviews/${testReview._id.toString()}/reply`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${farmerToken}` },
      body: { body: 'Thank you for your kind words! See you this Saturday.' },
    });
    assert.equal(replyRes.status, 200);
    const body = await replyRes.json();
    assert.ok(body.data.reply);
    assert.equal(body.data.reply.text, 'Thank you for your kind words! See you this Saturday.');

    // Verify customer received review_reply notification
    const notif = await db.collection(COLLECTIONS.NOTIFICATIONS).findOne({
      userId: customerDoc._id,
      type: 'review_reply',
      'data.reviewId': testReview._id.toString(),
    });
    assert.ok(notif, 'Customer must receive review_reply notification');
  });

  it('T4.122: Tenant isolation: Farmer B receives 404 when replying to Farmer A\'s review', async () => {
    const res = await request(`/api/farmer/reviews/${testReview._id.toString()}/reply`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${farmer2Token}` },
      body: { body: 'This should fail with 404' },
    });
    assert.equal(res.status, 404);
  });

  it('T4.123: DELETE /api/farmer/reviews/:id/reply removes the reply', async () => {
    const delRes = await request(`/api/farmer/reviews/${testReview._id.toString()}/reply`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${farmerToken}` },
    });
    assert.equal(delRes.status, 200);

    const docAfter = await db.collection(COLLECTIONS.REVIEWS).findOne({ _id: testReview._id });
    assert.equal(docAfter.reply, null);
  });
});
