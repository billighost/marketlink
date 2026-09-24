/**
 * Markets module routing.
 * Endpoints for physical farmers markets, location discovery, attending farmers, and fresh products.
 */

import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { parseLimit, parseFloatParam, parseEnum, escapeForPrefix } from '../../utils/query.js';
import {
  listMarkets,
  getMarketDetail,
  listFarmersAtMarket,
  listProductsAtMarket,
} from './markets.service.js';

export const marketsRouter = Router();

// All catalog market endpoints require authentication
marketsRouter.use(requireAuth);

/**
 * GET /api/markets
 * Lists markets with optional day filter, prefix search, and geospatial radius sorting.
 */
marketsRouter.get('/', async (req, res, next) => {
  try {
    const day = parseEnum(req.query.day, 'day', ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']);
    const q = req.query.q ? escapeForPrefix(req.query.q) : undefined;
    const lat = parseFloatParam(req.query.lat, 'lat', { min: -90, max: 90 });
    const lng = parseFloatParam(req.query.lng, 'lng', { min: -180, max: 180 });
    const radiusKm = parseFloatParam(req.query.radiusKm, 'radiusKm', { min: 1, max: 500 }) || 25;
    const limit = parseLimit(req.query.limit, 20, 50);
    const cursor = req.query.cursor ? String(req.query.cursor).trim() : undefined;

    const result = await listMarkets({ day, q, lat, lng, radiusKm, cursor, limit });
    return res.json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/markets/:id
 * Returns marketDetail.
 */
marketsRouter.get('/:id', async (req, res, next) => {
  try {
    const market = await getMarketDetail(req.params.id);
    return res.json({ data: market });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/markets/:id/farmers
 * Returns farmerCard list attending this market.
 */
marketsRouter.get('/:id/farmers', async (req, res, next) => {
  try {
    const sort = parseEnum(req.query.sort, 'sort', ['rating', 'top', 'new', 'name']) || 'rating';
    const limit = parseLimit(req.query.limit, 20, 50);
    const cursor = req.query.cursor ? String(req.query.cursor).trim() : undefined;

    const result = await listFarmersAtMarket(req.params.id, { sort, cursor, limit });
    return res.json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/markets/:id/products
 * Returns productCard list fresh at this market.
 */
marketsRouter.get('/:id/products', async (req, res, next) => {
  try {
    const limit = parseLimit(req.query.limit, 20, 50);
    const cursor = req.query.cursor ? String(req.query.cursor).trim() : undefined;

    const result = await listProductsAtMarket(req.params.id, { cursor, limit });
    return res.json(result);
  } catch (err) {
    next(err);
  }
});
