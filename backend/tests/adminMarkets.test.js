/**
 * Admin Markets Test Suite (T4.201 - T4.215)
 */

import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { ObjectId } from 'mongodb';
import { setupTestEnvironment, request, loginUser } from './helpers.js';
import { COLLECTIONS } from '../src/db/collections.js';

describe('Admin Markets Suite', () => {
  let db;
  let adminToken = '';
  let farmerDoc = null;

  before(async () => {
    const env = await setupTestEnvironment();
    db = env.db;

    const adminLogin = await loginUser('admin@marketlink.test', 'Admin12345');
    adminToken = adminLogin.accessToken;

    const farmerLogin = await loginUser('riverbend@example.com', 'market123');
    farmerDoc = await db.collection(COLLECTIONS.FARMERS).findOne({ userId: new ObjectId(farmerLogin.user.id) });

    await db.collection(COLLECTIONS.MARKETS).deleteMany({
      name: { $in: ['Meadowlands Green Market', 'Pine Valley Farmers Market', 'Force Removal Market'] },
    });
  });

  it('T4.201: Admin creates market with coordinates or mapUrl and slugification', async () => {
    // 1. With direct coordinates
    const res = await request('/api/admin/markets', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        name: 'Meadowlands Green Market',
        address: '100 Green Way, Secaucus, NJ',
        location: { lat: 40.789, lng: -74.056 },
        schedule: [{ day: 'sat', openMin: 480, closeMin: 780 }],
        timezone: 'America/New_York',
        facilities: ['parking', 'dog-friendly'],
        note: 'Fresh seasonal market near the wetlands.',
      },
    });
    assert.equal(res.status, 201);
    const body = await res.json();
    assert.equal(body.data.name, 'Meadowlands Green Market');
    assert.equal(body.data.slug, 'meadowlands-green-market');

    // 2. Duplicate name returns 409 MARKET_EXISTS
    const dupRes = await request('/api/admin/markets', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        name: 'meadowlands green market',
        address: '100 Green Way, Secaucus, NJ',
        location: { lat: 40.789, lng: -74.056 },
        schedule: [{ day: 'sat', openMin: 480, closeMin: 780 }],
      },
    });
    assert.equal(dupRes.status, 409);
    const dupBody = await dupRes.json();
    assert.equal(dupBody.error?.code, 'MARKET_EXISTS');

    // 3. Geocoding from mapUrl
    const mapUrlRes = await request('/api/admin/markets', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        name: 'Pine Valley Farmers Market',
        address: '50 Pine Street, Paramus, NJ',
        mapUrl: 'https://maps.google.com/?q=40.942,-74.072',
        schedule: [{ day: 'sun', openMin: 540, closeMin: 840 }],
      },
    });
    assert.equal(mapUrlRes.status, 201);
    const mapUrlBody = await mapUrlRes.json();
    assert.equal(mapUrlBody.data.location.lat, 40.942);
    assert.equal(mapUrlBody.data.location.lng, -74.072);
  });

  it('T4.202: Removing a market with attending farmers requires force flag', async () => {
    // Create a dedicated removal market and attach the farmer
    const removalMarketId = new ObjectId();
    await db.collection(COLLECTIONS.MARKETS).insertOne({
      _id: removalMarketId,
      name: 'Force Removal Market',
      slug: 'force-removal-market',
      address: '200 Market Street, Newark, NJ',
      location: { type: 'Point', coordinates: [-74.172, 40.735] },
      schedule: [{ day: 'sat', openMin: 480, closeMin: 780 }],
      timezone: 'America/New_York',
      facilities: ['parking'],
      note: 'Removal test market',
      farmerCount: 1,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await db.collection(COLLECTIONS.FARMERS).updateOne(
      { _id: farmerDoc._id },
      { $addToSet: { marketIds: removalMarketId } }
    );

    // Delete without force -> 409 FORCE_REQUIRED
    const noForceRes = await request(`/api/admin/markets/${removalMarketId.toString()}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.equal(noForceRes.status, 409);
    const noForceBody = await noForceRes.json();
    assert.equal(noForceBody.error?.code, 'FORCE_REQUIRED');

    // Delete with force=true -> succeeds and detaches farmers
    const forceRes = await request(`/api/admin/markets/${removalMarketId.toString()}?force=true`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.equal(forceRes.status, 200);
    const forceBody = await forceRes.json();
    assert.equal(forceBody.data.removed, true);
    assert.ok(forceBody.data.detachedFarmers >= 1);

    // Verify farmer does not have this marketId anymore
    const farmerAfter = await db.collection(COLLECTIONS.FARMERS).findOne({ _id: farmerDoc._id });
    assert.ok(!farmerAfter.marketIds.some((id) => id.toString() === removalMarketId.toString()));
  });
});
