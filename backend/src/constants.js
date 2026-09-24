/**
 * MarketLink application constants and domain enumerations.
 * Single source of truth for roles, statuses, units, and categories.
 */

export const ROLES = {
  CUSTOMER: 'customer',
  FARMER: 'farmer',
  ADMIN: 'admin',
};

export const ALL_ROLES = [ROLES.CUSTOMER, ROLES.FARMER, ROLES.ADMIN];

export const USER_STATUSES = {
  CUSTOMER: ['active', 'inactive'],
  FARMER: ['pending', 'active', 'suspended', 'rejected'],
  ADMIN: ['active'],
};

export const PRODUCT_UNITS = [
  'lb',
  'bunch',
  'loaf',
  'jar',
  'dozen',
  'each',
  'pint',
  'bag',
];

export const PRODUCT_AVAILABILITY = ['in', 'low', 'out', 'hidden'];

export const PRODUCT_TAGS = ['seasonal', 'organic', 'new', 'bestseller'];

export const ORDER_STATUSES = [
  'placed',
  'accepted',
  'ready',
  'completed',
  'cancelled',
  'declined',
];

export const OPERATING_DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

export const CONTACT_TOPICS = ['order', 'farmer-help', 'feedback', 'other'];

export const ANNOUNCEMENT_AUDIENCES = ['all', 'customer', 'farmer'];

export const MODERATION_STATUSES = ['open', 'resolved', 'removed'];

export const MODERATION_TARGET_TYPES = ['listing', 'review'];

export const REVIEW_TARGET_TYPES = ['farmer', 'product'];

export const FAVORITE_TARGET_TYPES = ['product', 'farmer'];

export const MARKET_STATUSES = ['active', 'removed'];

export const NOTIFICATION_TYPES = [
  'order_placed',
  'order_accepted',
  'order_ready',
  'order_completed',
  'order_declined',
  'order_cancelled',
  'restock',
  'announcement',
  'review_reply',
  'account',
];

export const CHECKOUT_STATUSES = ['pending', 'done', 'failed'];
