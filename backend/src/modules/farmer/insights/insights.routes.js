/**
 * Farmer Insights and Overview routes controller.
 */

import { Router } from 'express';
import { getDb } from '../../../db/client.js';
import { COLLECTIONS } from '../../../db/collections.js';
import { toObjectId } from '../../../utils/ids.js';
import { AppError } from '../../../utils/errors.js';
import { getFarmerInsights } from './insights.service.js';
import { getFarmerOverview } from './overview.service.js';
import { defineRoutes } from '../../../utils/defineRoutes.js';

export const farmerInsightsRouter = Router();

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
  // GET /api/farmer/insights
  {
    method: 'get',
    path: '/insights',
    auth: 'farmer',
    middlewares: [resolveFarmer],
    summary: 'Farmer revenue, orders, and sales insights across date ranges',
    handler: async (req, res, next) => {
      try {
        const range = req.query.range || '30d';
        const data = await getFarmerInsights(req.farmer._id, range);
        res.json({ data });
      } catch (err) {
        next(err);
      }
    },
  },

  // GET /api/farmer/overview
  {
    method: 'get',
    path: '/overview',
    auth: 'farmer',
    middlewares: [resolveFarmer],
    summary: 'Farmer daily summary dashboard with action items and earnings',
    handler: async (req, res, next) => {
      try {
        const data = await getFarmerOverview(req.farmer._id);
        res.json({ data });
      } catch (err) {
        next(err);
      }
    },
  },

  // GET /api/farmer/insights/overview
  {
    method: 'get',
    path: '/insights/overview',
    auth: 'farmer',
    middlewares: [resolveFarmer],
    summary: 'Farmer insights overview with KPIs',
    handler: async (req, res, next) => {
      try {
        const range = req.query.range || '30d';
        const data = await getFarmerInsights(req.farmer._id, range);
        res.json({
          data: {
            ...data,
            kpis: {
              revenueCents: data.revenueCents,
              totalOrders: data.totalOrders,
              averageOrderCents: data.averageOrderCents,
              repeatCustomers: data.repeatCustomers,
            },
          },
        });
      } catch (err) {
        next(err);
      }
    },
  },
];

defineRoutes(farmerInsightsRouter, 'farmerInsights', routes, { basePath: '/api/farmer' });
