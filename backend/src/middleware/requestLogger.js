/**
 * HTTP request logging and timing middleware.
 * Attaches Server-Timing header and warns on requests exceeding LOG_SLOW_MS.
 */

import crypto from 'node:crypto';
import { env } from '../config/env.js';

export function requestLogger(req, res, next) {
  const startTime = process.hrtime.bigint();
  const requestId = crypto.randomUUID();
  req.id = requestId;

  // Track response finish
  res.on('finish', () => {
    const endTime = process.hrtime.bigint();
    const durationMs = Number(endTime - startTime) / 1_000_000;
    const roundedMs = Math.round(durationMs * 100) / 100;

    // Set Server-Timing header if headers have not already been sent
    if (!res.headersSent) {
      res.setHeader('Server-Timing', `total;dur=${roundedMs}`);
    }

    if (durationMs > env.LOG_SLOW_MS) {
      console.warn(
        `[SLOW REQUEST WARNING] ${req.method} ${req.originalUrl} ${res.statusCode} took ${roundedMs}ms (threshold: ${env.LOG_SLOW_MS}ms) [reqId: ${requestId}]`
      );
    } else if (env.isDevelopment && !req.originalUrl.includes('/health')) {
      console.log(
        `[HTTP] ${req.method} ${req.originalUrl} ${res.statusCode} ${roundedMs}ms`
      );
    }
  });

  next();
}
