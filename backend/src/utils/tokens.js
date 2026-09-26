/**
 * JWT access token generation/verification and random cryptographic token utilities.
 * Handles access token signing and SHA-256 hashing for secure refresh & reset tokens.
 */

import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { AppError } from './errors.js';

const JWT_ISSUER = 'marketlink';
const ACCESS_TOKEN_EXPIRY = '15m';

/**
 * Signs an access JWT for a user.
 * Payload: { sub: userIdString, role }
 *
 * @param {{ sub: string, role: string }} payload
 * @returns {string} Signed JWT
 */
export function signAccessToken(payload) {
  return jwt.sign(
    {
      sub: payload.sub,
      role: payload.role,
    },
    env.JWT_SECRET,
    {
      issuer: JWT_ISSUER,
      expiresIn: ACCESS_TOKEN_EXPIRY,
      algorithm: 'HS256',
    }
  );
}

/**
 * Verifies and decodes an access token.
 * Throws AppError on invalid or expired token.
 *
 * @param {string} token
 * @returns {{ sub: string, role: string, iss: string, exp: number, iat: number }}
 */
export function verifyAccessToken(token) {
  try {
    return jwt.verify(token, env.JWT_SECRET, {
      issuer: JWT_ISSUER,
      algorithms: ['HS256'],
    });
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      throw AppError.tokenExpired();
    }
    throw AppError.unauthorized('Invalid or malformed access token.');
  }
}

/**
 * Generates a cryptographically secure random hex token.
 *
 * @param {number} [bytes=48]
 * @returns {string} Hex token
 */
export function generateRandomToken(bytes = 48) {
  return crypto.randomBytes(bytes).toString('hex');
}

/**
 * Computes the SHA-256 hash of a string (used for session & reset token storage).
 *
 * @param {string} rawToken
 * @returns {string} Hex-encoded SHA-256 hash
 */
export function sha256Hash(rawToken) {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}
