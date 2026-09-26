/**
 * Assistant Fallback Unit & Integration Tests.
 * Verifies that when Gemini is disabled, has zero keys, or all keys hit rate limits,
 * the assistant transparently routes queries through the deterministic rule-based matcher.
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { setupTestEnvironment, teardownTestEnvironment, loginUser } from './helpers.js';
import { processAssistantMessage } from '../src/modules/assistant/assistant.service.js';
import { KeyPool } from '../src/modules/assistant/keyPool.js';

describe('Assistant Fallback Mechanism Suite', () => {
  let customerGeorgeAuth;

  before(async () => {
    await setupTestEnvironment();
    customerGeorgeAuth = await loginUser('george@example.com', 'market123');
  });

  after(async () => {
    await teardownTestEnvironment();
  });

  it('routes through rule-based matcher when key pool is empty', async () => {
    const emptyPool = new KeyPool([]);

    const res = await processAssistantMessage({
      text: 'When is Elm Street Market open?',
      user: customerGeorgeAuth.user,
      keyPool: emptyPool,
    });

    assert.ok(res.reply.includes('Elm Street'));
    assert.equal(res.cards[0].type, 'market');
    assert.ok(res.provider.startsWith('rules'));
  });

  it('transparently falls back to rule-based assistant when all keys are cooling down', async () => {
    const keys = [
      'MOCK_FALLBACK_KEY_001_ABCDEF12345',
      'MOCK_FALLBACK_KEY_002_UVWXYZ67890',
    ];
    const pool = new KeyPool(keys);

    // Simulate rate-limiting all keys
    pool.reportRateLimited(0, 60);
    pool.reportRateLimited(1, 60);

    const res = await processAssistantMessage({
      text: 'Who sells eggs?',
      user: customerGeorgeAuth.user,
      keyPool: pool,
    });

    assert.ok(res.reply.length > 0);
    assert.ok(res.provider.startsWith('rules'));
  });

  it('answers order status questions via fallback when Gemini is busy', async () => {
    const pool = new KeyPool([]);

    const res = await processAssistantMessage({
      text: 'Where is my order?',
      user: customerGeorgeAuth.user,
      keyPool: pool,
    });

    assert.ok(res.reply.includes('order') || res.reply.includes('pre-order'));
    assert.ok(res.provider.startsWith('rules'));
  });

  it('emits streaming chunks even during fallback so UI does not stall', async () => {
    const pool = new KeyPool([]);
    const chunks = [];

    const res = await processAssistantMessage({
      text: "What's fresh on Saturday?",
      user: customerGeorgeAuth.user,
      keyPool: pool,
      onChunk: ({ textChunk }) => {
        chunks.push(textChunk);
      },
    });

    assert.ok(chunks.length > 0);
    assert.equal(chunks.join(''), res.reply);
  });
});
