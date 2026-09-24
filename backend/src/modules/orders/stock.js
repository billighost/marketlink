/**
 * Atomic stock reservation, restoration, and availability recalculation.
 * Uses atomic aggregation-pipeline updates so quantity check, arithmetic,
 * and availability state transition happen in a single operation.
 */

import { getDb } from '../../db/client.js';
import { COLLECTIONS } from '../../db/collections.js';
import { toObjectId } from '../../utils/ids.js';

export const availabilityExpr = {
  $switch: {
    branches: [
      { case: { $lte: ['$quantityAvailable', 0] }, then: 'out' },
      { case: { $lte: ['$quantityAvailable', '$lowStockThreshold'] }, then: 'low' },
    ],
    default: 'in',
  },
};

export const restoreAvailabilityExpr = {
  $cond: {
    if: { $eq: ['$availability', 'hidden'] },
    then: 'hidden',
    else: availabilityExpr,
  },
};

/**
 * Atomically reserves stock for a product if enough units are available and product is listed.
 * Never allows negative stock; updates availability dynamically.
 *
 * @param {string|import('mongodb').ObjectId} productId
 * @param {number} qty
 * @param {import('mongodb').Db} [dbInstance]
 * @returns {Promise<boolean>} - true if reserved successfully, false if insufficient stock or unlisted
 */
export async function reserveStock(productId, qty, dbInstance) {
  if (qty <= 0) return true;
  const db = dbInstance || getDb();
  const id = toObjectId(productId);

  // Standalone MongoDB atomic update: filter checks quantityAvailable >= qty and listed === true
  // Aggregation pipeline update computes new quantity and availability in the exact same write lock
  const r = await db.collection(COLLECTIONS.PRODUCTS).updateOne(
    { _id: id, listed: true, quantityAvailable: { $gte: qty } },
    [
      { $set: { quantityAvailable: { $subtract: ['$quantityAvailable', qty] } } },
      { $set: { availability: availabilityExpr, updatedAt: '$$NOW' } },
    ]
  );

  return r.matchedCount === 1;
}

/**
 * Atomically restores stock to a product (e.g. on order cancellation, rollback, or decrease).
 * Does not require listed: true (stock returns even if delisted).
 * Preserves 'hidden' availability if product is marked hidden.
 * Detects transition from 'out' to not 'out' for restock alerts.
 *
 * @param {string|import('mongodb').ObjectId} productId
 * @param {number} qty
 * @param {object} [options]
 * @param {import('mongodb').Db} [options.db]
 * @param {boolean} [options.notify=true]
 * @returns {Promise<{ success: boolean, crossedFromOut: boolean }>}
 */
export async function restoreStock(productId, qty, { db: dbInstance, notify = true } = {}) {
  if (qty <= 0) return { success: true, crossedFromOut: false };
  const db = dbInstance || getDb();
  const id = toObjectId(productId);

  const beforeDoc = await db.collection(COLLECTIONS.PRODUCTS).findOneAndUpdate(
    { _id: id },
    [
      { $set: { quantityAvailable: { $add: ['$quantityAvailable', qty] } } },
      { $set: { availability: restoreAvailabilityExpr, updatedAt: '$$NOW' } },
    ],
    { returnDocument: 'before' }
  );

  if (!beforeDoc) {
    return { success: false, crossedFromOut: false };
  }

  const wasOut = beforeDoc.availability === 'out';
  const newQty = (beforeDoc.quantityAvailable || 0) + qty;
  const crossedFromOut = wasOut && beforeDoc.availability !== 'hidden' && newQty > 0;

  if (crossedFromOut && notify) {
    try {
      const { notifyRestock } = await import('../favorites/restock.js');
      await notifyRestock(id, db);
    } catch {
      // Gracefully ignore restock notification errors during restore
    }
  }

  return { success: true, crossedFromOut };
}

/**
 * Adjusts stock by delta (delta < 0 reserves, delta > 0 restores).
 *
 * @param {string|import('mongodb').ObjectId} productId
 * @param {number} delta
 * @param {object} [options]
 * @returns {Promise<{ success: boolean, crossedFromOut: boolean }>}
 */
export async function adjustStock(productId, delta, options = {}) {
  if (delta === 0) {
    return { success: true, crossedFromOut: false };
  }
  if (delta < 0) {
    const success = await reserveStock(productId, Math.abs(delta), options.db);
    return { success, crossedFromOut: false };
  }
  return restoreStock(productId, delta, options);
}

/**
 * Rolls back an array of previously reserved items [{ productId, quantity }].
 *
 * @param {Array<{ productId: any, quantity: number }>} reservedList
 * @param {import('mongodb').Db} [dbInstance]
 */
export async function rollbackReservations(reservedList, dbInstance) {
  if (!Array.isArray(reservedList) || reservedList.length === 0) return;
  for (const item of reservedList) {
    if (item.quantity > 0) {
      await restoreStock(item.productId, item.quantity, { db: dbInstance, notify: false });
    }
  }
}
