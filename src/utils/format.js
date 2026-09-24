/**
 * Formatting utilities for currency, dates, and pickup times
 */

/**
 * Format a number as USD currency ($4.50)
 * @param {number} amount
 * @returns {string}
 */
export function formatPrice(amount) {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return '$0.00';
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format an ISO date string to a readable date (Sep 14, 2026)
 * @param {string} isoDate
 * @returns {string}
 */
export function formatDate(isoDate) {
  if (!isoDate) return '';
  const date = new Date(isoDate);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Format an ISO date string to a short date (Sep 14)
 * @param {string} isoDate
 * @returns {string}
 */
export function formatDateShort(isoDate) {
  if (!isoDate) return '';
  const date = new Date(isoDate);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format an ISO date string to time (2:22 pm)
 * @param {string} isoDate
 * @returns {string}
 */
export function formatTime(isoDate) {
  if (!isoDate) return '';
  const date = new Date(isoDate);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).toLowerCase();
}

/**
 * Format a pickup slot for display
 * @param {string} slot - e.g. "Sat 8 – 10 am"
 * @param {string} stallName - e.g. "Riverbend Farm"
 * @param {string} stallNumber - e.g. "Stall 4"
 * @returns {string}
 */
export function formatPickup(slot, stallName, stallNumber) {
  const parts = [];
  if (slot) parts.push(slot);
  if (stallName) parts.push(stallName);
  if (stallNumber) parts.push(stallNumber);
  return parts.join(' · ');
}

/**
 * Format a relative time from now (e.g. "2 weeks ago", "3 hours left")
 * @param {string} isoDate
 * @returns {string}
 */
export function formatRelativeTime(isoDate) {
  if (!isoDate) return '';
  const now = new Date();
  const date = new Date(isoDate);
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    // Future date
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
