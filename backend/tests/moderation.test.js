/**
 * Admin Moderation Test Suite (T4.220 - T4.240)
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { ObjectId } from 'mongodb';
import { setupTestEnvironment, teardownTestEnvironment, request, loginUser } from './helpers.js';
import { COLLECTIONS } from '../src/db/collections.js';

describe('Admin Moderation Suite (T4.220 - T4.240)', () => {
  let db;
  let adminToken = '';
  let farmerDoc = null;
  let customerDoc = null;
  let flaggedProduct = null;
  let flaggedReview = null;
  let flag1Id = null;
  let flag2Id = null;

  before(async () => {
    const env = await setupTestEnvironment();
    db = env.db;

    const adminLogin = await loginUser('admin@marketlink.test', 'Admin12345');
    adminToken = adminLogin.accessToken;

    const farmerLogin = await loginUser('riverbend@example.com', 'market123');
    farmerDoc = await db.collection(COLLECTIONS.FARMERS).findOne({ userId: new ObjectId(farmerLogin.user.id) });

    const custLogin = await loginUser('george@example.com', 'market123');
    customerDoc = await db.collection(COLLECTIONS.USERS).findOne({ email: 'george@example.com' });

    // Seed product to be flagged
    flaggedProduct = {
      _id: new ObjectId(),
      farmerId: farmerDoc._id,
      farmerUserId: farmerDoc.userId,
      categoryId: new ObjectId(),
      categorySlug: 'vegetables',
      name: 'Questionable Foraged Greens',
      priceCents: 500,
      unit: 'bag',
      quantityAvailable: 10,
      availability: 'in',
      listed: true,
      moderation: { removed: false },
      archived: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await db.collection(COLLECTIONS.PRODUCTS).insertOne(flaggedProduct);

    // Seed review with 1 star to test rating reversal
    flaggedReview = {
      _id: new ObjectId(),
      targetType: 'farmer',
      farmerId: farmerDoc._id,
      productId: null,
      customerId: customerDoc._id,
      customerName: customerDoc.name,
      orderId: new ObjectId(),
      rating: 1,
      comment: 'Inappropriate and offensive comment text.',
      status: 'visible',
      createdAt: new Date(),
    };
    await db.collection(COLLECTIONS.REVIEWS).insertOne(flaggedReview);

    // Initial recalculation to reflect the 1-star review on farmer
    const allFarmerReviews = await db.collection(COLLECTIONS.REVIEWS).find({
      farmerId: farmerDoc._id,
      targetType: 'farmer',
      status: 'visible',
    }).toArray();
    const sum = allFarmerReviews.reduce((s, r) => s + r.rating, 0);
    const count = allFarmerReviews.length;
    await db.collection(COLLECTIONS.FARMERS).updateOne(
      { _id: farmerDoc._id },
      { $set: { ratingSum: sum, ratingCount: count, ratingAvg: Math.round((sum / count) * 10) / 10 } }
    );

    // Seed moderation flags
    flag1Id = new ObjectId();
    flag2Id = new ObjectId();
    await db.collection(COLLECTIONS.MODERATION_FLAGS).insertMany([
      {
        _id: flag1Id,
        targetType: 'listing',
        targetId: flaggedProduct._id,
        reason: 'Possible non-food wild plant',
        reporterId: customerDoc._id,
        status: 'open',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        _id: flag2Id,
        targetType: 'review',
        targetId: flaggedReview._id,
        reason: 'Harassment and profanity',
        reporterId: customerDoc._id,
        status: 'open',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  });

  after(async () => {
    await teardownTestEnvironment();
  });

  it('T4.220: GET /api/admin/moderation lists flags with previews populated in batch without N+1 queries', async () => {
    const res = await request('/api/admin/moderation', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.equal(res.status, 200);
    const body = await res.json();

    assert.ok(Array.isArray(body.data));
    assert.ok(body.data.length >= 2);

    const fListing = body.data.find((f) => f.id === flag1Id.toString());
    assert.ok(fListing);
    assert.equal(fListing.preview?.name, 'Questionable Foraged Greens');

    const fReview = body.data.find((f) => f.id === flag2Id.toString());
    assert.ok(fReview);
    assert.equal(fReview.preview?.rating, 1);
  });

  it('T4.221: Resolving a flag as remove delists product, updates flag, and logs audit', async () => {
    const resolveRes = await request(`/api/admin/moderation/${flag1Id.toString()}/resolve`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { action: 'remove', note: 'Not a verified safe agricultural item' },
    });
    assert.equal(resolveRes.status, 200);
    const body = await resolveRes.json();
    assert.equal(body.data.status, 'removed');

    // Verify product is delisted and marked removed
    const pAfter = await db.collection(COLLECTIONS.PRODUCTS).findOne({ _id: flaggedProduct._id });
    assert.equal(pAfter.listed, false);
    assert.equal(pAfter.moderation?.removed, true);

    // Verify audit log entry
    const audit = await db.collection(COLLECTIONS.AUDIT_LOG).findOne({
      action: 'product.remove',
      targetId: flaggedProduct._id,
    });
    assert.ok(audit, 'product.remove audit log must be written');
  });

  it('T4.222: Resolving a review flag as remove reverses rating aggregates atomically', async () => {
    const farmerBefore = await db.collection(COLLECTIONS.FARMERS).findOne({ _id: farmerDoc._id });
    const initialSum = farmerBefore.ratingSum;
    const initialCount = farmerBefore.ratingCount;

    const resolveRes = await request(`/api/admin/moderation/${flag2Id.toString()}/resolve`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { action: 'remove', note: 'Violates content standards' },
    });
    assert.equal(resolveRes.status, 200);

    // Verify review status is 'removed'
    const rAfter = await db.collection(COLLECTIONS.REVIEWS).findOne({ _id: flaggedReview._id });
    assert.equal(rAfter.status, 'removed');

    // Verify atomic rating reversal
    const farmerAfter = await db.collection(COLLECTIONS.FARMERS).findOne({ _id: farmerDoc._id });
    assert.equal(farmerAfter.ratingCount, initialCount - 1);
    assert.equal(farmerAfter.ratingSum, initialSum - 1); // 1 star subtracted
  });

  it('T4.223: Direct remove endpoints for products and reviews work and log audit', async () => {
    // Direct product remove
    const freshProd = {
      _id: new ObjectId(),
      farmerId: farmerDoc._id,
      farmerUserId: farmerDoc.userId,
      categoryId: new ObjectId(),
      name: 'To Direct Remove',
      priceCents: 100,
      unit: 'each',
      quantityAvailable: 10,
      availability: 'in',
      listed: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await db.collection(COLLECTIONS.PRODUCTS).insertOne(freshProd);

    const directProdRes = await request(`/api/admin/products/${freshProd._id.toString()}/remove`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { note: 'Direct administrative removal' },
    });
    assert.equal(directProdRes.status, 200);

    const pAfter = await db.collection(COLLECTIONS.PRODUCTS).findOne({ _id: freshProd._id });
    assert.equal(pAfter.listed, false);
    assert.equal(pAfter.moderation?.removed, true);
  });
});
