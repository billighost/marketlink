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

const DAY_FULL_NAMES = {
  sun: 'Sunday',
  mon: 'Monday',
  tue: 'Tuesday',
  wed: 'Wednesday',
  thu: 'Thursday',
  fri: 'Friday',
  sat: 'Saturday',
};

export const DAY_STRING_TO_NUM = {
  sun: 0, sunday: 0,
  mon: 1, monday: 1,
  tue: 2, tuesday: 2, tues: 2,
  wed: 3, wednesday: 3,
  thu: 4, thursday: 4, thur: 4, thurs: 4,
  fri: 5, friday: 5,
  sat: 6, saturday: 6,
};

function formatHHMM(min) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function formatDisplayTime(min) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${h}:${String(m).padStart(2, '0')}`;
}

/**
 * Formats cutoff date as a human label in market timezone (e.g. "Reserve by Friday 18:00").
 *
 * @param {Date|string} cutoffDate
 * @param {string} [tz='America/New_York']
 * @returns {string|null}
 */
export function formatCutoffLabel(cutoffDate, tz = 'America/New_York') {
  if (!cutoffDate) return null;
  const d = cutoffDate instanceof Date ? cutoffDate : new Date(cutoffDate);
  if (isNaN(d.getTime())) return null;

  const day = new Intl.DateTimeFormat('en-US', { timeZone: tz, weekday: 'long' }).format(d);
  const timeParts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    hourCycle: 'h23',
    hour: '2-digit',
    minute: '2-digit',
  }).formatToParts(d);
  const hour = timeParts.find((p) => p.type === 'hour')?.value || '00';
  const minute = timeParts.find((p) => p.type === 'minute')?.value || '00';

  return `Reserve by ${day} ${hour}:${minute}`;
}

/**
 * Converts operatingDays (strings or numbers) into a sorted array of unique integers (0=Sunday..6=Saturday).
 *
 * @param {Array<string|number>|any} operatingDays
 * @returns {Array<number>}
 */
export function toOperatingDayNumbers(operatingDays) {
  if (!Array.isArray(operatingDays)) return [];
  const set = new Set();
  for (const day of operatingDays) {
    if (typeof day === 'number' && Number.isInteger(day) && day >= 0 && day <= 6) {
      set.add(day);
    } else if (typeof day === 'string') {
      const normalized = day.trim().toLowerCase();
      if (DAY_STRING_TO_NUM[normalized] !== undefined) {
        set.add(DAY_STRING_TO_NUM[normalized]);
      }
    }
  }
  return Array.from(set).sort((a, b) => a - b);
}

/**
 * Determines whether a farmer trades today in the given market timezone.
 *
 * @param {Array<number>} operatingDayNumbers
 * @param {string} [tz='America/New_York']
 * @param {Date} [now=new Date()]
 * @returns {boolean}
 */
export function computeOpenToday(operatingDayNumbers, tz = 'America/New_York', now = new Date()) {
  if (!Array.isArray(operatingDayNumbers) || operatingDayNumbers.length === 0) return false;
  const nowDate = now instanceof Date ? now : new Date(now);
  const p = new Intl.DateTimeFormat('en-US', { timeZone: tz, weekday: 'short' }).format(nowDate);
  const todayNum = DAY_STRING_TO_NUM[p.toLowerCase()];
  return todayNum !== undefined && operatingDayNumbers.includes(todayNum);
}

/**
 * Pure function computing the market clock state in the market's timezone.
 * Never throws on missing or malformed schedule data.
 *
 * @param {object} market
 * @param {Date} [now=new Date()]
 * @returns {object}
 */
export function computeMarketClock(market, now = new Date()) {
  if (!market || !Array.isArray(market.schedule) || market.schedule.length === 0) {
    return {
      openNow: false,
      todayWindow: null,
      todayProgress: null,
      closesAtLabel: null,
      windowLabel: null,
      nextOpenLabel: null,
      nextOpenAt: null,
    };
  }

  const tz = market.timezone || 'America/New_York';
  const nowDate = now instanceof Date ? now : new Date(now);
  const nowMs = nowDate.getTime();

  const p = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'short',
    hourCycle: 'h23',
  }).formatToParts(nowDate);

  const g = (t) => p.find((x) => x.type === t)?.value;
  const year = Number(g('year'));
  const month = Number(g('month'));
  const day = Number(g('day'));
  const todayWeekdayStr = (g('weekday') || '').toLowerCase().slice(0, 3);

  const todaySched = market.schedule.find((s) => s && s.day === todayWeekdayStr);
  let openNow = false;
  let todayProgress = null;
  let closesAtLabel = null;
  let todayWindow = null;
  let windowLabel = null;
  let nextOpenLabel = null;
  let nextOpenAt = null;

  if (todaySched && typeof todaySched.openMin === 'number' && typeof todaySched.closeMin === 'number') {
    const todayStartUtc = zonedTimeToUtc({ year, month, day, minutes: todaySched.openMin }, tz);
    const todayEndUtc = zonedTimeToUtc({ year, month, day, minutes: todaySched.closeMin }, tz);

    if (nowMs >= todayStartUtc.getTime() && nowMs < todayEndUtc.getTime()) {
      openNow = true;
      todayWindow = {
        opensAt: formatHHMM(todaySched.openMin),
        closesAt: formatHHMM(todaySched.closeMin),
      };
      const total = todayEndUtc.getTime() - todayStartUtc.getTime();
      const elapsed = nowMs - todayStartUtc.getTime();
      todayProgress = total > 0 ? Number(Math.min(1, Math.max(0, elapsed / total)).toFixed(4)) : 0;
      closesAtLabel = formatHHMM(todaySched.closeMin);
      const dayName = DAY_FULL_NAMES[todaySched.day] || todaySched.day;
      windowLabel = `${dayName} ${formatDisplayTime(todaySched.openMin)}\u2013${formatDisplayTime(todaySched.closeMin)}`;
    } else if (nowMs < todayStartUtc.getTime()) {
      todayWindow = {
        opensAt: formatHHMM(todaySched.openMin),
        closesAt: formatHHMM(todaySched.closeMin),
      };
    }
  }

  if (!openNow) {
    for (let d = 0; d <= 7; d++) {
      const probeDate = new Date(nowMs + d * 86400000);
      const prbParts = new Intl.DateTimeFormat('en-US', {
        timeZone: tz,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        weekday: 'short',
      }).formatToParts(probeDate);

      const getP = (type) => prbParts.find((x) => x.type === type)?.value;
      const pYear = Number(getP('year'));
      const pMonth = Number(getP('month'));
      const pDay = Number(getP('day'));
      const pWeekday = (getP('weekday') || '').toLowerCase().slice(0, 3);

      const sched = market.schedule.find((s) => s && s.day === pWeekday);
      if (!sched || typeof sched.openMin !== 'number' || typeof sched.closeMin !== 'number') continue;

      const startUtc = zonedTimeToUtc({ year: pYear, month: pMonth, day: pDay, minutes: sched.openMin }, tz);
      if (startUtc.getTime() > nowMs) {
        nextOpenAt = startUtc.toISOString();
        const dayName = DAY_FULL_NAMES[sched.day] || sched.day;
        windowLabel = `${dayName} ${formatDisplayTime(sched.openMin)}\u2013${formatDisplayTime(sched.closeMin)}`;
        if (d === 0) {
          nextOpenLabel = 'opens today';
        } else if (d === 1) {
          nextOpenLabel = 'opens tomorrow';
        } else if (d === 2) {
          nextOpenLabel = 'opens in 2 days';
        } else {
          nextOpenLabel = `opens ${dayName}`;
        }
        break;
      }
    }
  }

  return {
    openNow,
    todayWindow,
    todayProgress,
    closesAtLabel,
    windowLabel,
    nextOpenLabel,
    nextOpenAt,
  };
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

    // Stage 4: Check if farmer has closed this date in slotOverrides
    const monthPadded = String(month).padStart(2, '0');
    const dayPadded = String(day).padStart(2, '0');
    const dateKey = `${year}-${monthPadded}-${dayPadded}`;
    const isClosedDate = (farmer.slotOverrides || []).some(
      (ov) => ov && ov.date === dateKey && ov.closed === true
    );
    if (isClosedDate) {
      continue;
    }

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
