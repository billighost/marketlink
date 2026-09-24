/**
 * Admin People routes controller.
 * Gated endpoints for farmer verification, lifecycle transitions, and customer management.
 */

import { Router } from 'express';
import { requireAuth, requireRole } from '../../../middleware/auth.js';
import {
  listFarmers,
  listCustomers,
  approveFarmer,
  rejectFarmer,
  suspendFarmer,
  reinstateFarmer,
  deactivateCustomer,
  activateCustomer,
} from './people.service.js';

export const adminPeopleRouter = Router();

// ── Farmers Management ──────────────────────────────────────

// GET /api/admin/farmers
adminPeopleRouter.get(
  '/farmers',
  requireAuth,
  requireRole('admin'),
  async (req, res, next) => {
    try {
      const result = await listFarmers(req.query);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/admin/farmers/:id/approve
adminPeopleRouter.post(
  '/farmers/:id/approve',
  requireAuth,
  requireRole('admin'),
  async (req, res, next) => {
    try {
      const result = await approveFarmer(req.user, req.params.id);
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/admin/farmers/:id/reject
adminPeopleRouter.post(
  '/farmers/:id/reject',
  requireAuth,
  requireRole('admin'),
  async (req, res, next) => {
    try {
      const result = await rejectFarmer(req.user, req.params.id, req.body?.reason);
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/admin/farmers/:id/suspend
adminPeopleRouter.post(
  '/farmers/:id/suspend',
  requireAuth,
  requireRole('admin'),
  async (req, res, next) => {
    try {
      const result = await suspendFarmer(req.user, req.params.id, req.body?.reason);
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/admin/farmers/:id/reinstate
adminPeopleRouter.post(
  '/farmers/:id/reinstate',
  requireAuth,
  requireRole('admin'),
  async (req, res, next) => {
    try {
      const result = await reinstateFarmer(req.user, req.params.id);
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  }
);

// ── Customers Management ─────────────────────────────────────

// GET /api/admin/customers
adminPeopleRouter.get(
  '/customers',
  requireAuth,
  requireRole('admin'),
  async (req, res, next) => {
    try {
      const result = await listCustomers(req.query);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/admin/customers/:id/deactivate
adminPeopleRouter.post(
  '/customers/:id/deactivate',
  requireAuth,
  requireRole('admin'),
  async (req, res, next) => {
    try {
      const result = await deactivateCustomer(req.user, req.params.id);
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/admin/customers/:id/activate
adminPeopleRouter.post(
  '/customers/:id/activate',
  requireAuth,
  requireRole('admin'),
  async (req, res, next) => {
    try {
      const result = await activateCustomer(req.user, req.params.id);
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  }
);
