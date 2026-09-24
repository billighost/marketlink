/**
 * Farmer Insights and Overview routes controller.
 */

import { Router } from 'express';
import { requireAuth, requireRole } from '../../../middleware/auth.js';
import { getDb } from '../../../db/client.js';
import { COLLECTIONS } from '../../../db/collections.js';
import { toObjectId } from '../../../utils/ids.js';
import { AppError } from '../../../utils/errors.js';
import { getFarmerInsights } from './insights.service.js';
import { getFarmerOverview } from './overview.service.js';

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

// GET /api/farmer/insights
farmerInsightsRouter.get(
  '/insights',
  requireAuth,
  requireRole('farmer'),
  resolveFarmer,
  async (req, res, next) => {
    try {
      const range = req.query.range || '30d';
      const data = await getFarmerInsights(req.farmer._id, range);
      res.json({ data });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/farmer/overview
farmerInsightsRouter.get(
  '/overview',
  requireAuth,
  requireRole('farmer'),
  resolveFarmer,
  async (req, res, next) => {
    try {
      const data = await getFarmerOverview(req.farmer._id);
      res.json({ data });
    } catch (err) {
      next(err);
    }
  }
);
