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

export async function getCustomerOrderDetail(orderId, customerId, { now = new Date() } = {}) {
  const db = getDb();
  const oid = toObjectId(orderId);
  const cid = toObjectId(customerId);

  const order = await db.collection(COLLECTIONS.ORDERS).findOne({ _id: oid, customerId: cid });
  if (!order) {
    throw AppError.notFound('Order not found.');
  }

  const marketDoc = await db.collection(COLLECTIONS.MARKETS).findOne({ _id: order.marketId });
  return toOrderDetail(order, { marketDoc, now });
}

export async function modifyCustomerOrder(orderId, customerId, updates, { now = new Date() } = {}) {
  const db = getDb();
  const oid = toObjectId(orderId);
  const cid = toObjectId(customerId);

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

  const increases = [];
  const decreases = [];
  let updatedItems = [...order.items];

  if (Array.isArray(updates.items)) {
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

  const appliedIncreases = [];
  for (const inc of increases) {
    const success = await reserveStock(inc.productId, inc.delta, db);
    if (!success) {
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
      for (const applied of appliedIncreases) {
        await restoreStock(applied.productId, applied.delta, { db, notify: false });
      }
      throw AppError.conflict('That pickup time has closed.', 'SLOT_CLOSED');
    }

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
    for (const applied of appliedIncreases) {
      await restoreStock(applied.productId, applied.delta, { db, notify: false });
    }
    throw AppError.conflict(
      'The Farmer just updated this order. Please review it.',
      'ORDER_CHANGED'
    );
  }

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
  }

  return getCustomerOrderDetail(orderId, customerId, { now });
}

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

export async function getCustomerRoutePlan(customerId, { now = new Date() } = {}) {
  const db = getDb();
  const cid = toObjectId(customerId);
  const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

  const activeOrders = await db
    .collection(COLLECTIONS.ORDERS)
    .find({
      customerId: cid,
      $or: [
        { status: { $in: ['placed', 'accepted', 'ready'] } },
        { status: 'completed', updatedAt: { $gte: twoDaysAgo } },
        { customerCollected: true },
      ],
    })
    .sort({ createdAt: -1 })
    .toArray();

  if (!activeOrders || activeOrders.length === 0) {
    const user = await db.collection(COLLECTIONS.USERS).findOne({ _id: cid });
    let previewMarket = null;
    if (user?.homeMarketId) {
      previewMarket = await db.collection(COLLECTIONS.MARKETS).findOne({ _id: toObjectId(user.homeMarketId) });
    }
    if (!previewMarket) {
      previewMarket = await db.collection(COLLECTIONS.MARKETS).findOne({});
    }

    const mCoords = previewMarket?.location?.coordinates || [-74.172, 40.735];
    const centerLng = typeof mCoords[0] === 'number' ? mCoords[0] : -74.172;
    const centerLat = typeof mCoords[1] === 'number' ? mCoords[1] : 40.735;
    const marketName = previewMarket?.name || 'Local Farmers Market';
    const marketAddress = previewMarket?.address || 'Market Pavilion';

    const dbFarmers = await db
      .collection(COLLECTIONS.FARMERS)
      .find(
        previewMarket?._id
          ? {
              $or: [
                { marketId: previewMarket._id },
                { marketId: previewMarket._id.toString() },
                { attendingMarketIds: previewMarket._id },
              ],
            }
          : {}
      )
      .limit(3)
      .toArray();

    let realFarmers = dbFarmers;
    if (realFarmers.length === 0) {
      realFarmers = await db.collection(COLLECTIONS.FARMERS).find({}).limit(3).toArray();
    }

    const previewStops = (realFarmers.length > 0 ? realFarmers : [1, 2, 3]).map((f, idx) => {
      const stallName = f.stallName || (idx === 0 ? 'Riverbend Farm' : idx === 1 ? 'Oak & Mill Bakery' : 'Sunridge Orchards');
      const stallNum = f.stallNumber || `Stall ${String.fromCharCode(65 + idx)}${10 + idx * 4}`;
      const farmerId = f._id ? f._id.toString() : `preview-farmer-${idx + 1}`;
      const lat = centerLat + (idx === 0 ? -0.0004 : idx === 1 ? 0.0001 : 0.0005);
      const lng = centerLng + (idx === 0 ? 0.0005 : idx === 1 ? -0.0006 : 0.0004);

      return {
        step: idx + 1,
        id: `preview-${farmerId}`,
        orderId: null,
        stallName,
        stallNumber: stallNum.startsWith('Stall') ? stallNum : `Stall ${stallNum}`,
        farmerId,
        orderNumber: `ML-${1040 + idx}`,
        pickupCode: `ML-${4800 + idx * 111}`,
        status: idx === 0 ? 'ready' : 'accepted',
        statusLabel: idx === 0 ? 'Ready for pickup' : 'Being packed',
        category: f.specialty || (idx === 0 ? 'Organic Produce & Greens' : idx === 1 ? 'Woodfired Breads' : 'Orchard Fruits'),
        items: [
          { name: idx === 0 ? 'Heritage Heirloom Tomatoes' : idx === 1 ? 'Country Sourdough Boule' : 'Crisp Honeycrisp Apples', quantity: 2, unit: 'kg', priceCents: 850, art: 'tomato' },
        ],
        itemCount: 2,
        totalCents: 1700,
        pickupLabel: 'Saturday 8:00 AM – 1:00 PM',
        lat: parseFloat(lat.toFixed(6)),
        lng: parseFloat(lng.toFixed(6)),
        phone: f.phone || '',
        collected: false,
      };
    });

    const marketObj = {
      id: previewMarket?._id ? previewMarket._id.toString() : '',
      name: marketName,
      address: marketAddress,
      entranceLabel: 'Main Entrance',
      exitLabel: 'Market Exit & Parking',
      centerLat,
      centerLng,
      startPoint: {
        lat: parseFloat((centerLat - 0.0010).toFixed(6)),
        lng: parseFloat((centerLng - 0.0008).toFixed(6)),
        label: `START — ${marketName} Main Entrance`,
      },
      finishPoint: {
        lat: parseFloat((centerLat + 0.0010).toFixed(6)),
        lng: parseFloat((centerLng + 0.0008).toFixed(6)),
        label: 'FINISH — Collection Complete',
      },
    };

    return {
      hasRealOrders: false,
      routeTitle: 'Your Saturday Market Route',
      dayName: 'Saturday',
      market: marketObj,
      stops: previewStops,
      summary: {
        totalStops: previewStops.length,
        totalItems: previewStops.reduce((sum, s) => sum + s.itemCount, 0),
        estimatedWalkMinutes: Math.max(3, previewStops.length * 2),
        totalCents: previewStops.reduce((sum, s) => sum + s.totalCents, 0),
      },
      demoStops: previewStops,
    };
  }

  const farmerIds = [...new Set(activeOrders.map((o) => o.farmerId).filter(Boolean))];
  const marketIds = [...new Set(activeOrders.map((o) => o.marketId).filter(Boolean))];

  const [farmersList, marketsList] = await Promise.all([
    db.collection(COLLECTIONS.FARMERS).find({ _id: { $in: farmerIds.map(toObjectId) } }).toArray(),
    db.collection(COLLECTIONS.MARKETS).find({ _id: { $in: marketIds.map(toObjectId) } }).toArray(),
  ]);

  const farmerMap = new Map(farmersList.map((f) => [f._id.toString(), f]));
  const marketMap = new Map(marketsList.map((m) => [m._id.toString(), m]));

  let primaryMarket = marketsList[0] || null;
  if (!primaryMarket) {
    const user = await db.collection(COLLECTIONS.USERS).findOne({ _id: cid });
    if (user?.homeMarketId) {
      primaryMarket = await db.collection(COLLECTIONS.MARKETS).findOne({ _id: toObjectId(user.homeMarketId) });
    }
  }
  if (!primaryMarket) {
    primaryMarket = await db.collection(COLLECTIONS.MARKETS).findOne({});
  }

  const primaryMarketName = primaryMarket?.name || 'Local Market';
  const primaryMarketAddress = primaryMarket?.address || '';
  const mCoords = primaryMarket?.location?.coordinates || [-74.172, 40.735];
  const centerLng = typeof mCoords[0] === 'number' ? mCoords[0] : -74.172;
  const centerLat = typeof mCoords[1] === 'number' ? mCoords[1] : 40.735;

  let dayName = 'Saturday';
  const firstPickupDate = activeOrders[0]?.pickup?.start || activeOrders[0]?.createdAt;
  if (firstPickupDate) {
    try {
      const d = new Date(firstPickupDate);
      if (!isNaN(d.getTime())) {
        dayName = d.toLocaleDateString('en-US', { weekday: 'long' });
      }
    } catch {}
  }

  const sortedOrders = [...activeOrders].sort((a, b) => {
    const stallA = (a.pickup?.stallNumber || '').toLowerCase();
    const stallB = (b.pickup?.stallNumber || '').toLowerCase();
    return stallA.localeCompare(stallB);
  });

  const stops = sortedOrders.map((order, idx) => {
    const f = farmerMap.get(order.farmerId?.toString()) || {};
    const stallNum = order.pickup?.stallNumber || f.stallNumber || `Stall ${String.fromCharCode(65 + (idx % 26))}${((idx + 1) * 3) % 20 + 1}`;
    const name = order.farmerName || f.stallName || 'Farm Stall';

    const spreadFraction = sortedOrders.length > 1 ? (idx + 1) / (sortedOrders.length + 1) : 0.5;
    const latOffset = (spreadFraction - 0.5) * 0.0016;
    const lngOffset = Math.sin(spreadFraction * Math.PI) * 0.0012 * (idx % 2 === 0 ? 1 : -1);

    const lat = centerLat + latOffset;
    const lng = centerLng + lngOffset;

    const items = (order.items || []).map((it) => ({
      name: it.name,
      quantity: it.quantity,
      unit: it.unit || 'unit',
      priceCents: it.priceCents || 0,
      art: it.art || 'carrot',
    }));

    const itemCount = items.reduce((sum, it) => sum + (it.quantity || 1), 0);
    const isCollected = order.status === 'completed' || Boolean(order.customerCollected);

    return {
      step: idx + 1,
      id: order._id.toString(),
      orderId: order._id.toString(),
      stallName: name,
      stallNumber: stallNum.startsWith('Stall') ? stallNum : `Stall ${stallNum}`,
      farmerId: f._id ? f._id.toString() : (order.farmerId?.toString() || ''),
      orderNumber: order.orderNumber || `ML-${1000 + idx}`,
      pickupCode: order.pickupCode || 'ML-4819',
      status: order.status,
      statusLabel: isCollected
        ? 'Collected'
        : order.status === 'ready'
          ? 'Ready for pickup'
          : order.status === 'accepted'
            ? 'Being packed'
            : 'Order placed',
      category: f.specialty || 'Fresh Produce',
      items,
      itemCount,
      totalCents: order.totalCents || 0,
      pickupLabel: order.pickup?.label || `${dayName} Market Pickup`,
      lat: parseFloat(lat.toFixed(6)),
      lng: parseFloat(lng.toFixed(6)),
      phone: f.phone || '',
      collected: isCollected,
      customerCollectedAt: order.customerCollectedAt || null,
    };
  });

  const totalItems = stops.reduce((sum, s) => sum + s.itemCount, 0);
  const totalCents = stops.reduce((sum, s) => sum + s.totalCents, 0);

  return {
    hasRealOrders: true,
    routeTitle: `Your ${dayName} Market Route`,
    dayName,
    market: {
      id: primaryMarket?._id ? primaryMarket._id.toString() : '',
      name: primaryMarketName,
      address: primaryMarketAddress,
      entranceLabel: 'Main Entrance',
      exitLabel: 'Market Exit',
      centerLat,
      centerLng,
      startPoint: {
        lat: parseFloat((centerLat - 0.0010).toFixed(6)),
        lng: parseFloat((centerLng - 0.0008).toFixed(6)),
        label: 'START — Main Market Entrance',
      },
      finishPoint: {
        lat: parseFloat((centerLat + 0.0010).toFixed(6)),
        lng: parseFloat((centerLng + 0.0008).toFixed(6)),
        label: 'FINISH — Collection Complete',
      },
    },
    stops,
    summary: {
      totalStops: stops.length,
      totalItems,
      estimatedWalkMinutes: Math.max(3, stops.length * 2),
      totalCents,
    },
  };
}

export async function setRouteStopCollected(customerId, orderId, collected) {
  const db = getDb();
  const cid = toObjectId(customerId);
  const oid = toObjectId(orderId);

  const order = await db.collection(COLLECTIONS.ORDERS).findOne({ _id: oid, customerId: cid });
  if (!order) {
    throw AppError.notFound('Order not found.');
  }

  await db.collection(COLLECTIONS.ORDERS).updateOne(
    { _id: oid, customerId: cid },
    {
      $set: {
        customerCollected: Boolean(collected),
        customerCollectedAt: collected ? new Date() : null,
        updatedAt: new Date(),
      },
    }
  );

  return {
    orderId: oid.toString(),
    stopId: oid.toString(),
    collected: Boolean(collected),
  };
}

export async function resetCustomerRouteProgress(customerId) {
  const db = getDb();
  const cid = toObjectId(customerId);

  await db.collection(COLLECTIONS.ORDERS).updateMany(
    { customerId: cid },
    {
      $set: {
        customerCollected: false,
        customerCollectedAt: null,
        updatedAt: new Date(),
      },
    }
  );

  return { success: true };
}
