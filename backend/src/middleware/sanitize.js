/**
 * Sanitizer middleware.
 * Scans req.body, req.query, and req.params for:
 * 1. Forbidden NoSQL operator characters ($ or .)
 * 2. Prototype pollution keys (__proto__, constructor, prototype)
 * 3. Deeply nested JSON payloads (depth > 10)
 * 4. Poisonous control characters (e.g. null bytes)
 * Immediately rejects injection payloads with 400 Bad Request.
 */

import { AppError } from '../utils/errors.js';

const FORBIDDEN_KEYS = new Set(['__proto__', 'constructor', 'prototype']);
const MAX_DEPTH = 10;

/**
 * Recursively checks if an object or nested property contains forbidden NoSQL operator characters,
 * prototype pollution keys, excessive nesting depth, or null bytes.
 *
 * @param {unknown} val
 * @param {number} depth
 * @returns {string|null} Error reason or null if safe
 */
function inspectPayload(val, depth = 0) {
  if (depth > MAX_DEPTH) {
    return 'Request payload exceeds maximum allowed nesting depth.';
  }

  if (typeof val === 'string') {
    if (val.includes('\0')) {
      return 'Null bytes are forbidden in request data.';
    }
    return null;
  }

  if (!val || typeof val !== 'object') {
    return null;
  }

  if (Array.isArray(val)) {
    for (const item of val) {
      const err = inspectPayload(item, depth + 1);
      if (err) return err;
    }
    return null;
  }

  for (const key of Object.keys(val)) {
    if (FORBIDDEN_KEYS.has(key)) {
      return `Forbidden property name '${key}' detected.`;
    }
    if (key.includes('$') || key.includes('.')) {
      return 'Keys starting with $ or containing . are forbidden.';
    }
    const err = inspectPayload(val[key], depth + 1);
    if (err) return err;
  }

  return null;
}

export function sanitize(req, res, next) {
  if (req.body) {
    const err = inspectPayload(req.body);
    if (err) return next(AppError.badRequest(`Invalid characters in request body: ${err}`));
  }

  if (req.query) {
    const err = inspectPayload(req.query);
    if (err) return next(AppError.badRequest(`Invalid characters in query parameters: ${err}`));
  }

  if (req.params) {
    const err = inspectPayload(req.params);
    if (err) return next(AppError.badRequest(`Invalid characters in URL parameters: ${err}`));
  }

  next();
}

