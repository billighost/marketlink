/**
 * Admin Announcements routes controller.
 */

import { Router } from 'express';
import {
  listAnnouncementsAdmin,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  publishAnnouncement,
} from './announcementsAdmin.service.js';
import { defineRoutes } from '../../../utils/defineRoutes.js';

export const announcementsAdminRouter = Router();

const routes = [
  // GET /api/admin/announcements
  {
    method: 'get',
    path: '/',
    auth: 'admin',
    summary: 'List platform announcements for administration',
    handler: async (req, res, next) => {
      try {
        const data = await listAnnouncementsAdmin();
        res.json({ data });
      } catch (err) {
        next(err);
      }
    },
  },

  // POST /api/admin/announcements
  {
    method: 'post',
    path: '/',
    auth: 'admin',
    summary: 'Create platform announcement',
    body: 'createAnnouncement',
    handler: async (req, res, next) => {
      try {
        const data = await createAnnouncement(req.user, req.body);
        res.status(201).json({ data });
      } catch (err) {
        next(err);
      }
    },
  },

  // POST /api/admin/announcements/:id/publish
  {
    method: 'post',
    path: '/:id/publish',
    auth: 'admin',
    summary: 'Publish draft announcement',
    handler: async (req, res, next) => {
      try {
        const data = await publishAnnouncement(req.user, req.params.id);
        res.json({ data });
      } catch (err) {
        next(err);
      }
    },
  },

  // PATCH /api/admin/announcements/:id
  {
    method: 'patch',
    path: '/:id',
    auth: 'admin',
    summary: 'Update announcement details',
    body: 'updateAnnouncement',
    handler: async (req, res, next) => {
      try {
        const data = await updateAnnouncement(req.user, req.params.id, req.body || {});
        res.json({ data });
      } catch (err) {
        next(err);
      }
    },
  },

  // DELETE /api/admin/announcements/:id
  {
    method: 'delete',
    path: '/:id',
    auth: 'admin',
    summary: 'Delete announcement',
    handler: async (req, res, next) => {
      try {
        const result = await deleteAnnouncement(req.user, req.params.id);
        res.json({ data: result });
      } catch (err) {
        next(err);
      }
    },
  },
];

defineRoutes(announcementsAdminRouter, 'announcementsAdmin', routes, { basePath: '/api/admin/announcements' });
