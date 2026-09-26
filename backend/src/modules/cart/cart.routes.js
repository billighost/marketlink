/**
 * Cart routing layer.
 * Exposes live quote calculation with strict input validation and customer role gating.
 */

import { Router } from 'express';
import { isValidObjectId, toObjectId } from '../../utils/ids.js';
import { getDb } from '../../db/client.js';
import { COLLECTIONS } from '../../db/collections.js';
import {
  rejectUnknownFields,
  validateInteger,
  validateDate,
  assertValid,
} from '../../utils/validate.js';
import { AppError } from '../../utils/errors.js';
import { getCartQuote } from './cart.service.js';
import { defineRoutes } from '../../utils/defineRoutes.js';

export const cartRouter = Router();

defineRoutes(
  cartRouter,
  'cart',
  [
    {
      method: 'post',
      path: '/quote',
      auth: 'customer',
      summary: 'Calculate live pricing, availability, and pickup slot validation for cart items',
      body: 'cartQuote',
      handler: async (req, res) => {
        rejectUnknownFields(req.body, ['groups', 'items']);

        const details = [];

        if (!req.body || (!Array.isArray(req.body.groups) && !Array.isArray(req.body.items))) {
          throw AppError.validation([{ field: 'groups', message: 'groups or items must be an array.' }]);
        }

        let groups = req.body.groups;

        if (!groups && Array.isArray(req.body.items)) {
          const rawItems = req.body.items;
          if (rawItems.length < 1 || rawItems.length > 50) {
            throw AppError.validation([
              { field: 'items', message: 'items must contain between 1 and 50 items.' },
            ]);
          }

          const productIds = [];
          for (let i = 0; i < rawItems.length; i++) {
            const it = rawItems[i];
            if (!it || typeof it !== 'object' || Array.isArray(it)) {
              details.push({ field: `items[${i}]`, message: 'item must be an object.' });
              continue;
            }
            rejectUnknownFields(it, ['productId', 'quantity', 'expectedPriceCents']);
            if (!it.productId || !isValidObjectId(it.productId)) {
              details.push({ field: `items[${i}].productId`, message: 'productId must be a valid identifier.' });
            } else {
              productIds.push(toObjectId(it.productId));
            }
            validateInteger(it.quantity, `items[${i}].quantity`, details, { required: true, min: 1, max: 20 });
          }
          assertValid(details);

          const db = getDb();
          const prods = await db.collection(COLLECTIONS.PRODUCTS).find({ _id: { $in: productIds } }).toArray();
          const prodFarmerMap = new Map(prods.map((p) => [p._id.toString(), p.farmerId.toString()]));

          const farmerGroupMap = new Map();
          for (const it of rawItems) {
            const fId = prodFarmerMap.get(it.productId.toString());
            if (!fId) continue;
            if (!farmerGroupMap.has(fId)) {
              farmerGroupMap.set(fId, []);
            }
            farmerGroupMap.get(fId).push({
              productId: it.productId,
              quantity: it.quantity,
              expectedPriceCents: it.expectedPriceCents,
            });
          }

          groups = Array.from(farmerGroupMap.entries()).map(([farmerId, groupItems]) => ({
            farmerId,
            items: groupItems,
          }));
        }

        if (!Array.isArray(groups) || groups.length < 1 || groups.length > 10) {
          throw AppError.validation([
            { field: 'groups', message: 'groups must contain between 1 and 10 vendor groups.' },
          ]);
        }

        const validatedGroups = [];

        for (let gIdx = 0; gIdx < groups.length; gIdx++) {
          const group = groups[gIdx];
          if (typeof group !== 'object' || group === null || Array.isArray(group)) {
            details.push({ field: `groups[${gIdx}]`, message: 'group must be an object.' });
            continue;
          }

          rejectUnknownFields(group, ['farmerId', 'slotStart', 'items']);

          if (!group.farmerId || !isValidObjectId(group.farmerId)) {
            details.push({ field: `groups[${gIdx}].farmerId`, message: 'farmerId must be a valid identifier.' });
          }

          let slotStartIso = undefined;
          if (group.slotStart !== undefined && group.slotStart !== null && group.slotStart !== '') {
            const parsedDate = validateDate(group.slotStart, `groups[${gIdx}].slotStart`, details, { required: false });
            if (parsedDate) {
              slotStartIso = parsedDate.toISOString();
            }
          }

          if (!Array.isArray(group.items) || group.items.length < 1 || group.items.length > 30) {
            details.push({ field: `groups[${gIdx}].items`, message: 'items must contain between 1 and 30 items.' });
            continue;
          }

          const seenProductIds = new Set();
          const validatedItems = [];

          for (let iIdx = 0; iIdx < group.items.length; iIdx++) {
            const item = group.items[iIdx];
            if (typeof item !== 'object' || item === null || Array.isArray(item)) {
              details.push({ field: `groups[${gIdx}].items[${iIdx}]`, message: 'item must be an object.' });
              continue;
            }

            rejectUnknownFields(item, ['productId', 'quantity', 'expectedPriceCents']);

            if (!item.productId || !isValidObjectId(item.productId)) {
              details.push({ field: `groups[${gIdx}].items[${iIdx}].productId`, message: 'productId must be a valid identifier.' });
            } else {
              const prodIdStr = item.productId.toString();
              if (seenProductIds.has(prodIdStr)) {
                details.push({ field: `groups[${gIdx}].items[${iIdx}].productId`, message: 'duplicate productId in group.' });
              } else {
                seenProductIds.add(prodIdStr);
              }
            }

            const qty = validateInteger(item.quantity, `groups[${gIdx}].items[${iIdx}].quantity`, details, {
              required: true,
              min: 1,
              max: 20,
            });

            let expectedPriceCents = undefined;
            if (item.expectedPriceCents !== undefined) {
              expectedPriceCents = validateInteger(
                item.expectedPriceCents,
                `groups[${gIdx}].items[${iIdx}].expectedPriceCents`,
                details,
                { required: false, min: 0 }
              );
            }

            validatedItems.push({
              productId: item.productId,
              quantity: qty,
              expectedPriceCents,
            });
          }

          validatedGroups.push({
            farmerId: group.farmerId,
            slotStart: slotStartIso,
            items: validatedItems,
          });
        }

        assertValid(details);

        const quote = await getCartQuote(validatedGroups);

        res.status(200).json({
          data: quote,
        });
      },
    },
  ],
  { basePath: '/api/cart' }
);
