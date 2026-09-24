/**
 * Admin Overview service layer.
 * Aggregates high-level platform statistics, pending queue counters, and formatted audit activity.
 */

import { getDb } from '../../../db/client.js';
import { COLLECTIONS } from '../../../db/collections.js';
import { formatAuditActivity } from '../../../utils/audit.js';

/**
 * Retrieves the comprehensive platform overview dashboard metrics.
 *
 * @returns {Promise<object>}
 */
export async function getAdminOverview() {
  const db = getDb();

  const [
    farmersCount,
    customersCount,
    marketsCount,
    ordersCount,
    pendingFarmers,
    openFlags,
    unhandledMessages,
    recentAudits,
  ] = await Promise.all([
    // 1. Total Farmers
    db.collection(COLLECTIONS.USERS).countDocuments({ role: 'farmer' }),

    // 2. Total Customers
    db.collection(COLLECTIONS.USERS).countDocuments({ role: 'customer' }),

    // 3. Active Markets
    db.collection(COLLECTIONS.MARKETS).countDocuments({ status: 'active' }),

    // 4. Total Orders
    db.collection(COLLECTIONS.ORDERS).countDocuments({}),

    // 5. Pending Farmers Queue
    db.collection(COLLECTIONS.USERS).countDocuments({ role: 'farmer', status: 'pending' }),

    // 6. Open Moderation Flags
    db.collection(COLLECTIONS.MODERATION_FLAGS).countDocuments({ status: 'open' }),

    // 7. Unhandled Contact Messages
    db.collection(COLLECTIONS.CONTACT_MESSAGES).countDocuments({ status: 'new' }),

    // 8. Recent Audit Log Activity (last 10)
    db
      .collection(COLLECTIONS.AUDIT_LOG)
      .find({})
      .sort({ at: -1 })
      .limit(10)
      .toArray(),
  ]);

  const recentActivity = recentAudits.map((entry) => ({
    at: entry.at instanceof Date ? entry.at.toISOString() : entry.at,
    text: formatAuditActivity(entry),
  }));

  return {
    totals: {
      farmers: farmersCount,
      customers: customersCount,
      markets: marketsCount,
      orders: ordersCount,
    },
    pendingFarmers,
    openFlags,
    unhandledMessages,
    recentActivity,
  };
}
