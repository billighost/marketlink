/**
 * Public discovery routing.
 * Exposes GET /api/public/home with public 60-second caching headers.
 */

import { Router } from 'express';
import { getPublicHomeData } from './public.service.js';
import { defineRoutes } from '../../utils/defineRoutes.js';

export const publicRouter = Router();

defineRoutes(
  publicRouter,
  'public',
  [
    {
      method: 'get',
      path: '/home',
      auth: 'public',
      summary: 'Curated landing board, featured farmers, and announcements for guests',
      handler: async (req, res, next) => {
        try {
          const data = await getPublicHomeData();
          res.set('Cache-Control', 'public, max-age=60');
          return res.json({ data });
        } catch (err) {
          next(err);
        }
      },
    },
  ],
  { basePath: '/api/public' }
);
