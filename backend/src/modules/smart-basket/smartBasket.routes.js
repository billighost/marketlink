/**
 * Smart Basket routing layer.
 * POST /api/smart-basket/generate  - Generate basket from budget + categories
 * POST /api/smart-basket/validate  - Validate stock/availability for basket items
 */

import { Router } from 'express';
import { AppError } from '../../utils/errors.js';
import { isValidObjectId } from '../../utils/ids.js';
import { generateBasket, validateBasket } from './smartBasket.service.js';
import { defineRoutes } from '../../utils/defineRoutes.js';

export const smartBasketRouter = Router();

const routes = [
  {
    method: 'post',
    path: '/generate',
    auth: 'customer',
    summary: 'Generate a Smart Basket suggestion from budget and categories',
    handler: async (req, res) => {
      const body = req.body || {};
      const details = [];

      // Validate budget (required, positive integer in naira)
      if (body.budget === undefined || body.budget === null || body.budget === '') {
        details.push({ field: 'budget', message: 'budget is required.' });
      } else {
        const budget = Number(body.budget);
        if (!Number.isFinite(budget) || budget <= 0) {
          details.push({ field: 'budget', message: 'budget must be a positive number.' });
        } else if (budget < 100) {
          details.push({ field: 'budget', message: 'Minimum budget is ₦100.' });
        } else if (budget > 10_000_000) {
          details.push({ field: 'budget', message: 'Maximum budget is ₦10,000,000.' });
        }
      }

      // Validate categories (required, array of strings, 1–10 items)
      if (!Array.isArray(body.categories) || body.categories.length === 0) {
        details.push({ field: 'categories', message: 'categories must be a non-empty array of category names.' });
      } else if (body.categories.length > 10) {
        details.push({ field: 'categories', message: 'Maximum 10 categories allowed.' });
      } else {
        for (let i = 0; i < body.categories.length; i++) {
          if (typeof body.categories[i] !== 'string' || body.categories[i].trim().length === 0) {
            details.push({ field: `categories[${i}]`, message: 'Each category must be a non-empty string.' });
          }
        }
      }

      // Validate optional marketId
      if (body.marketId !== undefined && body.marketId !== null && body.marketId !== '') {
        if (!isValidObjectId(body.marketId)) {
          details.push({ field: 'marketId', message: 'marketId must be a valid ID.' });
        }
      }

      // Validate optional pickupDate
      if (body.pickupDate !== undefined && body.pickupDate !== null && body.pickupDate !== '') {
        const d = new Date(body.pickupDate);
        if (isNaN(d.getTime())) {
          details.push({ field: 'pickupDate', message: 'pickupDate must be a valid ISO date string.' });
        }
      }

      if (details.length > 0) {
        throw AppError.unprocessable(details);
      }

      const result = await generateBasket({
        budget: Number(body.budget),
        categories: body.categories.map((c) => String(c).trim().toLowerCase()),
        marketId: body.marketId || null,
        pickupDate: body.pickupDate || null,
      });

      res.status(200).json({ ok: true, data: result });
    },
  },

  {
    method: 'post',
    path: '/validate',
    auth: 'customer',
    summary: 'Validate current stock and availability for a set of basket items',
    handler: async (req, res) => {
      const body = req.body || {};

      if (!Array.isArray(body.items)) {
        throw AppError.unprocessable([{ field: 'items', message: 'items must be an array.' }]);
      }
      if (body.items.length > 50) {
        throw AppError.unprocessable([{ field: 'items', message: 'Maximum 50 items per validation request.' }]);
      }

      const details = [];
      for (let i = 0; i < body.items.length; i++) {
        const item = body.items[i];
        if (!item || typeof item !== 'object') {
          details.push({ field: `items[${i}]`, message: 'Each item must be an object.' });
          continue;
        }
        if (!isValidObjectId(item.productId)) {
          details.push({ field: `items[${i}].productId`, message: 'productId must be a valid ID.' });
        }
        const qty = Number(item.quantity);
        if (!Number.isInteger(qty) || qty < 1 || qty > 999) {
          details.push({ field: `items[${i}].quantity`, message: 'quantity must be an integer between 1 and 999.' });
        }
      }

      if (details.length > 0) {
        throw AppError.unprocessable(details);
      }

      const result = await validateBasket(
        body.items.map((i) => ({ productId: String(i.productId), quantity: Number(i.quantity) }))
      );

      res.status(200).json({ ok: true, data: result });
    },
  },
];

defineRoutes(smartBasketRouter, 'smart-basket', routes);
