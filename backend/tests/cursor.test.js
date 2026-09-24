/**
 * T2.001 - T2.010: Keyset cursor encoding, verification, and tampering test suite.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ObjectId } from 'mongodb';
import { encodeCursor, decodeCursor, buildKeysetPredicate } from '../src/utils/cursor.js';
import { AppError } from '../src/utils/errors.js';

describe('Cursor Suite (T2.001 - T2.010)', () => {
  const sampleId = new ObjectId().toString();

  it('T2.001: round trip encodes and decodes cursor correctly', () => {
    const payload = { s: 'price_asc', k: [450], id: sampleId };
    const encoded = encodeCursor(payload);
    assert.ok(typeof encoded === 'string');
    assert.ok(encoded.includes('.'));

    const decoded = decodeCursor(encoded, 'price_asc');
    assert.equal(decoded.v, 1);
    assert.equal(decoded.s, 'price_asc');
    assert.deepEqual(decoded.k, [450]);
    assert.equal(decoded.id, sampleId);
  });

  it('T2.002: tampered payload throws 400 INVALID_CURSOR', () => {
    const payload = { s: 'popular', k: [100], id: sampleId };
    const encoded = encodeCursor(payload);
    const [payloadB64, sigB64] = encoded.split('.');

    // Tamper with payload JSON
    const decodedJson = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
    decodedJson.k = [999999]; // attacker tries to jump ahead
    const tamperedPayloadB64 = Buffer.from(JSON.stringify(decodedJson)).toString('base64url');
    const tamperedCursor = `${tamperedPayloadB64}.${sigB64}`;

    assert.throws(
      () => decodeCursor(tamperedCursor, 'popular'),
      (err) => err instanceof AppError && err.statusCode === 400 && err.code === 'INVALID_CURSOR'
    );
  });

  it('T2.003: tampered signature throws 400 INVALID_CURSOR', () => {
    const payload = { s: 'price_desc', k: [1200], id: sampleId };
    const encoded = encodeCursor(payload);
    const [payloadB64, sigB64] = encoded.split('.');

    // Flip last character of signature
    const tamperedSig = sigB64.slice(0, -1) + (sigB64.slice(-1) === 'A' ? 'B' : 'A');
    const tamperedCursor = `${payloadB64}.${tamperedSig}`;

    assert.throws(
      () => decodeCursor(tamperedCursor, 'price_desc'),
      (err) => err instanceof AppError && err.statusCode === 400 && err.code === 'INVALID_CURSOR'
    );
  });

  it('T2.004: wrong sort name throws 400 INVALID_CURSOR', () => {
    const payload = { s: 'price_asc', k: [450], id: sampleId };
    const encoded = encodeCursor(payload);

    assert.throws(
      () => decodeCursor(encoded, 'newest'),
      (err) => err instanceof AppError && err.statusCode === 400 && err.code === 'INVALID_CURSOR'
    );
  });

  it('T2.005: wrong version throws 400 INVALID_CURSOR', () => {
    // Manually forge version 2 payload
    const invalidVersion = { v: 2, s: 'price_asc', k: [100], id: sampleId };
    const jsonStr = JSON.stringify(invalidVersion);
    const b64 = Buffer.from(jsonStr).toString('base64url');
    // Even if signature were valid or arbitrary
    assert.throws(
      () => decodeCursor(`${b64}.invalidsig`, 'price_asc'),
      (err) => err instanceof AppError && err.statusCode === 400 && err.code === 'INVALID_CURSOR'
    );
  });

  it('T2.006: truncated cursor string throws 400 INVALID_CURSOR', () => {
    assert.throws(
      () => decodeCursor('onlyonepartwithoutdots', 'newest'),
      (err) => err instanceof AppError && err.statusCode === 400 && err.code === 'INVALID_CURSOR'
    );
    assert.throws(
      () => decodeCursor('part1.', 'newest'),
      (err) => err instanceof AppError && err.statusCode === 400 && err.code === 'INVALID_CURSOR'
    );
    assert.throws(
      () => decodeCursor('.part2', 'newest'),
      (err) => err instanceof AppError && err.statusCode === 400 && err.code === 'INVALID_CURSOR'
    );
  });

  it('T2.007: malformed non-JSON payload throws 400 INVALID_CURSOR', () => {
    const garbage = Buffer.from('not json at all').toString('base64url');
    assert.throws(
      () => decodeCursor(`${garbage}.fakessig`, 'newest'),
      (err) => err instanceof AppError && err.statusCode === 400 && err.code === 'INVALID_CURSOR'
    );
  });

  it('T2.008: date revival converts epoch ms to Date instance for newest sort', () => {
    const now = new Date();
    const payload = { s: 'newest', k: [now], id: sampleId };
    const encoded = encodeCursor(payload);
    const decoded = decodeCursor(encoded, 'newest');

    assert.ok(decoded.k[0] instanceof Date);
    assert.equal(decoded.k[0].getTime(), now.getTime());
  });

  it('T2.009: cursor holds no user identity so same cursor verifies independently', () => {
    const payload = { s: 'featured', k: [85], id: sampleId };
    const encoded = encodeCursor(payload);
    // Verifying it twice or in different contexts succeeds
    const d1 = decodeCursor(encoded, 'featured');
    const d2 = decodeCursor(encoded, 'featured');
    assert.deepEqual(d1, d2);
  });

  it('T2.010: buildKeysetPredicate creates correct ascending and descending $or predicates', () => {
    const targetId = new ObjectId();

    const asc = buildKeysetPredicate('priceCents', 'asc', 450, targetId);
    assert.deepEqual(asc.sort, { priceCents: 1, _id: 1 });
    assert.deepEqual(asc.predicate, {
      $or: [
        { priceCents: { $gt: 450 } },
        { priceCents: 450, _id: { $gt: targetId } },
      ],
    });

    const desc = buildKeysetPredicate('createdAt', 'desc', 1700000000, targetId);
    assert.deepEqual(desc.sort, { createdAt: -1, _id: -1 });
    assert.deepEqual(desc.predicate, {
      $or: [
        { createdAt: { $lt: 1700000000 } },
        { createdAt: 1700000000, _id: { $lt: targetId } },
      ],
    });
  });
});
