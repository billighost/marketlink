/**
 * Products module routing.
 * Endpoints for browsing products, details, reviews, and related items.
 */

import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import {
  parseLimit,
  parseCsv,
  parseIntParam,
  parseEnum,
} from '../../utils/query.js';
import {
  listProducts,
  getProductDetail,
  listProductReviews,
  getRelatedProducts,
} from './products.service.js';

export const productsRouter = Router();

// All catalog product endpoints require authentication
productsRouter.use(requireAuth);

/**
 * GET /api/products
 * Browses catalog products with filters, sorts, keyset pagination, and text search.
 */
productsRouter.get('/', async (req, res, next) => {
  try {
    const category = req.query.category ? parseCsv(req.query.category, 5, 'category') : undefined;
    const minPrice = parseIntParam(req.query.minPrice, 'minPrice', { min: 0, max: 1000000 });
    const maxPrice = parseIntParam(req.query.maxPrice, 'maxPrice', { min: 0, max: 1000000 });
    const market = req.query.market ? String(req.query.market).trim() : undefined;
    const day = parseEnum(req.query.day, 'day', ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']);
    const availability = parseEnum(req.query.availability, 'availability', ['in', 'low', 'out']);
    const includeSoldOut = req.query.includeSoldOut === 'true';
    const tags = req.query.tags ? parseCsv(req.query.tags, 4, 'tags') : undefined;
    const farmer = req.query.farmer ? String(req.query.farmer).trim() : undefined;
    const q = req.query.q ? String(req.query.q).trim() : undefined;
    const sort = parseEnum(req.query.sort, 'sort', ['featured', 'price_asc', 'price_desc', 'newest', 'popular']) || 'featured';
    const limit = parseLimit(req.query.limit, 20, 50);
    const cursor = req.query.cursor ? String(req.query.cursor).trim() : undefined;

    const result = await listProducts({
      category,
      minPrice,
      maxPrice,
      market,
      day,
      availability,
      includeSoldOut,
      tags,
      farmer,
      q,
      sort,
      cursor,
      limit,
    });

    return res.json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/products/:id
 * Returns productDetail.
 */
productsRouter.get('/:id', async (req, res, next) => {
  try {
    const product = await getProductDetail(req.params.id);
    return res.json({ data: product });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/products/:id/reviews
 * Returns reviewItem list.
 */
productsRouter.get('/:id/reviews', async (req, res, next) => {
  try {
    const limit = parseLimit(req.query.limit, 20, 50);
    const cursor = req.query.cursor ? String(req.query.cursor).trim() : undefined;

    const result = await listProductReviews(req.params.id, { cursor, limit });
    return res.json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/products/:id/related
 * Returns moreFromFarmer and youMightLike.
 */
productsRouter.get('/:id/related', async (req, res, next) => {
  try {
    const result = await getRelatedProducts(req.params.id);
    return res.json({ data: result });
  } catch (err) {
    next(err);
  }
});
