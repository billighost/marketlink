/**
 * Notifications routing layer.
 * Exposes notification listing with unread counts and read receipt state transitions.
 */

import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { isValidObjectId } from '../../utils/ids.js';
import { AppError } from '../../utils/errors.js';
import {
  listNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from './notifications.service.js';

export const notificationsRouter = Router();

notificationsRouter.use(requireAuth);

// GET /notifications
notificationsRouter.get('/', async (req, res) => {
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
});

// POST /notifications/read-all
notificationsRouter.post('/read-all', async (req, res) => {
  const result = await markAllNotificationsRead(req.user.id);
  res.status(200).json({
    data: result,
  });
});

// POST /notifications/:id/read
notificationsRouter.post('/:id/read', async (req, res) => {
  if (!isValidObjectId(req.params.id)) {
    throw AppError.notFound('Notification not found.');
  }

  const result = await markNotificationRead(req.params.id, req.user.id);

  res.status(200).json({
    data: result,
  });
});
