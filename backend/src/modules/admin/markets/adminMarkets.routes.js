/**
 * Admin Markets routes controller.
 */

import { Router } from 'express';
import {
  createMarket,
  updateMarket,
  removeMarket,
} from './adminMarkets.service.js';
import { listMarkets } from '../../markets/markets.service.js';
import { defineRoutes } from '../../../utils/defineRoutes.js';

export const adminMarketsRouter = Router();

const routes = [
  // GET /api/admin/markets
  {
    method: 'get',
    path: '/',
    auth: 'admin',
    summary: 'List all markets for administration',
    handler: async (req, res, next) => {
      try {
        const result = await listMarkets(req.query || {});
        res.json(result);
      } catch (err) {
        next(err);
      }
    },
  },

  // POST /api/admin/markets
  {
    method: 'post',
    path: '/',
    auth: 'admin',
    summary: 'Create a new farmers market',
    body: 'createMarket',
    handler: async (req, res, next) => {
      try {
        const market = await createMarket(req.user, req.body);
        res.status(201).json({ data: market });
      } catch (err) {
        next(err);
      }
    },
  },

  // PATCH /api/admin/markets/:id
  {
    method: 'patch',
    path: '/:id',
    auth: 'admin',
    summary: 'Update an existing market',
    body: 'updateMarket',
    handler: async (req, res, next) => {
      try {
        const market = await updateMarket(req.user, req.params.id, req.body);
        res.json({ data: market });
      } catch (err) {
        next(err);
      }
    },
  },

  // DELETE /api/admin/markets/:id
  {
    method: 'delete',
    path: '/:id',
    auth: 'admin',
    summary: 'Remove a market with force check',
    handler: async (req, res, next) => {
      try {
        const force = req.query.force === 'true' || req.body?.force === true;
        const result = await removeMarket(req.user, req.params.id, force);
        res.json({ data: result });
      } catch (err) {
        next(err);
      }
    },
  },
];

defineRoutes(adminMarketsRouter, 'adminMarkets', routes, { basePath: '/api/admin/markets' });
