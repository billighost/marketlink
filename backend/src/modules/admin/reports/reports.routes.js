/**
 * Admin Reports routes controller.
 */

import { Router } from 'express';
import {
  getAdminReportsSummary,
  exportCsvReport,
  getReportsHistory,
} from './reports.service.js';
import { defineRoutes } from '../../../utils/defineRoutes.js';

export const adminReportsRouter = Router();

const routes = [
  // GET /api/admin/reports/summary
  {
    method: 'get',
    path: '/summary',
    auth: 'admin',
    summary: 'Platform sales and GMV metrics by date range',
    handler: async (req, res, next) => {
      try {
        const data = await getAdminReportsSummary(req.query.range || '30d');
        res.json({ data });
      } catch (err) {
        next(err);
      }
    },
  },

  // GET /api/admin/reports/history
  {
    method: 'get',
    path: '/history',
    auth: 'admin',
    summary: 'List recent administrative CSV export generation history',
    handler: async (req, res, next) => {
      try {
        const data = await getReportsHistory();
        res.json({ data });
      } catch (err) {
        next(err);
      }
    },
  },

  // GET /api/admin/reports/export
  {
    method: 'get',
    path: '/export',
    auth: 'admin',
    limiter: 'export',
    summary: 'Export CSV streaming report for orders, products, or farmers',
    handler: async (req, res, next) => {
      try {
        await exportCsvReport(req.user, res, req, req.query);
      } catch (err) {
        next(err);
      }
    },
  },

  // GET /api/admin/reports/sales.csv
  {
    method: 'get',
    path: '/sales.csv',
    auth: 'admin',
    limiter: 'export',
    summary: 'Export sales CSV report',
    handler: async (req, res, next) => {
      try {
        await exportCsvReport(req.user, res, req, { ...req.query, type: 'orders' });
      } catch (err) {
        next(err);
      }
    },
  },
];

defineRoutes(adminReportsRouter, 'adminReports', routes, { basePath: '/api/admin/reports' });
