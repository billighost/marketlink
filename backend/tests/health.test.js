/**
 * Health and readiness endpoint tests.
 * Verifies load-balancer ping, database connectivity probe, and 404 error formatting.
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { setupTestEnvironment, teardownTestEnvironment, request } from './helpers.js';

describe('Health and System Endpoints', () => {
  before(async () => {
    await setupTestEnvironment();
  });

  after(async () => {
    await teardownTestEnvironment();
  });

  it('GET /api/health returns 200 OK without database overhead', async () => {
    const res = await request('/api/health');
    assert.equal(res.status, 200);

    const body = await res.json();
    assert.equal(body.data.status, 'ok');
    assert.equal(typeof body.data.uptimeSec, 'number');
    assert.ok(Date.parse(body.data.time) > 0);
  });

  it('GET /api/ready returns 200 with DB ping', async () => {
    const res = await request('/api/ready');
    assert.equal(res.status, 200);

    const body = await res.json();
    assert.equal(body.data.status, 'ready');
    assert.equal(body.data.db, 'connected');
  });

  it('GET /api/non-existent-route returns standard 404 error shape', async () => {
    const res = await request('/api/non-existent-route');
    assert.equal(res.status, 404);

    const body = await res.json();
    assert.ok(body.error);
    assert.equal(body.error.code, 'NOT_FOUND');
    assert.ok(body.error.message.includes('/api/non-existent-route'));
  });
});
