/**
 * Admin Moderation routes controller.
 */

import { Router } from 'express';
import { requireAuth, requireRole } from '../../../middleware/auth.js';
import {
  listModerationFlags,
  resolveModerationFlag,
  removeProductByAdmin,
  removeReviewByAdmin,
} from './moderation.service.js';

export const adminModerationRouter = Router();

// GET /api/admin/moderation
adminModerationRouter.get(
  '/moderation',
  requireAuth,
  requireRole('admin'),
  async (req, res, next) => {
    try {
      const result = await listModerationFlags(req.query);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/admin/moderation/:id/resolve
adminModerationRouter.post(
  '/moderation/:id/resolve',
  requireAuth,
  requireRole('admin'),
  async (req, res, next) => {
    try {
      const result = await resolveModerationFlag(req.user, req.params.id, req.body || {});
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/admin/products/:id/remove
adminModerationRouter.post(
  '/products/:id/remove',
  requireAuth,
  requireRole('admin'),
  async (req, res, next) => {
    try {
      const result = await removeProductByAdmin(req.user, req.params.id, req.body?.note);
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/admin/reviews/:id/remove
adminModerationRouter.post(
  '/reviews/:id/remove',
  requireAuth,
  requireRole('admin'),
  async (req, res, next) => {
    try {
      const result = await removeReviewByAdmin(req.user, req.params.id, req.body?.note);
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  }
);
