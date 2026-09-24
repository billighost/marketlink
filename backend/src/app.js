/**
 * Express application factory.
 * Configures middleware pipeline, security headers, routing table, and error handling.
 */

import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import cookieParser from 'cookie-parser';

import { env } from './config/env.js';
import { requestLogger } from './middleware/requestLogger.js';
import { sanitize } from './middleware/sanitize.js';
import { globalRateLimiter } from './middleware/rateLimits.js';
import { notFound } from './middleware/notFound.js';
import { errorHandler } from './middleware/errorHandler.js';

import { healthRouter } from './modules/health/health.routes.js';
import { authRouter } from './modules/auth/auth.routes.js';
import { usersRouter } from './modules/users/users.routes.js';
import { contactRouter } from './modules/contact/contact.routes.js';

export function createApp() {
  const app = express();

  // Disable x-powered-by header
  app.disable('x-powered-by');

  // Parse nested query parameters (e.g. email[$ne]=x)
  app.set('query parser', 'extended');

  // Trust proxy if configured
  if (env.TRUST_PROXY) {
    app.set('trust proxy', 1);
  }

  // Security headers with Helmet
  app.use(helmet());

  // CORS configuration
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps, curl, server-to-server)
        if (!origin) return callback(null, true);
        if (env.CORS_ORIGINS.includes(origin)) {
          return callback(null, true);
        }
        return callback(null, false);
      },
      credentials: true,
    })
  );

  // Gzip compression
  app.use(compression());

  // Cookie parser for refresh token cookies
  app.use(cookieParser());

  // JSON and URL-encoded body parsers capped at 100kb
  app.use(express.json({ limit: '100kb' }));
  app.use(express.urlencoded({ extended: true, limit: '100kb' }));

  // Request logger and timing
  app.use(requestLogger);

  // NoSQL operator injection sanitizer
  app.use(sanitize);

  // Global rate limiter
  app.use(globalRateLimiter);

  // API Routes mounted under /api
  app.use('/api', healthRouter);
  app.use('/api/auth', authRouter);
  app.use('/api/users', usersRouter);
  app.use('/api/contact', contactRouter);

  // 404 handler for unmatched routes
  app.use(notFound);

  // Centralized JSON error handler
  app.use(errorHandler);

  return app;
}
