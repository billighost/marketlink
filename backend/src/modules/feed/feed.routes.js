/**
 * Feed module routes.
 * /api/feed, /api/feed/meta
 */

import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { getFeed, getFeedMeta } from './feed.service.js';

export const feedRouter = Router();

// Feed requires authentication across all routes
feedRouter.use(requireAuth);

/**
 * GET /api/feed/meta
 * Header greeting and next market opening line.
 */
feedRouter.get('/meta', async (req, res, next) => {
  try {
    const data = await getFeedMeta(req.user);
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/feed?cursor=
 * Curated endless feed with keyset pagination across infinite batches.
 */
feedRouter.get('/', async (req, res, next) => {
  try {
    const cursor = typeof req.query.cursor === 'string' ? req.query.cursor : null;
    const result = await getFeed(req.user, cursor);
    res.json({
      data: {
        sections: result.sections,
      },
      meta: result.meta,
    });
  } catch (err) {
    next(err);
  }
});
