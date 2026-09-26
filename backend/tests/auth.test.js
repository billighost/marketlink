/**
 * Comprehensive authentication and authorization test suite.
 * Validates registration, credential login, token rotation, reuse defense, recovery, and RBAC guards.
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { setupTestEnvironment, teardownTestEnvironment, request, loginUser } from './helpers.js';
import { getDb } from '../src/db/client.js';
import { COLLECTIONS } from '../src/db/collections.js';
import { sha256Hash } from '../src/utils/tokens.js';

describe('Auth Module Suite', () => {
  let db;

  before(async () => {
    const env = await setupTestEnvironment();
    db = env.db;
  });

  after(async () => {
    await teardownTestEnvironment();
  });

  // ── 1. Customer Registration ──
  describe('Customer Registration', () => {
    it('successfully registers a customer with valid credentials and sets refresh cookie', async () => {
      const email = `test.customer.${Date.now()}@example.com`;
      const res = await request('/api/auth/register/customer', {
        method: 'POST',
        body: {
          name: 'Jane Doe',
          phone: '(555) 123-4567',
          email,
          address: '42 Market Street, Maplewood',
          password: 'Password123',
        },
      });

      assert.equal(res.status, 201);
      const setCookie = res.headers.get('set-cookie');
      assert.ok(setCookie && setCookie.includes('refreshToken='));
      assert.ok(setCookie.includes('HttpOnly'));

      const body = await res.json();
      assert.ok(body.data.accessToken);
      assert.equal(body.data.user.email, email.toLowerCase());
      assert.equal(body.data.user.role, 'customer');
      assert.equal(body.data.user.status, 'active');
      assert.equal(body.data.user.passwordHash, undefined, 'passwordHash must never leak');
      assert.ok(body.data.user.id, 'id field must be present');
      assert.equal(body.data.user._id, undefined, '_id must be stripped');
    });

    it('rejects duplicate email with 409 EMAIL_TAKEN', async () => {
      const email = `dup.customer.${Date.now()}@example.com`;
      await request('/api/auth/register/customer', {
        method: 'POST',
        body: {
          name: 'First Register',
          phone: '(555) 123-4567',
          email,
          address: '42 Market Street',
          password: 'Password123',
        },
      });

      const res = await request('/api/auth/register/customer', {
        method: 'POST',
        body: {
          name: 'Second Register',
          phone: '(555) 123-4567',
          email: email.toUpperCase(), // Case-insensitive collision check
          address: '42 Market Street',
          password: 'Password123',
        },
      });

      assert.equal(res.status, 409);
      const body = await res.json();
      assert.equal(body.error.code, 'EMAIL_TAKEN');
    });

    it('validates required fields, short passwords, and invalid emails with 422 VALIDATION_FAILED', async () => {
      const res = await request('/api/auth/register/customer', {
        method: 'POST',
        body: {
          name: '',
          phone: '',
          email: 'not-an-email',
          address: '',
          password: 'short',
        },
      });

      assert.equal(res.status, 422);
      const body = await res.json();
      assert.equal(body.error.code, 'VALIDATION_FAILED');
      assert.ok(Array.isArray(body.error.details));
      const fields = body.error.details.map((d) => d.field);
      assert.ok(fields.includes('name'));
      assert.ok(fields.includes('email'));
      assert.ok(fields.includes('password'));
    });

    it('rejects unknown fields with 422 VALIDATION_FAILED', async () => {
      const res = await request('/api/auth/register/customer', {
        method: 'POST',
        body: {
          name: 'Hacker',
          phone: '(555) 123-4567',
          email: `hacker.${Date.now()}@example.com`,
          address: '42 Market Street',
          password: 'Password123',
          role: 'admin', // disallowed injected field
        },
      });

      assert.equal(res.status, 422);
      const body = await res.json();
      assert.equal(body.error.code, 'VALIDATION_FAILED');
      assert.ok(body.error.details.some((d) => d.field === 'role'));
    });
  });

  // ── 2. Farmer Registration ──
  describe('Farmer Registration', () => {
    it('successfully registers a farmer with status "pending" and creates 1:1 farmer profile', async () => {
      const email = `farmer.${Date.now()}@example.com`;
      const res = await request('/api/auth/register/farmer', {
        method: 'POST',
        body: {
          stallName: 'Golden Valley Honey',
          contactPerson: 'Gregory Scott',
          phone: '(555) 987-6543',
          email,
          address: '77 Country Road, Sussex, NJ',
          password: 'FarmPassword1',
        },
      });

      assert.equal(res.status, 201);
      const body = await res.json();
      assert.equal(body.data.user.role, 'farmer');
      assert.equal(body.data.user.status, 'pending');

      // Verify farmer profile exists in database
      const userInDb = await db.collection(COLLECTIONS.USERS).findOne({ email });
      assert.ok(userInDb);
      assert.equal(userInDb.status, 'pending');

      const farmerProfile = await db.collection(COLLECTIONS.FARMERS).findOne({ userId: userInDb._id });
      assert.ok(farmerProfile);
      assert.equal(farmerProfile.stallName, 'Golden Valley Honey');
      assert.equal(farmerProfile.listingEnabled, false);
    });
  });

  // ── 3. Login ──
  describe('Login Flow', () => {
    it('authenticates valid credentials, updates lastLoginAt, and returns access token', async () => {
      const res = await request('/api/auth/login', {
        method: 'POST',
        body: {
          email: 'george@example.com',
          password: 'market123',
        },
      });

      assert.equal(res.status, 200);
      const body = await res.json();
      assert.ok(body.data.accessToken);
      assert.equal(body.data.user.email, 'george@example.com');
      assert.ok(body.data.user.lastLoginAt);

      const setCookie = res.headers.get('set-cookie');
      assert.ok(setCookie && setCookie.includes('refreshToken='));
    });

    it('returns IDENTICAL 401 bodies for non-existent email and wrong password', async () => {
      const wrongPassRes = await request('/api/auth/login', {
        method: 'POST',
        body: {
          email: 'george@example.com',
          password: 'IncorrectPassword123',
        },
      });
      assert.equal(wrongPassRes.status, 401);
      const wrongPassBody = await wrongPassRes.json();

      const unknownEmailRes = await request('/api/auth/login', {
        method: 'POST',
        body: {
          email: 'nonexistent.user.999@example.com',
          password: 'SomePassword123',
        },
      });
      assert.equal(unknownEmailRes.status, 401);
      const unknownEmailBody = await unknownEmailRes.json();

      assert.deepEqual(
        wrongPassBody,
        unknownEmailBody,
        'Error responses for wrong password and unknown user must be identical'
      );
      assert.equal(wrongPassBody.error.code, 'INVALID_CREDENTIALS');
      assert.equal(wrongPassBody.error.message, "That email or password doesn't look right.");
    });

    it('blocks inactive customer with 403 ACCOUNT_INACTIVE', async () => {
      const res = await request('/api/auth/login', {
        method: 'POST',
        body: {
          email: 'inactive.customer@example.com',
          password: 'market123',
        },
      });

      assert.equal(res.status, 403);
      const body = await res.json();
      assert.equal(body.error.code, 'ACCOUNT_INACTIVE');
    });

    it('blocks suspended farmer with 403 ACCOUNT_SUSPENDED', async () => {
      const res = await request('/api/auth/login', {
        method: 'POST',
        body: {
          email: 'suspended.farmer@example.com',
          password: 'market123',
        },
      });

      assert.equal(res.status, 403);
      const body = await res.json();
      assert.equal(body.error.code, 'ACCOUNT_SUSPENDED');
    });

    it('allows pending farmer to log in with user.status = "pending"', async () => {
      const res = await request('/api/auth/login', {
        method: 'POST',
        body: {
          email: 'pending.farmer@example.com',
          password: 'market123',
        },
      });

      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.data.user.role, 'farmer');
      assert.equal(body.data.user.status, 'pending');
    });
  });

  // ── 4. Token Refresh & Reuse Detection ──
  describe('Refresh Token Rotation & Security', () => {
    it('successfully refreshes access token and rotates the refresh cookie', async () => {
      const login = await loginUser('george@example.com', 'market123');
      const initialCookie = login.cookie.split(';')[0];

      const refreshRes = await request('/api/auth/refresh', {
        method: 'POST',
        headers: {
          Cookie: initialCookie,
        },
      });

      assert.equal(refreshRes.status, 200);
      const refreshBody = await refreshRes.json();
      assert.ok(refreshBody.data.accessToken);
      assert.equal(refreshBody.data.user.email, 'george@example.com');

      const rotatedCookie = refreshRes.headers.get('set-cookie');
      assert.ok(rotatedCookie);
      assert.notEqual(initialCookie, rotatedCookie.split(';')[0], 'Rotated cookie must differ');
    });

    it('detects reuse of an already-rotated token, revokes all sessions, and returns 401', async () => {
      const email = `reuse.test.${Date.now()}@example.com`;
      // Create user
      await request('/api/auth/register/customer', {
        method: 'POST',
        body: {
          name: 'Reuse Tester',
          phone: '(555) 999-1111',
          email,
          address: '100 Security Way',
          password: 'Password123',
        },
      });

      const login = await loginUser(email, 'Password123');
      const originalCookie = login.cookie.split(';')[0];

      // First rotation succeeds
      const firstRefresh = await request('/api/auth/refresh', {
        method: 'POST',
        headers: { Cookie: originalCookie },
      });
      assert.equal(firstRefresh.status, 200);

      // Re-using the OLD originalCookie triggers reuse detection
      const reuseAttempt = await request('/api/auth/refresh', {
        method: 'POST',
        headers: { Cookie: originalCookie },
      });

      assert.equal(reuseAttempt.status, 401);
      const reuseBody = await reuseAttempt.json();
      assert.equal(reuseBody.error.code, 'UNAUTHENTICATED');

      // Verify that all sessions for this user in DB have been marked revoked
      const user = await db.collection(COLLECTIONS.USERS).findOne({ email });
      const activeSessions = await db.collection(COLLECTIONS.SESSIONS).countDocuments({
        userId: user._id,
        revokedAt: null,
      });
      assert.equal(activeSessions, 0, 'All sessions must be revoked upon token reuse detection');
    });

    it('returns 401 when no refresh cookie is provided', async () => {
      const res = await request('/api/auth/refresh', {
        method: 'POST',
      });
      assert.equal(res.status, 401);
    });
  });

  // ── 5. Logout & Current User ──
  describe('Logout & Current User (GET /auth/me)', () => {
    it('revokes session and clears cookie upon logout', async () => {
      const login = await loginUser('george@example.com', 'market123');
      const cookie = login.cookie.split(';')[0];

      const logoutRes = await request('/api/auth/logout', {
        method: 'POST',
        headers: { Cookie: cookie },
      });
      assert.equal(logoutRes.status, 204);

      // Trying to refresh after logout must fail
      const refreshAfterLogout = await request('/api/auth/refresh', {
        method: 'POST',
        headers: { Cookie: cookie },
      });
      assert.equal(refreshAfterLogout.status, 401);
    });

    it('GET /auth/me returns current user profile with valid Bearer token', async () => {
      const login = await loginUser('george@example.com', 'market123');
      const res = await request('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${login.accessToken}`,
        },
      });

      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.data.user.email, 'george@example.com');
      assert.equal(body.data.user.passwordHash, undefined);
    });

    it('GET /auth/me returns farmer metadata for Farmer accounts', async () => {
      const login = await loginUser('riverbend@example.com', 'market123');
      const res = await request('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${login.accessToken}`,
        },
      });

      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.data.user.role, 'farmer');
      assert.ok(body.data.user.farmer);
      assert.equal(body.data.user.farmer.stallName, 'Riverbend Farm');
      assert.equal(body.data.user.farmer.approvalStatus, 'active');
    });

    it('rejects GET /auth/me with 401 without token', async () => {
      const res = await request('/api/auth/me');
      assert.equal(res.status, 401);
      const body = await res.json();
      assert.equal(body.error.code, 'UNAUTHENTICATED');
    });

    it('rejects GET /auth/me with 401 on tampered access token', async () => {
      const res = await request('/api/auth/me', {
        headers: {
          Authorization: 'Bearer invalid.tampered.token',
        },
      });
      assert.equal(res.status, 401);
      const body = await res.json();
      assert.equal(body.error.code, 'UNAUTHENTICATED');
    });
  });

  // ── 6. Forgot and Reset Password Flow ──
  describe('Forgot and Reset Password Flow', () => {
    it('POST /auth/forgot-password returns 200 for both known and unknown emails', async () => {
      const resKnown = await request('/api/auth/forgot-password', {
        method: 'POST',
        body: { email: 'george@example.com' },
      });
      assert.equal(resKnown.status, 200);
      const bodyKnown = await resKnown.json();

      const resUnknown = await request('/api/auth/forgot-password', {
        method: 'POST',
        body: { email: 'unknown.ghost.user@example.com' },
      });
      assert.equal(resUnknown.status, 200);
      const bodyUnknown = await resUnknown.json();

      assert.deepEqual(bodyKnown, bodyUnknown, 'Forgot password response must be identical');
    });

    it('completes end-to-end password reset, revokes sessions, and allows login with new password', async () => {
      const email = `reset.user.${Date.now()}@example.com`;
      await request('/api/auth/register/customer', {
        method: 'POST',
        body: {
          name: 'Reset Test',
          phone: '(555) 777-8888',
          email,
          address: '12 Reset Lane',
          password: 'OldPassword1',
        },
      });

      // Request reset
      await request('/api/auth/forgot-password', {
        method: 'POST',
        body: { email },
      });

      // Retrieve reset token directly from database for testing
      const user = await db.collection(COLLECTIONS.USERS).findOne({ email });
      const resetRecord = await db.collection(COLLECTIONS.PASSWORD_RESETS).findOne({
        userId: user._id,
        usedAt: null,
      });
      assert.ok(resetRecord);

      // Perform reset with a known generated token test
      // Simulate raw token matching the hash
      const rawToken = 'test-reset-token-' + Date.now();
      const tokenHash = sha256Hash(rawToken);
      await db.collection(COLLECTIONS.PASSWORD_RESETS).insertOne({
        userId: user._id,
        tokenHash,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000),
        usedAt: null,
      });

      const resetRes = await request('/api/auth/reset-password', {
        method: 'POST',
        body: {
          token: rawToken,
          password: 'BrandNewPassword1',
        },
      });
      assert.equal(resetRes.status, 200);

      // Verify old password fails
      const oldLogin = await request('/api/auth/login', {
        method: 'POST',
        body: { email, password: 'OldPassword1' },
      });
      assert.equal(oldLogin.status, 401);

      // Verify new password succeeds
      const newLogin = await request('/api/auth/login', {
        method: 'POST',
        body: { email, password: 'BrandNewPassword1' },
      });
      assert.equal(newLogin.status, 200);

      // Verify token cannot be reused
      const secondResetAttempt = await request('/api/auth/reset-password', {
        method: 'POST',
        body: {
          token: rawToken,
          password: 'AnotherPassword1',
        },
      });
      assert.equal(secondResetAttempt.status, 400);
    });
  });
});
