/**
 * Assistant Routes Integration Tests.
 * Tests JSON endpoint contract, SSE streaming format, input validation,
 * authentication/role gates, and Admin key pool status endpoint.
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { setupTestEnvironment, teardownTestEnvironment, request, loginUser } from './helpers.js';

describe('Assistant Routes Suite', () => {
  let customerGeorgeAuth;
  let farmerRiverbendAuth;
  let adminAuth;

  before(async () => {
    await setupTestEnvironment();
    customerGeorgeAuth = await loginUser('george@example.com', 'market123');
    farmerRiverbendAuth = await loginUser('riverbend@example.com', 'market123');
    adminAuth = await loginUser('admin@marketlink.test', 'Admin12345');
  });

  after(async () => {
    await teardownTestEnvironment();
  });

  it('POST /api/assistant/message requires customer authentication (401 / 403)', async () => {
    // 401 without auth
    const resNoAuth = await request('/api/assistant/message', {
      method: 'POST',
      body: { text: 'Hello' },
    });
    assert.equal(resNoAuth.status, 401);

    // 403 for farmer role without customer role
    const resFarmer = await request('/api/assistant/message', {
      method: 'POST',
      headers: { Authorization: `Bearer ${farmerRiverbendAuth.accessToken}` },
      body: { text: 'Hello' },
    });
    assert.equal(resFarmer.status, 403);
  });

  it('POST /api/assistant/message enforces validation rules (422)', async () => {
    // Empty text
    const resEmpty = await request('/api/assistant/message', {
      method: 'POST',
      headers: { Authorization: `Bearer ${customerGeorgeAuth.accessToken}` },
      body: { text: '' },
    });
    assert.equal(resEmpty.status, 422);

    // Text too long (> 300 chars)
    const resTooLong = await request('/api/assistant/message', {
      method: 'POST',
      headers: { Authorization: `Bearer ${customerGeorgeAuth.accessToken}` },
      body: { text: 'a'.repeat(301) },
    });
    assert.equal(resTooLong.status, 422);

    // Unknown fields
    const resUnknown = await request('/api/assistant/message', {
      method: 'POST',
      headers: { Authorization: `Bearer ${customerGeorgeAuth.accessToken}` },
      body: { text: 'Hello', maliciousField: true },
    });
    assert.equal(resUnknown.status, 422);
  });

  it('POST /api/assistant/message returns backward-compatible standard JSON response', async () => {
    const res = await request('/api/assistant/message', {
      method: 'POST',
      headers: { Authorization: `Bearer ${customerGeorgeAuth.accessToken}` },
      body: { text: 'When is Elm Street Market open?' },
    });

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.ok(body.data);
    assert.ok(typeof body.data.reply === 'string');
    assert.ok(Array.isArray(body.data.cards));
    assert.ok(Array.isArray(body.data.suggestions));
  });

  it('POST /api/assistant/message?stream=1 streams Server-Sent Events', async () => {
    const res = await request('/api/assistant/message?stream=1', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${customerGeorgeAuth.accessToken}`,
        Accept: 'text/event-stream',
      },
      body: { text: 'Who sells eggs?' },
    });

    assert.equal(res.status, 200);
    const contentType = res.headers.get('content-type');
    assert.ok(contentType.includes('text/event-stream'));

    const rawText = await res.text();
    assert.ok(rawText.includes('data:'));
    assert.ok(rawText.includes('"done":true'));
  });

  it('GET /api/admin/assistant/status is protected for Admin only', async () => {
    // 401 unauthenticated
    const resNoAuth = await request('/api/admin/assistant/status');
    assert.equal(resNoAuth.status, 401);

    // 403 customer
    const resCust = await request('/api/admin/assistant/status', {
      headers: { Authorization: `Bearer ${customerGeorgeAuth.accessToken}` },
    });
    assert.equal(resCust.status, 403);

    // 200 admin
    const resAdmin = await request('/api/admin/assistant/status', {
      headers: { Authorization: `Bearer ${adminAuth.accessToken}` },
    });
    assert.equal(resAdmin.status, 200);
    const body = await resAdmin.json();
    assert.ok(Array.isArray(body.data));
    for (const item of body.data) {
      assert.ok(item.maskedKey.includes('...'));
      assert.equal(typeof item.requestsLastMinute, 'number');
    }
  });
});
