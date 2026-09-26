/**
 * Safety guard for destructive database operations (drop, seed, test reset).
 * Prevents accidental data destruction by strictly verifying database names and environments.
 */

import { maskUri } from '../utils/maskUri.js';

/**
 * Checks whether a database name is safe for destructive operations.
 *
 * @param {string} dbName - Target database name
 * @param {string} uri - Connection string (for logging masked host)
 * @param {object} options
 * @param {boolean} [options.isExplicitDevSeed=false] - True if this is an explicit 'seed' command in development
 * @param {string} [options.nodeEnv='development'] - Current NODE_ENV
 * @param {boolean} [options.force=false] - Explicit override flag
 * @returns {{ safe: boolean, error?: string, maskedHost: string }}
 */
export function verifyDestructiveSafety(dbName, uri, options = {}) {
  const { isExplicitDevSeed = false, nodeEnv = 'development', force = false } = options;

  let maskedHost = 'unknown';
  try {
    const parsed = new URL(uri.replace(/^mongodb\+srv:\/\//, 'http://').replace(/^mongodb:\/\//, 'http://'));
    maskedHost = parsed.host;
  } catch {
    maskedHost = 'masked-cluster';
  }

  if (force) {
    return { safe: true, maskedHost };
  }

  // If the database ends with '_test', it is always allowed for tests/wipes
  if (dbName && dbName.endsWith('_test')) {
    return { safe: true, maskedHost };
  }

  // In development, explicit seed against the dev database is allowed
  if (isExplicitDevSeed && nodeEnv === 'development' && dbName && !dbName.endsWith('_test')) {
    return { safe: true, maskedHost };
  }

  const error = `[SAFETY GUARD] Refusing destructive operation on non-test database "${dbName}" in environment "${nodeEnv}". Destructive actions are restricted to databases ending with "_test" unless running explicit development seed or passing --force.`;
  return { safe: false, error, maskedHost };
}

/**
 * Throws an Error if destructive action is unsafe.
 * Logs target database and masked host on success.
 *
 * @param {string} dbName
 * @param {string} uri
 * @param {string} actionName
 * @param {object} [options]
 */
export function assertSafeDatabase(dbName, uri, actionName = 'destructive operation', options = {}) {
  const result = verifyDestructiveSafety(dbName, uri, options);
  if (!result.safe) {
    throw new Error(result.error);
  }
  console.log(`[SAFETY GUARD] Verified ${actionName} on target database: "${dbName}" at host: ${result.maskedHost}`);
}