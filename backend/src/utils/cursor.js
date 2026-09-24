/**
 * Tamper-proof, signed cursor pagination utilities.
 * Implements keyset pagination encoded with HMAC-SHA256 signatures to prevent tampering.
 */

import crypto from 'node:crypto';
import { ObjectId } from 'mongodb';
import { env } from '../config/env.js';
import { AppError } from './errors.js';

/**
 * Derives the HMAC key for signing cursors: sha256('cursor:' + JWT_SECRET).
 */
function getCursorKey() {
  const secret = env.JWT_SECRET || 'marketlink-default-jwt-secret';
  return crypto.createHash('sha256').update('cursor:' + secret).digest();
}

/**
 * Encodes a cursor object into a base64url signed string:
 * base64url(JSON) + '.' + base64url(HMAC-SHA256(json, key).subarray(0,16))
 *
 * @param {object} payload - { s: sortName, k: [sortKeys], id: lastIdHex, ...extras }
 * @returns {string}
 */
export function encodeCursor(payload) {
  const kRevived = (payload.k || []).map((val) => (val instanceof Date ? val.getTime() : val));
  const fullObj = {
    v: 1,
    s: payload.s,
    k: kRevived,
    id: payload.id ? payload.id.toString() : undefined,
    ...payload,
    v: 1, // enforce version 1
  };
  // Ensure k is the revived one
  fullObj.k = kRevived;

  const jsonStr = JSON.stringify(fullObj);
  const payloadB64 = Buffer.from(jsonStr, 'utf8').toString('base64url');
  const hmac = crypto.createHmac('sha256', getCursorKey()).update(jsonStr).digest().subarray(0, 16);
  const sigB64 = hmac.toString('base64url');

  return `${payloadB64}.${sigB64}`;
}

/**
 * Decodes and verifies a signed cursor string against expectedSort.
 * Throws 400 INVALID_CURSOR on missing/invalid signature, version mismatch, or wrong sort.
 *
 * @param {string} cursorStr
 * @param {string} [expectedSort]
 * @returns {object}
 */
export function decodeCursor(cursorStr, expectedSort) {
  if (!cursorStr || typeof cursorStr !== 'string') {
    throw new AppError(400, 'INVALID_CURSOR', 'Invalid cursor format.');
  }

  const parts = cursorStr.split('.');
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    throw new AppError(400, 'INVALID_CURSOR', 'Cursor is malformed or missing signature.');
  }

  const [payloadB64, sigB64] = parts;
  let jsonStr;
  try {
    jsonStr = Buffer.from(payloadB64, 'base64url').toString('utf8');
  } catch {
    throw new AppError(400, 'INVALID_CURSOR', 'Failed to decode cursor payload.');
  }

  // Verify HMAC signature in constant time
  const expectedHmac = crypto.createHmac('sha256', getCursorKey()).update(jsonStr).digest().subarray(0, 16);
  const expectedSigB64 = expectedHmac.toString('base64url');
  let actualHmac;
  try {
    actualHmac = Buffer.from(sigB64, 'base64url');
  } catch {
    throw new AppError(400, 'INVALID_CURSOR', 'Invalid cursor signature encoding.');
  }

  if (sigB64 !== expectedSigB64 || actualHmac.length !== expectedHmac.length || !crypto.timingSafeEqual(actualHmac, expectedHmac)) {
    throw new AppError(400, 'INVALID_CURSOR', 'Cursor signature mismatch (tampered cursor).');
  }

  let obj;
  try {
    obj = JSON.parse(jsonStr);
  } catch {
    throw new AppError(400, 'INVALID_CURSOR', 'Cursor payload is not valid JSON.');
  }

  if (!obj || typeof obj !== 'object' || obj.v !== 1) {
    throw new AppError(400, 'INVALID_CURSOR', 'Unsupported cursor version.');
  }

  if (expectedSort && obj.s !== expectedSort) {
    throw new AppError(400, 'INVALID_CURSOR', `Cursor sort '${obj.s}' does not match expected '${expectedSort}'.`);
  }

  // Revive dates in k when sort is 'newest' or sort key was an epoch timestamp
  if (Array.isArray(obj.k)) {
    if (obj.s === 'newest' && typeof obj.k[0] === 'number') {
      obj.k[0] = new Date(obj.k[0]);
    }
  }

  return obj;
}

/**
 * Builds standard MongoDB keyset predicate and sort object for a given sort and cursor.
 * Ascending: { $or: [ { [f]: { $gt: k0 } }, { [f]: k0, _id: { $gt: ObjectId(id) } } ] }
 * Descending: { $or: [ { [f]: { $lt: k0 } }, { [f]: k0, _id: { $lt: ObjectId(id) } } ] }
 *
 * @param {string} field - Sort field (e.g. 'priceCents', 'createdAt', 'salesCount')
 * @param {'asc'|'desc'} direction
 * @param {unknown} k0 - Sort key value from cursor
 * @param {string|ObjectId} lastId - Document _id from cursor
 * @returns {{ predicate: object, sort: object }}
 */
export function buildKeysetPredicate(field, direction, k0, lastId) {
  const isAsc = direction === 'asc';
  const op = isAsc ? '$gt' : '$lt';
  const sortDir = isAsc ? 1 : -1;
  const targetId = lastId instanceof ObjectId ? lastId : new ObjectId(lastId);

  const predicate = {
    $or: [
      { [field]: { [op]: k0 } },
      { [field]: k0, _id: { [op]: targetId } },
    ],
  };

  const sort = { [field]: sortDir, _id: sortDir };

  return { predicate, sort };
}
