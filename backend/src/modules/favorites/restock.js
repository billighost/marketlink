/**
 * Restock alert dispatcher.
 * Finds users who favorited a restocked product, verifies restockAlerts preference,
 * deduplicates within 24 hours, and creates in-app notifications.
 */

import { ObjectId } from 'mongodb';
import { getDb } from '../../db/client.js';
import { COLLECTIONS } from '../../db/collections.js';
import { toObjectId } from '../../utils/ids.js';
import { createNotifications } from '../notifications/notify.js';

/**
 * Dispatches restock notifications to favoriters of a product.
 *
 * @param {string|ObjectId} productId
 * @param {import('mongodb').Db} [dbInstance]
 * @returns {Promise<number>} - Count of notifications created
 */
export async function notifyRestock(productId, dbInstance) {
  const db = dbInstance || getDb();
  const pid = toObjectId(productId);

  const product = await db
    .collection(COLLECTIONS.PRODUCTS)
    .findOne({ _id: pid, listed: true }, { projection: { _id: 1, name: 1, farmerId: 1 } });

  if (!product) return 0;

  // Find all customers who favorited this product
  const favorites = await db
    .collection(COLLECTIONS.FAVORITES)
    .find({ targetType: 'product', targetId: pid }, { projection: { userId: 1 } })
    .toArray();

  if (favorites.length === 0) return 0;

  const candidateUserIds = [...new Set(favorites.map((f) => f.userId.toString()))];

  // 24-hour deduplication: check if any of these users were already sent a restock notification for this product in the last 24h
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const recentNotifications = await db
    .collection(COLLECTIONS.NOTIFICATIONS)
    .find(
      {
        userId: { $in: candidateUserIds.map((id) => toObjectId(id)) },
        type: 'restock',
        'data.productId': pid.toString(),
        createdAt: { $gte: oneDayAgo },
      },
      { projection: { userId: 1 } }
    )
    .toArray();

  const recentlyNotified = new Set(recentNotifications.map((n) => n.userId.toString()));
  const targetUserIds = candidateUserIds.filter((uid) => !recentlyNotified.has(uid));

  if (targetUserIds.length === 0) return 0;

  const notificationItems = targetUserIds.map((userId) => ({
    userId,
    type: 'restock',
    title: `${product.name} is back in stock!`,
    body: `${product.name} is available again for pre-order.`,
    data: {
      productId: pid.toString(),
    },
  }));

  return createNotifications(notificationItems, db);
}
