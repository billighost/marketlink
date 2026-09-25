/**
 * Notifications routing layer.
 * Exposes notification listing with unread counts and read receipt state transitions.
 */

import { Router } from 'express';
import { isValidObjectId } from '../../utils/ids.js';
import { AppError } from '../../utils/errors.js';
import {
  listNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from './notifications.service.js';
import { defineRoutes } from '../../utils/defineRoutes.js';

export const notificationsRouter = Router();

const routes = [
  // GET /notifications
  {
    method: 'get',
    path: '/',
    auth: 'any',
    summary: 'List notifications with unread counts and keyset pagination',
    handler: async (req, res) => {
      const { cursor, limit, unread } = req.query;

      const result = await listNotifications(req.user.id, {
        cursor: typeof cursor === 'string' ? cursor : undefined,
        limit: limit ? parseInt(limit, 10) : undefined,
        unread: unread === 'true',
      });

      res.status(200).json({
        data: result.items,
        meta: {
          nextCursor: result.nextCursor,
          limit: result.limit,
          unreadCount: result.unreadCount,
        },
      });
    },
  },

  // POST /notifications/read-all
  {
    method: 'post',
    path: '/read-all',
    auth: 'any',
    summary: 'Mark all notifications as read',
    handler: async (req, res) => {
      const result = await markAllNotificationsRead(req.user.id);
      res.status(200).json({
        data: result,
      });
    },
  },

  // POST /notifications/:id/read
  {
    method: 'post',
    path: '/:id/read',
    auth: 'any',
    summary: 'Mark a specific notification as read',
    handler: async (req, res) => {
      if (!isValidObjectId(req.params.id)) {
        throw AppError.notFound('Notification not found.');
      }

      const result = await markNotificationRead(req.params.id, req.user.id);

      res.status(200).json({
        data: result,
      });
    },
  },
];

defineRoutes(notificationsRouter, 'notifications', routes, { basePath: '/api/notifications' });
