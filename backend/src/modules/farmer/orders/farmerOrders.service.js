<<<<<<< HEAD
import { ObjectId } from 'mongodb';import { getDb } from '../../../db/client.js';import { COLLECTIONS } from '../../../db/collections.js';import { toObjectId } from '../../../utils/ids.js';import { AppError } from '../../../utils/errors.js';import { formatCustomerName } from '../../../utils/shapes.js';import { transitionOrder } from '../../orders/orderStateMachine.js';export function toFarmerOrderDto(order, customerMap) {  const isAcceptedOrBeyond = ['accepted', 'ready', 'completed'].includes(order.status);  const custDoc = customerMap && order.customerId ? customerMap.get(order.customerId.toString()) : null;  const itemCount = Array.isArray(order.items)    ? order.items.reduce((sum, it) => sum + (it.quantity || 0), 0)    : 0;  const dto = {    id: order._id ? order._id.toString() : order.id,    orderNumber: order.orderNumber,    status: order.status,    customerName: formatCustomerName(order.customerName),    pickup: order.pickup || {},    itemCount,    subtotalCents: order.subtotalCents,    totalCents: order.totalCents,    items: Array.isArray(order.items)      ? order.items.map((it) => ({          productId: it.productId ? it.productId.toString() : '',          name: it.name,          unit: it.unit || 'each',          priceCents: it.priceCents,          quantity: it.quantity,          lineTotalCents: it.lineTotalCents || it.priceCents * it.quantity,          art: it.art || 'carrot',        }))      : [],    timeline: Array.isArray(order.timeline)      ? order.timeline.map((t) => ({          status: t.status,          at: t.at instanceof Date ? t.at.toISOString() : t.at,          byRole: t.byRole,          note: t.note || undefined,        }))      : [],    cutoffAt: order.cutoffAt instanceof Date ? order.cutoffAt.toISOString() : order.cutoffAt,    cancelReason: order.cancelReason || null,    note: order.note || '',    createdAt: order.createdAt instanceof Date ? order.createdAt.toISOString() : order.createdAt,    updatedAt: order.updatedAt instanceof Date ? order.updatedAt.toISOString() : order.updatedAt,  };  if (isAcceptedOrBeyond) {    dto.customerPhone = order.customerPhone || custDoc?.phone || null;  } else {    dto.customerPhone = null;  }  return dto;}export async function listFarmerOrders(farmerId, query = {}) {  const db = getDb();  const fId = toObjectId(farmerId);  const filter = { farmerId: fId };  if (query.status) {    filter.status = query.status;  }  if (query.marketId && ObjectId.isValid(query.marketId)) {    filter.marketId = toObjectId(query.marketId);  }  if (query.date && typeof query.date === 'string') {    filter['pickup.start'] = { $regex: `^${query.date}` };  }  if (query.search && typeof query.search === 'string' && query.search.trim()) {    const s = query.search.trim();    filter.$or = [      { orderNumber: { $regex: s, $options: 'i' } },      { customerName: { $regex: s, $options: 'i' } },    ];  }  const limit = Math.min(100, Math.max(1, parseInt(query.limit || 20, 10)));  const [orders, countAgg] = await Promise.all([    db      .collection(COLLECTIONS.ORDERS)      .find(filter)      .sort({ createdAt: -1, _id: -1 })      .limit(limit)      .toArray(),    db      .collection(COLLECTIONS.ORDERS)      .aggregate([        { $match: { farmerId: fId } },        { $group: { _id: '$status', count: { $sum: 1 } } },      ])      .toArray(),  ]);  const counts = {    placed: 0,    accepted: 0,    ready: 0,    completed: 0,    cancelled: 0,    declined: 0,  };  for (const item of countAgg) {    if (item._id in counts) {      counts[item._id] = item.count;    }  }  const needPhoneUserIds = orders    .filter((o) => ['accepted', 'ready', 'completed'].includes(o.status) && o.customerId)    .map((o) => o.customerId);  let customerMap = new Map();  if (needPhoneUserIds.length > 0) {    const users = await db      .collection(COLLECTIONS.USERS)      .find({ _id: { $in: needPhoneUserIds } }, { projection: { _id: 1, phone: 1 } })      .toArray();    customerMap = new Map(users.map((u) => [u._id.toString(), u]));  }  return {    data: orders.map((o) => toFarmerOrderDto(o, customerMap)),    meta: {      nextCursor: null,      counts,    },  };}export async function getFarmerOrderDetail(farmerId, orderId) {  if (!orderId || !ObjectId.isValid(orderId)) {    throw AppError.notFound('Order not found');  }  const db = getDb();  const fId = toObjectId(farmerId);  const oId = toObjectId(orderId);  const order = await db.collection(COLLECTIONS.ORDERS).findOne({    _id: oId,    farmerId: fId,  });  if (!order) {    throw AppError.notFound('Order not found');  }  let customerMap = null;  if (['accepted', 'ready', 'completed'].includes(order.status) && order.customerId) {    const cust = await db      .collection(COLLECTIONS.USERS)      .findOne({ _id: order.customerId }, { projection: { _id: 1, phone: 1 } });    if (cust) {      customerMap = new Map([[cust._id.toString(), cust]]);    }  }  return toFarmerOrderDto(order, customerMap);}export async function transitionFarmerOrder(farmerId, farmerUserId, orderId, destinationStatus, reason) {  if (!orderId || !ObjectId.isValid(orderId)) {    throw AppError.notFound('Order not found');  }  const db = getDb();  const fId = toObjectId(farmerId);  const oId = toObjectId(orderId);  const order = await db.collection(COLLECTIONS.ORDERS).findOne({    _id: oId,    farmerId: fId,  });  if (!order) {    throw AppError.notFound('Order not found');  }  const actor = {    id: farmerUserId.toString(),    role: 'farmer',    farmerId: fId.toString(),    reason,  };  const updatedOrder = await transitionOrder(oId, destinationStatus, actor, {    reason,    db,  });  return getFarmerOrderDetail(fId, updatedOrder._id);}
=======
/**
 * Farmer Orders service layer.
 * Lists orders with status counts and privacy gates, retrieves order details,
 * and executes state transitions.
 */

import { ObjectId } from 'mongodb';
import { getDb } from '../../../db/client.js';
import { COLLECTIONS } from '../../../db/collections.js';
import { toObjectId } from '../../../utils/ids.js';
import { AppError } from '../../../utils/errors.js';
import { formatCustomerName } from '../../../utils/shapes.js';
import { transitionOrder } from '../../orders/orderStateMachine.js';

/**
 * Transforms an internal order document to the farmer order DTO.
 * Enforces customer phone privacy: only visible from status 'accepted' onwards.
 *
 * @param {object} order
 * @param {Map<string, object>} [customerMap]
 * @returns {object}
 */
export function toFarmerOrderDto(order, customerMap) {
  const isAcceptedOrBeyond = ['accepted', 'ready', 'completed'].includes(order.status);
  const custDoc = customerMap && order.customerId ? customerMap.get(order.customerId.toString()) : null;

  const itemCount = Array.isArray(order.items)
    ? order.items.reduce((sum, it) => sum + (it.quantity || 0), 0)
    : 0;

  const dto = {
    id: order._id ? order._id.toString() : order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    customerName: formatCustomerName(order.customerName),
    pickup: order.pickup || {},
    itemCount,
    subtotalCents: order.subtotalCents,
    totalCents: order.totalCents,
    items: Array.isArray(order.items)
      ? order.items.map((it) => ({
          productId: it.productId ? it.productId.toString() : '',
          name: it.name,
          unit: it.unit || 'each',
          priceCents: it.priceCents,
          quantity: it.quantity,
          lineTotalCents: it.lineTotalCents || it.priceCents * it.quantity,
          art: it.art || 'carrot',
        }))
      : [],
    timeline: Array.isArray(order.timeline)
      ? order.timeline.map((t) => ({
          status: t.status,
          at: t.at instanceof Date ? t.at.toISOString() : t.at,
          byRole: t.byRole,
          note: t.note || undefined,
        }))
      : [],
    cutoffAt: order.cutoffAt instanceof Date ? order.cutoffAt.toISOString() : order.cutoffAt,
    cancelReason: order.cancelReason || null,
    note: order.note || '',
    createdAt: order.createdAt instanceof Date ? order.createdAt.toISOString() : order.createdAt,
    updatedAt: order.updatedAt instanceof Date ? order.updatedAt.toISOString() : order.updatedAt,
  };

  if (isAcceptedOrBeyond) {
    dto.customerPhone = order.customerPhone || custDoc?.phone || null;
  } else {
    dto.customerPhone = null;
  }

  return dto;
}

/**
 * Lists orders for a farmer with status filtering, search, pagination, and status breakdown counts.
 *
 * @param {string|ObjectId} farmerId
 * @param {object} [query={}]
 * @returns {Promise<{ data: Array<object>, meta: object }>}
 */
export async function listFarmerOrders(farmerId, query = {}) {
  const db = getDb();
  const fId = toObjectId(farmerId);

  const filter = { farmerId: fId };

  if (query.status) {
    if (query.status.includes(',')) {
      filter.status = { $in: query.status.split(',').map((s) => s.trim()) };
    } else if (query.status === 'cancelled') {
      filter.status = { $in: ['cancelled', 'declined'] };
    } else {
      filter.status = query.status;
    }
  }

  if (query.marketId && ObjectId.isValid(query.marketId)) {
    filter.marketId = toObjectId(query.marketId);
  }

  if (query.date && typeof query.date === 'string') {
    filter['pickup.start'] = { $regex: `^${query.date}` };
  }

  if (query.search && typeof query.search === 'string' && query.search.trim()) {
    const s = query.search.trim();
    filter.$or = [
      { orderNumber: { $regex: s, $options: 'i' } },
      { customerName: { $regex: s, $options: 'i' } },
    ];
  }

  const limit = Math.min(100, Math.max(1, parseInt(query.limit || 20, 10)));

  const [orders, countAgg] = await Promise.all([
    db
      .collection(COLLECTIONS.ORDERS)
      .find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit)
      .toArray(),
    db
      .collection(COLLECTIONS.ORDERS)
      .aggregate([
        { $match: { farmerId: fId } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ])
      .toArray(),
  ]);

  const counts = {
    placed: 0,
    accepted: 0,
    ready: 0,
    completed: 0,
    cancelled: 0,
    declined: 0,
  };

  for (const item of countAgg) {
    if (item._id in counts) {
      counts[item._id] = item.count;
    }
  }

  // Preload customer phone numbers for orders that are accepted or beyond
  const needPhoneUserIds = orders
    .filter((o) => ['accepted', 'ready', 'completed'].includes(o.status) && o.customerId)
    .map((o) => o.customerId);

  let customerMap = new Map();
  if (needPhoneUserIds.length > 0) {
    const users = await db
      .collection(COLLECTIONS.USERS)
      .find({ _id: { $in: needPhoneUserIds } }, { projection: { _id: 1, phone: 1 } })
      .toArray();
    customerMap = new Map(users.map((u) => [u._id.toString(), u]));
  }

  return {
    data: orders.map((o) => toFarmerOrderDto(o, customerMap)),
    meta: {
      nextCursor: null,
      counts,
    },
  };
}

/**
 * Retrieves detailed order info for a farmer. Enforces strict tenant isolation.
 *
 * @param {string|ObjectId} farmerId
 * @param {string|ObjectId} orderId
 * @returns {Promise<object>}
 */
export async function getFarmerOrderDetail(farmerId, orderId) {
  if (!orderId || !ObjectId.isValid(orderId)) {
    throw AppError.notFound('Order not found');
  }

  const db = getDb();
  const fId = toObjectId(farmerId);
  const oId = toObjectId(orderId);

  const order = await db.collection(COLLECTIONS.ORDERS).findOne({
    _id: oId,
    farmerId: fId,
  });

  if (!order) {
    throw AppError.notFound('Order not found');
  }

  let customerMap = null;
  if (['accepted', 'ready', 'completed'].includes(order.status) && order.customerId) {
    const cust = await db
      .collection(COLLECTIONS.USERS)
      .findOne({ _id: order.customerId }, { projection: { _id: 1, phone: 1 } });
    if (cust) {
      customerMap = new Map([[cust._id.toString(), cust]]);
    }
  }

  return toFarmerOrderDto(order, customerMap);
}

/**
 * Transitions order status for a farmer using the centralized order state machine.
 *
 * @param {string|ObjectId} farmerId
 * @param {string|ObjectId} farmerUserId
 * @param {string|ObjectId} orderId
 * @param {string} destinationStatus
 * @param {string} [reason]
 * @returns {Promise<object>}
 */
export async function transitionFarmerOrder(farmerId, farmerUserId, orderId, destinationStatus, reason) {
  if (!orderId || !ObjectId.isValid(orderId)) {
    throw AppError.notFound('Order not found');
  }

  const db = getDb();
  const fId = toObjectId(farmerId);
  const oId = toObjectId(orderId);

  const order = await db.collection(COLLECTIONS.ORDERS).findOne({
    _id: oId,
    farmerId: fId,
  });

  if (!order) {
    throw AppError.notFound('Order not found');
  }

  const actor = {
    id: farmerUserId.toString(),
    role: 'farmer',
    farmerId: fId.toString(),
    reason,
  };

  const updatedOrder = await transitionOrder(oId, destinationStatus, actor, {
    reason,
    db,
  });

  return getFarmerOrderDetail(fId, updatedOrder._id);
}
>>>>>>> bc73418815cde522512fe21a2af884eee3163165
