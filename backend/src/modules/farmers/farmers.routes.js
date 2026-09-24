/**
 * Farmers module routing.
 * Endpoints for browsing listed farmers, profiles, reviews, products, and pickup schedules.
 */

import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { parseLimit, parseIntParam, parseEnum, escapeForPrefix } from '../../utils/query.js';
import {
  listFarmers,
  getFarmerDetail,
  listFarmerProducts,
  listFarmerReviews,
  getFarmerPickupSlots,
} from './farmers.service.js';

export const farmersRouter = Router();

// All catalog farmer endpoints require authentication
farmersRouter.use(requireAuth);

/**
 * GET /api/farmers
 * Lists listed farmers with optional search, category, market, and day filters.
 */
farmersRouter.get('/', async (req, res, next) => {
  try {
    const q = req.query.q ? escapeForPrefix(req.query.q) : undefined;
    const category = req.query.category ? String(req.query.category).trim() : undefined;
    const market = req.query.market ? String(req.query.market).trim() : undefined;
    const day = parseEnum(req.query.day, 'day', ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']);
    const sort = parseEnum(req.query.sort, 'sort', ['rating', 'top', 'new', 'name']) || 'rating';
    const limit = parseLimit(req.query.limit, 20, 50);
    const cursor = req.query.cursor ? String(req.query.cursor).trim() : undefined;

    const result = await listFarmers({ q, category, market, day, sort, cursor, limit });
    return res.json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/farmers/:id
 * Returns farmerDetail. 404 if unlisted, pending, or suspended.
 */
farmersRouter.get('/:id', async (req, res, next) => {
  try {
    const farmer = await getFarmerDetail(req.params.id);
    return res.json({ data: farmer });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/farmers/:id/products
 * Returns farmer's listed product cards.
 */
farmersRouter.get('/:id/products', async (req, res, next) => {
  try {
    const availability = parseEnum(req.query.availability, 'availability', ['in', 'low', 'out']);
    const category = req.query.category ? String(req.query.category).trim() : undefined;
    const includeSoldOut = req.query.includeSoldOut === 'true';
    const limit = parseLimit(req.query.limit, 20, 50);
    const cursor = req.query.cursor ? String(req.query.cursor).trim() : undefined;

    const result = await listFarmerProducts(req.params.id, {
      availability,
      category,
      includeSoldOut,
      cursor,
      limit,
    });
    return res.json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/farmers/:id/reviews
 * Returns reviewItem list.
 */
farmersRouter.get('/:id/reviews', async (req, res, next) => {
  try {
    const sort = parseEnum(req.query.sort, 'sort', ['newest', 'highest', 'lowest']) || 'newest';
    const limit = parseLimit(req.query.limit, 20, 50);
    const cursor = req.query.cursor ? String(req.query.cursor).trim() : undefined;

    const result = await listFarmerReviews(req.params.id, { sort, cursor, limit });
    return res.json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/farmers/:id/pickup-slots
 * Returns upcoming pickup slots.
 */
farmersRouter.get('/:id/pickup-slots', async (req, res, next) => {
  try {
    const days = parseIntParam(req.query.days, 'days', { min: 1, max: 60 }) || 14;
    const slots = await getFarmerPickupSlots(req.params.id, { days });
    return res.json({ data: slots });
  } catch (err) {
    next(err);
  }
});
