/**
 * Admin Markets routes controller.
 */

import { Router } from 'express';
import { requireAuth, requireRole } from '../../../middleware/auth.js';
import {
  createMarket,
  updateMarket,
  removeMarket,
} from './adminMarkets.service.js';

export const adminMarketsRouter = Router();

// POST /api/admin/markets
adminMarketsRouter.post(
  '/',
  requireAuth,
  requireRole('admin'),
  async (req, res, next) => {
    try {
      const market = await createMarket(req.user, req.body);
      res.status(201).json({ data: market });
    } catch (err) {
      next(err);
    }
  }
);

// PATCH /api/admin/markets/:id
adminMarketsRouter.patch(
  '/:id',
  requireAuth,
  requireRole('admin'),
  async (req, res, next) => {
    try {
      const market = await updateMarket(req.user, req.params.id, req.body);
      res.json({ data: market });
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /api/admin/markets/:id
adminMarketsRouter.delete(
  '/:id',
  requireAuth,
  requireRole('admin'),
  async (req, res, next) => {
    try {
      const force = req.query.force === 'true' || req.body?.force === true;
      const result = await removeMarket(req.user, req.params.id, force);
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  }
);
