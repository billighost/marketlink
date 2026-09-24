/**
 * Order state machine and atomic lifecycle transitions.
 * Enforces role-based permissions, cutoff deadlines, conditional status updates,
 * stock restoration, salesCount increments, and system notifications.
 */

import { getDb } from '../../db/client.js';
import { COLLECTIONS } from '../../db/collections.js';
import { toObjectId } from '../../utils/ids.js';
import { AppError } from '../../utils/errors.js';
import { restoreStock } from './stock.js';
import { createNotifications } from '../notifications/notify.js';
import { triggerDebouncedRefreshRankings } from '../../jobs/rankings.js';

export const TRANSITIONS = {
  placed: {
    accepted: ['farmer'],
    declined: ['farmer'],
    cancelled: ['customer', 'farmer', 'admin'],
  },
  accepted: {
    ready: ['farmer'],
    cancelled: ['customer', 'farmer', 'admin'],
  },
  ready: {
    completed: ['farmer'],
    cancelled: ['farmer', 'admin'],
  },
  completed: {},
  cancelled: {},
  declined: {},
};

/**
 * Transitions an order from its current status to a new status atomically.
 *
 * @param {string|import('mongodb').ObjectId|object} orderOrId - Order ID or order document
 * @param {string} to - Destination status ('accepted'|'ready'|'completed'|'cancelled'|'declined')
 * @param {object} actor - Actor performing transition: { id, role, byRole?, byUserId?, name? }
 * @param {object} [options]
 * @param {string} [options.reason] - Required for farmer/admin cancel & decline
 * @param {Date} [options.now=new Date()]
 * @param {import('mongodb').Db} [options.db]
 * @returns {Promise<object>} - Updated order document
 */
export async function transitionOrder(orderOrId, to, actor, options = {}) {
  const db = options.db || getDb();
  const now = options.now || new Date();

  // Normalize actor properties
  const actorRole = actor.role || actor.byRole;
  const actorId = (actor.id || actor.byUserId || '').toString();
  const reason = options.reason !== undefined ? options.reason : actor.reason;

  // 1. Load the order
  let order;
  if (typeof orderOrId === 'object' && orderOrId !== null && orderOrId._id && orderOrId.status) {
    order = orderOrId;
  } else {
    order = await db.collection(COLLECTIONS.ORDERS).findOne({ _id: toObjectId(orderOrId) });
  }

  if (!order) {
    throw AppError.notFound('Order not found.');
  }

  const orderId = order._id;
  const from = order.status;

  // 2. Ownership & permissions check
  if (actorRole === 'customer') {
    if (!order.customerId || order.customerId.toString() !== actorId) {
      // 404 for tenant isolation (never 403 on ID probe)
      throw AppError.notFound('Order not found.');
    }
  } else if (actorRole === 'farmer') {
    if (!order.farmerUserId || order.farmerUserId.toString() !== actorId) {
      throw AppError.notFound('Order not found.');
    }
  } else if (actorRole !== 'admin') {
    throw AppError.forbidden(`Unknown role '${actorRole}'.`, 'FORBIDDEN');
  }

  // Check state machine transition table
  const allowedRoles = TRANSITIONS[from]?.[to];
  if (!allowedRoles) {
    throw AppError.conflict(
      `Cannot transition order from '${from}' to '${to}'.`,
      'INVALID_TRANSITION'
    );
  }

  if (!allowedRoles.includes(actorRole)) {
    throw AppError.forbidden(
      `Role '${actorRole}' is not allowed to transition order from '${from}' to '${to}'.`,
      'INVALID_TRANSITION'
    );
  }

  // Business rules:
  // - Customer cancel requires now < cutoffAt
  if (actorRole === 'customer' && to === 'cancelled') {
    if (order.cutoffAt && now >= new Date(order.cutoffAt)) {
      throw AppError.conflict('The cutoff time for this order has passed.', 'CUTOFF_PASSED');
    }
  }

  // - declined and cancelled require a reason (3..200 chars) for Farmers and Admins
  if (['declined', 'cancelled'].includes(to)) {
    if (['farmer', 'admin'].includes(actorRole)) {
      if (!reason || typeof reason !== 'string' || reason.trim().length < 3 || reason.trim().length > 200) {
        throw AppError.validation([
          { field: 'reason', message: 'A reason between 3 and 200 characters is required.' },
        ]);
      }
    } else if (actorRole === 'customer' && reason) {
      if (typeof reason !== 'string' || reason.trim().length > 200) {
        throw AppError.validation([
          { field: 'reason', message: 'Cancel reason cannot exceed 200 characters.' },
        ]);
      }
    }
  }

  const cleanReason = reason ? reason.trim() : null;

  // 3. Conditional update on the exact current status
  const filter = { _id: orderId, status: from };
  const setFields = {
    status: to,
    updatedAt: now,
  };

  if (to === 'completed') {
    setFields.completedAt = now;
  }
  if (to === 'cancelled' || to === 'declined') {
    setFields.cancelReason = cleanReason;
  }

  const timelineNote =
    cleanReason ||
    (to === 'accepted'
      ? 'Order accepted'
      : to === 'ready'
      ? 'Ready for pickup'
      : to === 'completed'
      ? 'Order completed'
      : undefined);

  const pushFields = {
    timeline: {
      status: to,
      at: now,
      byRole: actorRole,
      byUserId: actorId ? toObjectId(actorId) : undefined,
      note: timelineNote,
    },
  };

  const updateResult = await db.collection(COLLECTIONS.ORDERS).updateOne(filter, {
    $set: setFields,
    $push: pushFields,
  });

  if (updateResult.matchedCount === 0) {
    throw AppError.conflict(
      'The order status has changed. Please refresh and try again.',
      'ORDER_CHANGED'
    );
  }

  // 4. Post-transition side effects
  // 4a. Stock restoration on decline/cancel
  if (to === 'declined' || to === 'cancelled') {
    if (Array.isArray(order.items)) {
      for (const item of order.items) {
        if (item.productId && item.quantity > 0) {
          await restoreStock(item.productId, item.quantity, { db, notify: true });
        }
      }
    }
    if (order.slotKey) {
      await db.collection(COLLECTIONS.COUNTERS).updateOne(
        { _id: `slot:${order.slotKey}`, seq: { $gt: 0 } },
        { $inc: { seq: -1 } }
      );
    }
  }

  // 4b. SalesCount update on complete
  if (to === 'completed' && Array.isArray(order.items)) {
    const productOps = order.items.map((item) => ({
      updateOne: {
        filter: { _id: toObjectId(item.productId) },
        update: { $inc: { salesCount: item.quantity } },
      },
    }));

    if (productOps.length > 0) {
      await db.collection(COLLECTIONS.PRODUCTS).bulkWrite(productOps, { ordered: false });
    }

    const totalQty = order.items.reduce((sum, item) => sum + (item.quantity || 0), 0);
    await db.collection(COLLECTIONS.FARMERS).updateOne(
      { _id: toObjectId(order.farmerId) },
      { $inc: { salesCount: totalQty } }
    );

    // Stage 4 hook: refreshRankings
    triggerDebouncedRefreshRankings();
  }

  // 4c. Notifications per specification table
  const notifications = [];
  const farmerName = order.farmerName || 'Farmer';
  const orderNumber = order.orderNumber || '';

  if (to === 'accepted') {
    notifications.push({
      userId: order.customerId,
      type: 'order_accepted',
      title: 'Order accepted',
      body: `${farmerName} accepted order ${orderNumber}.`,
      data: { orderId: orderId.toString(), orderNumber },
    });
  } else if (to === 'ready') {
    const stall = order.pickup?.stallNumber || '';
    notifications.push({
      userId: order.customerId,
      type: 'order_ready',
      title: 'Ready for pickup',
      body: `Order ${orderNumber} is ready at stall ${stall}.`,
      data: { orderId: orderId.toString(), orderNumber, stallNumber: stall },
    });
  } else if (to === 'completed') {
    notifications.push({
      userId: order.customerId,
      type: 'order_completed',
      title: 'Order completed',
      body: `Thanks for shopping with ${farmerName}. How was it?`,
      data: { orderId: orderId.toString(), orderNumber },
    });
  } else if (to === 'declined') {
    notifications.push({
      userId: order.customerId,
      type: 'order_declined',
      title: 'Order declined',
      body: `${farmerName} couldn't take order ${orderNumber}: ${cleanReason || ''}`,
      data: { orderId: orderId.toString(), orderNumber, reason: cleanReason },
    });
  } else if (to === 'cancelled') {
    // Notify the other party
    const targetUserId = actorRole === 'customer' ? order.farmerUserId : order.customerId;
    if (targetUserId) {
      notifications.push({
        userId: targetUserId,
        type: 'order_cancelled',
        title: 'Order cancelled',
        body: `Order ${orderNumber} was cancelled.`,
        data: { orderId: orderId.toString(), orderNumber, reason: cleanReason },
      });
    }
  }

  if (notifications.length > 0) {
    try {
      await createNotifications(notifications, db);
    } catch {
      // Notification errors logged, never roll back completed transition
    }
  }

  // 5. Return fresh updated order
  return db.collection(COLLECTIONS.ORDERS).findOne({ _id: orderId });
}
