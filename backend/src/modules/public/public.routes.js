/**
 * Public discovery routing.
 * Exposes GET /api/public/home with public 60-second caching headers.
 */

import { Router } from 'express';
import { getPublicHomeData } from './public.service.js';

export const publicRouter = Router();

/**
 * GET /api/public/home
 * Returns curated landing board, farmers, and announcements for guests.
 */
publicRouter.get('/home', async (req, res, next) => {
  try {
    const data = await getPublicHomeData();
    res.set('Cache-Control', 'public, max-age=60');
    return res.json({ data });
  } catch (err) {
    next(err);
  }
});
