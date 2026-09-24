/**
 * Reviews routing layer.
 * Exposes author edit/delete operations, review rating updates, and moderation flagging.
 */

import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { reviewRateLimiter } from '../../middleware/rateLimits.js';
import { ROLES } from '../../constants.js';
import { isValidObjectId } from '../../utils/ids.js';
import {
  rejectUnknownFields,
  validateInteger,
  validateString,
  assertValid,
} from '../../utils/validate.js';
import { AppError } from '../../utils/errors.js';
import { updateReview, deleteReview, flagReview } from './reviews.service.js';

export const reviewsRouter = Router();

// PATCH /reviews/:id (Author only, within 14 days)
reviewsRouter.patch('/:id', reviewRateLimiter, requireAuth, requireRole(ROLES.CUSTOMER), async (req, res) => {
  if (!isValidObjectId(req.params.id)) {
    throw AppError.notFound('Review not found.');
  }

  rejectUnknownFields(req.body, ['rating', 'comment']);
  const details = [];
  const updates = {};

  if (req.body.rating === undefined && req.body.comment === undefined) {
    throw AppError.unprocessable([
      { field: 'body', message: 'At least one of rating or comment must be provided.' },
    ]);
  }

  if (req.body.rating !== undefined) {
    updates.rating = validateInteger(req.body.rating, 'rating', details, {
      required: true,
      min: 1,
      max: 5,
    });
  }

  if (req.body.comment !== undefined) {
    updates.comment = validateString(req.body.comment, 'comment', details, {
      required: false,
      max: 1000,
    });
  }

  assertValid(details);

  const updatedReview = await updateReview(req.params.id, req.user.id, updates);

  res.status(200).json({
    data: updatedReview,
  });
});

// DELETE /reviews/:id (Author only, within 14 days)
reviewsRouter.delete('/:id', requireAuth, requireRole(ROLES.CUSTOMER), async (req, res) => {
  if (!isValidObjectId(req.params.id)) {
    throw AppError.notFound('Review not found.');
  }

  const result = await deleteReview(req.params.id, req.user.id);

  res.status(200).json({
    data: result,
  });
});

// POST /reviews/:id/flag (Any signed-in role, reason 3..300)
reviewsRouter.post('/:id/flag', reviewRateLimiter, requireAuth, async (req, res) => {
  if (!isValidObjectId(req.params.id)) {
    throw AppError.notFound('Review not found.');
  }

  rejectUnknownFields(req.body, ['reason']);
  const details = [];

  const reason = validateString(req.body.reason, 'reason', details, {
    required: true,
    min: 3,
    max: 300,
  });

  assertValid(details);

  const result = await flagReview(req.params.id, req.user, reason);

  res.status(200).json({
    data: result,
  });
});
