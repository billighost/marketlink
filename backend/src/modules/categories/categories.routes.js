/**
 * Categories module routing.
 * Exposes GET /api/categories with public 60-second caching headers.
 */

import { Router } from 'express';
import { listCategories } from './categories.service.js';

export const categoriesRouter = Router();

/**
 * GET /api/categories
 * Returns active taxonomy with cached product counts.
 */
categoriesRouter.get('/', async (req, res, next) => {
  try {
    const data = await listCategories();
    res.set('Cache-Control', 'public, max-age=60');
    return res.json({ data });
  } catch (err) {
    next(err);
  }
});
