/**
 * Formatting utilities for currency, dates, countdowns, and pickup times.
 * Note: All monetary amounts are expected to be integer cents.
 */

/**
 * Format integer cents as USD currency ($4.50)
 * @param {number} cents - Amount in integer cents
 * @returns {string}
 */
export function formatPrice(cents) {
  if (typeof cents !== 'number' || isNaN(cents)) {
    return '$0.00';
  }
  // All monetary calculations in Marketlink use integer cents.
  // Math.round guards against any inadvertent float representation.
  const dollars = Math.round(cents) / 100;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(dollars);
}

export const formatCurrency = formatPrice;

/**
 * Parses a dollar string ($4.50 or 4.5) to integer cents using integer math.
 * Split on '.' and pad string - no floating point math allowed.
 * @param {string} str
 * @returns {number|null}
 */
export function parseDollarsToCents(str) {
  if (typeof str !== 'string') str = String(str || '');
  const clean = str.trim().replace(/^\$/, '');
  if (!/^\d{1,4}(\.\d{1,2})?$/.test(clean)) {
    return null;
  }
  const parts = clean.split('.');
  const dollars = parseInt(parts[0], 10) || 0;
  const cents = parts[1] ? parseInt(parts[1].padEnd(2, '0').slice(0, 2), 10) : 0;
  return dollars * 100 + cents;
}

/**
 * Formats integer cents into a raw decimal dollar string for input fields (450 -> "4.50")
 * @param {number} cents
 * @returns {string}
 */
export function formatCentsToDollarsInput(cents) {
  if (typeof cents !== 'number' || isNaN(cents)) return '';
  const dollars = Math.floor(cents / 100);
  const rem = cents % 100;
  return `${dollars}.${rem.toString().padStart(2, '0')}`;
}

/**
 * Format an ISO date string to a readable date (Sep 14, 2026)
 * @param {string|Date} isoDate
 * @param {string} [timeZone]
 * @returns {string}
 */
export function formatDate(isoDate, timeZone) {
  if (!isoDate) return '';
  const date = new Date(isoDate);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone,
  });
}

/**
 * Format an ISO date string to a short date (Sep 14)
 * @param {string|Date} isoDate
 * @param {string} [timeZone]
 * @returns {string}
 */
export function formatDateShort(isoDate, timeZone) {
  if (!isoDate) return '';
  const date = new Date(isoDate);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone,
  });
}

/**
 * Format an ISO date string to time (2:22 pm)
 * @param {string|Date} isoDate
 * @param {string} [timeZone]
 * @returns {string}
 */
export function formatTime(isoDate, timeZone) {
  if (!isoDate) return '';
  const date = new Date(isoDate);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone,
  }).toLowerCase();
}

/**
 * Format a pickup slot for display in market timezone
 * @param {object|string} slot - slot object or label
 * @param {string} [timeZone] - Market timezone e.g. "America/New_York"
 * @returns {string}
 */
export function formatPickup(slot, timeZone = 'America/New_York') {
  if (!slot) return '';
  if (typeof slot === 'string') return slot;

  if (slot.label && !slot.startTime && !slot.start) return slot.label;

  const rawStart = slot.startTime || slot.start;
  const rawEnd = slot.endTime || slot.end;

  if (rawStart && rawEnd) {
    const start = new Date(rawStart);
    const end = new Date(rawEnd);
    const dayStr = start.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone });
    const startTimeStr = start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone }).toLowerCase();
    const endTimeStr = end.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone }).toLowerCase();
    return `${dayStr} • ${startTimeStr} – ${endTimeStr}`;
  }

  return slot.label || slot.name || '';
}

/**
 * Format a countdown to an order cutoff timestamp
 * @param {string|Date|number} cutoffAt - ISO string, timestamp, or Date
 * @param {string|Date|number} [referenceTime] - Optional reference time for testing (defaults to now)
 * @returns {string}
 */
export function formatCountdown(cutoffAt, referenceTime = Date.now()) {
  if (!cutoffAt) return '';
  const now = typeof referenceTime === 'number' ? referenceTime : new Date(referenceTime).getTime();
  const target = typeof cutoffAt === 'number' ? cutoffAt : new Date(cutoffAt).getTime();
  const diffMs = target - now;

  if (diffMs <= 0) {
    return 'Cutoff passed';
  }

  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) {
    const remHours = diffHours % 24;
    return `${diffDays}d ${remHours}h left to order`;
  }
  if (diffHours > 0) {
    const remMins = diffMins % 60;
    return `${diffHours}h ${remMins}m left to order`;
  }
  if (diffMins > 0) {
    return `${diffMins}m left to order`;
  }
  return `${diffSecs}s left to order`;
}

/**
 * Format a relative time from now (e.g. "2 weeks ago", "3 hours left")
 * @param {string|Date} isoDate
 * @returns {string}
 */
export function formatRelativeTime(isoDate) {
  if (!isoDate) return '';
  const now = new Date();
  const date = new Date(isoDate);
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    const hoursLeft = Math.floor(-diffMs / (1000 * 60 * 60));
    if (hoursLeft < 1) return 'Less than an hour';
    if (hoursLeft < 24) return `${hoursLeft} hour${hoursLeft === 1 ? '' : 's'} left`;
    const daysLeft = Math.floor(-diffDays);
    return `${daysLeft} day${daysLeft === 1 ? '' : 's'} left`;
  }

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 14) return '1 week ago';
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 60) return '1 month ago';
  return `${Math.floor(diffDays / 30)} months ago`;
}

export function getCutoffCountdown(targetDay = 'Friday', targetHour = 18) {
  const now = new Date();
  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const targetDayIdx = daysOfWeek.indexOf(targetDay);
  if (targetDayIdx === -1) return `Order by ${targetDay}`;

  let daysUntil = (targetDayIdx - now.getDay() + 7) % 7;
  const targetDate = new Date(now);
  targetDate.setDate(now.getDate() + daysUntil);
  targetDate.setHours(targetHour, 0, 0, 0);

  if (targetDate.getTime() <= now.getTime()) {
    targetDate.setDate(targetDate.getDate() + 7);
  }

  return formatCountdown(targetDate);
}

/**
 * Format market schedule safely for display (handles strings, objects {day, openMin, closeMin}, and arrays)
 * @param {object} market - Market object
 * @returns {string}
 */
export function formatMarketSchedule(market) {
  if (!market) return '';
  if (typeof market.schedule === 'string') return market.schedule;

  const formatMinToTime = (min) => {
    if (min == null) return '';
    const h = Math.floor(min / 60);
    const m = min % 60;
    const ampm = h >= 12 ? 'pm' : 'am';
    const displayH = h % 12 || 12;
    const displayM = m > 0 ? `:${m.toString().padStart(2, '0')}` : '';
    return `${displayH}${displayM} ${ampm}`;
  };

  const formatScheduleItem = (s) => {
    if (!s) return '';
    if (typeof s === 'string') return s;
    const dayName = s.day ? (s.day.charAt(0).toUpperCase() + s.day.slice(1)) : '';
    const openTime = formatMinToTime(s.openMin != null ? s.openMin : 480);
    const closeTime = formatMinToTime(s.closeMin != null ? s.closeMin : 780);
    const timeStr = `${openTime} – ${closeTime}`;
    return dayName ? `${dayName} · ${timeStr}` : timeStr;
  };

  // If schedule is an array of objects [{ day, openMin, closeMin }]
  if (Array.isArray(market.schedule) && market.schedule.length > 0) {
    return market.schedule.map(formatScheduleItem).filter(Boolean).join(', ');
  }

  // If schedule is a single object { day, openMin, closeMin }
  if (market.schedule && typeof market.schedule === 'object') {
    return formatScheduleItem(market.schedule);
  }

  // Fallback to days/hours or day
  const daysStr = Array.isArray(market.days) ? market.days.join(', ') : (market.day || 'Saturday');
  const hoursStr = market.hours || '8 am – 1 pm';
  return `${daysStr} · ${hoursStr}`;
}

/**
 * Formats minutes from midnight into 12-hour am/pm string (e.g. 480 -> "8:00am")
 * @param {number} totalMin
 * @returns {string}
 */
export function formatMinutesToTime(totalMin) {
    if (totalMin === undefined || totalMin === null || isNaN(totalMin)) return '';
    const num = Number(totalMin);
    const hours = Math.floor(num / 60);
    const mins = num % 60;
    const period = hours >= 12 && hours < 24 ? 'pm' : 'am';
    const displayHour = hours % 12 === 0 ? 12 : hours % 12;
    const displayMin = mins.toString().padStart(2, '0');
    return `${displayHour}:${displayMin} ${period}`;
  }

  /**
   * Generates options list in 30-minute increments from min to max.
   * @param {number} [startMin=300]
   * @param {number} [endMin=1380]
   * @param {number} [stepMin=30]
   * @returns {Array<{ value: number, label: string }>}
   */
  export function generateTimeOptions(startMin = 300, endMin = 1380, stepMin = 30) {
    const options = [];
    for (let m = startMin; m <= endMin; m += stepMin) {
      options.push({
        value: m,
        label: formatMinutesToTime(m),
      });
    }
    return options;
  }

