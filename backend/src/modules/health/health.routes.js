/**
 * Health and readiness endpoints.
 * /health for fast load-balancer ping (no DB call) and /ready for database connection check.
 */

import { Router } from 'express';
import { getDb } from '../../db/client.js';

export const healthRouter = Router();

// GET /health - Lightweight uptime check
healthRouter.get('/health', (req, res) => {
  res.status(200).json({
    data: {
      status: 'ok',
      uptimeSec: Math.floor(process.uptime()),
      time: new Date().toISOString(),
    },
  });
});

// GET /ready - Database ping
healthRouter.get('/ready', async (req, res) => {
  try {
    const db = getDb();
    await db.command({ ping: 1 });
    res.status(200).json({
      data: {
        status: 'ready',
        db: 'connected',
      },
    });
  } catch (err) {
    res.status(503).json({
      error: {
        code: 'DB_UNAVAILABLE',
        message: 'Database is not reachable.',
      },
    });
  }
});
