/**
 * Admin Reports routes controller.
 */

import { Router } from 'express';
import { requireAuth, requireRole } from '../../../middleware/auth.js';
import {
  getAdminReportsSummary,
  exportCsvReport,
} from './reports.service.js';

export const adminReportsRouter = Router();

// GET /api/admin/reports/summary
adminReportsRouter.get(
  '/summary',
  requireAuth,
  requireRole('admin'),
  async (req, res, next) => {
    try {
      const data = await getAdminReportsSummary(req.query.range || '30d');
      res.json({ data });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/admin/reports/export
adminReportsRouter.get(
  '/export',
  requireAuth,
  requireRole('admin'),
  async (req, res, next) => {
    try {
      await exportCsvReport(req.user, res, req, req.query);
    } catch (err) {
      next(err);
    }
  }
);
