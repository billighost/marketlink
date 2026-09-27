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
function getProductEmoji(name = '', art = '') {
  const lower = `${name} ${art}`.toLowerCase();
  if (lower.includes('tomato')) return '🍅';
  if (lower.includes('egg')) return '🥚';
  if (lower.includes('carrot')) return '🥕';
  if (lower.includes('spinach') || lower.includes('kale') || lower.includes('lettuce') || lower.includes('green')) return '🥬';
  if (lower.includes('potato') || lower.includes('yam')) return '🥔';
  if (lower.includes('strawberr') || lower.includes('berr') || lower.includes('apple') || lower.includes('fruit')) return '🍓';
  if (lower.includes('honey')) return '🍯';
  if (lower.includes('bread') || lower.includes('sourdough') || lower.includes('bakery')) return '🍞';
  if (lower.includes('mushroom')) return '🍄';
  if (lower.includes('corn')) return '🌽';
  if (lower.includes('pepper') || lower.includes('chili')) return '🌶️';
  return '🌱';
}

export async function notifyRestock(productId, dbInstance) {
  const db = dbInstance || getDb();
  const pid = toObjectId(productId);

  const product = await db
    .collection(COLLECTIONS.PRODUCTS)
    .findOne({ _id: pid, listed: true });

  if (!product) return 0;

  const farmer = await db
    .collection(COLLECTIONS.FARMERS)
    .findOne({ _id: toObjectId(product.farmerId) });

  const farmName = farmer?.stallName || 'Green Valley Farm';

  // Find all customers who favorited this product OR favorited this farmer
  const query = product.farmerId
    ? {
        $or: [
          { targetType: 'product', targetId: pid },
          { targetType: 'farmer', targetId: toObjectId(product.farmerId) },
        ],
      }
    : { targetType: 'product', targetId: pid };

  const favorites = await db
    .collection(COLLECTIONS.FAVORITES)
    .find(query, { projection: { userId: 1 } })
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
        type: { $in: ['restock', 'favorite_restock'] },
        'data.productId': pid.toString(),
        createdAt: { $gte: oneDayAgo },
      },
      { projection: { userId: 1 } }
    )
    .toArray();

  const recentlyNotified = new Set(recentNotifications.map((n) => n.userId.toString()));
  const targetUserIds = candidateUserIds.filter((uid) => !recentlyNotified.has(uid));

  if (targetUserIds.length === 0) return 0;

  const emoji = getProductEmoji(product.name, product.art);
  const isPlural = product.name.trim().toLowerCase().endsWith('s');
  const verb = isPlural ? 'are' : 'is';
  const body = `${emoji} ${product.name} ${verb} back at ${farmName}.`;

  const notificationItems = targetUserIds.map((userId) => ({
    userId,
    type: 'restock',
    title: 'Your favorite farmer just restocked',
    body,
    data: {
      productId: pid.toString(),
      farmerId: product.farmerId ? product.farmerId.toString() : '',
      farmerName: farmName,
      productName: product.name,
      emoji,
    },
  }));

  return createNotifications(notificationItems, db);
}
