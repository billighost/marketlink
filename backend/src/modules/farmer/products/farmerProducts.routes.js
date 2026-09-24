/**
 * Farmer Products and Weekly Template routes.
 * Endpoints for catalog management, stock toggles, bulk actions, and recurring templates.
 */

import { Router } from 'express';
import { requireAuth, requireRole } from '../../../middleware/auth.js';
import { requireApprovedFarmer } from '../../../middleware/requireApprovedFarmer.js';
import { getDb } from '../../../db/client.js';
import { COLLECTIONS } from '../../../db/collections.js';
import { toObjectId } from '../../../utils/ids.js';
import { AppError } from '../../../utils/errors.js';
import {
  listFarmerProducts,
  getFarmerProductById,
  createFarmerProduct,
  updateFarmerProduct,
  setProductSoldOut,
  setProductAvailable,
  setProductHidden,
  deleteFarmerProduct,
  bulkFarmerProducts,
} from './farmerProducts.service.js';
import {
  getWeeklyTemplate,
  updateWeeklyTemplate,
  applyWeeklyTemplate,
} from './weeklyTemplate.service.js';

export const farmerProductsRouter = Router();
export const weeklyTemplateRouter = Router();

/**
 * Middleware to resolve the farmer document from req.user.id.
 */
async function resolveFarmer(req, res, next) {
  try {
    const db = getDb();
    const farmer = await db.collection(COLLECTIONS.FARMERS).findOne({
      userId: toObjectId(req.user.id),
    });
    if (!farmer) {
      return next(AppError.notFound('Farmer profile not found'));
    }
    req.farmer = farmer;
    next();
  } catch (err) {
    next(err);
  }
}

// ── Products Endpoints ──────────────────────────────────────────

// GET /api/farmer/products - list products
farmerProductsRouter.get(
  '/',
  requireAuth,
  requireRole('farmer'),
  resolveFarmer,
  async (req, res, next) => {
    try {
      const result = await listFarmerProducts(req.farmer._id, req.query);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/farmer/products - create product
farmerProductsRouter.post(
  '/',
  requireAuth,
  requireRole('farmer'),
  requireApprovedFarmer,
  resolveFarmer,
  async (req, res, next) => {
    try {
      const product = await createFarmerProduct(req.farmer._id, req.body);
      res.status(201).json({ data: product });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/farmer/products/bulk - bulk actions
farmerProductsRouter.post(
  '/bulk',
  requireAuth,
  requireRole('farmer'),
  requireApprovedFarmer,
  resolveFarmer,
  async (req, res, next) => {
    try {
      const result = await bulkFarmerProducts(req.farmer._id, req.body);
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/farmer/products/:id - get product details
farmerProductsRouter.get(
  '/:id',
  requireAuth,
  requireRole('farmer'),
  resolveFarmer,
  async (req, res, next) => {
    try {
      const product = await getFarmerProductById(req.farmer._id, req.params.id);
      res.json({ data: product });
    } catch (err) {
      next(err);
    }
  }
);

// PATCH /api/farmer/products/:id - update product
farmerProductsRouter.patch(
  '/:id',
  requireAuth,
  requireRole('farmer'),
  requireApprovedFarmer,
  resolveFarmer,
  async (req, res, next) => {
    try {
      const product = await updateFarmerProduct(req.farmer._id, req.params.id, req.body);
      res.json({ data: product });
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /api/farmer/products/:id - delete/archive product
farmerProductsRouter.delete(
  '/:id',
  requireAuth,
  requireRole('farmer'),
  requireApprovedFarmer,
  resolveFarmer,
  async (req, res, next) => {
    try {
      const result = await deleteFarmerProduct(req.farmer._id, req.params.id);
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/farmer/products/:id/sold-out
farmerProductsRouter.post(
  '/:id/sold-out',
  requireAuth,
  requireRole('farmer'),
  requireApprovedFarmer,
  resolveFarmer,
  async (req, res, next) => {
    try {
      const product = await setProductSoldOut(req.farmer._id, req.params.id);
      res.json({ data: product });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/farmer/products/:id/available
farmerProductsRouter.post(
  '/:id/available',
  requireAuth,
  requireRole('farmer'),
  requireApprovedFarmer,
  resolveFarmer,
  async (req, res, next) => {
    try {
      const product = await setProductAvailable(req.farmer._id, req.params.id, req.body || {});
      res.json({ data: product });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/farmer/products/:id/hide
farmerProductsRouter.post(
  '/:id/hide',
  requireAuth,
  requireRole('farmer'),
  requireApprovedFarmer,
  resolveFarmer,
  async (req, res, next) => {
    try {
      const product = await setProductHidden(req.farmer._id, req.params.id, true);
      res.json({ data: product });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/farmer/products/:id/unhide
farmerProductsRouter.post(
  '/:id/unhide',
  requireAuth,
  requireRole('farmer'),
  requireApprovedFarmer,
  resolveFarmer,
  async (req, res, next) => {
    try {
      const product = await setProductHidden(req.farmer._id, req.params.id, false);
      res.json({ data: product });
    } catch (err) {
      next(err);
    }
  }
);

// ── Weekly Template Endpoints ────────────────────────────────────

// GET /api/farmer/weekly-template
weeklyTemplateRouter.get(
  '/',
  requireAuth,
  requireRole('farmer'),
  resolveFarmer,
  async (req, res, next) => {
    try {
      const items = await getWeeklyTemplate(req.farmer._id);
      res.json({ data: items });
    } catch (err) {
      next(err);
    }
  }
);

// PUT /api/farmer/weekly-template
weeklyTemplateRouter.put(
  '/',
  requireAuth,
  requireRole('farmer'),
  requireApprovedFarmer,
  resolveFarmer,
  async (req, res, next) => {
    try {
      const result = await updateWeeklyTemplate(req.farmer._id, req.body.items);
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/farmer/weekly-template/apply
weeklyTemplateRouter.post(
  '/apply',
  requireAuth,
  requireRole('farmer'),
  requireApprovedFarmer,
  resolveFarmer,
  async (req, res, next) => {
    try {
      const result = await applyWeeklyTemplate(req.farmer._id);
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  }
);
