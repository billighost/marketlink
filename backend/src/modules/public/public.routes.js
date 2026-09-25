/**
 * Public discovery routing.
 * Exposes GET /api/public/home and unauthenticated catalog browsing for guests.
 */

import { Router } from 'express';
import { getPublicHomeData } from './public.service.js';
import { defineRoutes } from '../../utils/defineRoutes.js';
import {
  parseLimit,
  parseFloatParam,
  parseIntParam,
  parseEnum,
  parseCsv,
  escapeForPrefix,
} from '../../utils/query.js';
import {
  listMarkets,
  getMarketDetail,
  listFarmersAtMarket,
  listProductsAtMarket,
} from '../markets/markets.service.js';
import {
  listFarmers,
  getFarmerDetail,
  listFarmerProducts,
  listFarmerReviews,
  getFarmerPickupSlots,
} from '../farmers/farmers.service.js';
import {
  listProducts,
  getProductDetail,
  listProductReviews,
  getRelatedProducts,
} from '../products/products.service.js';

export const publicRouter = Router();

const routes = [
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
  // ── Public Markets ──────────────────────────────────────────
  {
    method: 'get',
    path: '/markets',
    auth: 'public',
    summary: 'Browse markets for unauthenticated guests',
    handler: async (req, res, next) => {
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
    },
  },
  {
    method: 'get',
    path: '/markets/:id',
    auth: 'public',
    summary: 'Get market detail for unauthenticated guests',
    handler: async (req, res, next) => {
      try {
        const market = await getMarketDetail(req.params.id);
        return res.json({ data: market });
      } catch (err) {
        next(err);
      }
    },
  },
  {
    method: 'get',
    path: '/markets/:id/farmers',
    auth: 'public',
    summary: 'List farmers attending this market for unauthenticated guests',
    handler: async (req, res, next) => {
      try {
        const sort = parseEnum(req.query.sort, 'sort', ['rating', 'top', 'new', 'name']) || 'rating';
        const limit = parseLimit(req.query.limit, 20, 50);
        const cursor = req.query.cursor ? String(req.query.cursor).trim() : undefined;

        const result = await listFarmersAtMarket(req.params.id, { sort, cursor, limit });
        return res.json(result);
      } catch (err) {
        next(err);
      }
    },
  },
  {
    method: 'get',
    path: '/markets/:id/products',
    auth: 'public',
    summary: 'List products available at this market for unauthenticated guests',
    handler: async (req, res, next) => {
      try {
        const limit = parseLimit(req.query.limit, 20, 50);
        const cursor = req.query.cursor ? String(req.query.cursor).trim() : undefined;

        const result = await listProductsAtMarket(req.params.id, { cursor, limit });
        return res.json(result);
      } catch (err) {
        next(err);
      }
    },
  },
  // ── Public Farmers ──────────────────────────────────────────
  {
    method: 'get',
    path: '/farmers',
    auth: 'public',
    summary: 'Browse farmers for unauthenticated guests',
    handler: async (req, res, next) => {
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
    },
  },
  {
    method: 'get',
    path: '/farmers/:id',
    auth: 'public',
    summary: 'Get farmer profile details for unauthenticated guests',
    handler: async (req, res, next) => {
      try {
        const farmer = await getFarmerDetail(req.params.id);
        return res.json({ data: farmer });
      } catch (err) {
        next(err);
      }
    },
  },
  {
    method: 'get',
    path: '/farmers/:id/products',
    auth: 'public',
    summary: "List a farmer's catalog products for unauthenticated guests",
    handler: async (req, res, next) => {
      try {
        const limit = parseLimit(req.query.limit, 20, 50);
        const cursor = req.query.cursor ? String(req.query.cursor).trim() : undefined;

        const result = await listFarmerProducts(req.params.id, { cursor, limit });
        return res.json(result);
      } catch (err) {
        next(err);
      }
    },
  },
  {
    method: 'get',
    path: '/farmers/:id/reviews',
    auth: 'public',
    summary: "List a farmer's reviews for unauthenticated guests",
    handler: async (req, res, next) => {
      try {
        const rating = parseIntParam(req.query.rating, 'rating', { min: 1, max: 5 });
        const limit = parseLimit(req.query.limit, 20, 50);
        const cursor = req.query.cursor ? String(req.query.cursor).trim() : undefined;

        const result = await listFarmerReviews(req.params.id, { rating, cursor, limit });
        return res.json(result);
      } catch (err) {
        next(err);
      }
    },
  },
  {
    method: 'get',
    path: '/farmers/:id/pickup-slots',
    auth: 'public',
    summary: 'Get open pickup slots for unauthenticated guests',
    handler: async (req, res, next) => {
      try {
        const slots = await getFarmerPickupSlots(req.params.id);
        return res.json({ data: slots });
      } catch (err) {
        next(err);
      }
    },
  },
  // ── Public Products ─────────────────────────────────────────
  {
    method: 'get',
    path: '/products',
    auth: 'public',
    summary: 'Browse products for unauthenticated guests',
    handler: async (req, res, next) => {
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
    },
  },
  {
    method: 'get',
    path: '/products/:id',
    auth: 'public',
    summary: 'Get product detail for unauthenticated guests',
    handler: async (req, res, next) => {
      try {
        const product = await getProductDetail(req.params.id);
        return res.json({ data: product });
      } catch (err) {
        next(err);
      }
    },
  },
  {
    method: 'get',
    path: '/products/:id/reviews',
    auth: 'public',
    summary: "List a product's reviews for unauthenticated guests",
    handler: async (req, res, next) => {
      try {
        const rating = parseIntParam(req.query.rating, 'rating', { min: 1, max: 5 });
        const limit = parseLimit(req.query.limit, 20, 50);
        const cursor = req.query.cursor ? String(req.query.cursor).trim() : undefined;

        const result = await listProductReviews(req.params.id, { rating, cursor, limit });
        return res.json(result);
      } catch (err) {
        next(err);
      }
    },
  },
  {
    method: 'get',
    path: '/products/:id/related',
    auth: 'public',
    summary: 'Get related products for unauthenticated guests',
    handler: async (req, res, next) => {
      try {
        const limit = parseLimit(req.query.limit, 4, 10);
        const products = await getRelatedProducts(req.params.id, limit);
        return res.json({ data: products });
      } catch (err) {
        next(err);
      }
    },
  },
];

defineRoutes(publicRouter, 'public', routes, { basePath: '/api/public' });
