/**
 * Feed module routes.
 * /api/feed, /api/feed/meta
 */

import { Router } from 'express';
import { getFeed, getFeedMeta } from './feed.service.js';
import { defineRoutes } from '../../utils/defineRoutes.js';

export const feedRouter = Router();

const routes = [
  {
    method: 'get',
    path: '/meta',
    auth: 'any',
    summary: 'Header greeting and next market opening line',
    handler: async (req, res, next) => {
      try {
        const data = await getFeedMeta(req.user);
        res.json({ data });
      } catch (err) {
        next(err);
      }
    },
  },
  {
    method: 'get',
    path: '/',
    auth: 'any',
    summary: 'Curated personalized feed with infinite batch walking',
    handler: async (req, res, next) => {
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
    },
  },
];

defineRoutes(feedRouter, 'feed', routes, { basePath: '/api/feed' });
