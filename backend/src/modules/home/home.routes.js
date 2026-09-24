/**
 * Home routing layer.
 * Exposes customer home summary endpoint.
 */

import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { ROLES } from '../../constants.js';
import { getHomeSummary } from './home.service.js';

export const homeRouter = Router();

// GET /home/summary (Customer only)
homeRouter.get('/summary', requireAuth, requireRole(ROLES.CUSTOMER), async (req, res) => {
  const summary = await getHomeSummary(req.user.id);
  res.status(200).json({
    data: summary,
  });
});
