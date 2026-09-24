/**
 * Admin Announcements routes controller.
 */

import { Router } from 'express';
import { requireAuth, requireRole } from '../../../middleware/auth.js';
import {
  listAnnouncementsAdmin,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  publishAnnouncement,
} from './announcementsAdmin.service.js';

export const announcementsAdminRouter = Router();

// GET /api/admin/announcements
announcementsAdminRouter.get(
  '/',
  requireAuth,
  requireRole('admin'),
  async (req, res, next) => {
    try {
      const data = await listAnnouncementsAdmin();
      res.json({ data });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/admin/announcements
announcementsAdminRouter.post(
  '/',
  requireAuth,
  requireRole('admin'),
  async (req, res, next) => {
    try {
      const data = await createAnnouncement(req.user, req.body);
      res.status(201).json({ data });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/admin/announcements/:id/publish
announcementsAdminRouter.post(
  '/:id/publish',
  requireAuth,
  requireRole('admin'),
  async (req, res, next) => {
    try {
      const data = await publishAnnouncement(req.user, req.params.id);
      res.json({ data });
    } catch (err) {
      next(err);
    }
  }
);

// PATCH /api/admin/announcements/:id
announcementsAdminRouter.patch(
  '/:id',
  requireAuth,
  requireRole('admin'),
  async (req, res, next) => {
    try {
      const data = await updateAnnouncement(req.user, req.params.id, req.body || {});
      res.json({ data });
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /api/admin/announcements/:id
announcementsAdminRouter.delete(
  '/:id',
  requireAuth,
  requireRole('admin'),
  async (req, res, next) => {
    try {
      const result = await deleteAnnouncement(req.user, req.params.id);
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  }
);
