/**
 * Favorites routing layer.
 * Exposes customer favorites management, heart IDs lookup, and paginated favorites card listing.
 */

import { Router } from 'express';
import { isValidObjectId } from '../../utils/ids.js';
import { AppError } from '../../utils/errors.js';
import {
  addFavorite,
  removeFavorite,
  getFavoriteIds,
  listFavorites,
} from './favorites.service.js';
import { defineRoutes } from '../../utils/defineRoutes.js';

export const favoritesRouter = Router();

const routes = [
  // GET /favorites/ids (Lightweight IDs for hearts)
  {
    method: 'get',
    path: '/ids',
    auth: 'any',
    summary: 'Lightweight list of favorited product and farmer IDs',
    handler: async (req, res) => {
      const result = await getFavoriteIds(req.user.id);
      res.status(200).json({
        data: result,
      });
    },
  },

  // GET /favorites (Cursor paginated cards by type)
  {
    method: 'get',
    path: '/',
    auth: 'customer',
    summary: 'List customer favorite cards by type with pagination',
    handler: async (req, res) => {
      const { type, cursor, limit } = req.query;

      if (!type || !['product', 'farmer'].includes(type)) {
        throw AppError.unprocessable([
          { field: 'type', message: "Query parameter 'type' must be 'product' or 'farmer'." },
        ]);
      }

      const result = await listFavorites(req.user.id, {
        type,
        cursor: typeof cursor === 'string' ? cursor : undefined,
        limit: limit ? parseInt(limit, 10) : undefined,
      });

      res.status(200).json({
        data: result.items,
        meta: {
          nextCursor: result.nextCursor,
          limit: result.limit,
        },
      });
    },
  },

  // PUT /favorites/:type/:id (Idempotent add)
  {
    method: 'put',
    path: '/:type/:id',
    auth: 'customer',
    summary: 'Save product or farmer to favorites',
    handler: async (req, res) => {
      const { type, id } = req.params;

      if (!['product', 'farmer'].includes(type)) {
        throw AppError.unprocessable([
          { field: 'type', message: "Path parameter 'type' must be 'product' or 'farmer'." },
        ]);
      }

      if (!isValidObjectId(id)) {
        throw AppError.notFound(`${type === 'product' ? 'Product' : 'Farmer'} not found.`);
      }

      const result = await addFavorite(req.user.id, type, id);

      res.status(200).json({
        data: result,
      });
    },
  },

  // DELETE /favorites/:type/:id (Idempotent remove)
  {
    method: 'delete',
    path: '/:type/:id',
    auth: 'customer',
    summary: 'Remove product or farmer from favorites',
    handler: async (req, res) => {
      const { type, id } = req.params;

      if (!['product', 'farmer'].includes(type)) {
        throw AppError.unprocessable([
          { field: 'type', message: "Path parameter 'type' must be 'product' or 'farmer'." },
        ]);
      }

      if (!isValidObjectId(id)) {
        throw AppError.notFound(`${type === 'product' ? 'Product' : 'Farmer'} not found.`);
      }

      const result = await removeFavorite(req.user.id, type, id);

      res.status(200).json({
        data: result,
      });
    },
  },
];

defineRoutes(favoritesRouter, 'favorites', routes, { basePath: '/api/favorites' });
