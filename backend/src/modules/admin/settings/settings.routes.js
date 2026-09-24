/**
 * Admin Settings routes controller.
 */

import { Router } from 'express';
import { requireAuth, requireRole } from '../../../middleware/auth.js';
import {
  getPlatformSettings,
  updatePlatformSettings,
} from './settings.service.js';

export const settingsAdminRouter = Router();

// GET /api/admin/settings
settingsAdminRouter.get(
  '/',
  requireAuth,
  requireRole('admin'),
  async (req, res, next) => {
    try {
      const data = await getPlatformSettings();
      res.json({ data });
    } catch (err) {
      next(err);
    }
  }
);

// PATCH /api/admin/settings
settingsAdminRouter.patch(
  '/',
  requireAuth,
  requireRole('admin'),
  async (req, res, next) => {
    try {
      const data = await updatePlatformSettings(req.user, req.body || {});
      res.json({ data });
    } catch (err) {
      next(err);
    }
  }
);
