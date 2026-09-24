/**
 * Weekly template service for farmers.
 * Manages recurring inventory configurations and batch application.
 */

import { ObjectId } from 'mongodb';
import { getDb } from '../../../db/client.js';
import { COLLECTIONS } from '../../../db/collections.js';
import { toObjectId } from '../../../utils/ids.js';
import { AppError } from '../../../utils/errors.js';
import { syncFarmerCategorySlugs } from '../../../utils/sync.js';
import { notifyRestock } from '../../favorites/restock.js';

/**
 * Retrieves the weekly template configuration for all products of a farmer.
 *
 * @param {string|ObjectId} farmerId
 * @returns {Promise<Array<object>>}
 */
export async function getWeeklyTemplate(farmerId) {
  const db = getDb();
  const fId = toObjectId(farmerId);

  const products = await db
    .collection(COLLECTIONS.PRODUCTS)
    .find(
      { farmerId: fId, archived: { $ne: true } },
      {
        projection: {
          _id: 1,
          name: 1,
          unit: 1,
          priceCents: 1,
          quantityAvailable: 1,
          weekly: 1,
          availability: 1,
        },
      }
    )
    .sort({ nameLower: 1 })
    .toArray();

  return products.map((p) => ({
    productId: p._id.toString(),
    name: p.name,
    unit: p.unit,
    priceCents: p.priceCents,
    currentQty: p.quantityAvailable,
    availability: p.availability,
    weekly: p.weekly || { enabled: false, defaultQty: 0 },
  }));
}

/**
 * Updates weekly inventory templates for multiple products.
 *
 * @param {string|ObjectId} farmerId
 * @param {Array<{ productId: string, enabled: boolean, defaultQty: number }>} items
 * @returns {Promise<{ updatedCount: number }>}
 */
export async function updateWeeklyTemplate(farmerId, items) {
  if (!Array.isArray(items) || items.length === 0) {
    throw AppError.validation('Items must be a non-empty array', { field: 'items' });
  }

  const db = getDb();
  const fId = toObjectId(farmerId);
  const now = new Date();

  // Validate items
  const validated = [];
  for (const item of items) {
    if (!item.productId || !ObjectId.isValid(item.productId)) {
      throw AppError.validation('Invalid productId in item', { field: 'productId' });
    }
    if (typeof item.enabled !== 'boolean') {
      throw AppError.validation('enabled must be a boolean', { field: 'enabled' });
    }
    if (
      typeof item.defaultQty !== 'number' ||
      !Number.isInteger(item.defaultQty) ||
      item.defaultQty < 0 ||
      item.defaultQty > 10000
    ) {
      throw AppError.validation('defaultQty must be an integer between 0 and 10000', { field: 'defaultQty' });
    }
    validated.push(item);
  }

  const ops = validated.map((it) => ({
    updateOne: {
      filter: { _id: toObjectId(it.productId), farmerId: fId, archived: { $ne: true } },
      update: {
        $set: {
          'weekly.enabled': it.enabled,
          'weekly.defaultQty': it.defaultQty,
          updatedAt: now,
        },
      },
    },
  }));

  const res = await db.collection(COLLECTIONS.PRODUCTS).bulkWrite(ops);
  return { updatedCount: res.modifiedCount };
}

/**
 * Applies the weekly template: resets quantityAvailable to defaultQty for all enabled products,
 * recomputes availability and listed flags, and dispatches restock notifications.
 *
 * @param {string|ObjectId} farmerId
 * @returns {Promise<{ appliedCount: number, restockedCount: number }>}
 */
export async function applyWeeklyTemplate(farmerId) {
  const db = getDb();
  const fId = toObjectId(farmerId);
  const now = new Date();

  const farmer = await db.collection(COLLECTIONS.FARMERS).findOne({ _id: fId });
  if (!farmer) {
    throw AppError.notFound('Farmer profile not found');
  }

  const products = await db
    .collection(COLLECTIONS.PRODUCTS)
    .find({
      farmerId: fId,
      archived: { $ne: true },
      'weekly.enabled': true,
    })
    .toArray();

  if (products.length === 0) {
    return { appliedCount: 0, restockedCount: 0 };
  }

  const ops = [];
  const restockPromises = [];

  for (const p of products) {
    const defaultQty = typeof p.weekly?.defaultQty === 'number' ? p.weekly.defaultQty : 0;
    const wasOut = p.quantityAvailable === 0 || p.availability === 'out';
    const lowThreshold = typeof p.lowStockThreshold === 'number' ? p.lowStockThreshold : 5;

    let newAvailability = 'in';
    if (defaultQty === 0) {
      newAvailability = 'out';
    } else if (defaultQty <= lowThreshold) {
      newAvailability = 'low';
    }

    // Respect moderation and archived flags
    const listed = Boolean(
      farmer.listingEnabled &&
      !p.moderation?.removed &&
      !p.archived &&
      newAvailability !== 'hidden'
    );

    ops.push({
      updateOne: {
        filter: { _id: p._id },
        update: {
          $set: {
            quantityAvailable: defaultQty,
            availability: newAvailability,
            listed,
            updatedAt: now,
          },
        },
      },
    });

    if (wasOut && defaultQty > 0) {
      restockPromises.push(notifyRestock(p._id, db));
    }
  }

  await db.collection(COLLECTIONS.PRODUCTS).bulkWrite(ops);

  let restockedCount = 0;
  if (restockPromises.length > 0) {
    const restockResults = await Promise.all(restockPromises);
    restockedCount = restockResults.filter((count) => count > 0).length;
  }

  await syncFarmerCategorySlugs(fId, db);

  return { appliedCount: products.length, restockedCount };
}
