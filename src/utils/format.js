/**
 * Formatting utilities for currency and dates
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
