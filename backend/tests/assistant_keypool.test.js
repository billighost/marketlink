/**
 * Key Pool and Multi-Key Rotation Unit Tests.
 * Verifies round-robin order, rate-limit cooldowns, exponential backoff with jitter,
 * local sliding-window RPM throttling, non-transient auth error handling, and key masking security.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { KeyPool, maskKey, callWithKeyRotation } from '../src/modules/assistant/keyPool.js';

describe('Gemini KeyPool and Rotation Suite', () => {
  const sampleKeys = [
    'MOCK_KEY_ALPHA_1234567890_TEST_A1',
    'MOCK_KEY_BRAVO_1234567890_TEST_B2',
    'MOCK_KEY_CHARL_1234567890_TEST_C3',
  ];

  it('masks keys securely and never reveals full string', () => {
    const masked = maskKey('MOCK_KEY_ALPHA_1234567890_TEST_A1');
    assert.equal(masked, 'MOCK...T_A1');
    assert.equal(masked.length, 11);
    assert.equal(maskKey('short'), 'sh...rt');
    assert.equal(maskKey(null), '****');
  });

  it('initializes pool and enforces round-robin rotation', () => {
    const pool = new KeyPool(sampleKeys, { rpmPerKey: 10 });
    assert.equal(pool.length, 3);

    const pick1 = pool.pickKey();
    assert.equal(pick1.entry.index, 0);

    const pick2 = pool.pickKey();
    assert.equal(pick2.entry.index, 1);

    const pick3 = pool.pickKey();
    assert.equal(pick3.entry.index, 2);

    // Wraps around
    const pick4 = pool.pickKey();
    assert.equal(pick4.entry.index, 0);
  });

  it('skips a cooling down key until cooldown expires', () => {
    const pool = new KeyPool(sampleKeys, { rpmPerKey: 10 });
    const now = 1000000;

    // Pick key 0 and report rate-limited for 10s
    const pick1 = pool.pickKey(now);
    assert.equal(pick1.entry.index, 0);
    pool.reportRateLimited(0, 10, now);

    // Next pick should skip index 0 and return index 1
    const pick2 = pool.pickKey(now);
    assert.equal(pick2.entry.index, 1);

    // Third pick returns index 2
    const pick3 = pool.pickKey(now);
    assert.equal(pick3.entry.index, 2);

    // Fourth pick returns index 1 (since index 0 is still cooling down)
    const pick4 = pool.pickKey(now);
    assert.equal(pick4.entry.index, 1);

    // Advance time past cooldown: index 0 is now eligible again
    const pick5 = pool.pickKey(now + 11000);
    assert.equal(pick5.entry.index, 2);
    const pick6 = pool.pickKey(now + 11000);
    assert.equal(pick6.entry.index, 0);
  });

  it('applies exponential backoff on consecutive rate limits', () => {
    const pool = new KeyPool(sampleKeys, { rpmPerKey: 10 });
    const now = 500000;

    pool.reportRateLimited(0, null, now);
    const firstCooldown = pool.pool[0].cooldownUntil - now;
    // 2^1 * 1000 = 2000 +/- 20% -> [1600, 2400]
    assert.ok(firstCooldown >= 1500 && firstCooldown <= 2600);

    pool.reportRateLimited(0, null, now);
    const secondCooldown = pool.pool[0].cooldownUntil - now;
    // 2^2 * 1000 = 4000 +/- 20% -> [3200, 4800]
    assert.ok(secondCooldown >= 3000 && secondCooldown <= 5200);

    // Success resets consecutive errors
    pool.reportSuccess(0, now);
    assert.equal(pool.pool[0].consecutiveErrors, 0);
  });

  it('enforces local sliding-window RPM throttling', () => {
    const pool = new KeyPool(sampleKeys, { rpmPerKey: 2 });
    const now = 2000000;

    // Key 0: 2 requests
    pool.reportSuccess(0, now);
    pool.reportSuccess(0, now + 1000);

    // Key 1: 2 requests
    pool.reportSuccess(1, now);
    pool.reportSuccess(1, now + 1000);

    // Key 2: 2 requests
    pool.reportSuccess(2, now);
    pool.reportSuccess(2, now + 1000);

    // Now all keys have 2 requests in the last 60s
    const pick = pool.pickKey(now + 2000);
    assert.equal(pick.isThrottled, true);

    // After 61 seconds, sliding window slides and keys are available again
    const pickLater = pool.pickKey(now + 65000);
    assert.equal(pickLater.isThrottled, false);
    assert.ok(pickLater.entry !== null);
  });

  it('puts key on 1h cooldown on 401/403 non-transient auth error', () => {
    const pool = new KeyPool(sampleKeys, { rpmPerKey: 10 });
    const now = 100000;

    pool.reportError(0, false, now); // false = non-transient
    assert.equal(pool.pool[0].cooldownUntil, now + 3600000);

    // Subsequent pick should immediately skip index 0
    const pick = pool.pickKey(now);
    assert.equal(pick.entry.index, 1);
  });

  it('callWithKeyRotation retries across keys on 429 and succeeds on next available key', async () => {
    const pool = new KeyPool(sampleKeys, { rpmPerKey: 10 });
    let attempts = 0;

    const result = await callWithKeyRotation(async (key, index) => {
      attempts += 1;
      if (index === 0) {
        const err = new Error('Quota exceeded');
        err.status = 429;
        throw err;
      }
      return `success-from-${index}`;
    }, pool);

    assert.equal(result, 'success-from-1');
    assert.equal(attempts, 2);
    assert.ok(pool.pool[0].cooldownUntil > Date.now());
  });

  it('callWithKeyRotation throws ASSISTANT_BUSY if all keys fail or cooling down', async () => {
    const pool = new KeyPool(sampleKeys, { rpmPerKey: 10 });

    await assert.rejects(
      async () => {
        await callWithKeyRotation(async () => {
          const err = new Error('429 RESOURCE_EXHAUSTED');
          err.status = 429;
          throw err;
        }, pool);
      },
      (err) => {
        assert.equal(err.statusCode, 503);
        assert.equal(err.code, 'ASSISTANT_BUSY');
        return true;
      }
    );
  });

  it('getStatus returns masked keys without exposing secrets', () => {
    const pool = new KeyPool(sampleKeys, { rpmPerKey: 10 });
    const status = pool.getStatus();

    assert.equal(status.length, 3);
    for (const item of status) {
      assert.ok(item.maskedKey.includes('...'));
      assert.ok(!item.maskedKey.includes('In9Zu89l3hyDKPvlb46y9TXOsjfTh1XKOnJzXcW'));
      assert.equal(typeof item.requestsLastMinute, 'number');
    }
  });
});
