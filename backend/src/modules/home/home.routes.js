/**
 * Home routing layer.
 * Exposes customer home summary endpoint.
 */

import { Router } from 'express';
import { getHomeSummary } from './home.service.js';
import { defineRoutes } from '../../utils/defineRoutes.js';

export const homeRouter = Router();

defineRoutes(
  homeRouter,
  'home',
  [
    {
      method: 'get',
      path: '/summary',
      auth: 'customer',
      summary: 'Customer personalized dashboard summary with ready orders and pickup alerts',
      handler: async (req, res) => {
        const summary = await getHomeSummary(req.user.id);
        res.status(200).json({
          data: summary,
        });
      },
    },
  ],
  { basePath: '/api/home' }
);
