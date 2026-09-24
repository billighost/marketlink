/**
 * Home summary module service layer.
 * Provides consolidated customer home overview with ready orders, next pickup, and unread notifications count.
 */

import { getDb } from '../../db/client.js';
import { COLLECTIONS } from '../../db/collections.js';
import { toObjectId } from '../../utils/ids.js';
import { toOrderSummary } from '../orders/orderShapes.js';

/**
 * Returns a fast, single-round-trip summary for the customer home screen.
 *
 * @param {string|import('mongodb').ObjectId} customerId
 * @param {object} [options]
 * @param {Date} [options.now=new Date()]
 * @returns {Promise<{ readyForPickup: object|null, nextPickup: object|null, unreadNotifications: number, cartHint: null }>}
 */
export async function getHomeSummary(customerId, { now = new Date() } = {}) {
  const db = getDb();
  const cid = toObjectId(customerId);

  const [readyOrder, nextOrder, unreadNotifications] = await Promise.all([
    // Soonest order marked ready for pickup
    db
      .collection(COLLECTIONS.ORDERS)
      .find({ customerId: cid, status: 'ready' })
      .sort({ 'pickup.start': 1 })
      .limit(1)
      .next(),

    // Soonest placed or accepted order scheduled for upcoming pickup
    db
      .collection(COLLECTIONS.ORDERS)
      .find({ customerId: cid, status: { $in: ['placed', 'accepted'] } })
      .sort({ 'pickup.start': 1 })
      .limit(1)
      .next(),

    // Indexed count of unread notifications
    db.collection(COLLECTIONS.NOTIFICATIONS).countDocuments({ userId: cid, readAt: null }),
  ]);

  return {
    readyForPickup: readyOrder ? toOrderSummary(readyOrder, { now }) : null,
    nextPickup: nextOrder ? toOrderSummary(nextOrder, { now }) : null,
    unreadNotifications,
    cartHint: null,
  };
}
