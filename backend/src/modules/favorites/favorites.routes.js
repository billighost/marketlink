/**
 * Favorites routing layer.
 * Exposes customer favorites management, heart IDs lookup, and paginated favorites card listing.
 */

import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { ROLES } from '../../constants.js';
import { isValidObjectId } from '../../utils/ids.js';
import { AppError } from '../../utils/errors.js';
import {
  addFavorite,
  removeFavorite,
  getFavoriteIds,
  listFavorites,
} from './favorites.service.js';

export const favoritesRouter = Router();

// All favorites endpoints are Customer-only
favoritesRouter.use(requireAuth, requireRole(ROLES.CUSTOMER));

// GET /favorites/ids (Lightweight IDs for hearts)
favoritesRouter.get('/ids', async (req, res) => {
  const result = await getFavoriteIds(req.user.id);
  res.status(200).json({
    data: result,
  });
});

// GET /favorites (Cursor paginated cards by type)
favoritesRouter.get('/', async (req, res) => {
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
});

// PUT /favorites/:type/:id (Idempotent add)
favoritesRouter.put('/:type/:id', async (req, res) => {
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
});

// DELETE /favorites/:type/:id (Idempotent remove)
favoritesRouter.delete('/:type/:id', async (req, res) => {
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
});
