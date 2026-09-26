/**
 * Admin Settings routes controller.
 */

import { Router } from 'express';
import {
  getPlatformSettings,
  updatePlatformSettings,
} from './settings.service.js';
import { defineRoutes } from '../../../utils/defineRoutes.js';

export const settingsAdminRouter = Router();

const routes = [
  // GET /api/admin/settings
  {
    method: 'get',
    path: '/',
    auth: 'admin',
    summary: 'Get global platform settings',
    handler: async (req, res, next) => {
      try {
        const data = await getPlatformSettings();
        res.json({ data });
      } catch (err) {
        next(err);
      }
    },
  },

  // PATCH /api/admin/settings
  {
    method: 'patch',
    path: '/',
    auth: 'admin',
    summary: 'Update global platform settings',
    body: 'platformSettings',
    handler: async (req, res, next) => {
      try {
        const data = await updatePlatformSettings(req.user, req.body || {});
        res.json({ data });
      } catch (err) {
        next(err);
      }
    },
  },
];

defineRoutes(settingsAdminRouter, 'settingsAdmin', routes, { basePath: '/api/admin/settings' });
