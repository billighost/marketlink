/**
 * Farmer Reviews routes controller.
 * Exposes listing, summary breakdown, and reply endpoints.
 */

import { Router } from 'express';
import { requireAuth, requireRole } from '../../../middleware/auth.js';
import { requireApprovedFarmer } from '../../../middleware/requireApprovedFarmer.js';
import { getDb } from '../../../db/client.js';
import { COLLECTIONS } from '../../../db/collections.js';
import { toObjectId } from '../../../utils/ids.js';
import { AppError } from '../../../utils/errors.js';
import {
  listFarmerReviews,
  replyToReview,
  deleteReviewReply,
} from './farmerReviews.service.js';

export const farmerReviewsRouter = Router();

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

// GET /api/farmer/reviews
farmerReviewsRouter.get(
  '/',
  requireAuth,
  requireRole('farmer'),
  resolveFarmer,
  async (req, res, next) => {
    try {
      const result = await listFarmerReviews(req.farmer._id, req.query);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/farmer/reviews/:id/reply
farmerReviewsRouter.post(
  '/:id/reply',
  requireAuth,
  requireRole('farmer'),
  requireApprovedFarmer,
  resolveFarmer,
  async (req, res, next) => {
    try {
      const text = req.body?.body || req.body?.comment || req.body?.text;
      const review = await replyToReview(req.farmer._id, req.params.id, text);
      res.json({ data: review });
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /api/farmer/reviews/:id/reply
farmerReviewsRouter.delete(
  '/:id/reply',
  requireAuth,
  requireRole('farmer'),
  requireApprovedFarmer,
  resolveFarmer,
  async (req, res, next) => {
    try {
      const result = await deleteReviewReply(req.farmer._id, req.params.id);
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  }
);
