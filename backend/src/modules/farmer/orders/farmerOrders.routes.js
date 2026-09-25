/**
 * Farmer Orders routes controller.
 * Exposes listing, pick list, order detail, and lifecycle transition endpoints.
 */

import { Router } from 'express';
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
import { defineRoutes } from '../../../utils/defineRoutes.js';

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

const routes = [
  // ── Pick List ── (Must be before /:id)
  {
    method: 'get',
    path: '/pick-list',
    auth: 'farmer',
    middlewares: [resolveFarmer],
    summary: 'Get daily pick list aggregated by product and pickup window',
    handler: async (req, res, next) => {
      try {
        const date = req.query.date || new Date().toISOString().slice(0, 10);
        const result = await getPickList(req.farmer._id, date);
        res.json({ data: result });
      } catch (err) {
        next(err);
      }
    },
  },

  // ── Orders Listing ──
  {
    method: 'get',
    path: '/',
    auth: 'farmer',
    middlewares: [resolveFarmer],
    summary: 'List incoming and past orders for this stall',
    handler: async (req, res, next) => {
      try {
        const result = await listFarmerOrders(req.farmer._id, req.query);
        res.json(result);
      } catch (err) {
        next(err);
      }
    },
  },

  // ── Single Order Detail ──
  {
    method: 'get',
    path: '/:id',
    auth: 'farmer',
    middlewares: [resolveFarmer],
    summary: 'Get detailed view of a customer order for this farmer',
    handler: async (req, res, next) => {
      try {
        const order = await getFarmerOrderDetail(req.farmer._id, req.params.id);
        res.json({ data: order });
      } catch (err) {
        next(err);
      }
    },
  },

  // ── Transitions ──
  {
    method: 'post',
    path: '/:id/accept',
    auth: 'farmer',
    middlewares: [requireApprovedFarmer, resolveFarmer],
    summary: 'Accept placed order',
    handler: async (req, res, next) => {
      try {
        const order = await transitionFarmerOrder(req.farmer._id, req.user.id, req.params.id, 'accepted');
        res.json({ data: order });
      } catch (err) {
        next(err);
      }
    },
  },
  {
    method: 'post',
    path: '/:id/decline',
    auth: 'farmer',
    middlewares: [requireApprovedFarmer, resolveFarmer],
    summary: 'Decline order with reason and restore inventory',
    body: 'declineOrder',
    handler: async (req, res, next) => {
      try {
        const reason = req.body?.reason;
        const order = await transitionFarmerOrder(req.farmer._id, req.user.id, req.params.id, 'declined', reason);
        res.json({ data: order });
      } catch (err) {
        next(err);
      }
    },
  },
  {
    method: 'post',
    path: '/:id/ready',
    auth: 'farmer',
    middlewares: [requireApprovedFarmer, resolveFarmer],
    summary: 'Mark order ready for pickup and notify customer',
    handler: async (req, res, next) => {
      try {
        const order = await transitionFarmerOrder(req.farmer._id, req.user.id, req.params.id, 'ready');
        res.json({ data: order });
      } catch (err) {
        next(err);
      }
    },
  },
  {
    method: 'post',
    path: '/:id/complete',
    auth: 'farmer',
    middlewares: [requireApprovedFarmer, resolveFarmer],
    summary: 'Mark order completed upon in-person pickup and payment',
    handler: async (req, res, next) => {
      try {
        const order = await transitionFarmerOrder(req.farmer._id, req.user.id, req.params.id, 'completed');
        res.json({ data: order });
      } catch (err) {
        next(err);
      }
    },
  },
  {
    method: 'post',
    path: '/:id/cancel',
    auth: 'farmer',
    middlewares: [requireApprovedFarmer, resolveFarmer],
    summary: 'Cancel order with reason and restore inventory',
    body: 'cancelOrder',
    handler: async (req, res, next) => {
      try {
        const reason = req.body?.reason;
        const order = await transitionFarmerOrder(req.farmer._id, req.user.id, req.params.id, 'cancelled', reason);
        res.json({ data: order });
      } catch (err) {
        next(err);
      }
    },
  },
];

defineRoutes(farmerOrdersRouter, 'farmerOrders', routes, { basePath: '/api/farmer/orders' });
