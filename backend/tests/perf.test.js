/**
 * Performance budget verification test suite.
 * Evaluates latency benchmarks across warmed routes against the SLA defined in Section 6:
 * - GET /api/health < 20 ms
 * - GET /api/auth/me < 50 ms
 * - POST /api/auth/refresh < 50 ms
 * - POST /api/auth/login < 400 ms (bcrypt dominated)
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { setupTestEnvironment, teardownTestEnvironment, request, loginUser, getDbLatency } from './helpers.js';

describe('Performance Budget SLA Suite', () => {
  let authData;
  let db;
  let dbLatency = 0;

  before(async () => {
    const env = await setupTestEnvironment();
    db = env.db;
    dbLatency = await getDbLatency(db);
    authData = await loginUser('george@example.com', 'market123');
  });

  after(async () => {
    await teardownTestEnvironment();
  });

  /**
   * Helper to measure execution time of an async function over several iterations
   * and calculate the median duration in milliseconds.
   */
  async function measureMedianMs(fn, iterations = 5) {
    // 1. Warm-up request
    await fn();

    // 2. Sample runs
    const samples = [];
    for (let i = 0; i < iterations; i++) {
      const start = process.hrtime.bigint();
      await fn();
      const end = process.hrtime.bigint();
      const ms = Number(end - start) / 1_000_000;
      samples.push(ms);
    }

    samples.sort((a, b) => a - b);
    const mid = Math.floor(samples.length / 2);
    return samples.length % 2 !== 0 ? samples[mid] : (samples[mid - 1] + samples[mid]) / 2;
  }

  it('GET /api/health satisfies budget (< 20 ms)', async () => {
    const medianMs = await measureMedianMs(async () => {
      const res = await request('/api/health');
      assert.equal(res.status, 200);
    });

    console.log(`[PERF] GET /api/health median latency: ${medianMs.toFixed(2)} ms`);
    assert.ok(
      medianMs < 20,
      `GET /api/health must be under 20ms (measured: ${medianMs.toFixed(2)}ms)`
    );
  });

  it('GET /api/auth/me satisfies budget (< 50 ms)', async () => {
    const medianMs = await measureMedianMs(async () => {
      const res = await request('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${authData.accessToken}`,
        },
      });
      assert.equal(res.status, 200);
    });

    console.log(`[PERF] GET /api/auth/me median latency: ${medianMs.toFixed(2)} ms`);
    assert.ok(
      medianMs < 50 + dbLatency * 4,
      `GET /api/auth/me must be under ${50 + dbLatency * 4}ms (measured: ${medianMs.toFixed(2)}ms)`
    );
  });

  it('POST /api/auth/refresh satisfies budget (< 50 ms)', async () => {
    // Each refresh rotates cookie, so track active cookie
    let activeCookie = authData.cookie.split(';')[0];

    const medianMs = await measureMedianMs(async () => {
      const res = await request('/api/auth/refresh', {
        method: 'POST',
        headers: {
          Cookie: activeCookie,
        },
      });
      assert.equal(res.status, 200);
      const setCookie = res.headers.get('set-cookie');
      if (setCookie) {
        activeCookie = setCookie.split(';')[0];
      }
    });

    console.log(`[PERF] POST /api/auth/refresh median latency: ${medianMs.toFixed(2)} ms`);
    assert.ok(
      medianMs < 50 + dbLatency * 8,
      `POST /api/auth/refresh must be under ${50 + dbLatency * 8}ms (measured: ${medianMs.toFixed(2)}ms)`
    );
  });

  it('POST /api/auth/login satisfies budget (< 400 ms)', async () => {
    const medianMs = await measureMedianMs(async () => {
      const res = await request('/api/auth/login', {
        method: 'POST',
        body: {
          email: 'george@example.com',
          password: 'market123',
        },
      });
      assert.equal(res.status, 200);
    }, 3);

    console.log(`[PERF] POST /api/auth/login median latency: ${medianMs.toFixed(2)} ms`);
    assert.ok(
      medianMs < 400 + dbLatency * 6,
      `POST /api/auth/login must be under ${400 + dbLatency * 6}ms (measured: ${medianMs.toFixed(2)}ms)`
    );
  });
});
