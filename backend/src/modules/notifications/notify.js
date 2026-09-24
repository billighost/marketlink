/**
 * In-app notification creation helper.
 * Enforces user notification preferences, active status gating, and batch insertMany writes.
 */

import { getDb } from '../../db/client.js';
import { COLLECTIONS } from '../../db/collections.js';
import { toObjectId } from '../../utils/ids.js';
import { mailer } from '../../utils/mailer.js';

/**
 * Creates in-app notifications respecting user preferences.
 *
 * @param {Array<{ userId: string|import('mongodb').ObjectId, type: string, title: string, body: string, data?: object }>} items
 * @param {import('mongodb').Db} [dbInstance]
 * @returns {Promise<number>} - Count of notifications inserted
 */
export async function createNotifications(items, dbInstance) {
  if (!Array.isArray(items) || items.length === 0) return 0;
  const db = dbInstance || getDb();

  const userIds = [...new Set(items.map((it) => toObjectId(it.userId)))];

  // Fetch users to verify active status and notification preferences
  const users = await db
    .collection(COLLECTIONS.USERS)
    .find(
      { _id: { $in: userIds }, status: 'active' },
      { projection: { _id: 1, role: 1, email: 1, notificationPrefs: 1 } }
    )
    .toArray();

  const userMap = new Map(users.map((u) => [u._id.toString(), u]));
  const now = new Date();
  const docsToInsert = [];

  for (const item of items) {
    const user = userMap.get(item.userId.toString());
    if (!user) continue;

    // Farmers always receive notifications; for customers, check notificationPrefs
    if (user.role === 'customer') {
      const prefs = user.notificationPrefs || {};

      if (item.type === 'order_ready') {
        if (prefs.readyAlerts === false) continue;
      } else if (item.type === 'restock') {
        if (prefs.restockAlerts === false) continue;
      } else if (
        [
          'order_placed',
          'order_accepted',
          'order_completed',
          'order_declined',
          'order_cancelled',
        ].includes(item.type)
      ) {
        if (prefs.orderUpdates === false) continue;
      }
    }

    docsToInsert.push({
      userId: user._id,
      type: item.type,
      title: item.title,
      body: item.body,
      data: item.data || {},
      readAt: null,
      createdAt: now,
    });

    // Mailer trigger for key alerts
    try {
      if (item.type === 'order_ready' && user.email) {
        mailer.sendOrderReady(user.email, {
          orderNumber: item.data?.orderNumber || '',
          stallNumber: item.data?.stallNumber || '',
        });
      }
    } catch {
      // Mailer logging failure must never fail the transaction
    }
  }

  if (docsToInsert.length === 0) return 0;

  const result = await db.collection(COLLECTIONS.NOTIFICATIONS).insertMany(docsToInsert);
  return result.insertedCount;
}

/**
 * Creates a single notification.
 *
 * @param {object} item
 * @param {import('mongodb').Db} [dbInstance]
 */
export async function createNotification(item, dbInstance) {
  return createNotifications([item], dbInstance);
}
