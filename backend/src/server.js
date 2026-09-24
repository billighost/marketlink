/**
 * Server entrypoint.
 * Connects to MongoDB, ensures all collection indexes, binds the HTTP port,
 * and manages graceful shutdown.
 */

import http from 'node:http';
import { env } from './config/env.js';
import { connectDb, closeDb, getDb } from './db/client.js';
import { ensureIndexes } from './db/indexes.js';
import { createCollections } from './db/collections.js';
import { createApp } from './app.js';

let server;

async function bootstrap() {
  try {
    console.log(`[BOOT] Initializing MarketLink backend in ${env.NODE_ENV} mode...`);

    // 1. Connect to MongoDB
    console.log(`[DB] Connecting to MongoDB at ${env.MONGODB_URI} (${env.DB_NAME})...`);
    const db = await connectDb();
    console.log(`[DB] Connected successfully.`);

    // 2. Ensure collections with validators and indexes
    console.log(`[DB] Verifying collections and indexes...`);
    await createCollections(db);
    await ensureIndexes(db);
    console.log(`[DB] Collections and indexes verified.`);

    // 3. Create Express application
    const app = createApp();
    server = http.createServer(app);

    // 4. Start HTTP listener
    server.listen(env.PORT, () => {
      console.log(`[SERVER] MarketLink API listening on http://localhost:${env.PORT}/api`);
      console.log(`[SERVER] Health check ready at http://localhost:${env.PORT}/api/health`);
    });
  } catch (err) {
    console.error('[FATAL] Failed to start server:', err);
    process.exit(1);
  }
}

// Graceful shutdown handler
async function gracefulShutdown(signal) {
  console.log(`\n[SHUTDOWN] Received ${signal}. Closing HTTP server and database connections...`);

  if (server) {
    server.close(async () => {
      console.log('[SHUTDOWN] HTTP server closed.');
      try {
        await closeDb();
        console.log('[SHUTDOWN] Database connection pool closed.');
        process.exit(0);
      } catch (err) {
        console.error('[SHUTDOWN] Error closing database pool:', err);
        process.exit(1);
      }
    });

    // Force close if graceful shutdown hangs
    setTimeout(() => {
      console.error('[SHUTDOWN] Forcing shutdown after timeout.');
      process.exit(1);
    }, 10000).unref();
  } else {
    process.exit(0);
  }
}

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

process.on('unhandledRejection', (reason, promise) => {
  console.error('[FATAL] Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  console.error('[FATAL] Uncaught Exception:', err);
  process.exit(1);
});

bootstrap();
