/**
 * Admin Moderation routes controller.
 */

import { Router } from 'express';
import {
  listModerationFlags,
  resolveModerationFlag,
  removeProductByAdmin,
  removeReviewByAdmin,
} from './moderation.service.js';
import { defineRoutes } from '../../../utils/defineRoutes.js';

export const adminModerationRouter = Router();

const routes = [
  // GET /api/admin/moderation
  {
    method: 'get',
    path: '/moderation',
    auth: 'admin',
    summary: 'List moderation flags with target preview previews',
    handler: async (req, res, next) => {
      try {
        const result = await listModerationFlags(req.query);
        res.json(result);
      } catch (err) {
        next(err);
      }
    },
  },

  // POST /api/admin/moderation/:id/resolve
  {
    method: 'post',
    path: '/moderation/:id/resolve',
    auth: 'admin',
    summary: 'Resolve moderation flag with action',
    body: 'resolveModeration',
    handler: async (req, res, next) => {
      try {
        const result = await resolveModerationFlag(req.user, req.params.id, req.body || {});
        res.json({ data: result });
      } catch (err) {
        next(err);
      }
    },
  },

  // POST /api/admin/products/:id/remove
  {
    method: 'post',
    path: '/products/:id/remove',
    auth: 'admin',
    summary: 'Direct administrative removal and delisting of product',
    body: 'removeProduct',
    handler: async (req, res, next) => {
      try {
        const result = await removeProductByAdmin(req.user, req.params.id, req.body?.note);
        res.json({ data: result });
      } catch (err) {
        next(err);
      }
    },
  },

  // POST /api/admin/reviews/:id/remove
  {
    method: 'post',
    path: '/reviews/:id/remove',
    auth: 'admin',
    summary: 'Direct administrative removal of review and rating reversal',
    body: 'removeReview',
    handler: async (req, res, next) => {
      try {
        const result = await removeReviewByAdmin(req.user, req.params.id, req.body?.note);
        res.json({ data: result });
      } catch (err) {
        next(err);
      }
    },
  },
];

defineRoutes(adminModerationRouter, 'adminModeration', routes, { basePath: '/api/admin' });
