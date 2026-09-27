/**
 * Market Reminder Alert Generator.
 * Dispatches intelligent market opening reminders to customers:
 * "Market reminder: 📍 Bodija Market opens tomorrow at 8:00 AM."
 */

import { getDb } from '../../db/client.js';
import { COLLECTIONS } from '../../db/collections.js';
import { toObjectId } from '../../utils/ids.js';
import { createNotifications } from './notify.js';

/**
 * Ensures a customer receives their market reminder alert if not already sent in the last 24h.
 *
 * @param {string|import('mongodb').ObjectId} userId
 * @param {import('mongodb').Db} [dbInstance]
 * @returns {Promise<object|null>}
 */
export async function ensureMarketReminder(userId, dbInstance) {
  const db = dbInstance || getDb();
  const uid = toObjectId(userId);

  // Check if user already got a market_reminder in the last 24h
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const existing = await db.collection(COLLECTIONS.NOTIFICATIONS).findOne({
    userId: uid,
    type: 'market_reminder',
    createdAt: { $gte: oneDayAgo },
  });
  if (existing) return null;

  // Find user's home market or saved market or fallback to primary active market
  const user = await db.collection(COLLECTIONS.USERS).findOne({ _id: uid });
  if (!user || user.role !== 'customer') return null;

  let market = null;
  if (user.homeMarketId) {
    market = await db.collection(COLLECTIONS.MARKETS).findOne({ _id: toObjectId(user.homeMarketId) });
  }

  if (!market) {
    const favoriteMarket = await db.collection(COLLECTIONS.FAVORITES).findOne({
      userId: uid,
      targetType: 'market',
    });
    if (favoriteMarket) {
      market = await db.collection(COLLECTIONS.MARKETS).findOne({ _id: toObjectId(favoriteMarket.targetId) });
    }
  }

  if (!market) {
    market = await db.collection(COLLECTIONS.MARKETS).findOne({ status: 'active' });
  }

  if (!market) return null;

  const marketName = market.name || 'Bodija Market';

  // Compute tomorrow's opening time
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dayIndex = tomorrow.getDay();
  const dayNames = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  const dayKey = dayNames[dayIndex];

  const sched = (market.schedule || []).find((s) => s.day === dayKey) || market.schedule?.[0];
  let timeStr = '8:00 AM';
  if (sched && typeof sched.openMin === 'number') {
    const hours24 = Math.floor(sched.openMin / 60);
    const mins = sched.openMin % 60;
    const period = hours24 >= 12 ? 'PM' : 'AM';
    const hours12 = hours24 % 12 || 12;
    timeStr = `${hours12}:${mins.toString().padStart(2, '0')} ${period}`;
  }

  const notification = {
    userId: uid,
    type: 'market_reminder',
    title: 'Market reminder',
    body: `📍 ${marketName} opens tomorrow at ${timeStr}.`,
    data: {
      marketId: market._id.toString(),
      marketName,
      opensAt: timeStr,
    },
  };

  await createNotifications([notification], db);
  return notification;
}
