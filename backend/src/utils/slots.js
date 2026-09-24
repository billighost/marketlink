/**
 * Pickup slots computation engine.
 * Pure timezone-aware computation for market operating days and farmer pickup windows.
 */

import { getDb } from '../db/client.js';

/**
 * Calculates timezone offset in milliseconds at a given instant.
 *
 * @param {number} utcMs
 * @param {string} tz
 * @returns {number}
 */
function offsetMs(utcMs, tz) {
  const p = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(new Date(utcMs));

  const g = (t) => Number(p.find((x) => x.type === t).value);
  const asUtc = Date.UTC(g('year'), g('month') - 1, g('day'), g('hour'), g('minute'), g('second'));
  return asUtc - Math.floor(utcMs / 1000) * 1000;
}

/**
 * Converts a timezone-local calendar date and minutes from midnight to a UTC Date.
 * Uses a two-pass algorithm to guarantee precision across Daylight Saving Time (DST) boundaries.
 *
 * @param {{ year: number, month: number, day: number, minutes: number }} dateObj
 * @param {string} tz - IANA timezone (e.g. "America/New_York")
 * @returns {Date}
 */
export function zonedTimeToUtc({ year, month, day, minutes }, tz) {
  const guess = Date.UTC(year, month - 1, day, 0, minutes);
  let utc = guess - offsetMs(guess, tz);
  utc = guess - offsetMs(utc, tz); // second pass fixes DST-boundary guesses
  return new Date(utc);
}

/**
 * Formats a slot label in the market's timezone (e.g. "Sat 27 Sep, 8:00 to 10:00am").
 *
 * @param {Date} start
 * @param {Date} end
 * @param {string} tz
 * @returns {string}
 */
export function formatSlotLabel(start, end, tz) {
  const dFmt = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
  const dParts = dFmt.formatToParts(start);
  const weekday = dParts.find((p) => p.type === 'weekday')?.value || '';
  const day = dParts.find((p) => p.type === 'day')?.value || '';
  const month = dParts.find((p) => p.type === 'month')?.value || '';
  const dateStr = `${weekday} ${day} ${month}`;

  function formatTime(d) {
    const tParts = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).formatToParts(d);
    const hour = tParts.find((p) => p.type === 'hour')?.value || '';
    const minute = tParts.find((p) => p.type === 'minute')?.value || '';
    const dayPeriod = (tParts.find((p) => p.type === 'dayPeriod')?.value || '').toLowerCase();
    return { hour, minute, dayPeriod };
  }

  const sT = formatTime(start);
  const eT = formatTime(end);

  let timeStr = '';
  if (sT.dayPeriod === eT.dayPeriod) {
    timeStr = `${sT.hour}:${sT.minute} to ${eT.hour}:${eT.minute}${eT.dayPeriod}`;
  } else {
    timeStr = `${sT.hour}:${sT.minute}${sT.dayPeriod} to ${eT.hour}:${eT.minute}${eT.dayPeriod}`;
  }

  return `${dateStr}, ${timeStr}`;
}

// In-memory cache for computed slots (30 seconds TTL)
const slotsCache = new Map();

/**
 * Clears the in-memory slots cache (used on profile edits and test resets).
 */
export function clearSlotsCache() {
  slotsCache.clear();
}

/**
 * Computes upcoming pickup slots for a farmer across their attended markets.
 * Pure function: deterministic and tested across fixed now dates and DST boundaries.
 *
 * @param {object} farmer
 * @param {Array<object>|object} markets
 * @param {object} [opts]
 * @param {number} [opts.days=14]
 * @param {Date} [opts.now=new Date()]
 * @returns {Array<object>}
 */
export function getUpcomingSlots(farmer, markets, { days = 14, now = new Date() } = {}) {
  if (!farmer || !farmer.operatingDays || farmer.operatingDays.length === 0) {
    return [];
  }

  const marketList = Array.isArray(markets) ? markets : [markets].filter(Boolean);
  if (marketList.length === 0) {
    return [];
  }

  // Create lookup map of marketId -> market doc
  const marketMap = new Map();
  for (const m of marketList) {
    marketMap.set(m._id ? m._id.toString() : m.id, m);
  }

  // Check in-memory cache if farmer has an ID
  const farmerIdStr = farmer._id ? farmer._id.toString() : farmer.id;
  const nowMs = now.getTime();
  const dayBucket = Math.floor(nowMs / (30 * 1000)); // 30s bucket
  const cacheKey = `${farmerIdStr}|${dayBucket}|${days}`;

  if (farmerIdStr && slotsCache.has(cacheKey)) {
    return slotsCache.get(cacheKey);
  }

  const slots = [];
  const farmerMarketIds = (farmer.marketIds || []).map((id) => (id._id ? id._id.toString() : id.toString()));

  // 1. For each day d from 0 to days:
  for (let d = 0; d <= days; d++) {
    const targetInstant = new Date(nowMs + d * 86400000);

    // Pick a default timezone from the first farmer market
    const defaultMarket = marketMap.get(farmerMarketIds[0]) || marketList[0];
    const defaultTz = defaultMarket?.timezone || 'America/New_York';

    // Compute calendar parts in market timezone
    const p = new Intl.DateTimeFormat('en-US', {
      timeZone: defaultTz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      weekday: 'short',
      hourCycle: 'h23',
    }).formatToParts(targetInstant);

    const g = (t) => p.find((x) => x.type === t)?.value;
    const year = Number(g('year'));
    const month = Number(g('month'));
    const day = Number(g('day'));
    const weekdayStr = (g('weekday') || '').toLowerCase().slice(0, 3);

    // 2. If farmer operates on this weekday
    if (!farmer.operatingDays.includes(weekdayStr)) {
      continue;
    }

    // 3. Determine the market: if farmer sells at multiple markets on same day,
    // match the market whose schedule contains that weekday (first match)
    let assignedMarket = null;
    for (const mId of farmerMarketIds) {
      const m = marketMap.get(mId);
      if (m && Array.isArray(m.schedule) && m.schedule.some((s) => s.day === weekdayStr)) {
        assignedMarket = m;
        break;
      }
    }

    if (!assignedMarket) {
      assignedMarket = defaultMarket;
    }

    const marketTz = assignedMarket.timezone || defaultTz;
    const matchingWindows = (farmer.pickupWindows || []).filter((w) => w.day === weekdayStr);

    for (const win of matchingWindows) {
      const start = zonedTimeToUtc({ year, month, day, minutes: win.startMin }, marketTz);
      const end = zonedTimeToUtc({ year, month, day, minutes: win.endMin }, marketTz);

      // Skip slots that have already ended
      if (end.getTime() <= nowMs) {
        continue;
      }

      const cutoffMinutes = farmer.cutoffMinutesBefore ?? 720;
      const cutoffAt = new Date(start.getTime() - cutoffMinutes * 60000);
      const isOpen = nowMs < cutoffAt.getTime();

      const label = formatSlotLabel(start, end, marketTz);

      slots.push({
        start: start.toISOString(),
        end: end.toISOString(),
        marketId: assignedMarket._id ? assignedMarket._id.toString() : assignedMarket.id,
        marketName: assignedMarket.name,
        stallNumber: farmer.stallNumber || '',
        cutoffAt: cutoffAt.toISOString(),
        isOpen,
        label,
      });
    }
  }

  // Stage 4: filter out farmer.slotOverrides closures and full slots
  slots.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

  if (farmerIdStr) {
    slotsCache.set(cacheKey, slots);
    // Cleanup older entries
    if (slotsCache.size > 200) {
      const firstKey = slotsCache.keys().next().value;
      slotsCache.delete(firstKey);
    }
  }

  return slots;
}

// Global cache for getNextSlotsForAllFarmers (60s TTL)
let allFarmersSlotCache = null;
let allFarmersSlotCacheTime = 0;

/**
 * Loads upcoming open slot for all active farmers once every 60 seconds.
 *
 * @param {import('mongodb').Db} db
 * @returns {Promise<Map<string, object>>}
 */
export async function getNextSlotsForAllFarmers(db) {
  const database = db || getDb();
  const now = Date.now();
  if (allFarmersSlotCache && now - allFarmersSlotCacheTime < 60000) {
    return allFarmersSlotCache;
  }

  const [farmers, markets] = await Promise.all([
    database
      .collection('farmers')
      .find(
        { listingEnabled: true },
        {
          projection: {
            _id: 1,
            operatingDays: 1,
            pickupWindows: 1,
            cutoffMinutesBefore: 1,
            marketIds: 1,
            stallNumber: 1,
          },
        }
      )
      .toArray(),
    database
      .collection('markets')
      .find(
        { status: 'active' },
        {
          projection: {
            _id: 1,
            timezone: 1,
            schedule: 1,
            name: 1,
          },
        }
      )
      .toArray(),
  ]);

  const slotMap = new Map();
  const currentDate = new Date();

  for (const farmer of farmers) {
    const upcoming = getUpcomingSlots(farmer, markets, { days: 14, now: currentDate });
    const firstOpen = upcoming.find((s) => s.isOpen) || upcoming[0] || null;
    if (firstOpen) {
      slotMap.set(farmer._id.toString(), firstOpen);
    }
  }

  allFarmersSlotCache = slotMap;
  allFarmersSlotCacheTime = now;
  return slotMap;
}
