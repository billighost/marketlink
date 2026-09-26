/**
 * Farmer pickup slots and closures management service.
 * Computes upcoming slots with capacity and order counts, and manages slot closures/overrides.
 */

import { getDb } from '../../../db/client.js';
import { COLLECTIONS } from '../../../db/collections.js';
import { toObjectId } from '../../../utils/ids.js';
import { AppError } from '../../../utils/errors.js';
import { getUpcomingSlots, clearSlotsCache } from '../../../utils/slots.js';

/**
 * Lists upcoming slots for a farmer with active order counts, capacity, and closure status.
 *
 * @param {string|import('mongodb').ObjectId} userId
 * @param {object} [options]
 * @param {number} [options.days=14]
 * @param {Date} [options.now=new Date()]
 * @returns {Promise<Array<object>>}
 */
export async function listFarmerSlots(userId, { days = 14, now = new Date() } = {}) {
  const db = getDb();
  const uid = toObjectId(userId);

  const farmer = await db.collection(COLLECTIONS.FARMERS).findOne({ userId: uid });
  if (!farmer) {
    throw AppError.notFound('Farmer profile not found.');
  }

  const markets = await db
    .collection(COLLECTIONS.MARKETS)
    .find({ _id: { $in: (farmer.marketIds || []).map((id) => toObjectId(id)) } })
    .toArray();

  // Create temporary farmer object without slotOverrides so getUpcomingSlots gives raw slots to show closures
  const rawFarmer = { ...farmer, slotOverrides: [] };
  const rawSlots = getUpcomingSlots(rawFarmer, markets, { days, now });

  const capacity = farmer.maxOrdersPerSlot || 30;
  const closedDateSet = new Set(
    (farmer.slotOverrides || [])
      .filter((ov) => ov && ov.closed)
      .map((ov) => ov.date)
  );

  const enrichedSlots = await Promise.all(
    rawSlots.map(async (s) => {
      const slotKey = `${farmer._id.toString()}|${s.start}`;
      const ordersCount = await db.collection(COLLECTIONS.ORDERS).countDocuments({
        slotKey,
        status: { $in: ['placed', 'accepted', 'ready'] },
      });

      // Extract date in slot start (ISO date)
      const slotDateKey = s.start.slice(0, 10);
      const isClosed = closedDateSet.has(slotDateKey);

      return {
        ...s,
        ordersCount,
        capacity,
        closed: isClosed,
      };
    })
  );

  return enrichedSlots;
}

/**
 * Adds or updates closures in farmer.slotOverrides.
 *
 * @param {string|import('mongodb').ObjectId} userId
 * @param {Array<string>} dates - Array of YYYY-MM-DD
 * @param {string} [reason]
 * @returns {Promise<Array<object>>} - Updated slotOverrides array
 */
export async function addSlotClosures(userId, dates, reason = '') {
  const db = getDb();
  const uid = toObjectId(userId);

  const farmer = await db.collection(COLLECTIONS.FARMERS).findOne({ userId: uid });
  if (!farmer) {
    throw AppError.notFound('Farmer profile not found.');
  }

  const overrides = farmer.slotOverrides || [];
  const map = new Map(overrides.map((ov) => [ov.date, ov]));

  for (const d of dates) {
    map.set(d, {
      date: d,
      closed: true,
      reason: reason || undefined,
    });
  }

  const newOverrides = Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));

  await db.collection(COLLECTIONS.FARMERS).updateOne(
    { _id: farmer._id },
    { $set: { slotOverrides: newOverrides, updatedAt: new Date() } }
  );

  clearSlotsCache();
  return newOverrides;
}

/**
 * Reopens a previously closed date in farmer.slotOverrides.
 *
 * @param {string|import('mongodb').ObjectId} userId
 * @param {string} date - YYYY-MM-DD
 * @returns {Promise<Array<object>>} - Updated slotOverrides array
 */
export async function removeSlotClosure(userId, date) {
  const db = getDb();
  const uid = toObjectId(userId);

  const farmer = await db.collection(COLLECTIONS.FARMERS).findOne({ userId: uid });
  if (!farmer) {
    throw AppError.notFound('Farmer profile not found.');
  }

  const overrides = (farmer.slotOverrides || []).filter((ov) => ov.date !== date);

  await db.collection(COLLECTIONS.FARMERS).updateOne(
    { _id: farmer._id },
    { $set: { slotOverrides: overrides, updatedAt: new Date() } }
  );

  clearSlotsCache();
  return overrides;
}
