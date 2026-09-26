/**
 * Multi-Key Rotation and Pool Management for Gemini API.
 * Handles round-robin selection, rate-limit backoff, local sliding-window RPM throttling,
 * and automatic failover across multiple keys.
 */

import { env } from '../../config/env.js';
import { AppError } from '../../utils/errors.js';

export function maskKey(key) {
  if (!key || typeof key !== 'string') return '****';
  if (key.length <= 8) return `${key.slice(0, 2)}...${key.slice(-2)}`;
  return `${key.slice(0, 4)}...${key.slice(-4)}`;
}

export class KeyPool {
  /**
   * @param {string[]|string} [keys]
   * @param {object} [options]
   * @param {number} [options.rpmPerKey]
   */
  constructor(keys, options = {}) {
    const rawKeys = Array.isArray(keys)
      ? keys
      : typeof keys === 'string'
      ? keys.split(',')
      : (env.GEMINI_API_KEYS || []);

    this.rpmPerKey = options.rpmPerKey || env.GEMINI_RPM_PER_KEY || 10;
    this.lastUsedIndex = -1;

    this.pool = rawKeys
      .map((k) => (typeof k === 'string' ? k.trim() : ''))
      .filter((k) => k.length >= 20)
      .map((key, index) => ({
        key,
        index,
        masked: maskKey(key),
        cooldownUntil: 0,
        consecutiveErrors: 0,
        requestTimestamps: [],
      }));
  }

  get length() {
    return this.pool.length;
  }

  /**
   * Cleans sliding window timestamps older than 60s for a key entry.
   * @param {object} entry
   * @param {number} now
   * @returns {number} requests in last 60 seconds
   */
  getRequestsLastMinute(entry, now = Date.now()) {
    const windowStart = now - 60000;
    entry.requestTimestamps = entry.requestTimestamps.filter((t) => t > windowStart);
    return entry.requestTimestamps.length;
  }

  /**
   * Picks the next available key entry using round-robin order.
   * If all keys are cooling down, returns the entry with the earliest cooldownUntil and sets `allCoolingDown: true`.
   *
   * @param {number} [now=Date.now()]
   * @returns {{ entry: object|null, allCoolingDown: boolean, isThrottled: boolean }}
   */
  pickKey(now = Date.now()) {
    if (this.pool.length === 0) {
      return { entry: null, allCoolingDown: true, isThrottled: false };
    }

    let candidate = null;
    let soonestCooldownEntry = null;

    // Search round-robin starting after lastUsedIndex
    for (let i = 0; i < this.pool.length; i++) {
      const idx = (this.lastUsedIndex + 1 + i) % this.pool.length;
      const entry = this.pool[idx];

      if (entry.cooldownUntil <= now) {
        // Key is not in cooldown. Check local sliding window RPM
        const reqCount = this.getRequestsLastMinute(entry, now);
        if (reqCount < this.rpmPerKey) {
          candidate = entry;
          this.lastUsedIndex = idx;
          break;
        }
      } else {
        if (!soonestCooldownEntry || entry.cooldownUntil < soonestCooldownEntry.cooldownUntil) {
          soonestCooldownEntry = entry;
        }
      }
    }

    if (candidate) {
      return { entry: candidate, allCoolingDown: false, isThrottled: false };
    }

    // Check if any keys are ready but hit local sliding window RPM
    const uncooledEntries = this.pool.filter((e) => e.cooldownUntil <= now);
    if (uncooledEntries.length > 0) {
      return { entry: uncooledEntries[0], allCoolingDown: false, isThrottled: true };
    }

    return { entry: soonestCooldownEntry, allCoolingDown: true, isThrottled: false };
  }

  /**
   * Records a successful API call for the key.
   * @param {number} index
   * @param {number} [now=Date.now()]
   */
  reportSuccess(index, now = Date.now()) {
    const entry = this.pool[index];
    if (!entry) return;
    entry.consecutiveErrors = 0;
    entry.requestTimestamps.push(now);
  }

  /**
   * Records a rate-limit (HTTP 429 / quota exceeded) event on the key.
   * @param {number} index
   * @param {number} [retryAfterSeconds]
   * @param {number} [now=Date.now()]
   */
  reportRateLimited(index, retryAfterSeconds, now = Date.now()) {
    const entry = this.pool[index];
    if (!entry) return;

    entry.consecutiveErrors += 1;
    const n = entry.consecutiveErrors;

    let delayMs;
    if (typeof retryAfterSeconds === 'number' && retryAfterSeconds > 0) {
      delayMs = retryAfterSeconds * 1000;
    } else {
      // Exponential backoff: min(2^n * 1000, 60_000) with +/- 20% jitter
      const baseDelay = Math.min(Math.pow(2, n) * 1000, 60000);
      const jitter = (Math.random() * 0.4 - 0.2); // [-0.2, +0.2]
      delayMs = Math.round(baseDelay * (1 + jitter));
    }

    entry.cooldownUntil = now + Math.max(1000, delayMs);
  }

  /**
   * Records a generic error on the key.
   * Transient (network/5xx) -> 3s cooldown.
   * Non-transient (401/403 bad key) -> 1h cooldown + warning.
   *
   * @param {number} index
   * @param {boolean} isTransient
   * @param {number} [now=Date.now()]
   */
  reportError(index, isTransient, now = Date.now()) {
    const entry = this.pool[index];
    if (!entry) return;

    if (isTransient) {
      entry.cooldownUntil = now + 3000;
    } else {
      entry.cooldownUntil = now + 3600000; // 1 hour
      console.warn(
        `[Assistant KeyPool] Key at index ${index} (${entry.masked}) returned authentication/permission failure. Cooling down for 1 hour.`
      );
    }
  }

  /**
   * Masked status list for Admin health check.
   * @param {number} [now=Date.now()]
   */
  getStatus(now = Date.now()) {
    return this.pool.map((entry) => ({
      index: entry.index,
      maskedKey: entry.masked,
      cooldownUntil: entry.cooldownUntil,
      isCoolingDown: entry.cooldownUntil > now,
      consecutiveErrors: entry.consecutiveErrors,
      requestsLastMinute: this.getRequestsLastMinute(entry, now),
    }));
  }
}

// Singleton instance for standard app execution
export const defaultKeyPool = new KeyPool();

/**
 * Executes a function with automatic key rotation and failover.
 *
 * @template T
 * @param {(apiKey: string, keyIndex: number) => Promise<T>} fn
 * @param {KeyPool} [pool=defaultKeyPool]
 * @returns {Promise<T>}
 */
export async function callWithKeyRotation(fn, pool = defaultKeyPool) {
  if (pool.length === 0) {
    throw new AppError(503, 'ASSISTANT_BUSY', "MarketLink's assistant is busy right now. Try again in a moment.");
  }

  const maxAttempts = pool.length;
  let lastError = null;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const { entry, allCoolingDown, isThrottled } = pool.pickKey();

    if (allCoolingDown || isThrottled || !entry) {
      throw new AppError(503, 'ASSISTANT_BUSY', "MarketLink's assistant is busy right now. Try again in a moment.");
    }

    try {
      const result = await fn(entry.key, entry.index);
      pool.reportSuccess(entry.index);
      return result;
    } catch (err) {
      lastError = err;
      const status = err.status || err.statusCode || (err.response && err.response.status);
      const isRateLimit = status === 429 || /RESOURCE_EXHAUSTED|quota/i.test(err.message || '');
      const isAuthError = status === 401 || status === 403 || /API_KEY_INVALID/i.test(err.message || '');
      const isTransient = status >= 500 || err.name === 'AbortError' || /ECONNRESET|ETIMEDOUT|fetch failed/i.test(err.message || '');

      if (isRateLimit) {
        const retryAfter = err.retryAfterSeconds || null;
        pool.reportRateLimited(entry.index, retryAfter);
        continue; // Retry on next key
      } else if (isAuthError) {
        pool.reportError(entry.index, false);
        continue; // Retry on next key
      } else if (isTransient) {
        pool.reportError(entry.index, true);
        continue; // Retry on next key
      } else {
        // Unknown error; record transient and bubble or retry
        pool.reportError(entry.index, true);
        throw err;
      }
    }
  }

  throw new AppError(503, 'ASSISTANT_BUSY', "MarketLink's assistant is busy right now. Try again in a moment.");
}
