/**
 * Smart Basket routing layer.
 * Exposes endpoints for generating budget-aware baskets from real inventory,
 * validating stock, recalculating authoritative totals, and creating final pre-orders.
 *
 * GET  /api/smart-basket/options         - Get markets, categories, operating days
 * GET  /api/smart-basket/products/search - Search products to replace or add to basket
 * POST /api/smart-basket/generate        - Generate basket from prompt/budget/categories
 * POST /api/smart-basket/recalculate     - Recalculate basket totals authoritatively
 * POST /api/smart-basket/validate        - Validate live stock and availability
 * POST /api/smart-basket/order           - Create final order with atomic stock checks
 * POST /api/smart-basket/reserve         - Alias for pre-order reservation
 */

import { Router } from 'express';
import {
  getOptionsController,
  searchProductsController,
  generateBasketController,
  recalculateBasketController,
  validateBasketController,
  createOrderController,
} from './smartBasket.controller.js';
import { defineRoutes } from '../../utils/defineRoutes.js';

export const smartBasketRouter = Router();

const routes = [
  {
    method: 'get',
    path: '/options',
    auth: 'public',
    summary: 'Get available markets, categories, and pickup days for Smart Basket',
    handler: getOptionsController,
  },

  {
    method: 'get',
    path: '/products/search',
    auth: 'public',
    summary: 'Search active database products to replace or add to Smart Basket',
    handler: searchProductsController,
  },

  {
    method: 'post',
    path: '/generate',
    auth: 'optional',
    summary: 'Generate a Smart Basket suggestion from prompt or budget and categories',
    handler: generateBasketController,
  },

  {
    method: 'post',
    path: '/recalculate',
    auth: 'optional',
    summary: 'Recalculate basket totals authoritatively using server-side product prices',
    handler: recalculateBasketController,
  },

  {
    method: 'post',
    path: '/validate',
    auth: 'optional',
    summary: 'Validate current stock and availability for a set of basket items',
    handler: validateBasketController,
  },

  {
    method: 'post',
    path: '/order',
    auth: 'customer',
    limiter: 'checkout',
    summary: 'Create final order from Smart Basket with atomic stock reservation',
    handler: createOrderController,
  },

  {
    method: 'post',
    path: '/reserve',
    auth: 'customer',
    limiter: 'checkout',
    summary: 'Reserve Smart Basket pre-order with atomic stock reservation',
    handler: createOrderController,
  },
];

defineRoutes(smartBasketRouter, 'smart-basket', routes, { basePath: '/api/smart-basket' });
