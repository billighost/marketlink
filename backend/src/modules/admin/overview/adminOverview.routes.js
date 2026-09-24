/**
 * Admin Overview routes controller.
 */

import { Router } from 'express';
import { requireAuth, requireRole } from '../../../middleware/auth.js';
import { getAdminOverview } from './adminOverview.service.js';

export const adminOverviewRouter = Router();

// GET /api/admin/overview
adminOverviewRouter.get(
  '/',
  requireAuth,
  requireRole('admin'),
  async (req, res, next) => {
    try {
      const data = await getAdminOverview();
      res.json({ data });
    } catch (err) {
      next(err);
    }
  }
);
