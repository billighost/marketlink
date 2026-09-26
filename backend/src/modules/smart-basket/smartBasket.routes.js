/**
 * Smart Basket routing layer.
 * POST /api/smart-basket/generate  - Generate basket from budget + categories or natural language prompt
 * POST /api/smart-basket/validate  - Validate stock/availability for basket items
 * GET  /api/smart-basket/replacements/:productId - Get in-stock replacement options
 */

import { Router } from 'express';
import { AppError } from '../../utils/errors.js';
import { isValidObjectId } from '../../utils/ids.js';
import { generateBasket, validateBasket, getReplacementProducts, parseBasketPrompt } from './smartBasket.service.js';
import { defineRoutes } from '../../utils/defineRoutes.js';

export const smartBasketRouter = Router();

const routes = [
  {
    method: 'post',
    path: '/generate',
    auth: 'optional',
    summary: 'Generate a Smart Basket suggestion from budget, categories, or natural language prompt',
    handler: async (req, res) => {
      const body = req.body || {};
      const details = [];

      // If a natural language prompt is supplied (e.g. "I have ₦10,000. I need vegetables, fruits and eggs for Saturday.")
      let effectiveBudget = body.budget;
      let effectiveCategories = body.categories;
      let effectivePickupDate = body.pickupDate;

      if (body.prompt && typeof body.prompt === 'string') {
        const parsed = parseBasketPrompt(body.prompt);
        if (effectiveBudget === undefined || effectiveBudget === null || effectiveBudget === '') {
          effectiveBudget = parsed.budget;
        }
        if (!Array.isArray(effectiveCategories) || effectiveCategories.length === 0) {
          effectiveCategories = parsed.categories;
        }
        if (!effectivePickupDate && parsed.pickupDay) {
          // If no specific ISO date, provide next occurrence of that weekday
          const dayMap = { wed: 3, fri: 5, sat: 6, sun: 0 };
          const targetDay = dayMap[parsed.pickupDay];
          if (targetDay !== undefined) {
            const d = new Date();
            const currentDay = d.getDay();
            const daysUntil = (targetDay - currentDay + 7) % 7 || 7;
            d.setDate(d.getDate() + daysUntil);
            effectivePickupDate = d.toISOString().slice(0, 10);
          }
        }
      }

      // Default categories if still empty
      if (!Array.isArray(effectiveCategories) || effectiveCategories.length === 0) {
        effectiveCategories = ['vegetables', 'fruit', 'dairy-and-eggs'];
      }

      // Validate budget (required, positive number)
      if (effectiveBudget === undefined || effectiveBudget === null || effectiveBudget === '') {
        details.push({ field: 'budget', message: 'budget is required.' });
      } else {
        const budget = Number(effectiveBudget);
        if (!Number.isFinite(budget) || budget <= 0) {
          details.push({ field: 'budget', message: 'budget must be a positive number.' });
        } else if (budget < 1) {
          details.push({ field: 'budget', message: 'Minimum budget is ₦100.' });
        } else if (budget > 10_000_000) {
          details.push({ field: 'budget', message: 'Maximum budget is ₦10,000,000.' });
        }
      }

      // Validate categories (array of strings, 1–10 items)
      if (effectiveCategories.length > 10) {
        details.push({ field: 'categories', message: 'Maximum 10 categories allowed.' });
      } else {
        for (let i = 0; i < effectiveCategories.length; i++) {
          if (typeof effectiveCategories[i] !== 'string' || effectiveCategories[i].trim().length === 0) {
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
      if (effectivePickupDate !== undefined && effectivePickupDate !== null && effectivePickupDate !== '') {
        const d = new Date(effectivePickupDate);
        if (isNaN(d.getTime())) {
          details.push({ field: 'pickupDate', message: 'pickupDate must be a valid ISO date string.' });
        }
      }

      if (details.length > 0) {
        throw AppError.unprocessable(details);
      }

      const result = await generateBasket({
        budget: Number(effectiveBudget),
        categories: effectiveCategories.map((c) => String(c).trim().toLowerCase()),
        marketId: body.marketId || null,
        pickupDate: effectivePickupDate || null,
        pickupTime: body.pickupTime || null,
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

  {
    method: 'get',
    path: '/replacements/:productId',
    auth: 'optional',
    summary: 'Get in-stock replacement products for a given product',
    handler: async (req, res) => {
      const { productId } = req.params;
      if (!isValidObjectId(productId)) {
        throw AppError.unprocessable([{ field: 'productId', message: 'Invalid product ID.' }]);
      }

      const { marketId, limit } = req.query;
      const replacements = await getReplacementProducts(productId, {
        marketId: marketId || null,
        limit: limit ? parseInt(limit, 10) : 6,
      });

      res.status(200).json({ ok: true, data: replacements });
    },
  },
];

defineRoutes(smartBasketRouter, 'smart-basket', routes);
