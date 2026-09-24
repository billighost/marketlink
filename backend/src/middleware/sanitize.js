/**
 * NoSQL injection sanitizer middleware.
 * Scans req.body, req.query, and req.params for keys starting with '$' or containing '.',
 * immediately rejecting injection payloads with 400 BAD_JSON.
 */

import { AppError } from '../utils/errors.js';

/**
 * Recursively checks if an object or nested property contains forbidden NoSQL operator characters.
 *
 * @param {unknown} val
 * @returns {boolean} True if a forbidden key is found
 */
function hasForbiddenKeys(val) {
  if (!val || typeof val !== 'object') {
    return false;
  }

  if (Array.isArray(val)) {
    for (const item of val) {
      if (hasForbiddenKeys(item)) {
        return true;
      }
    }
    return false;
  }

  for (const key of Object.keys(val)) {
    if (key.includes('$') || key.includes('.')) {
      return true;
    }
    if (hasForbiddenKeys(val[key])) {
      return true;
    }
  }

  return false;
}

export function sanitize(req, res, next) {
  if (req.body && hasForbiddenKeys(req.body)) {
    return next(AppError.badRequest('Invalid characters in request body. Keys starting with $ or containing . are forbidden.'));
  }

  if (req.query && hasForbiddenKeys(req.query)) {
    return next(AppError.badRequest('Invalid characters in query parameters. Keys starting with $ or containing . are forbidden.'));
  }

  if (req.params && hasForbiddenKeys(req.params)) {
    return next(AppError.badRequest('Invalid characters in URL parameters. Keys starting with $ or containing . are forbidden.'));
  }

  next();
}
