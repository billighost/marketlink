/**
 * Admin Email Log routes.
 * Provides administrators visibility into email delivery attempts, failures, and quota skips.
 */

import { Router } from 'express';
import { getDb } from '../../../db/client.js';
import { COLLECTIONS } from '../../../db/collections.js';
import { defineRoutes } from '../../../utils/defineRoutes.js';
import { toObjectId, toApi } from '../../../utils/ids.js';
import { getRollingDailySentCount } from '../../../utils/mailer.js';
import { env } from '../../../config/env.js';

export const emailLogRouter = Router();

defineRoutes(
  emailLogRouter,
  'adminEmailLog',
  [
    {
      method: 'get',
      path: '/',
      auth: 'admin',
      summary: 'List email delivery logs with tag/status filter and cursor pagination',
      handler: async (req, res) => {
        const db = getDb();
        const { tag, status, cursor } = req.query;
        const limit = Math.min(Math.max(parseInt(req.query.limit || '50', 10), 1), 100);

        const filter = {};
        if (tag && typeof tag === 'string') {
          filter.tag = tag.trim();
        }
        if (status && typeof status === 'string') {
          filter.status = status.trim();
        }
        if (cursor && typeof cursor === 'string') {
          try {
            filter._id = { $lt: toObjectId(cursor) };
          } catch {
            // ignore malformed cursor
          }
        }

        const items = await db
          .collection(COLLECTIONS.EMAIL_LOG)
          .find(filter)
          .sort({ _id: -1 })
          .limit(limit)
          .toArray();

        const sentToday = await getRollingDailySentCount();
        const nextCursor = items.length === limit ? items[items.length - 1]._id.toString() : null;

        res.status(200).json({
          data: {
            items: toApi(items),
            nextCursor,
            stats: {
              sentToday,
              dailyLimit: env.GMAIL_DAILY_LIMIT,
            },
          },
        });
      },
    },
  ],
  { basePath: '/api/admin/email-log' }
);
