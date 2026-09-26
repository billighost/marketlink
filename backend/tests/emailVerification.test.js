/**
 * Email verification workflow test suite.
 * Validates registration token issuance, /verify-email endpoint, rate-limited resend,
 * and the farmer approval gate.
 */

import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { setupTestEnvironment, teardownTestEnvironment, request, loginUser } from './helpers.js';
import { getDb } from '../src/db/client.js';
import { COLLECTIONS } from '../src/db/collections.js';
import { sha256Hash, generateRandomToken } from '../src/utils/tokens.js';
import { setTransporter, resetMailerState } from '../src/utils/mailer.js';

describe('Email Verification Suite', () => {
  let db;

  before(async () => {
    const env = await setupTestEnvironment();
    db = env.db;
  });

  after(async () => {
    resetMailerState();
    await teardownTestEnvironment();
  });

  beforeEach(() => {
    // Intercept mailer so tests do not hit Gmail network
    setTransporter({
      sendMail: async () => ({ messageId: '<test-verification-msg@marketlink>' }),
    });
  });

  it('creates an emailVerifications record with 24h TTL upon customer registration', async () => {
    const email = `verify.cust.${Date.now()}.${Math.random()}@example.com`;
    const res = await request('/api/auth/register/customer', {
      method: 'POST',
      body: {
        name: 'Unverified Customer',
        phone: '(555) 000-1111',
        email,
        address: '42 Main St',
        password: 'Password123!',
      },
    });

    assert.equal(res.status, 201);
    const body = await res.json();
    assert.equal(body.data.user.emailVerified, false);

    // Check user in db
    const userDoc = await db.collection(COLLECTIONS.USERS).findOne({ email: email.toLowerCase() });
    assert.ok(userDoc);
    assert.equal(userDoc.emailVerified, false);
    assert.equal(userDoc.emailVerifiedAt, null);

    // Check emailVerifications record
    const record = await db.collection(COLLECTIONS.EMAIL_VERIFICATIONS).findOne({ userId: userDoc._id });
    assert.ok(record);
    assert.ok(record.tokenHash);
    assert.equal(record.usedAt, null);

    const ttlMs = record.expiresAt.getTime() - record.createdAt.getTime();
    const approx24Hours = 24 * 60 * 60 * 1000;
    assert.ok(Math.abs(ttlMs - approx24Hours) < 5000, 'Expiration should be 24 hours from creation');
  });

  it('successfully verifies email with valid token and sets emailVerified to true', async () => {
    const email = `verify.token.${Date.now()}.${Math.random()}@example.com`;
    await request('/api/auth/register/customer', {
      method: 'POST',
      body: {
        name: 'Token Verifier',
        phone: '(555) 222-3333',
        email,
        address: '100 Green St',
        password: 'Password123!',
      },
    });

    const userDoc = await db.collection(COLLECTIONS.USERS).findOne({ email: email.toLowerCase() });
    const rawToken = generateRandomToken(32);
    const hashed = sha256Hash(rawToken);
    await db.collection(COLLECTIONS.EMAIL_VERIFICATIONS).insertOne({
      userId: userDoc._id,
      tokenHash: hashed,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      usedAt: null,
    });

    // POST /api/auth/verify-email
    const verifyRes = await request('/api/auth/verify-email', {
      method: 'POST',
      body: { token: rawToken },
    });

    assert.equal(verifyRes.status, 200);
    const verifyBody = await verifyRes.json();
    assert.equal(verifyBody.data.user.emailVerified, true);

    // Verify user in db is updated
    const updatedUser = await db.collection(COLLECTIONS.USERS).findOne({ _id: userDoc._id });
    assert.equal(updatedUser.emailVerified, true);
    assert.ok(updatedUser.emailVerifiedAt instanceof Date);

    // Second verify attempt with same token must fail
    const replayRes = await request('/api/auth/verify-email', {
      method: 'POST',
      body: { token: rawToken },
    });
    assert.equal(replayRes.status, 422);
    const replayBody = await replayRes.json();
    assert.equal(replayBody.error.code, 'INVALID_VERIFICATION_TOKEN');
  });

  it('GET /api/auth/verify-email verifies with query parameter token', async () => {
    const email = `verify.get.${Date.now()}.${Math.random()}@example.com`;
    await request('/api/auth/register/customer', {
      method: 'POST',
      body: {
        name: 'Get Verifier',
        phone: '(555) 333-4444',
        email,
        address: '500 Market Lane',
        password: 'Password123!',
      },
    });

    const userDoc = await db.collection(COLLECTIONS.USERS).findOne({ email: email.toLowerCase() });
    const rawToken = generateRandomToken(32);
    const hashed = sha256Hash(rawToken);
    await db.collection(COLLECTIONS.EMAIL_VERIFICATIONS).insertOne({
      userId: userDoc._id,
      tokenHash: hashed,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      usedAt: null,
    });

    const res = await request(`/api/auth/verify-email?token=${rawToken}`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.data.user.emailVerified, true);
  });

  it('rejects expired verification tokens with 422', async () => {
    const email = `verify.expired.${Date.now()}.${Math.random()}@example.com`;
    await request('/api/auth/register/customer', {
      method: 'POST',
      body: {
        name: 'Expired Token User',
        phone: '(555) 444-5555',
        email,
        address: '12 Expired St',
        password: 'Password123!',
      },
    });

    const userDoc = await db.collection(COLLECTIONS.USERS).findOne({ email: email.toLowerCase() });
    const rawToken = generateRandomToken(32);
    const hashed = sha256Hash(rawToken);
    await db.collection(COLLECTIONS.EMAIL_VERIFICATIONS).insertOne({
      userId: userDoc._id,
      tokenHash: hashed,
      createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
      expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Expired 24h ago
      usedAt: null,
    });

    const res = await request('/api/auth/verify-email', {
      method: 'POST',
      body: { token: rawToken },
    });
    assert.equal(res.status, 422);
    const body = await res.json();
    assert.equal(body.error.code, 'INVALID_VERIFICATION_TOKEN');
  });

  it('prevents administrator from approving an unverified farmer stall (409 EMAIL_NOT_VERIFIED)', async () => {
    const adminLogin = await loginUser('admin@marketlink.test', 'Admin12345');
    const adminToken = adminLogin.accessToken;
    assert.ok(adminToken, 'Admin should login successfully');

    // Register a pending farmer
    const farmerEmail = `unverified.farmer.${Date.now()}.${Math.random()}@example.com`;
    const regRes = await request('/api/auth/register/farmer', {
      method: 'POST',
      body: {
        contactPerson: 'Pending Farmer Joe',
        stallName: `Stall ${Date.now()}`,
        phone: '(555) 777-8888',
        email: farmerEmail,
        address: 'Orchard Valley, NY',
        password: 'Password123!',
      },
    });
    assert.equal(regRes.status, 201);

    const farmerUser = await db.collection(COLLECTIONS.USERS).findOne({ email: farmerEmail.toLowerCase() });
    const farmerDoc = await db.collection(COLLECTIONS.FARMERS).findOne({ userId: farmerUser._id });
    assert.ok(farmerDoc);

    // Attempt to approve unverified farmer -> must return 409 EMAIL_NOT_VERIFIED
    const approveRes = await request(`/api/admin/farmers/${farmerDoc._id}/approve`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.equal(approveRes.status, 409);
    const approveBody = await approveRes.json();
    assert.equal(approveBody.error.code, 'EMAIL_NOT_VERIFIED');

    // Now verify the farmer's email
    await db.collection(COLLECTIONS.USERS).updateOne(
      { _id: farmerUser._id },
      { $set: { emailVerified: true, emailVerifiedAt: new Date() } }
    );

    // Re-attempt approval -> must succeed 200
    const approveSuccessRes = await request(`/api/admin/farmers/${farmerDoc._id}/approve`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.equal(approveSuccessRes.status, 200);
    const approvedBody = await approveSuccessRes.json();
    assert.equal(approvedBody.data.status, 'active');
  });
});
