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
      { projection: { _id: 1, role: 1, email: 1, name: 1, notificationPrefs: 1 } }
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

    // Real mailer triggers for all notification alerts (fire-and-forget, never fails the transaction)
    if (user.email) {
      try {
        if (item.type === 'order_ready') {
          mailer.sendOrderReady(user.email, {
            orderNumber: item.data?.orderNumber || '',
            stallNumber: item.data?.stallNumber || '',
            farmerName: item.data?.farmerName || '',
          }).catch((err) => console.warn('[NOTIFY] Mailer warning (order_ready):', err.message));
        } else if (item.type === 'order_accepted') {
          mailer.sendOrderAccepted(user.email, {
            orderNumber: item.data?.orderNumber || '',
            farmerName: item.data?.farmerName || '',
            pickupLabel: item.data?.pickupLabel || '',
          }).catch((err) => console.warn('[NOTIFY] Mailer warning (order_accepted):', err.message));
        } else if (item.type === 'order_completed') {
          mailer.sendOrderCompleted(user.email, {
            orderNumber: item.data?.orderNumber || '',
            farmerName: item.data?.farmerName || '',
          }).catch((err) => console.warn('[NOTIFY] Mailer warning (order_completed):', err.message));
        } else if (item.type === 'order_declined') {
          mailer.sendOrderDeclined(user.email, {
            orderNumber: item.data?.orderNumber || '',
            farmerName: item.data?.farmerName || '',
          }, item.data?.reason || '').catch((err) => console.warn('[NOTIFY] Mailer warning (order_declined):', err.message));
        } else if (item.type === 'order_cancelled') {
          mailer.sendOrderCancelled(user.email, {
            orderNumber: item.data?.orderNumber || '',
            farmerName: item.data?.farmerName || '',
          }, item.data?.who || item.data?.reason || '').catch((err) => console.warn('[NOTIFY] Mailer warning (order_cancelled):', err.message));
        } else if (item.type === 'restock') {
          mailer.sendRestockAlert(user.email, user, {
            name: item.title.replace(' is back in stock!', ''),
            id: item.data?.productId,
          }).catch((err) => console.warn('[NOTIFY] Mailer warning (restock):', err.message));
        } else if (item.type === 'review_reply') {
          mailer.sendReviewReply(
            user.email,
            user,
            item.title.replace(' replied to your review', ''),
            item.body
          ).catch((err) => console.warn('[NOTIFY] Mailer warning (review_reply):', err.message));
        } else if (item.type === 'announcement') {
          mailer.sendAnnouncement(user.email, user, {
            title: item.title,
            body: item.body,
          }).catch((err) => console.warn('[NOTIFY] Mailer warning (announcement):', err.message));
        } else if (item.type === 'account') {
          if (item.title?.toLowerCase().includes('approved')) {
            mailer.sendFarmerApproved(user.email, user)
              .catch((err) => console.warn('[NOTIFY] Mailer warning (farmer_approved):', err.message));
          } else if (item.title?.toLowerCase().includes('suspended')) {
            mailer.sendFarmerSuspended(user.email, user, item.body)
              .catch((err) => console.warn('[NOTIFY] Mailer warning (farmer_suspended):', err.message));
          }
        }
      } catch (err) {
        console.warn(`[NOTIFY] Mailer setup error for ${item.type}:`, err.message);
      }
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
