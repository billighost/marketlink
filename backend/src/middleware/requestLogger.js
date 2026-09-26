/**
 * HTTP request logging and timing middleware.
 * Attaches Server-Timing header and warns on requests exceeding LOG_SLOW_MS.
 */

import crypto from 'node:crypto';
import { env } from '../config/env.js';

export function requestLogger(req, res, next) {
  const startTime = process.hrtime.bigint();
  const requestId = req.headers['x-request-id'] || crypto.randomUUID();
  req.id = requestId;

  // Always set X-Request-Id header on response
  res.setHeader('X-Request-Id', requestId);

  // Track response finish
  res.on('finish', () => {
    const endTime = process.hrtime.bigint();
    const durationMs = Number(endTime - startTime) / 1_000_000;
    const roundedMs = Math.round(durationMs * 100) / 100;

    // Set Server-Timing header if headers have not already been sent
    if (!res.headersSent) {
      res.setHeader('Server-Timing', `total;dur=${roundedMs}`);
    }

    // Redact sensitive query parameters in URL
    const sanitizedUrl = req.originalUrl.replace(/([?&](token|password|secret|key)=)[^&]+/gi, '$1[REDACTED]');

    const logEntry = {
      requestId,
      method: req.method,
      path: sanitizedUrl,
      status: res.statusCode,
      durationMs: roundedMs,
      userId: req.user?.id || req.user?.sub || null,
      role: req.user?.role || null,
    };

    if (durationMs > env.LOG_SLOW_MS) {
      console.warn(
        `[SLOW REQUEST WARNING] ${req.method} ${sanitizedUrl} ${res.statusCode} took ${roundedMs}ms (threshold: ${env.LOG_SLOW_MS}ms) [reqId: ${requestId}]`
      );
    } else if (process.env.LOG_FORMAT === 'json') {
      console.log(JSON.stringify(logEntry));
    } else if (env.isDevelopment && !req.originalUrl.includes('/health')) {
      console.log(
        `[HTTP] ${req.method} ${sanitizedUrl} ${res.statusCode} ${roundedMs}ms`
      );
    }
  });

  next();
}
