/**
 * Admin Overview routes controller.
 */

import { Router } from 'express';
import { getAdminOverview } from './adminOverview.service.js';
import { defineRoutes } from '../../../utils/defineRoutes.js';

export const adminOverviewRouter = Router();

defineRoutes(
  adminOverviewRouter,
  'adminOverview',
  [
    {
      method: 'get',
      path: '/',
      auth: 'admin',
      summary: 'Platform-wide administrator overview dashboard metrics',
      handler: async (req, res, next) => {
        try {
          const data = await getAdminOverview();
          res.json({ data });
        } catch (err) {
          next(err);
        }
      },
    },
  ],
  { basePath: '/api/admin/overview' }
);
