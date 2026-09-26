/**
 * Users profile management and security test suite.
 * Tests profile retrieval, partial patching, password changing, and session invalidation.
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { setupTestEnvironment, teardownTestEnvironment, request, loginUser } from './helpers.js';
import { COLLECTIONS } from '../src/db/collections.js';

describe('Users Module Suite', () => {
  let db;

  before(async () => {
    const env = await setupTestEnvironment();
    db = env.db;
  });

  after(async () => {
    await teardownTestEnvironment();
  });

  it('GET /api/users/me returns full authenticated user profile', async () => {
    const login = await loginUser('george@example.com', 'market123');
    const res = await request('/api/users/me', {
      headers: {
        Authorization: `Bearer ${login.accessToken}`,
      },
    });

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.data.user.email, 'george@example.com');
    assert.equal(body.data.user.name, 'George Adams');
    assert.equal(body.data.user.passwordHash, undefined);
  });

  it('PATCH /api/users/me updates permitted fields', async () => {
    const login = await loginUser('george@example.com', 'market123');
    const res = await request('/api/users/me', {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${login.accessToken}`,
      },
      body: {
        phone: '(555) 999-8888',
        address: '99 New Horizon Lane',
        notificationPrefs: {
          orderUpdates: true,
          readyAlerts: true,
          weeklyPicks: true,
          restockAlerts: true,
        },
      },
    });

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.data.user.phone, '(555) 999-8888');
    assert.equal(body.data.user.address, '99 New Horizon Lane');
    assert.equal(body.data.user.notificationPrefs.restockAlerts, true);
  });

  it('PATCH /api/users/me rejects unknown or immutable fields with 422', async () => {
    const login = await loginUser('george@example.com', 'market123');
    const res = await request('/api/users/me', {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${login.accessToken}`,
      },
      body: {
        email: 'newemail@example.com', // Immutable
      },
    });

    assert.equal(res.status, 422);
    const body = await res.json();
    assert.equal(body.error.code, 'VALIDATION_FAILED');
  });

  it('POST /api/users/me/password changes password when current password is valid', async () => {
    // Create dedicated user
    const email = `pass.change.${Date.now()}@example.com`;
    await request('/api/auth/register/customer', {
      method: 'POST',
      body: {
        name: 'Pass User',
        phone: '(555) 321-4321',
        email,
        address: '55 Secure Way',
        password: 'OriginalPassword1',
      },
    });

    const login = await loginUser(email, 'OriginalPassword1');

    // Wrong current password fails
    const failRes = await request('/api/users/me/password', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${login.accessToken}`,
      },
      body: {
        currentPassword: 'WrongPassword1',
        newPassword: 'BrandNewPassword2',
      },
    });
    assert.equal(failRes.status, 401);

    // Valid current password succeeds
    const successRes = await request('/api/users/me/password', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${login.accessToken}`,
      },
      body: {
        currentPassword: 'OriginalPassword1',
        newPassword: 'BrandNewPassword2',
      },
    });
    assert.equal(successRes.status, 200);

    // Login with new password works
    const newLogin = await loginUser(email, 'BrandNewPassword2');
    assert.ok(newLogin.accessToken);
  });

  it('DELETE /api/users/me/sessions signs out everywhere and invalidates sessions', async () => {
    const login = await loginUser('george@example.com', 'market123');
    const res = await request('/api/users/me/sessions', {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${login.accessToken}`,
      },
    });

    assert.equal(res.status, 200);

    // Verify in DB that active sessions are zero
    const activeSessions = await db.collection(COLLECTIONS.SESSIONS).countDocuments({
      userId: login.user.id,
      revokedAt: null,
    });
    assert.equal(activeSessions, 0);
  });
});
