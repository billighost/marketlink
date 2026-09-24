/**
 * Farmer Orders routes controller.
 * Exposes listing, pick list, order detail, and lifecycle transition endpoints.
 */

import { Router } from 'express';
import { requireAuth, requireRole } from '../../../middleware/auth.js';
import { requireApprovedFarmer } from '../../../middleware/requireApprovedFarmer.js';
import { getDb } from '../../../db/client.js';
import { COLLECTIONS } from '../../../db/collections.js';
import { toObjectId } from '../../../utils/ids.js';
import { AppError } from '../../../utils/errors.js';
import {
  listFarmerOrders,
  getFarmerOrderDetail,
  transitionFarmerOrder,
} from './farmerOrders.service.js';
import { getPickList } from './pickList.service.js';

export const farmerOrdersRouter = Router();

async function resolveFarmer(req, res, next) {
  try {
    const db = getDb();
    const farmer = await db.collection(COLLECTIONS.FARMERS).findOne({
      userId: toObjectId(req.user.id),
    });
    if (!farmer) {
      return next(AppError.notFound('Farmer profile not found'));
    }
    req.farmer = farmer;
    next();
  } catch (err) {
    next(err);
  }
}

// ── Pick List ── (Mount before /:id)
farmerOrdersRouter.get(
  '/pick-list',
  requireAuth,
  requireRole('farmer'),
  resolveFarmer,
  async (req, res, next) => {
    try {
      const date = req.query.date || new Date().toISOString().slice(0, 10);
      const result = await getPickList(req.farmer._id, date);
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  }
);

// ── Orders Listing ──
farmerOrdersRouter.get(
  '/',
  requireAuth,
  requireRole('farmer'),
  resolveFarmer,
  async (req, res, next) => {
    try {
      const result = await listFarmerOrders(req.farmer._id, req.query);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

// ── Single Order Detail ──
farmerOrdersRouter.get(
  '/:id',
  requireAuth,
  requireRole('farmer'),
  resolveFarmer,
  async (req, res, next) => {
    try {
      const order = await getFarmerOrderDetail(req.farmer._id, req.params.id);
      res.json({ data: order });
    } catch (err) {
      next(err);
    }
  }
);

// ── Transitions ──
farmerOrdersRouter.post(
  '/:id/accept',
  requireAuth,
  requireRole('farmer'),
  requireApprovedFarmer,
  resolveFarmer,
  async (req, res, next) => {
    try {
      const order = await transitionFarmerOrder(req.farmer._id, req.user.id, req.params.id, 'accepted');
      res.json({ data: order });
    } catch (err) {
      next(err);
    }
  }
);

farmerOrdersRouter.post(
  '/:id/decline',
  requireAuth,
  requireRole('farmer'),
  requireApprovedFarmer,
  resolveFarmer,
  async (req, res, next) => {
    try {
      const reason = req.body?.reason;
      const order = await transitionFarmerOrder(req.farmer._id, req.user.id, req.params.id, 'declined', reason);
      res.json({ data: order });
    } catch (err) {
      next(err);
    }
  }
);

farmerOrdersRouter.post(
  '/:id/ready',
  requireAuth,
  requireRole('farmer'),
  requireApprovedFarmer,
  resolveFarmer,
  async (req, res, next) => {
    try {
      const order = await transitionFarmerOrder(req.farmer._id, req.user.id, req.params.id, 'ready');
      res.json({ data: order });
    } catch (err) {
      next(err);
    }
  }
);

farmerOrdersRouter.post(
  '/:id/complete',
  requireAuth,
  requireRole('farmer'),
  requireApprovedFarmer,
  resolveFarmer,
  async (req, res, next) => {
    try {
      const order = await transitionFarmerOrder(req.farmer._id, req.user.id, req.params.id, 'completed');
      res.json({ data: order });
    } catch (err) {
      next(err);
    }
  }
);

farmerOrdersRouter.post(
  '/:id/cancel',
  requireAuth,
  requireRole('farmer'),
  requireApprovedFarmer,
  resolveFarmer,
  async (req, res, next) => {
    try {
      const reason = req.body?.reason;
      const order = await transitionFarmerOrder(req.farmer._id, req.user.id, req.params.id, 'cancelled', reason);
      res.json({ data: order });
    } catch (err) {
      next(err);
    }
  }
);
