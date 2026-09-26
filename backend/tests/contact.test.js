/**
 * Contact message submission test suite.
 * Validates message storage, payload schema constraints, and rate limiting.
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { setupTestEnvironment, teardownTestEnvironment, request } from './helpers.js';
import { COLLECTIONS } from '../src/db/collections.js';

describe('Contact Module Suite', () => {
  let db;

  before(async () => {
    const env = await setupTestEnvironment();
    db = env.db;
  });

  after(async () => {
    await teardownTestEnvironment();
  });

  it('stores a valid contact message in contactMessages collection with 201 Created', async () => {
    const email = `contact.${Date.now()}@example.com`;
    const res = await request('/api/contact', {
      method: 'POST',
      body: {
        name: 'Curious Customer',
        email,
        topic: 'order',
        message: 'Hello, I would like to know if pre-orders can be collected by a friend.',
      },
    });

    assert.equal(res.status, 201);
    const body = await res.json();
    assert.ok(body.data.message);

    // Verify stored in MongoDB
    const doc = await db.collection(COLLECTIONS.CONTACT_MESSAGES).findOne({ email });
    assert.ok(doc);
    assert.equal(doc.name, 'Curious Customer');
    assert.equal(doc.topic, 'order');
    assert.ok(doc.createdAt instanceof Date);
  });

  it('rejects invalid topic, empty message, and oversize message with 422', async () => {
    // 1. Invalid topic
    const resBadTopic = await request('/api/contact', {
      method: 'POST',
      body: {
        name: 'Jane Doe',
        email: 'jane@example.com',
        topic: 'invalid-topic-name',
        message: 'Testing invalid topic.',
      },
    });
    assert.equal(resBadTopic.status, 422);

    // 2. Empty message
    const resEmptyMsg = await request('/api/contact', {
      method: 'POST',
      body: {
        name: 'Jane Doe',
        email: 'jane@example.com',
        topic: 'feedback',
        message: '',
      },
    });
    assert.equal(resEmptyMsg.status, 422);

    // 3. Oversize message (> 2000 chars)
    const longMessage = 'A'.repeat(2005);
    const resOversize = await request('/api/contact', {
      method: 'POST',
      body: {
        name: 'Jane Doe',
        email: 'jane@example.com',
        topic: 'feedback',
        message: longMessage,
      },
    });
    assert.equal(resOversize.status, 422);
  });

  it('triggers 429 RATE_LIMITED when rate limiting is explicitly enabled', async () => {
    const headers = { 'x-enable-rate-limit': 'true' };
    const payload = {
      name: 'Rate Tester',
      email: 'rate@example.com',
      topic: 'other',
      message: 'Rate limit test message.',
    };

    // The contact limit is 5 per hour. Sending 6 requests with rate limiting enabled.
    let hit429 = false;
    for (let i = 0; i < 7; i++) {
      const res = await request('/api/contact', {
        method: 'POST',
        headers,
        body: payload,
      });
      if (res.status === 429) {
        hit429 = true;
        const body = await res.json();
        assert.equal(body.error.code, 'RATE_LIMITED');
        break;
      }
    }
    assert.ok(hit429, 'Must trigger 429 RATE_LIMITED after exceeding threshold');
  });
});
