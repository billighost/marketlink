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
import { categoriesRouter } from './modules/categories/categories.routes.js';
import { publicRouter } from './modules/public/public.routes.js';
import { announcementsRouter } from './modules/announcements/announcements.routes.js';
import { marketsRouter } from './modules/markets/markets.routes.js';
import { farmersRouter } from './modules/farmers/farmers.routes.js';
import { productsRouter } from './modules/products/products.routes.js';
import { searchRouter } from './modules/search/search.routes.js';
import { feedRouter } from './modules/feed/feed.routes.js';
import { cartRouter } from './modules/cart/cart.routes.js';
import { ordersRouter } from './modules/orders/orders.routes.js';
import { reviewsRouter } from './modules/reviews/reviews.routes.js';
import { favoritesRouter } from './modules/favorites/favorites.routes.js';
import { notificationsRouter } from './modules/notifications/notifications.routes.js';
import { homeRouter } from './modules/home/home.routes.js';
import { assistantRouter, adminAssistantRouter } from './modules/assistant/assistant.routes.js';
import { farmerProfileRouter } from './modules/farmer/profile/farmerProfile.routes.js';
import { farmerSlotsRouter } from './modules/farmer/slots/slots.routes.js';
import { farmerProductsRouter, weeklyTemplateRouter } from './modules/farmer/products/farmerProducts.routes.js';
import { farmerOrdersRouter } from './modules/farmer/orders/farmerOrders.routes.js';
import { farmerReviewsRouter } from './modules/farmer/reviews/farmerReviews.routes.js';
import { farmerInsightsRouter } from './modules/farmer/insights/insights.routes.js';
import { uploadsRouter } from './modules/uploads/uploads.routes.js';
import { smartBasketRouter } from './modules/smart-basket/smartBasket.routes.js';

import { adminOverviewRouter } from './modules/admin/overview/adminOverview.routes.js';
import { adminPeopleRouter } from './modules/admin/people/people.routes.js';
import { adminMarketsRouter } from './modules/admin/markets/adminMarkets.routes.js';
import { adminModerationRouter } from './modules/admin/moderation/moderation.routes.js';
import { adminReportsRouter } from './modules/admin/reports/reports.routes.js';
import { categoriesAdminRouter } from './modules/admin/settings/categoriesAdmin.routes.js';
import { announcementsAdminRouter } from './modules/admin/settings/announcementsAdmin.routes.js';
import { settingsAdminRouter } from './modules/admin/settings/settings.routes.js';
import { messagesAdminRouter } from './modules/admin/settings/messagesAdmin.routes.js';
import { emailLogRouter } from './modules/admin/emailLog/emailLog.routes.js';

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

  // Security headers with Helmet and Cloudinary/Leaflet CSP
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          ...helmet.contentSecurityPolicy.getDefaultDirectives(),
          'img-src': [
            "'self'",
            'data:',
            'https://res.cloudinary.com',
            'https://tile.openstreetmap.org',
            'https://*.tile.openstreetmap.org',
          ],
        },
      },
    })
  );

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

  // Development artificial latency simulation (ignored in production)
  if (env.isDevelopment && process.env.DEV_LATENCY_MS) {
    const latency = parseInt(process.env.DEV_LATENCY_MS, 10);
    if (!isNaN(latency) && latency > 0) {
      app.use((req, res, next) => {
        setTimeout(next, latency);
      });
    }
  }

  // API Routes mounted under /api
  app.use('/api', healthRouter);
  app.use('/api/auth', authRouter);
  app.use('/api/users', usersRouter);
  app.use('/api/contact', contactRouter);
  app.use('/api/categories', categoriesRouter);
  app.use('/api/public', publicRouter);
  app.use('/api/announcements', announcementsRouter);
  app.use('/api/markets', marketsRouter);
  app.use('/api/farmers', farmersRouter);
  app.use('/api/products', productsRouter);
  app.use('/api/search', searchRouter);
  app.use('/api/feed', feedRouter);
  app.use('/api/cart', cartRouter);
  app.use('/api/orders', ordersRouter);
  app.use('/api/reviews', reviewsRouter);
  app.use('/api/favorites', favoritesRouter);
  app.use('/api/notifications', notificationsRouter);
  app.use('/api/home', homeRouter);
  app.use('/api/assistant', assistantRouter);
  app.use('/api/smart-basket', smartBasketRouter);

  // Farmer routes
  app.use('/api/farmer/profile', farmerProfileRouter);
  app.use('/api/farmer/slots', farmerSlotsRouter);
  app.use('/api/farmer/products', farmerProductsRouter);
  app.use('/api/farmer/weekly-template', weeklyTemplateRouter);
  app.use('/api/farmer/orders', farmerOrdersRouter);
  app.use('/api/farmer/reviews', farmerReviewsRouter);
  app.use('/api/farmer', farmerInsightsRouter);
  app.use('/api/farmer/uploads', uploadsRouter);
  app.use('/farmer/uploads', uploadsRouter);

  // Admin routes
  app.use('/api/admin/overview', adminOverviewRouter);
  app.use('/api/admin/markets', adminMarketsRouter);
  app.use('/api/admin/categories', categoriesAdminRouter);
  app.use('/api/admin/announcements', announcementsAdminRouter);
  app.use('/api/admin/settings', settingsAdminRouter);
  app.use('/api/admin/messages', messagesAdminRouter);
  app.use('/api/admin/reports', adminReportsRouter);
  app.use('/api/admin/assistant', adminAssistantRouter);
  app.use('/admin/assistant', adminAssistantRouter);
  app.use('/api/admin/email-log', emailLogRouter);
  app.use('/admin/email-log', emailLogRouter);
  app.use('/api/admin', adminPeopleRouter);
  app.use('/api/admin', adminModerationRouter);

  // Static uploads directory serving (development fallback only when using local driver)
  if (env.STORAGE_DRIVER === 'local' && !env.isProduction) {
    app.use(
      '/uploads',
      express.static(env.UPLOAD_DIR, {
        index: false,
        dotfiles: 'deny',
        maxAge: '30d',
        immutable: true,
        setHeaders: (res) => res.set('X-Content-Type-Options', 'nosniff'),
      })
    );
  }

  // 404 handler for unmatched routes
  app.use(notFound);

  // Centralized JSON error handler
  app.use(errorHandler);

  return app;
}
