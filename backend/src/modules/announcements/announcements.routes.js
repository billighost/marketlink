/**
 * Announcements module routing.
 * Exposes GET /api/announcements with optional authentication.
 */

import { Router } from 'express';
import { optionalAuth } from '../../middleware/auth.js';
import { listActiveAnnouncements } from './announcements.service.js';

export const announcementsRouter = Router();

/**
 * GET /api/announcements
 * Returns active announcements for the caller's role (or 'all' for guests).
 */
announcementsRouter.get('/', optionalAuth, async (req, res, next) => {
  try {
    const role = req.user?.role || null;
    const data = await listActiveAnnouncements(role);
    res.set('Cache-Control', 'public, max-age=30');
    return res.json({ data });
  } catch (err) {
    next(err);
  }
});
