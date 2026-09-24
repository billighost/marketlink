/**
 * Admin Categories routes controller.
 */

import { Router } from 'express';
import { requireAuth, requireRole } from '../../../middleware/auth.js';
import {
  listCategoriesAdmin,
  createCategory,
  updateCategory,
  deleteCategory,
  reorderCategories,
} from './categoriesAdmin.service.js';

export const categoriesAdminRouter = Router();

// GET /api/admin/categories
categoriesAdminRouter.get(
  '/',
  requireAuth,
  requireRole('admin'),
  async (req, res, next) => {
    try {
      const data = await listCategoriesAdmin();
      res.json({ data });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/admin/categories/reorder (mount before /:id)
categoriesAdminRouter.post(
  '/reorder',
  requireAuth,
  requireRole('admin'),
  async (req, res, next) => {
    try {
      const result = await reorderCategories(req.user, req.body?.order);
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/admin/categories
categoriesAdminRouter.post(
  '/',
  requireAuth,
  requireRole('admin'),
  async (req, res, next) => {
    try {
      const data = await createCategory(req.user, req.body);
      res.status(201).json({ data });
    } catch (err) {
      next(err);
    }
  }
);

// PATCH /api/admin/categories/:id
categoriesAdminRouter.patch(
  '/:id',
  requireAuth,
  requireRole('admin'),
  async (req, res, next) => {
    try {
      const data = await updateCategory(req.user, req.params.id, req.body || {});
      res.json({ data });
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /api/admin/categories/:id
categoriesAdminRouter.delete(
  '/:id',
  requireAuth,
  requireRole('admin'),
  async (req, res, next) => {
    try {
      const result = await deleteCategory(req.user, req.params.id);
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  }
);
