/**
 * Rate limiting middleware using express-rate-limit.
 * Protects against brute-force and resource abuse with configurable thresholds.
 */

import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';

/**
 * Creates a rate limiter instance that can be bypassed when RATE_LIMIT_DISABLED is true,
 * unless explicitly forced via the 'x-enable-rate-limit' header during security tests.
 *
 * @param {object} opts
 * @param {number} opts.windowMs
 * @param {number} opts.limit
 * @param {string} opts.message
 */
function createLimiter({ windowMs, limit, message }) {
  const limiter = rateLimit({
    windowMs,
    limit,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      res.status(429).json({
        error: {
          code: 'RATE_LIMITED',
          message,
        },
      });
    },
    skip: (req) => {
      // Allow bypass in test mode unless test explicitly tests rate limiting
      const isDisabled = process.env.RATE_LIMIT_DISABLED === 'true' || env.RATE_LIMIT_DISABLED;
      if (isDisabled && req.headers['x-enable-rate-limit'] !== 'true') {
        return true;
      }
      return false;
    },
  });

  return limiter;
}

// Global: 300 requests per minute per IP
export const globalRateLimiter = createLimiter({
  windowMs: 60 * 1000,
  limit: parseInt(process.env.RATE_LIMIT_GLOBAL_MAX || '300', 10),
  message: 'Too many requests from this IP. Please try again in a minute.',
});

// Login: 10 requests per 15 minutes per IP
export const loginRateLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  limit: parseInt(process.env.RATE_LIMIT_LOGIN_MAX || '10', 10),
  message: 'Too many sign-in attempts. Please try again in 15 minutes.',
});

// Register: 20 requests per hour per IP
export const registerRateLimiter = createLimiter({
  windowMs: 60 * 60 * 1000,
  limit: parseInt(process.env.RATE_LIMIT_REGISTER_MAX || '20', 10),
  message: 'Too many accounts created from this IP. Please try again later.',
});

// Forgot Password: 5 requests per hour per IP
export const forgotPasswordRateLimiter = createLimiter({
  windowMs: 60 * 60 * 1000,
  limit: parseInt(process.env.RATE_LIMIT_FORGOT_MAX || '5', 10),
  message: 'Too many password reset requests. Please check your inbox or try again in an hour.',
});

// Contact Form: 5 requests per hour per IP
export const contactRateLimiter = createLimiter({
  windowMs: 60 * 60 * 1000,
  limit: parseInt(process.env.RATE_LIMIT_CONTACT_MAX || '5', 10),
  message: 'Too many messages sent. Please wait an hour before submitting another message.',
});
