/**
 * Admin Contact Messages routes controller.
 */

import { Router } from 'express';
import { requireAuth, requireRole } from '../../../middleware/auth.js';
import {
  listContactMessages,
  handleContactMessage,
} from './messagesAdmin.service.js';

export const messagesAdminRouter = Router();

// GET /api/admin/messages
messagesAdminRouter.get(
  '/',
  requireAuth,
  requireRole('admin'),
  async (req, res, next) => {
    try {
      const result = await listContactMessages(req.query);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/admin/messages/:id/handle
messagesAdminRouter.post(
  '/:id/handle',
  requireAuth,
  requireRole('admin'),
  async (req, res, next) => {
    try {
      const result = await handleContactMessage(req.user, req.params.id, req.body?.reply);
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  }
);
