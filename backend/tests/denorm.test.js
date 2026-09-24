/**
 * Denormalisation and Sync Matrix Test Suite.
 * Validates each sync function in src/utils/sync.js per specification D3.
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { ObjectId } from 'mongodb';
import { setupTestEnvironment, teardownTestEnvironment } from './helpers.js';
import { COLLECTIONS } from '../src/db/collections.js';
import {
  syncFarmerApproval,
  syncFarmerSuspension,
  syncFarmerStallInfo,
  syncFarmerMarkets,
  syncFarmerCategorySlugs,
  syncProductListing,
  syncCategoryRename,
  syncMarketRemoved,
  syncReviewRating,
} from '../src/utils/sync.js';

describe('Denormalisation Sync Matrix Suite (D3)', () => {
  let db;

  before(async () => {
    const env = await setupTestEnvironment();
    db = env.db;
  });

  after(async () => {
    await db.collection(COLLECTIONS.PRODUCTS).deleteMany({
      name: { $in: ['Sync Veg 1', 'Sync Veg 2 (hidden)', 'Product 1', 'Product M', 'Product C', 'Product R'] },
    });
    await db.collection(COLLECTIONS.MARKETS).deleteMany({
      name: { $in: ['Market 1', 'Market 2', 'Market 3', 'To Be Removed Market'] },
    });
    await db.collection(COLLECTIONS.FARMERS).deleteMany({
      $or: [
        { email: { $regex: '^sync\\.farmer\\.' } },
        { email: { $in: ['mtest@farmer.com', 'test@stall.com', 'c@farmer.com', 'rem@farmer.com'] } },
      ],
    });
    await db.collection(COLLECTIONS.USERS).deleteMany({
      email: { $regex: '^sync\\.farmer\\.' },
    });
    await teardownTestEnvironment();
  });

  it('syncFarmerApproval and syncFarmerSuspension correctly update listed, markets.farmerCount, and sessions', async () => {
    // 1. Create a test farmer with 2 products and 1 market
    const market = await db.collection(COLLECTIONS.MARKETS).findOne({ status: 'active' });
    assert.ok(market);
    const initialFarmerCount = market.farmerCount;

    const testUserId = new ObjectId();
    const testFarmerId = new ObjectId();

    await db.collection(COLLECTIONS.USERS).insertOne({
      _id: testUserId,
      role: 'farmer',
      name: 'Sync Test Farmer',
      email: `sync.farmer.${Date.now()}@example.com`,
      passwordHash: 'hash',
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await db.collection(COLLECTIONS.FARMERS).insertOne({
      _id: testFarmerId,
      userId: testUserId,
      stallName: 'Sync Stall',
      stallNameLower: 'sync stall',
      email: `sync.farmer.${Date.now()}@example.com`,
      marketIds: [market._id],
      listingEnabled: false,
      categorySlugs: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const p1 = new ObjectId();
    const p2 = new ObjectId();
    await db.collection(COLLECTIONS.PRODUCTS).insertMany([
      {
        _id: p1,
        farmerId: testFarmerId,
        farmerUserId: testUserId,
        categoryId: new ObjectId(),
        categorySlug: 'vegetables',
        name: 'Sync Veg 1',
        priceCents: 300,
        unit: 'lb',
        quantityAvailable: 10,
        availability: 'in',
        listed: false,
        archived: false,
        moderation: { removed: false },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        _id: p2,
        farmerId: testFarmerId,
        farmerUserId: testUserId,
        categoryId: new ObjectId(),
        categorySlug: 'vegetables',
        name: 'Sync Veg 2 (hidden)',
        priceCents: 400,
        unit: 'bunch',
        quantityAvailable: 5,
        availability: 'hidden',
        listed: false,
        archived: false,
        moderation: { removed: false },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    // 2. Approve farmer: p1 should become listed, p2 remains unlisted (hidden)
    const approveRes = await syncFarmerApproval(testFarmerId, { db });
    assert.equal(approveRes.productsListedCount, 1);
    assert.equal(approveRes.marketsUpdatedCount, 1);

    const fAfterApprove = await db.collection(COLLECTIONS.FARMERS).findOne({ _id: testFarmerId });
    assert.equal(fAfterApprove.listingEnabled, true);
    assert.deepEqual(fAfterApprove.categorySlugs, ['vegetables']);

    const mAfterApprove = await db.collection(COLLECTIONS.MARKETS).findOne({ _id: market._id });
    assert.equal(mAfterApprove.farmerCount, initialFarmerCount + 1);

    const p1Doc = await db.collection(COLLECTIONS.PRODUCTS).findOne({ _id: p1 });
    assert.equal(p1Doc.listed, true);
    const p2Doc = await db.collection(COLLECTIONS.PRODUCTS).findOne({ _id: p2 });
    assert.equal(p2Doc.listed, false);

    // 3. Suspend farmer: both become unlisted, market count decrements, sessions revoked
    await db.collection(COLLECTIONS.SESSIONS).insertOne({
      userId: testUserId,
      tokenHash: `dummy_hash_${Date.now()}_${Math.random()}`,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 3600000),
    });

    const suspendRes = await syncFarmerSuspension(testFarmerId, { db });
    assert.ok(suspendRes.productsDelistedCount >= 1);
    assert.equal(suspendRes.marketsUpdatedCount, 1);

    const fAfterSuspend = await db.collection(COLLECTIONS.FARMERS).findOne({ _id: testFarmerId });
    assert.equal(fAfterSuspend.listingEnabled, false);
    assert.deepEqual(fAfterSuspend.categorySlugs, []);

    const mAfterSuspend = await db.collection(COLLECTIONS.MARKETS).findOne({ _id: market._id });
    assert.equal(mAfterSuspend.farmerCount, initialFarmerCount);

    const p1AfterSuspend = await db.collection(COLLECTIONS.PRODUCTS).findOne({ _id: p1 });
    assert.equal(p1AfterSuspend.listed, false);

    // Session should be revoked
    const sessions = await db.collection(COLLECTIONS.SESSIONS).find({ userId: testUserId }).toArray();
    assert.ok(sessions.every((s) => s.revokedAt !== null && s.revokedAt !== undefined));
  });

  it('syncFarmerStallInfo updates stallNameLower and product snapshots', async () => {
    const fid = new ObjectId();
    await db.collection(COLLECTIONS.FARMERS).insertOne({
      _id: fid,
      userId: new ObjectId(),
      stallName: 'Old Stall Name',
      stallNameLower: 'old stall name',
      email: 'test@stall.com',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const pid = new ObjectId();
    await db.collection(COLLECTIONS.PRODUCTS).insertOne({
      _id: pid,
      farmerId: fid,
      farmerUserId: new ObjectId(),
      categoryId: new ObjectId(),
      name: 'Product 1',
      priceCents: 200,
      unit: 'lb',
      quantityAvailable: 10,
      availability: 'in',
      farmer: { stallName: 'Old Stall Name', stallNumber: '1' },
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const res = await syncFarmerStallInfo(
      fid,
      { stallName: 'Fresh Valley Farm', stallNumber: '4B' },
      { db }
    );
    assert.equal(res.productsUpdatedCount, 1);

    const updatedFarmer = await db.collection(COLLECTIONS.FARMERS).findOne({ _id: fid });
    assert.equal(updatedFarmer.stallName, 'Fresh Valley Farm');
    assert.equal(updatedFarmer.stallNameLower, 'fresh valley farm');
    assert.equal(updatedFarmer.stallNumber, '4B');

    const updatedProd = await db.collection(COLLECTIONS.PRODUCTS).findOne({ _id: pid });
    assert.equal(updatedProd.farmer.stallName, 'Fresh Valley Farm');
    assert.equal(updatedProd.farmer.stallNumber, '4B');
  });

  it('syncFarmerMarkets computes added/removed sets and updates products.marketIds and markets.farmerCount', async () => {
    const m1 = new ObjectId();
    const m2 = new ObjectId();
    const m3 = new ObjectId();

    await db.collection(COLLECTIONS.MARKETS).insertMany([
      { _id: m1, name: 'Market 1', slug: `m1-${Date.now()}`, address: 'Addr 1', status: 'active', farmerCount: 1, createdAt: new Date(), updatedAt: new Date() },
      { _id: m2, name: 'Market 2', slug: `m2-${Date.now()}`, address: 'Addr 2', status: 'active', farmerCount: 1, createdAt: new Date(), updatedAt: new Date() },
      { _id: m3, name: 'Market 3', slug: `m3-${Date.now()}`, address: 'Addr 3', status: 'active', farmerCount: 0, createdAt: new Date(), updatedAt: new Date() },
    ]);

    const fid = new ObjectId();
    await db.collection(COLLECTIONS.FARMERS).insertOne({
      _id: fid,
      userId: new ObjectId(),
      stallName: 'Market Test Farmer',
      email: 'mtest@farmer.com',
      marketIds: [m1, m2],
      listingEnabled: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const pid = new ObjectId();
    await db.collection(COLLECTIONS.PRODUCTS).insertOne({
      _id: pid,
      farmerId: fid,
      farmerUserId: new ObjectId(),
      categoryId: new ObjectId(),
      name: 'Product M',
      priceCents: 200,
      unit: 'lb',
      quantityAvailable: 10,
      availability: 'in',
      marketIds: [m1, m2],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Change markets to [m2, m3] -> m1 removed (-1), m3 added (+1), m2 unchanged
    const res = await syncFarmerMarkets(fid, [m2, m3], [m1, m2], { db });
    assert.equal(res.productsUpdatedCount, 1);
    assert.equal(res.marketsUpdatedCount, 2);

    const updatedProd = await db.collection(COLLECTIONS.PRODUCTS).findOne({ _id: pid });
    assert.deepEqual(
      updatedProd.marketIds.map((id) => id.toString()),
      [m2.toString(), m3.toString()]
    );

    const m1Doc = await db.collection(COLLECTIONS.MARKETS).findOne({ _id: m1 });
    assert.equal(m1Doc.farmerCount, 0);
    const m2Doc = await db.collection(COLLECTIONS.MARKETS).findOne({ _id: m2 });
    assert.equal(m2Doc.farmerCount, 1);
    const m3Doc = await db.collection(COLLECTIONS.MARKETS).findOne({ _id: m3 });
    assert.equal(m3Doc.farmerCount, 1);
  });

  it('syncCategoryRename propagates categorySlug to products and recalculates farmer categorySlugs', async () => {
    const cid = new ObjectId();
    const fid = new ObjectId();

    await db.collection(COLLECTIONS.FARMERS).insertOne({
      _id: fid,
      userId: new ObjectId(),
      stallName: 'Category Test Farmer',
      email: 'c@farmer.com',
      listingEnabled: true,
      categorySlugs: ['old-cat'],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const pid = new ObjectId();
    await db.collection(COLLECTIONS.PRODUCTS).insertOne({
      _id: pid,
      farmerId: fid,
      farmerUserId: new ObjectId(),
      categoryId: cid,
      categorySlug: 'old-cat',
      name: 'Product C',
      priceCents: 200,
      unit: 'lb',
      quantityAvailable: 10,
      availability: 'in',
      listed: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const res = await syncCategoryRename(cid, 'new-cat', { db });
    assert.equal(res.productsUpdatedCount, 1);
    assert.equal(res.farmersUpdatedCount, 1);

    const prod = await db.collection(COLLECTIONS.PRODUCTS).findOne({ _id: pid });
    assert.equal(prod.categorySlug, 'new-cat');

    const farmer = await db.collection(COLLECTIONS.FARMERS).findOne({ _id: fid });
    assert.deepEqual(farmer.categorySlugs, ['new-cat']);
  });

  it('syncMarketRemoved pulls marketId from farmers and products and sets farmerCount to 0', async () => {
    const mid = new ObjectId();
    const otherMid = new ObjectId();

    await db.collection(COLLECTIONS.MARKETS).insertOne({
      _id: mid,
      name: 'To Be Removed Market',
      slug: `tbr-${Date.now()}`,
      address: 'Addr',
      status: 'active',
      farmerCount: 3,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const fid = new ObjectId();
    await db.collection(COLLECTIONS.FARMERS).insertOne({
      _id: fid,
      userId: new ObjectId(),
      stallName: 'Removal Farmer',
      email: 'rem@farmer.com',
      marketIds: [mid, otherMid],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const pid = new ObjectId();
    await db.collection(COLLECTIONS.PRODUCTS).insertOne({
      _id: pid,
      farmerId: fid,
      farmerUserId: new ObjectId(),
      categoryId: new ObjectId(),
      name: 'Product R',
      priceCents: 200,
      unit: 'lb',
      quantityAvailable: 10,
      availability: 'in',
      marketIds: [mid, otherMid],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const res = await syncMarketRemoved(mid, { db });
    assert.equal(res.farmersModifiedCount, 1);
    assert.equal(res.productsModifiedCount, 1);

    const mDoc = await db.collection(COLLECTIONS.MARKETS).findOne({ _id: mid });
    assert.equal(mDoc.farmerCount, 0);
    assert.equal(mDoc.status, 'removed');

    const fDoc = await db.collection(COLLECTIONS.FARMERS).findOne({ _id: fid });
    assert.deepEqual(fDoc.marketIds.map((id) => id.toString()), [otherMid.toString()]);

    const pDoc = await db.collection(COLLECTIONS.PRODUCTS).findOne({ _id: pid });
    assert.deepEqual(pDoc.marketIds.map((id) => id.toString()), [otherMid.toString()]);
  });
});
