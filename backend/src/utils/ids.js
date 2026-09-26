/**
 * MongoDB ObjectId and API document transformation utilities.
 * Ensures consistent 'id' exposure and strips internal / sensitive fields.
 */

import { ObjectId } from 'mongodb';
import { AppError } from './errors.js';

/**
 * Validates whether a string or value is a valid 24-char hex MongoDB ObjectId.
 * @param {unknown} val
 * @returns {boolean}
 */
export function isValidObjectId(val) {
  if (!val) return false;
  if (val instanceof ObjectId) return true;
  return typeof val === 'string' && ObjectId.isValid(val) && new ObjectId(val).toString() === val;
}

/**
 * Converts a string or ObjectId to a MongoDB ObjectId.
 * Throws 422 VALIDATION_FAILED if invalid.
 * @param {string|ObjectId} val
 * @param {string} [fieldName='id']
 * @returns {ObjectId}
 */
export function toObjectId(val, fieldName = 'id') {
  if (val instanceof ObjectId) return val;
  if (isValidObjectId(val)) {
    return new ObjectId(val);
  }
  throw AppError.unprocessable([{ field: fieldName, message: `Invalid identifier format.` }]);
}

/**
 * Sensitive fields that must NEVER leak in API responses.
 */
const SENSITIVE_FIELDS = new Set(['passwordHash', 'tokenHash']);

/**
 * Transforms a MongoDB document or array of documents for the public API:
 * - Renames `_id` to `id` (as a 24-character string)
 * - Strips `passwordHash`, `tokenHash`
 * - Deeply cleans nested objects/arrays if necessary
 *
 * @template T
 * @param {T} doc
 * @returns {T}
 */
export function toApi(doc) {
  if (!doc) return doc;

  if (Array.isArray(doc)) {
    return doc.map(toApi);
  }

  if (typeof doc === 'object' && !(doc instanceof Date) && !(doc instanceof ObjectId)) {
    const clean = {};
    for (const [key, value] of Object.entries(doc)) {
      if (key === '_id') {
        clean.id = value ? value.toString() : value;
      } else if (SENSITIVE_FIELDS.has(key)) {
        // Strip sensitive field
        continue;
      } else if (value instanceof ObjectId) {
        clean[key] = value.toString();
      } else if (Array.isArray(value)) {
        clean[key] = value.map((item) => {
          if (item instanceof ObjectId) return item.toString();
          if (item && typeof item === 'object' && !(item instanceof Date)) {
            return toApi(item);
          }
          return item;
        });
      } else if (value && typeof value === 'object' && !(value instanceof Date)) {
        clean[key] = toApi(value);
      } else {
        clean[key] = value;
      }
    }
    return clean;
  }

  return doc;
}
