/**
 * Search module routes.
 * /api/search/suggestions, /api/search/history (GET, POST, DELETE, DELETE :id)
 */

import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { AppError } from '../../utils/errors.js';
import {
  getSuggestions,
  getSearchHistory,
  recordSearchHistory,
  deleteSearchHistoryItem,
  clearSearchHistory,
} from './search.service.js';

export const searchRouter = Router();

/**
 * GET /api/search/suggestions?q=
 * Instant search suggestions for prefixes with at least 2 characters.
 */
searchRouter.get('/suggestions', requireAuth, async (req, res, next) => {
  try {
    const q = req.query.q;
    if (typeof q !== 'string' || q.trim().length < 2) {
      throw new AppError(422, 'VALIDATION_FAILED', 'Search query must be at least 2 characters.', [
        { field: 'q', message: 'Search query must be at least 2 characters.' },
      ]);
    }

    const data = await getSuggestions(q);
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/search/history
 * Returns the latest 10 search history entries for the authenticated user.
 */
searchRouter.get('/history', requireAuth, async (req, res, next) => {
  try {
    const data = await getSearchHistory(req.user.id);
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/search/history
 * Records a search term for the authenticated user, deduplicating and capping at 10.
 */
searchRouter.post('/history', requireAuth, async (req, res, next) => {
  try {
    const { term } = req.body;
    if (typeof term !== 'string' || term.trim().length === 0) {
      throw new AppError(422, 'VALIDATION_FAILED', 'Search term must be a non-empty string.', [
        { field: 'term', message: 'Search term must be a non-empty string.' },
      ]);
    }

    const data = await recordSearchHistory(req.user.id, term);
    res.status(201).json({ data });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/search/history
 * Clears all search history for the authenticated user.
 */
searchRouter.delete('/history', requireAuth, async (req, res, next) => {
  try {
    const data = await clearSearchHistory(req.user.id);
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/search/history/:id
 * Deletes a single search history entry owned by the authenticated user.
 */
searchRouter.delete('/history/:id', requireAuth, async (req, res, next) => {
  try {
    const data = await deleteSearchHistoryItem(req.user.id, req.params.id);
    res.json({ data });
  } catch (err) {
    next(err);
  }
});
