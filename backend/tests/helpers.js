/**
 * Test helpers and harness for node:test test suites.
 * Spawns an isolated HTTP server on an ephemeral port against the 'marketlink_test' database.
 */

import http from 'node:http';

// Configure test environment variables before module dependencies evaluate
process.env.NODE_ENV = 'test';
process.env.DB_NAME = 'marketlink_test';
process.env.RATE_LIMIT_DISABLED = 'true';
process.env.STORAGE_DRIVER = 'memory';

import { connectDb, closeDb, getDb } from '../src/db/client.js';
import { createApp } from '../src/app.js';
import { runSeed } from '../src/db/seed.js';
import { assertSafeDatabase } from '../src/db/safetyGuard.js';

let testServerInstance = null;
let testBaseUrl = '';

/**
 * Initializes and starts the test server on an ephemeral random port.
 * Connects to the test database and seeds it.
 *
 * @returns {Promise<{ baseUrl: string, db: import('mongodb').Db, close: () => Promise<void> }>}
 */
export async function setupTestEnvironment() {
  process.env.NODE_ENV = 'test';
  const testDbName = process.env.TEST_DB_NAME || 'marketlink_test';
  process.env.DB_NAME = testDbName;
  process.env.RATE_LIMIT_DISABLED = 'true';
  process.env.STORAGE_DRIVER = 'memory';

  assertSafeDatabase(testDbName, process.env.MONGODB_URI, 'test database setup', {
    nodeEnv: 'test',
  });

  // 1. Connect to test database and ensure seeded once
  const db = await connectDb(process.env.MONGODB_URI, testDbName);
  const userCount = await db.collection('users').countDocuments();
  if (userCount === 0) {
    await runSeed(true);
  }

  // 2. Start Express app on random port (0)
  const app = createApp();
  testServerInstance = http.createServer(app);

  await new Promise((resolve) => {
    testServerInstance.listen(0, '127.0.0.1', () => {
      const addr = testServerInstance.address();
      testBaseUrl = `http://127.0.0.1:${addr.port}`;
      resolve();
    });
  });

  return {
    baseUrl: testBaseUrl,
    db,
    close: teardownTestEnvironment,
  };
}

/**
 * Gracefully shuts down the test server and database connection.
 */
export async function teardownTestEnvironment() {
  if (testServerInstance) {
    await new Promise((resolve) => testServerInstance.close(resolve));
    testServerInstance = null;
  }
  await closeDb(false);
}

/**
 * Wrapper for native fetch targeting the test server.
 *
 * @param {string} path - e.g. '/api/health'
 * @param {RequestInit} [options]
 * @returns {Promise<Response>}
 */
export async function request(path, options = {}) {
  const url = `${testBaseUrl}${path.startsWith('/') ? path : '/' + path}`;
  const headers = { ...options.headers };

  let body = options.body;
  if (options.rawBody !== undefined) {
    body = options.rawBody;
  } else if (body && typeof body === 'object' && !Buffer.isBuffer(body) && !(body instanceof Uint8Array)) {
    headers['Content-Type'] = headers['Content-Type'] || 'application/json';
    body = JSON.stringify(body);
  }

  return fetch(url, {
    ...options,
    body,
    headers,
  });
}

/**
 * Helper to log in a user and return the access token and set-cookie string.
 *
 * @param {string} email
 * @param {string} [password='market123']
 * @returns {Promise<{ accessToken: string, cookie: string, user: any }>}
 */
export async function loginUser(email, password = 'market123') {
  const res = await request('/api/auth/login', {
    method: 'POST',
    body: { email, password },
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(`Login failed for ${email}: ${JSON.stringify(err)}`);
  }

  const setCookie = res.headers.get('set-cookie') || '';
  const body = await res.json();

  return {
    accessToken: body.data.accessToken,
    cookie: setCookie,
    user: body.data.user,
  };
}

let cachedDbLatency = null;
/**
 * Measures single round-trip ping latency to database.
 * Returns ~0ms on local MongoDB and ~100-200ms on remote Atlas clusters.
 */
export async function getDbLatency(db) {
  if (cachedDbLatency !== null) return cachedDbLatency;
  try {
    const t0 = performance.now();
    await db.command({ ping: 1 });
    cachedDbLatency = Math.round(performance.now() - t0);
  } catch {
    cachedDbLatency = 0;
  }
  return cachedDbLatency;
}

