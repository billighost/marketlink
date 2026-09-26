/**
 * Orders module service layer.
 * Implements customer order listing with cursor pagination, order detail retrieval,
 * order modification with deterministic delta stock arithmetic, cancelation, and reorder preview.
 */

import { ObjectId } from 'mongodb';
import { getDb } from '../../db/client.js';
import { COLLECTIONS } from '../../db/collections.js';
import { toObjectId } from '../../utils/ids.js';
import { AppError } from '../../utils/errors.js';
import { encodeCursor, decodeCursor } from '../../utils/cursor.js';
import { getUpcomingSlots } from '../../utils/slots.js';
import { reserveStock, restoreStock, rollbackReservations } from './stock.js';
import { transitionOrder } from './orderStateMachine.js';
import { toOrderSummary, toOrderDetail } from './orderShapes.js';
import { createNotification } from '../notifications/notify.js';

/**
 * Lists orders for a customer with tab filtering ('active' vs 'past') and keyset cursor pagination.
 *
 * @param {string|ObjectId} customerId
 * @param {object} [options]
 * @param {string} [options.tab='active'] - 'active' | 'past'
 * @param {string} [options.cursor]
 * @param {number} [options.limit=10]
 * @param {Date} [options.now=new Date()]
 * @returns {Promise<{ orders: Array<object>, nextCursor: string|null, limit: number }>}
 */
export async function listCustomerOrders(customerId, { tab = 'active', cursor, limit = 10, now = new Date() } = {}) {
  const db = getDb();
  const cid = toObjectId(customerId);
  const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 50);

  const statuses =
    tab === 'past'
      ? ['completed', 'cancelled', 'declined']
      : ['placed', 'accepted', 'ready'];

  const filter = {
    customerId: cid,
    status: { $in: statuses },
  };

  if (cursor) {
    const decoded = decodeCursor(cursor);
    if (decoded && Array.isArray(decoded.k) && decoded.k.length === 2) {
      const [cursorCreatedAtIso, cursorIdStr] = decoded.k;
      const cursorDate = new Date(cursorCreatedAtIso);
      const cursorId = toObjectId(cursorIdStr);

      filter.$or = [
        { createdAt: { $lt: cursorDate } },
        { createdAt: cursorDate, _id: { $lt: cursorId } },
      ];
    }
  }

  const orders = await db
    .collection(COLLECTIONS.ORDERS)
    .find(filter)
    .sort({ createdAt: -1, _id: -1 })
    .limit(parsedLimit + 1)
    .toArray();

  const hasMore = orders.length > parsedLimit;
  const pageDocs = hasMore ? orders.slice(0, parsedLimit) : orders;

  let nextCursor = null;
  if (hasMore && pageDocs.length > 0) {
    const lastDoc = pageDocs[pageDocs.length - 1];
    nextCursor = encodeCursor({
      v: 1,
      s: 'orders',
      k: [lastDoc.createdAt.toISOString(), lastDoc._id.toString()],
    });
  }

  const summaries = pageDocs.map((o) => toOrderSummary(o, { now }));

  return {
    orders: summaries,
    nextCursor,
    limit: parsedLimit,
  };
}

/**
 * Loads order details for a customer with strict ownership enforcement.
 *
 * @param {string|ObjectId} orderId
 * @param {string|ObjectId} customerId
 * @param {object} [options]
 * @param {Date} [options.now=new Date()]
 * @returns {Promise<object>}
 */
export async function getCustomerOrderDetail(orderId, customerId, { now = new Date() } = {}) {
  const db = getDb();
  const oid = toObjectId(orderId);
  const cid = toObjectId(customerId);

  // Strict ownership in query filter: returns 404 for other customers to prevent ID probing
  const order = await db.collection(COLLECTIONS.ORDERS).findOne({ _id: oid, customerId: cid });
  if (!order) {
    throw AppError.notFound('Order not found.');
  }

  const marketDoc = await db.collection(COLLECTIONS.MARKETS).findOne({ _id: order.marketId });
  return toOrderDetail(order, { marketDoc, now });
}

/**
 * Modifies an active order placed by the customer before cutoff.
 * Applies exact algorithm from D5.
 *
 * @param {string|ObjectId} orderId
 * @param {string|ObjectId} customerId
 * @param {object} updates - { items?: Array<{ productId, quantity }>, note?: string, slotStart?: string }
 * @param {object} [options]
 * @param {Date} [options.now=new Date()]
 * @returns {Promise<object>}
 */
export async function modifyCustomerOrder(orderId, customerId, updates, { now = new Date() } = {}) {
  const db = getDb();
  const oid = toObjectId(orderId);
  const cid = toObjectId(customerId);

  // 1. Load { _id, customerId } (404 otherwise). Require status === 'placed' and now < cutoffAt
  const order = await db.collection(COLLECTIONS.ORDERS).findOne({ _id: oid, customerId: cid });
  if (!order) {
    throw AppError.notFound('Order not found.');
  }

  if (order.status !== 'placed') {
    throw AppError.conflict(
      'Orders can only be modified while in placed status.',
      'CANNOT_MODIFY'
    );
  }

  if (order.cutoffAt && now >= new Date(order.cutoffAt)) {
    throw AppError.conflict(
      'The cutoff time for this order has passed.',
      'CUTOFF_PASSED'
    );
  }

  const oldItemsMap = new Map();
  for (const item of order.items) {
    oldItemsMap.set(item.productId.toString(), item);
  }

  // 2. Compute delta per product: newQty - oldQty. Reject if all lines would be removed (USE_CANCEL)
  const increases = [];
  const decreases = [];
  let updatedItems = [...order.items];

  if (Array.isArray(updates.items)) {
    // Only existing products can be adjusted; adding new products is NOT allowed
    for (const reqItem of updates.items) {
      if (!oldItemsMap.has(reqItem.productId.toString())) {
        throw AppError.unprocessable([
          { field: 'items', message: 'Adding new products to an existing order is not permitted.' },
        ]);
      }
    }

    const newQuantities = new Map();
    for (const reqItem of updates.items) {
      newQuantities.set(reqItem.productId.toString(), reqItem.quantity);
    }

    // Build new item list and calculate delta
    const nextList = [];
    for (const oldItem of order.items) {
      const pIdStr = oldItem.productId.toString();
      const newQty = newQuantities.has(pIdStr) ? newQuantities.get(pIdStr) : oldItem.quantity;

      const delta = newQty - oldItem.quantity;
      if (delta > 0) {
        increases.push({ productId: oldItem.productId, delta });
      } else if (delta < 0) {
        decreases.push({ productId: oldItem.productId, delta: Math.abs(delta) });
      }

      if (newQty > 0) {
        // Recalculate totals from SNAPSHOT prices
        nextList.push({
          ...oldItem,
          quantity: newQty,
          lineTotalCents: oldItem.priceCents * newQty,
        });
      }
    }

    if (nextList.length === 0) {
      throw AppError.conflict('Cancel the order instead.', 'USE_CANCEL');
    }

    updatedItems = nextList;
  }

  // 3. Apply increases first through reserveStock (conditional), then decreases through restoreStock
  const appliedIncreases = [];
  for (const inc of increases) {
    const success = await reserveStock(inc.productId, inc.delta, db);
    if (!success) {
      // Roll back already applied increases
      for (const applied of appliedIncreases) {
        await restoreStock(applied.productId, applied.delta, { db, notify: false });
      }
      throw AppError.conflict('Insufficient stock to increase order quantity.', 'NOT_ENOUGH_STOCK');
    }
    appliedIncreases.push(inc);
  }

  for (const dec of decreases) {
    await restoreStock(dec.productId, dec.delta, { db, notify: true });
  }

  // 4. New slot: must be an open slot of the same Farmer
  let newPickup = order.pickup;
  let newCutoffAt = order.cutoffAt;
  let newSlotKey = order.slotKey;

  if (updates.slotStart && updates.slotStart !== order.pickup?.start?.toISOString()) {
    const farmer = await db.collection(COLLECTIONS.FARMERS).findOne({ _id: order.farmerId });
    const markets = await db
      .collection(COLLECTIONS.MARKETS)
      .find({ _id: { $in: farmer.marketIds || [] } })
      .toArray();

    const upcoming = getUpcomingSlots(farmer, markets, { days: 14, now });
    const slot = upcoming.find((s) => s.start === updates.slotStart);

    if (!slot || !slot.isOpen) {
      // Roll back stock increases
      for (const applied of appliedIncreases) {
        await restoreStock(applied.productId, applied.delta, { db, notify: false });
      }
      throw AppError.conflict('That pickup time has closed.', 'SLOT_CLOSED');
    }

    // Capacity check on new slot
    const slotKey = `${order.farmerId.toString()}|${slot.start}`;
    const maxOrdersPerSlot = 30;
    const count = await db.collection(COLLECTIONS.ORDERS).countDocuments({
      slotKey,
      status: { $in: ['placed', 'accepted', 'ready'] },
    });

    if (count >= maxOrdersPerSlot) {
      for (const applied of appliedIncreases) {
        await restoreStock(applied.productId, applied.delta, { db, notify: false });
      }
      throw AppError.conflict('That pickup time is fully booked.', 'SLOT_FULL');
    }

    newPickup = {
      start: new Date(slot.start),
      end: new Date(slot.end),
      stallNumber: farmer.stallNumber || '',
      marketId: toObjectId(slot.marketId),
      label: slot.label,
    };
    newCutoffAt = new Date(slot.cutoffAt);
    newSlotKey = slotKey;
  }

  const subtotalCents = updatedItems.reduce((sum, it) => sum + it.lineTotalCents, 0);
  const totalCents = subtotalCents;
  const newNote = updates.note !== undefined ? updates.note.trim() : order.note;

  // 5. updateOne({ _id, status: 'placed' }) with conditional match
  const updateResult = await db.collection(COLLECTIONS.ORDERS).updateOne(
    { _id: oid, status: 'placed' },
    {
      $set: {
        items: updatedItems,
        subtotalCents,
        totalCents,
        note: newNote,
        pickup: newPickup,
        cutoffAt: newCutoffAt,
        slotKey: newSlotKey,
        updatedAt: now,
      },
      $push: {
        timeline: {
          status: 'placed',
          at: now,
          byRole: 'customer',
          note: 'Order changed',
        },
      },
    }
  );

  if (updateResult.matchedCount === 0) {
    // Farmer accepted meanwhile: roll the stock increases back and return 409 ORDER_CHANGED
    for (const applied of appliedIncreases) {
      await restoreStock(applied.productId, applied.delta, { db, notify: false });
    }
    throw AppError.conflict(
      'The Farmer just updated this order. Please review it.',
      'ORDER_CHANGED'
    );
  }

  // 6. Notify the Farmer
  try {
    await createNotification(
      {
        userId: order.farmerUserId,
        type: 'order_placed',
        title: 'Order modified',
        body: `Order ${order.orderNumber} was changed.`,
        data: { orderId: order._id.toString(), orderNumber: order.orderNumber },
      },
      db
    );
  } catch {
    // Non-blocking
  }

  return getCustomerOrderDetail(orderId, customerId, { now });
}

/**
 * Cancels an order on behalf of the customer before cutoff.
 *
 * @param {string|ObjectId} orderId
 * @param {string|ObjectId} customerId
 * @param {object} [params]
 * @param {string} [params.reason]
 * @param {Date} [params.now=new Date()]
 * @returns {Promise<object>}
 */
export async function cancelCustomerOrder(orderId, customerId, { reason, now = new Date() } = {}) {
  const db = getDb();
  const oid = toObjectId(orderId);
  const cid = toObjectId(customerId);

  const order = await db.collection(COLLECTIONS.ORDERS).findOne({ _id: oid, customerId: cid });
  if (!order) {
    throw AppError.notFound('Order not found.');
  }

  if (order.status === 'ready' || order.status === 'completed') {
    throw AppError.conflict('This order cannot be cancelled in its current state.', 'CANNOT_CANCEL');
  }

  if (order.status === 'cancelled') {
    throw AppError.conflict('Order is already cancelled.', 'CANNOT_CANCEL');
  }

  if (order.cutoffAt && now >= new Date(order.cutoffAt)) {
    throw AppError.conflict('The cutoff time for this order has passed.', 'CUTOFF_PASSED');
  }

  const updatedOrder = await transitionOrder(
    order,
    'cancelled',
    { id: cid, role: 'customer' },
    { reason, now, db }
  );

  const marketDoc = await db.collection(COLLECTIONS.MARKETS).findOne({ _id: updatedOrder.marketId });
  return toOrderDetail(updatedOrder, { marketDoc, now });
}

/**
 * Previews items for reordering a past order, indicating live availability and current prices.
 *
 * @param {string|ObjectId} orderId
 * @param {string|ObjectId} customerId
 * @returns {Promise<{ items: Array<object> }>}
 */
export async function getReorderPreview(orderId, customerId) {
  const db = getDb();
  const oid = toObjectId(orderId);
  const cid = toObjectId(customerId);

  const order = await db.collection(COLLECTIONS.ORDERS).findOne({ _id: oid, customerId: cid });
  if (!order) {
    throw AppError.notFound('Order not found.');
  }

  const prodIds = order.items.map((it) => toObjectId(it.productId));
  const products = await db
    .collection(COLLECTIONS.PRODUCTS)
    .find({ _id: { $in: prodIds } })
    .toArray();

  const prodMap = new Map(products.map((p) => [p._id.toString(), p]));

  const items = order.items.map((it) => {
    const prod = prodMap.get(it.productId.toString());
    const isListed = Boolean(prod && prod.listed && prod.availability !== 'hidden');
    const isAvailable = Boolean(isListed && prod.availability !== 'out' && prod.quantityAvailable > 0);

    return {
      productId: it.productId.toString(),
      name: prod ? prod.name : it.name,
      unit: prod ? prod.unit : it.unit,
      art: prod ? prod.art : it.art,
      originalPriceCents: it.priceCents,
      currentPriceCents: prod ? prod.priceCents : it.priceCents,
      quantity: it.quantity,
      quantityAvailable: prod ? prod.quantityAvailable : 0,
      availability: prod ? prod.availability : 'out',
      isAvailable,
      maxQuantity: prod ? Math.min(20, prod.quantityAvailable) : 0,
    };
  });

  return { items };
}
