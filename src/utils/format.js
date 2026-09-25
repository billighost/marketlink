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
  // Convert integer cents to currency representation
  const dollars = cents >= 100 || Number.isInteger(cents) ? cents / 100 : cents;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(dollars);
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

  if (slot.label) return slot.label;

  if (slot.startTime && slot.endTime) {
    const start = new Date(slot.startTime);
    const end = new Date(slot.endTime);
    const dayStr = start.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone });
    const startTimeStr = start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone }).toLowerCase();
    const endTimeStr = end.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone }).toLowerCase();
    return `${dayStr} • ${startTimeStr} – ${endTimeStr}`;
  }

  return slot.name || '';
}

/**
 * Format a countdown to an order cutoff timestamp
 * @param {string|Date} cutoffAt - ISO string or Date
 * @returns {string}
 */
export function formatCountdown(cutoffAt) {
  if (!cutoffAt) return '';
  const now = Date.now();
  const target = new Date(cutoffAt).getTime();
  const diffMs = target - now;

  if (diffMs <= 0) {
    return 'Cutoff passed';
  }

  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) {
    return `${diffDays}d ${diffHours % 24}h left to order`;
  }
  if (diffHours > 0) {
    return `${diffHours}h ${diffMins}m left to order`;
  }
  return `${Math.max(1, diffMins)}m left to order`;
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

export function getLivePickupCountdown(slotLabel = '') {
  return 'Closes at 1:00 pm, 2 hours left';
}
