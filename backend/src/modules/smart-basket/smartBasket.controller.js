/**
 * Smart Basket Controller.
 * Handles request validation, parameter normalization, and delegates to service layer.
 * Strictly calculates authoritative prices and totals on the backend.
 */

import { AppError } from '../../utils/errors.js';
import { isValidObjectId } from '../../utils/ids.js';
import {
  rejectUnknownFields,
  validateInteger,
  validateNumber,
  validateString,
  validateDate,
  validateObjectIdStr,
  assertValid,
} from '../../utils/validate.js';
import {
  generateBasket,
  recalculateBasket,
  validateBasket,
  createSmartBasketOrder,
  getSmartBasketOptions,
  searchAvailableProducts,
} from './smartBasket.service.js';

/**
 * Controller for GET /api/smart-basket/options
 */
export async function getOptionsController(req, res) {
  const options = await getSmartBasketOptions();
  res.status(200).json({ ok: true, data: options });
}

/**
 * Controller for GET /api/smart-basket/products/search
 */
export async function searchProductsController(req, res) {
  const { q, marketId, categorySlug, day } = req.query;
  const products = await searchAvailableProducts({
    query: q || '',
    marketId: marketId || null,
    categorySlug: categorySlug || null,
    day: day || null,
  });
  res.status(200).json({ ok: true, data: products });
}

/**
 * Controller for POST /api/smart-basket/generate
 * Supports both structured payload and natural language prompt:
 * {
 *   "budget": 10000,
 *   "categories": ["vegetables", "fruits", "eggs"],
 *   "marketId": "...",
 *   "pickupDate": "...",
 *   "pickupTime": "...",
 *   "prompt": "..."
 * }
 */
export async function generateBasketController(req, res) {
  const body = req.body || {};
  const details = [];

  rejectUnknownFields(body, [
    'budget',
    'categories',
    'marketId',
    'day',
    'pickupDate',
    'pickupTime',
    'prompt',
  ]);

  // If no prompt provided, validate budget
  let validatedBudget = null;
  if (!body.prompt) {
    if (body.budget === undefined || body.budget === null || body.budget === '') {
      details.push({ field: 'budget', message: 'budget or prompt is required.' });
    } else {
      const budgetNum = Number(body.budget);
      if (!Number.isFinite(budgetNum) || budgetNum <= 0) {
        details.push({ field: 'budget', message: 'budget must be a positive number.' });
      } else if (budgetNum < 100) {
        details.push({ field: 'budget', message: 'Minimum budget is ₦100.' });
      } else if (budgetNum > 10_000_000) {
        details.push({ field: 'budget', message: 'Maximum budget is ₦10,000,000.' });
      } else {
        validatedBudget = budgetNum;
      }
    }
  } else {
    if (body.budget !== undefined && body.budget !== null && body.budget !== '') {
      const budgetNum = Number(body.budget);
      if (Number.isFinite(budgetNum) && budgetNum >= 100) {
        validatedBudget = budgetNum;
      }
    }
  }

  // Validate optional categories array
  let validatedCategories = [];
  if (body.categories !== undefined && body.categories !== null) {
    if (!Array.isArray(body.categories)) {
      details.push({ field: 'categories', message: 'categories must be an array of category names or slugs.' });
    } else {
      for (let i = 0; i < body.categories.length; i++) {
        const cat = body.categories[i];
        if (typeof cat !== 'string' || cat.trim().length === 0) {
          details.push({ field: `categories[${i}]`, message: 'Each category must be a non-empty string.' });
        } else {
          validatedCategories.push(cat.trim().toLowerCase());
        }
      }
    }
  }

  // Validate optional marketId
  let validatedMarketId = null;
  if (body.marketId !== undefined && body.marketId !== null && body.marketId !== '') {
    if (!isValidObjectId(body.marketId)) {
      details.push({ field: 'marketId', message: 'marketId must be a valid 24-character hexadecimal identifier.' });
    } else {
      validatedMarketId = String(body.marketId).trim();
    }
  }

  // Validate optional pickupDate
  let validatedPickupDate = null;
  if (body.pickupDate !== undefined && body.pickupDate !== null && body.pickupDate !== '') {
    const d = new Date(body.pickupDate);
    if (Number.isNaN(d.getTime())) {
      details.push({ field: 'pickupDate', message: 'pickupDate must be a valid ISO date string.' });
    } else {
      validatedPickupDate = body.pickupDate;
    }
  }

  // Validate optional pickupTime
  let validatedPickupTime = null;
  if (body.pickupTime !== undefined && body.pickupTime !== null && body.pickupTime !== '') {
    if (typeof body.pickupTime !== 'string') {
      details.push({ field: 'pickupTime', message: 'pickupTime must be a string.' });
    } else {
      validatedPickupTime = body.pickupTime.trim();
    }
  }

  assertValid(details);

  const result = await generateBasket({
    prompt: body.prompt ? String(body.prompt).trim() : null,
    budget: validatedBudget,
    categories: validatedCategories,
    marketId: validatedMarketId,
    day: body.day ? String(body.day).trim().toLowerCase() : null,
    pickupDate: validatedPickupDate,
    pickupTime: validatedPickupTime,
  });

  res.status(200).json({ ok: true, data: result });
}

/**
 * Controller for POST /api/smart-basket/recalculate
 * Recalculates basket totals using authoritative DB prices.
 * Never trusts prices or quantities sent from frontend.
 */
export async function recalculateBasketController(req, res) {
  const body = req.body || {};
  const details = [];

  rejectUnknownFields(body, ['items', 'budget', 'marketId', 'pickupDate']);

  if (!Array.isArray(body.items) || body.items.length === 0) {
    throw AppError.unprocessable([{ field: 'items', message: 'items must be a non-empty array.' }]);
  }

  if (body.items.length > 50) {
    throw AppError.unprocessable([{ field: 'items', message: 'Maximum 50 items allowed per basket.' }]);
  }

  const validatedItems = [];
  for (let i = 0; i < body.items.length; i++) {
    const it = body.items[i];
    if (!it || typeof it !== 'object' || Array.isArray(it)) {
      details.push({ field: `items[${i}]`, message: 'Each item must be an object.' });
      continue;
    }

    if (!it.productId || !isValidObjectId(it.productId)) {
      details.push({ field: `items[${i}].productId`, message: 'productId must be a valid identifier.' });
    }

    const qty = validateInteger(it.quantity, `items[${i}].quantity`, details, {
      required: true,
      min: 1,
      max: 99,
    });

    if (it.productId && isValidObjectId(it.productId) && qty) {
      validatedItems.push({
        productId: String(it.productId),
        quantity: qty,
      });
    }
  }

  let budgetNum = null;
  if (body.budget !== undefined && body.budget !== null && body.budget !== '') {
    budgetNum = Number(body.budget);
    if (!Number.isFinite(budgetNum) || budgetNum < 0) {
      details.push({ field: 'budget', message: 'budget must be a positive number.' });
    }
  }

  if (body.marketId && !isValidObjectId(body.marketId)) {
    details.push({ field: 'marketId', message: 'marketId must be a valid identifier.' });
  }

  assertValid(details);

  const result = await recalculateBasket({
    items: validatedItems,
    budget: budgetNum,
    marketId: body.marketId || null,
    pickupDate: body.pickupDate || null,
  });

  res.status(200).json({ ok: true, data: result });
}

/**
 * Controller for POST /api/smart-basket/validate
 * Validates product stock and availability against real inventory.
 */
export async function validateBasketController(req, res) {
  const body = req.body || {};
  const details = [];

  rejectUnknownFields(body, ['items']);

  if (!Array.isArray(body.items)) {
    throw AppError.unprocessable([{ field: 'items', message: 'items must be an array.' }]);
  }

  if (body.items.length === 0) {
    return res.status(200).json({
      ok: true,
      data: { valid: true, issues: [], items: [], alternatives: {} },
    });
  }

  if (body.items.length > 50) {
    throw AppError.unprocessable([{ field: 'items', message: 'Maximum 50 items allowed per validation request.' }]);
  }

  const validatedItems = [];
  for (let i = 0; i < body.items.length; i++) {
    const item = body.items[i];
    if (!item || typeof item !== 'object') {
      details.push({ field: `items[${i}]`, message: 'Each item must be an object.' });
      continue;
    }
    if (!item.productId || !isValidObjectId(item.productId)) {
      details.push({ field: `items[${i}].productId`, message: 'productId must be a valid identifier.' });
    }
    const qty = validateInteger(item.quantity, `items[${i}].quantity`, details, {
      required: true,
      min: 1,
      max: 99,
    });
    if (item.productId && isValidObjectId(item.productId) && qty) {
      validatedItems.push({ productId: String(item.productId), quantity: qty });
    }
  }

  assertValid(details);

  const result = await validateBasket(validatedItems);
  res.status(200).json({ ok: true, data: result });
}

/**
 * Controller for POST /api/smart-basket/order (and /reserve)
 * Rechecks stock atomically, prevents purchases above available stock,
 * creates the final order, updates inventory, and handles unavailable products gracefully.
 */
export async function createOrderController(req, res) {
  const user = req.user;
  if (!user || user.role !== 'customer') {
    throw AppError.unauthorized('Authenticated customer account required to create an order.');
  }

  const body = req.body || {};
  const details = [];

  rejectUnknownFields(body, [
    'items',
    'marketId',
    'pickupDate',
    'pickupTime',
    'slotStart',
    'note',
    'idempotencyKey',
  ]);

  if (!Array.isArray(body.items) || body.items.length === 0) {
    throw AppError.unprocessable([{ field: 'items', message: 'items must be a non-empty array.' }]);
  }

  if (body.items.length > 50) {
    throw AppError.unprocessable([{ field: 'items', message: 'Maximum 50 items per order.' }]);
  }

  const seenProductIds = new Set();
  const validatedItems = [];

  for (let i = 0; i < body.items.length; i++) {
    const it = body.items[i];
    if (!it || typeof it !== 'object' || Array.isArray(it)) {
      details.push({ field: `items[${i}]`, message: 'Each item must be an object.' });
      continue;
    }

    if (!it.productId || !isValidObjectId(it.productId)) {
      details.push({ field: `items[${i}].productId`, message: 'productId must be a valid identifier.' });
    } else {
      const pidStr = it.productId.toString();
      if (seenProductIds.has(pidStr)) {
        details.push({ field: `items[${i}].productId`, message: 'Duplicate productId in items.' });
      } else {
        seenProductIds.add(pidStr);
      }
    }

    const qty = validateInteger(it.quantity, `items[${i}].quantity`, details, {
      required: true,
      min: 1,
      max: 50,
    });

    if (it.productId && isValidObjectId(it.productId) && qty) {
      validatedItems.push({
        productId: String(it.productId),
        quantity: qty,
      });
    }
  }

  let validatedMarketId = null;
  if (body.marketId !== undefined && body.marketId !== null && body.marketId !== '') {
    if (!isValidObjectId(body.marketId)) {
      details.push({ field: 'marketId', message: 'marketId must be a valid identifier.' });
    } else {
      validatedMarketId = String(body.marketId);
    }
  }

  let validatedSlotStart = null;
  if (body.slotStart !== undefined && body.slotStart !== null && body.slotStart !== '') {
    const d = new Date(body.slotStart);
    if (Number.isNaN(d.getTime())) {
      details.push({ field: 'slotStart', message: 'slotStart must be a valid ISO date string.' });
    } else {
      validatedSlotStart = body.slotStart;
    }
  }

  const validatedNote = validateString(body.note, 'note', details, {
    required: false,
    max: 300,
  });

  // Extract or generate idempotency key
  const rawIdempKey = req.headers['idempotency-key'] || body.idempotencyKey;
  let idempotencyKey = rawIdempKey ? String(rawIdempKey).trim() : null;

  if (idempotencyKey) {
    if (idempotencyKey.length < 8 || idempotencyKey.length > 64 || !/^[A-Za-z0-9-]+$/.test(idempotencyKey)) {
      details.push({
        field: 'idempotency-key',
        message: 'Idempotency key must be 8-64 alphanumeric characters or hyphens.',
      });
    }
  } else {
    // Generate deterministic idempotency key for this basket order
    idempotencyKey = `sb-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
  }

  assertValid(details);

  const result = await createSmartBasketOrder({
    user,
    idempotencyKey,
    items: validatedItems,
    marketId: validatedMarketId,
    pickupDate: body.pickupDate || null,
    pickupTime: body.pickupTime || null,
    slotStart: validatedSlotStart,
    note: validatedNote || '',
    reqId: req.id || req.headers['x-request-id'] || 'smart-basket-req',
  });

  res.status(201).json({
    ok: true,
    data: result,
  });
}
