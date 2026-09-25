/**
 * Admin Categories routes controller.
 */

import { Router } from 'express';
import {
  listCategoriesAdmin,
  createCategory,
  updateCategory,
  deleteCategory,
  reorderCategories,
} from './categoriesAdmin.service.js';
import { defineRoutes } from '../../../utils/defineRoutes.js';

export const categoriesAdminRouter = Router();

const routes = [
  // GET /api/admin/categories
  {
    method: 'get',
    path: '/',
    auth: 'admin',
    summary: 'List categories for administrative management',
    handler: async (req, res, next) => {
      try {
        const data = await listCategoriesAdmin();
        res.json({ data });
      } catch (err) {
        next(err);
      }
    },
  },

  // POST /api/admin/categories/reorder
  {
    method: 'post',
    path: '/reorder',
    auth: 'admin',
    summary: 'Reorder category display sequence',
    body: 'reorderCategories',
    handler: async (req, res, next) => {
      try {
        const result = await reorderCategories(req.user, req.body?.order);
        res.json({ data: result });
      } catch (err) {
        next(err);
      }
    },
  },

  // POST /api/admin/categories
  {
    method: 'post',
    path: '/',
    auth: 'admin',
    summary: 'Create category taxonomy item',
    body: 'createCategory',
    handler: async (req, res, next) => {
      try {
        const data = await createCategory(req.user, req.body);
        res.status(201).json({ data });
      } catch (err) {
        next(err);
      }
    },
  },

  // PATCH /api/admin/categories/:id
  {
    method: 'patch',
    path: '/:id',
    auth: 'admin',
    summary: 'Update category taxonomy item',
    body: 'updateCategory',
    handler: async (req, res, next) => {
      try {
        const data = await updateCategory(req.user, req.params.id, req.body || {});
        res.json({ data });
      } catch (err) {
        next(err);
      }
    },
  },

  // DELETE /api/admin/categories/:id
  {
    method: 'delete',
    path: '/:id',
    auth: 'admin',
    summary: 'Delete category taxonomy item',
    handler: async (req, res, next) => {
      try {
        const result = await deleteCategory(req.user, req.params.id);
        res.json({ data: result });
      } catch (err) {
        next(err);
      }
    },
  },
];

defineRoutes(categoriesAdminRouter, 'categoriesAdmin', routes, { basePath: '/api/admin/categories' });
