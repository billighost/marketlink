/**
 * Search module routes.
 * /api/search/suggestions, /api/search/history (GET, POST, DELETE, DELETE :id)
 */

import { Router } from 'express';
import { AppError } from '../../utils/errors.js';
import {
  getSuggestions,
  getSearchHistory,
  recordSearchHistory,
  deleteSearchHistoryItem,
  clearSearchHistory,
} from './search.service.js';
import { defineRoutes } from '../../utils/defineRoutes.js';

export const searchRouter = Router();

const routes = [
  {
    method: 'get',
    path: '/suggestions',
    auth: 'any',
    summary: 'Instant search suggestions for prefixes with at least 2 characters',
    handler: async (req, res, next) => {
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
    },
  },
  {
    method: 'get',
    path: '/history',
    auth: 'any',
    summary: 'Get search history for authenticated user',
    handler: async (req, res, next) => {
      try {
        const data = await getSearchHistory(req.user.id);
        res.json({ data });
      } catch (err) {
        next(err);
      }
    },
  },
  {
    method: 'post',
    path: '/history',
    auth: 'any',
    summary: 'Record a search history entry',
    body: 'searchHistory',
    handler: async (req, res, next) => {
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
    },
  },
  {
    method: 'delete',
    path: '/history',
    auth: 'any',
    summary: 'Clear all search history',
    handler: async (req, res, next) => {
      try {
        const data = await clearSearchHistory(req.user.id);
        res.json({ data });
      } catch (err) {
        next(err);
      }
    },
  },
  {
    method: 'delete',
    path: '/history/:id',
    auth: 'any',
    summary: 'Delete a single search history entry',
    handler: async (req, res, next) => {
      try {
        const data = await deleteSearchHistoryItem(req.user.id, req.params.id);
        res.json({ data });
      } catch (err) {
        next(err);
      }
    },
  },
];

defineRoutes(searchRouter, 'search', routes, { basePath: '/api/search' });
