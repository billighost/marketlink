<<<<<<< HEAD
import { ObjectId } from 'mongodb';import { getDb } from '../../db/client.js';import { COLLECTIONS } from '../../db/collections.js';import { toObjectId } from '../../utils/ids.js';import { AppError } from '../../utils/errors.js';import { getUpcomingSlots } from '../../utils/slots.js';import { reserveStock, restoreStock, rollbackReservations } from './stock.js';import { toOrderSummary } from './orderShapes.js';import { createNotifications } from '../notifications/notify.js';import { mailer } from '../../utils/mailer.js';export async function processCheckout({ user, idempotencyKey, groups, now = new Date(), reqId }) {  const db = getDb();  const customerId = toObjectId(user.id);  const settingDoc = await db.collection(COLLECTIONS.SETTINGS).findOne({ _id: 'maxItemsPerOrder' });  const maxItemsPerOrder = Math.min(Math.max(settingDoc?.value || 30, 1), 30);  for (const group of groups) {    if (group.items.length > maxItemsPerOrder) {      throw AppError.unprocessable([        { field: 'items', message: `Maximum ${maxItemsPerOrder} items allowed per vendor order.` },      ]);    }  }  const checkoutId = new ObjectId();  try {    await db.collection(COLLECTIONS.CHECKOUTS).insertOne({      _id: checkoutId,      customerId,      idempotencyKey,      status: 'pending',      createdAt: now,    });  } catch (err) {    if (err.code === 11000) {      const existing = await db        .collection(COLLECTIONS.CHECKOUTS)        .findOne({ customerId, idempotencyKey });      if (existing) {        if (existing.status === 'done') {          const pastOrders = await db            .collection(COLLECTIONS.ORDERS)            .find({ _id: { $in: (existing.orderIds || []).map((id) => toObjectId(id)) } })            .toArray();          const summaries = pastOrders.map((o) => toOrderSummary(o, { now }));          return {            isReplay: true,            statusCode: 200,            data: {              checkoutId: existing._id.toString(),              orders: summaries,            },          };        }        if (existing.status === 'pending') {          throw AppError.conflict(            'A checkout with this idempotency key is currently in progress.',            'CHECKOUT_IN_PROGRESS'          );        }        if (existing.status === 'failed') {          throw AppError.conflict(            'This idempotency key was already used for a failed checkout. Please try again.',            'IDEMPOTENCY_KEY_USED'          );        }      }    }    throw err;  }  try {    const allProductIds = [];    const allFarmerIds = [];    for (const group of groups) {      allFarmerIds.push(toObjectId(group.farmerId));      for (const item of group.items) {        allProductIds.push(toObjectId(item.productId));      }    }    const [products, farmers] = await Promise.all([      db        .collection(COLLECTIONS.PRODUCTS)        .find({ _id: { $in: allProductIds } })        .toArray(),      db        .collection(COLLECTIONS.FARMERS)        .find({ _id: { $in: allFarmerIds } })        .toArray(),    ]);    const allMarketIds = [];    const productMap = new Map();    for (const p of products) {      productMap.set(p._id.toString(), p);      if (Array.isArray(p.marketIds)) {        p.marketIds.forEach((mId) => allMarketIds.push(toObjectId(mId)));      }    }    const farmerMap = new Map();    for (const f of farmers) {      farmerMap.set(f._id.toString(), f);      if (Array.isArray(f.marketIds)) {        f.marketIds.forEach((mId) => allMarketIds.push(toObjectId(mId)));      }    }    const markets = await db      .collection(COLLECTIONS.MARKETS)      .find({ _id: { $in: allMarketIds } })      .toArray();    const customerUser = await db.collection(COLLECTIONS.USERS).findOne({ _id: customerId });    if (!customerUser || customerUser.status !== 'active') {      await db.collection(COLLECTIONS.CHECKOUTS).updateOne({ _id: checkoutId }, { $set: { status: 'failed' } });      throw AppError.accountInactive('Your Customer account is currently inactive.');    }    const customerName = customerUser.name;    const customerEmail = customerUser.email;    const problems = [];    const validatedGroupContexts = [];    for (const group of groups) {      const farmer = farmerMap.get(group.farmerId.toString());      if (!farmer || !farmer.listingEnabled) {        problems.push({          farmerId: group.farmerId.toString(),          code: 'UNAVAILABLE',          message: 'Farmer is not listed or not accepting orders.',        });      }      const farmerMarkets = farmer        ? markets.filter((m) => (farmer.marketIds || []).some((fMid) => fMid.toString() === m._id.toString()))        : [];      const upcomingSlots = farmer        ? getUpcomingSlots(farmer, farmerMarkets, { days: 14, now })        : [];      const matchedSlot = upcomingSlots.find((s) => s.start === group.slotStart);      if (!matchedSlot || !matchedSlot.isOpen) {        problems.push({          farmerId: group.farmerId.toString(),          code: 'CUTOFF_PASSED',          message: 'The cutoff deadline has passed for the selected pickup slot.',        });      }      const slotKey = `${group.farmerId.toString()}|${group.slotStart}`;      const maxOrdersPerSlot = farmer?.maxOrdersPerSlot ?? 30;      const slotOrderCount = await db.collection(COLLECTIONS.ORDERS).countDocuments({        slotKey,        status: { $in: ['placed', 'accepted', 'ready'] },      });      if (slotOrderCount >= maxOrdersPerSlot) {        problems.push({          farmerId: group.farmerId.toString(),          code: 'SLOT_FULL',          message: 'The selected pickup slot is fully booked.',        });      }      for (const item of group.items) {        const prod = productMap.get(item.productId.toString());        if (!prod || !prod.listed || prod.availability === 'hidden') {          problems.push({            productId: item.productId.toString(),            farmerId: group.farmerId.toString(),            code: 'UNAVAILABLE',            message: `${prod?.name || 'Product'} is unavailable.`,          });        } else if (prod.farmerId.toString() !== group.farmerId.toString()) {          problems.push({            productId: item.productId.toString(),            farmerId: group.farmerId.toString(),            code: 'UNAVAILABLE',            message: `Product ${prod.name} does not belong to farmer ${farmer?.stallName || ''}.`,          });        } else if (prod.availability === 'out' || prod.quantityAvailable <= 0) {          problems.push({            productId: item.productId.toString(),            farmerId: group.farmerId.toString(),            code: 'NOT_ENOUGH_STOCK',            message: `Out of stock for ${prod.name}.`,            maxQuantity: 0,          });        } else if (prod.quantityAvailable < item.quantity) {          problems.push({            productId: item.productId.toString(),            farmerId: group.farmerId.toString(),            code: 'NOT_ENOUGH_STOCK',            message: `Only ${prod.quantityAvailable} left of ${prod.name}.`,            maxQuantity: prod.quantityAvailable,          });        }      }      validatedGroupContexts.push({        group,        farmer,        matchedSlot,        slotKey,      });    }    if (problems.length > 0) {      await db.collection(COLLECTIONS.CHECKOUTS).updateOne(        { _id: checkoutId },        { $set: { status: 'failed', error: { details: problems } } }      );      const firstCode = problems[0].code;      throw new AppError(409, firstCode, problems[0].message, problems);    }    const reservedSlots = [];    for (const ctx of validatedGroupContexts) {      const maxOrders = ctx.farmer?.maxOrdersPerSlot ?? 30;      const counterId = `slot:${ctx.slotKey}`;      const currentCount = await db.collection(COLLECTIONS.ORDERS).countDocuments({        slotKey: ctx.slotKey,        status: { $in: ['placed', 'accepted', 'ready'] },      });      await db.collection(COLLECTIONS.COUNTERS).updateOne(        { _id: counterId },        { $setOnInsert: { seq: currentCount } },        { upsert: true }      );      const slotRes = await db.collection(COLLECTIONS.COUNTERS).findOneAndUpdate(        { _id: counterId, seq: { $lt: maxOrders } },        { $inc: { seq: 1 } },        { returnDocument: 'after' }      );      if (!slotRes) {        for (const sId of reservedSlots) {          await db.collection(COLLECTIONS.COUNTERS).updateOne({ _id: sId }, { $inc: { seq: -1 } });        }        await db.collection(COLLECTIONS.CHECKOUTS).updateOne(          { _id: checkoutId },          { $set: { status: 'failed', error: { details: [{ farmerId: ctx.group.farmerId.toString(), code: 'SLOT_FULL', message: 'The selected pickup slot is fully booked.' }] } } }        );        throw new AppError(409, 'SLOT_FULL', 'The selected pickup slot is fully booked.', [          { farmerId: ctx.group.farmerId.toString(), code: 'SLOT_FULL', message: 'The selected pickup slot is fully booked.' },        ]);      }      reservedSlots.push(counterId);    }    const flatItemsToReserve = [];    for (const group of groups) {      for (const item of group.items) {        flatItemsToReserve.push({          productId: item.productId,          quantity: item.quantity,        });      }    }    flatItemsToReserve.sort((a, b) => a.productId.toString().localeCompare(b.productId.toString()));    const reserved = [];    for (const item of flatItemsToReserve) {      const success = await reserveStock(item.productId, item.quantity, db);      if (!success) {        await rollbackReservations(reserved, db);        for (const sId of reservedSlots) {          await db.collection(COLLECTIONS.COUNTERS).updateOne({ _id: sId }, { $inc: { seq: -1 } });        }        await db.collection(COLLECTIONS.CHECKOUTS).updateOne({ _id: checkoutId }, { $set: { status: 'failed' } });        const fresh = await db.collection(COLLECTIONS.PRODUCTS).findOne({ _id: toObjectId(item.productId) });        const left = fresh ? fresh.quantityAvailable : 0;        const name = fresh ? fresh.name : 'Product';        throw new AppError(          409,          'NOT_ENOUGH_STOCK',          `Only ${left} ${name} left.`,          [{ productId: item.productId.toString(), code: 'NOT_ENOUGH_STOCK', message: `Only ${left} left.`, maxQuantity: left }]        );      }      reserved.push(item);    }    const counterDoc = await db.collection(COLLECTIONS.COUNTERS).findOneAndUpdate(      { _id: 'orderNumber' },      { $inc: { seq: groups.length } },      { upsert: true, returnDocument: 'after' }    );    const seqEnd = counterDoc.seq;    const baseSeq = seqEnd - groups.length + 1;    const ordersToInsert = [];    const summaries = [];    for (let i = 0; i < validatedGroupContexts.length; i++) {      const { group, farmer, matchedSlot, slotKey } = validatedGroupContexts[i];      const orderNumber = `ML-${baseSeq + i}`;      let subtotalCents = 0;      const snapshotLines = group.items.map((item) => {        const prod = productMap.get(item.productId.toString());        const lineTotal = prod.priceCents * item.quantity;        subtotalCents += lineTotal;        return {          productId: prod._id,          name: prod.name,          unit: prod.unit,          priceCents: prod.priceCents,          quantity: item.quantity,          lineTotalCents: lineTotal,          art: prod.art || 'carrot',        };      });      const pStart = new Date(matchedSlot.start);      const pEnd = new Date(matchedSlot.end);      const cutoffAt = new Date(matchedSlot.cutoffAt);      const orderDoc = {        _id: new ObjectId(),        orderNumber,        checkoutId: checkoutId.toString(),        customerId,        customerName,        farmerId: farmer._id,        farmerUserId: farmer.userId,        farmerName: farmer.stallName,        marketId: toObjectId(matchedSlot.marketId),        items: snapshotLines,        subtotalCents,        totalCents: subtotalCents,        status: 'placed',        pickup: {          start: pStart,          end: pEnd,          stallNumber: farmer.stallNumber || '',          marketId: toObjectId(matchedSlot.marketId),          label: matchedSlot.label,        },        cutoffAt,        slotKey,        note: group.note ? group.note.trim() : '',        timeline: [{ status: 'placed', at: now, byRole: 'customer' }],        cancelReason: null,        reviewed: false,        idempotencyKey: `${idempotencyKey}:${farmer._id.toString()}`,        createdAt: now,        updatedAt: now,      };      ordersToInsert.push(orderDoc);      summaries.push(toOrderSummary(orderDoc, { now }));    }    try {      await db.collection(COLLECTIONS.ORDERS).insertMany(ordersToInsert, { ordered: true });    } catch (insertErr) {      await rollbackReservations(reserved, db);      await db.collection(COLLECTIONS.CHECKOUTS).updateOne({ _id: checkoutId }, { $set: { status: 'failed' } });      console.error(`[CHECKOUT INSERT ERROR] [reqId: ${reqId}]`, insertErr);      throw AppError.internal('Failed to create orders. All inventory reservations rolled back.');    }    await db.collection(COLLECTIONS.CHECKOUTS).updateOne(      { _id: checkoutId },      {        $set: {          status: 'done',          orderIds: ordersToInsert.map((o) => o._id),          completedAt: new Date(),        },      }    );    setImmediate(async () => {      try {        const notifList = [];        const farmerNames = [...new Set(ordersToInsert.map((o) => o.farmerName))].join(', ');        const firstOrder = ordersToInsert[0];        notifList.push({          userId: customerId,          type: 'order_placed',          title: 'Pre-order placed',          body: `Your pre-order ${firstOrder.orderNumber} is with ${farmerNames}. Pick up ${firstOrder.pickup?.label || ''}.`,          data: { checkoutId: checkoutId.toString(), orderId: firstOrder._id.toString(), orderNumber: firstOrder.orderNumber },        });        const customerFirst = customerName ? customerName.split(' ')[0] : 'Customer';        for (const order of ordersToInsert) {          notifList.push({            userId: order.farmerUserId,            type: 'order_placed',            title: 'New pre-order',            body: `${customerFirst} placed order ${order.orderNumber} for ${order.pickup?.label || ''}.`,            data: { orderId: order._id.toString(), orderNumber: order.orderNumber },          });        }        await createNotifications(notifList, db);        if (customerEmail) {          await mailer.sendOrderConfirmation(customerEmail, {            orderNumber: firstOrder.orderNumber,            pickupLabel: firstOrder.pickup?.label || '',            totalCents: ordersToInsert.reduce((sum, o) => sum + o.totalCents, 0),          });        }      } catch (postErr) {        console.error('[CHECKOUT POST-NOTIFICATION ERROR]', postErr);      }    });    return {      isReplay: false,      statusCode: 201,      data: {        checkoutId: checkoutId.toString(),        orders: summaries,      },    };  } catch (err) {    if (err instanceof AppError) {      throw err;    }    await db.collection(COLLECTIONS.CHECKOUTS).updateOne({ _id: checkoutId }, { $set: { status: 'failed' } });    throw err;  }}
=======
/**
 * Customer Checkout Service.
 * Implements the authoritative 10-step atomic pre-order checkout algorithm.
 * Guarantees zero overselling, deterministic rollback on partial inventory failure,
 * idempotent replay via unique indexes, and contiguous order numbering.
 */

import { ObjectId } from 'mongodb';
import { getDb } from '../../db/client.js';
import { COLLECTIONS } from '../../db/collections.js';
import { toObjectId } from '../../utils/ids.js';
import { AppError } from '../../utils/errors.js';
import { getUpcomingSlots } from '../../utils/slots.js';
import { reserveStock, restoreStock, rollbackReservations } from './stock.js';
import { toOrderSummary } from './orderShapes.js';
import { createNotifications } from '../notifications/notify.js';
import { mailer } from '../../utils/mailer.js';
import { generatePickupCode } from '../../utils/pickupCode.js';

/**
 * Executes customer checkout across one or more farmer groups.
 *
 * @param {object} params
 * @param {object} params.user - Authenticated customer { id, name, status, role }
 * @param {string} params.idempotencyKey - Validated idempotency key (8..64 chars)
 * @param {Array<object>} params.groups - Validated groups
 * @param {Date} [params.now=new Date()] - Evaluation time
 * @param {string} [params.reqId] - Trace request id
 * @returns {Promise<{ isReplay: boolean, statusCode: number, data: { checkoutId: string, orders: Array<object> } }>}
 */
export async function processCheckout({ user, idempotencyKey, groups, now = new Date(), reqId }) {
  const db = getDb();
  const customerId = toObjectId(user.id);

  // 1. Validate shape and limits. Load settings maxItemsPerOrder (default 30, cap 30). 422 on failures.
  const settingDoc = await db.collection(COLLECTIONS.SETTINGS).findOne({ _id: 'maxItemsPerOrder' });
  const maxItemsPerOrder = Math.min(Math.max(settingDoc?.value || 30, 1), 30);
  for (const group of groups) {
    if (group.items.length > maxItemsPerOrder) {
      throw AppError.unprocessable([
        { field: 'items', message: `Maximum ${maxItemsPerOrder} items allowed per vendor order.` },
      ]);
    }
  }

  // 2. checkoutId = new ObjectId(); insertOne into checkouts { _id: checkoutId, customerId, idempotencyKey, status: 'pending', createdAt }.
  // On duplicate-key (11000): load existing checkout for { customerId, idempotencyKey };
  // done returns 200 with its orders (orderSummary), pending returns 409 CHECKOUT_IN_PROGRESS, failed returns 409 IDEMPOTENCY_KEY_USED ("Please try again.").
  const checkoutId = new ObjectId();
  try {
    await db.collection(COLLECTIONS.CHECKOUTS).insertOne({
      _id: checkoutId,
      customerId,
      idempotencyKey,
      status: 'pending',
      createdAt: now,
    });
  } catch (err) {
    if (err.code === 11000) {
      const existing = await db
        .collection(COLLECTIONS.CHECKOUTS)
        .findOne({ customerId, idempotencyKey });

      if (existing) {
        if (existing.status === 'done') {
          const pastOrders = await db
            .collection(COLLECTIONS.ORDERS)
            .find({ _id: { $in: (existing.orderIds || []).map((id) => toObjectId(id)) } })
            .toArray();

          const summaries = pastOrders.map((o) => toOrderSummary(o, { now }));
          return {
            isReplay: true,
            statusCode: 200,
            data: {
              checkoutId: existing._id.toString(),
              orders: summaries,
            },
          };
        }

        if (existing.status === 'pending') {
          throw AppError.conflict(
            'A checkout with this idempotency key is currently in progress.',
            'CHECKOUT_IN_PROGRESS'
          );
        }

        if (existing.status === 'failed') {
          throw AppError.conflict(
            'This idempotency key was already used for a failed checkout. Please try again.',
            'IDEMPOTENCY_KEY_USED'
          );
        }
      }
    }
    throw err;
  }

  try {
    // 3. Load in three queries: products by $in, Farmers by $in, markets by $in.
    // Validate every group (Farmer listingEnabled, each product's farmerId equals the group's Farmer, listed, availability !== 'out'),
    // the slot (slotStart must equal a start from getUpcomingSlots and isOpen), capacity (count non-terminal orders with the same slotKey, cap maxOrdersPerSlot default 30),
    // and the caller's account status active. Collect all problems for the response (do not stop at the first):
    // on any problem mark the checkout failed and return 409 with error.details = list of { productId?, farmerId?, code, message }
    // and error.code = the first blocking code (NOT_ENOUGH_STOCK, CUTOFF_PASSED, SLOT_FULL, UNAVAILABLE).

    const allProductIds = [];
    const allFarmerIds = [];

    for (const group of groups) {
      allFarmerIds.push(toObjectId(group.farmerId));
      for (const item of group.items) {
        allProductIds.push(toObjectId(item.productId));
      }
    }

    const [products, farmers] = await Promise.all([
      db
        .collection(COLLECTIONS.PRODUCTS)
        .find({ _id: { $in: allProductIds } })
        .toArray(),
      db
        .collection(COLLECTIONS.FARMERS)
        .find({ _id: { $in: allFarmerIds } })
        .toArray(),
    ]);

    const allMarketIds = [];
    const productMap = new Map();
    for (const p of products) {
      productMap.set(p._id.toString(), p);
      if (Array.isArray(p.marketIds)) {
        p.marketIds.forEach((mId) => allMarketIds.push(toObjectId(mId)));
      }
    }

    const farmerMap = new Map();
    for (const f of farmers) {
      farmerMap.set(f._id.toString(), f);
      if (Array.isArray(f.marketIds)) {
        f.marketIds.forEach((mId) => allMarketIds.push(toObjectId(mId)));
      }
    }

    const markets = await db
      .collection(COLLECTIONS.MARKETS)
      .find({ _id: { $in: allMarketIds } })
      .toArray();

    // Verify caller account status
    const customerUser = await db.collection(COLLECTIONS.USERS).findOne({ _id: customerId });
    if (!customerUser || customerUser.status !== 'active') {
      await db.collection(COLLECTIONS.CHECKOUTS).updateOne({ _id: checkoutId }, { $set: { status: 'failed' } });
      throw AppError.accountInactive('Your Customer account is currently inactive.');
    }

    const customerName = customerUser.name;
    const customerEmail = customerUser.email;

    const problems = [];
    const validatedGroupContexts = [];

    for (const group of groups) {
      const farmer = farmerMap.get(group.farmerId.toString());

      if (!farmer || !farmer.listingEnabled) {
        problems.push({
          farmerId: group.farmerId.toString(),
          code: 'UNAVAILABLE',
          message: 'Farmer is not listed or not accepting orders.',
        });
      }

      // Check slot & upcoming slots
      const farmerMarkets = farmer
        ? markets.filter((m) => (farmer.marketIds || []).some((fMid) => fMid.toString() === m._id.toString()))
        : [];
      const upcomingSlots = farmer
        ? getUpcomingSlots(farmer, farmerMarkets, { days: 14, now })
        : [];

      const matchedSlot = upcomingSlots.find((s) => s.start === group.slotStart);
      if (!matchedSlot || !matchedSlot.isOpen) {
        problems.push({
          farmerId: group.farmerId.toString(),
          code: 'CUTOFF_PASSED',
          message: 'The cutoff deadline has passed for the selected pickup slot.',
        });
      }

      const slotKey = `${group.farmerId.toString()}|${group.slotStart}`;

      // Capacity check: count non-terminal orders with same slotKey
      const maxOrdersPerSlot = farmer?.maxOrdersPerSlot ?? 30;
      const slotOrderCount = await db.collection(COLLECTIONS.ORDERS).countDocuments({
        slotKey,
        status: { $in: ['placed', 'accepted', 'ready'] },
      });

      if (slotOrderCount >= maxOrdersPerSlot) {
        problems.push({
          farmerId: group.farmerId.toString(),
          code: 'SLOT_FULL',
          message: 'The selected pickup slot is fully booked.',
        });
      }

      // Check products in group
      for (const item of group.items) {
        const prod = productMap.get(item.productId.toString());

        if (!prod || !prod.listed || prod.availability === 'hidden') {
          problems.push({
            productId: item.productId.toString(),
            farmerId: group.farmerId.toString(),
            code: 'UNAVAILABLE',
            message: `${prod?.name || 'Product'} is unavailable.`,
          });
        } else if (prod.farmerId.toString() !== group.farmerId.toString()) {
          problems.push({
            productId: item.productId.toString(),
            farmerId: group.farmerId.toString(),
            code: 'UNAVAILABLE',
            message: `Product ${prod.name} does not belong to farmer ${farmer?.stallName || ''}.`,
          });
        } else if (prod.availability === 'out' || prod.quantityAvailable <= 0) {
          problems.push({
            productId: item.productId.toString(),
            farmerId: group.farmerId.toString(),
            code: 'NOT_ENOUGH_STOCK',
            message: `Out of stock for ${prod.name}.`,
            maxQuantity: 0,
          });
        } else if (prod.quantityAvailable < item.quantity) {
          problems.push({
            productId: item.productId.toString(),
            farmerId: group.farmerId.toString(),
            code: 'NOT_ENOUGH_STOCK',
            message: `Only ${prod.quantityAvailable} left of ${prod.name}.`,
            maxQuantity: prod.quantityAvailable,
          });
        }
      }

      validatedGroupContexts.push({
        group,
        farmer,
        matchedSlot,
        slotKey,
      });
    }

    if (problems.length > 0) {
      await db.collection(COLLECTIONS.CHECKOUTS).updateOne(
        { _id: checkoutId },
        { $set: { status: 'failed', error: { details: problems } } }
      );

      const firstCode = problems[0].code;
      throw new AppError(409, firstCode, problems[0].message, problems);
    }

    // 3b. Atomically reserve slot capacity tickets under concurrency races
    const reservedSlots = [];
    for (const ctx of validatedGroupContexts) {
      const maxOrders = ctx.farmer?.maxOrdersPerSlot ?? 30;
      const counterId = `slot:${ctx.slotKey}`;
      const currentCount = await db.collection(COLLECTIONS.ORDERS).countDocuments({
        slotKey: ctx.slotKey,
        status: { $in: ['placed', 'accepted', 'ready'] },
      });
      await db.collection(COLLECTIONS.COUNTERS).updateOne(
        { _id: counterId },
        { $setOnInsert: { seq: currentCount } },
        { upsert: true }
      );
      const slotRes = await db.collection(COLLECTIONS.COUNTERS).findOneAndUpdate(
        { _id: counterId, seq: { $lt: maxOrders } },
        { $inc: { seq: 1 } },
        { returnDocument: 'after' }
      );
      if (!slotRes) {
        for (const sId of reservedSlots) {
          await db.collection(COLLECTIONS.COUNTERS).updateOne({ _id: sId }, { $inc: { seq: -1 } });
        }
        await db.collection(COLLECTIONS.CHECKOUTS).updateOne(
          { _id: checkoutId },
          { $set: { status: 'failed', error: { details: [{ farmerId: ctx.group.farmerId.toString(), code: 'SLOT_FULL', message: 'The selected pickup slot is fully booked.' }] } } }
        );
        throw new AppError(409, 'SLOT_FULL', 'The selected pickup slot is fully booked.', [
          { farmerId: ctx.group.farmerId.toString(), code: 'SLOT_FULL', message: 'The selected pickup slot is fully booked.' },
        ]);
      }
      reservedSlots.push(counterId);
    }

    // 4. Reserve stock line by line in a deterministic order (sorted by productId to avoid lock-order surprises).
    // Keep a reserved[] list. On the first false: run rollback(reserved) (restoreStock for each), mark the checkout failed,
    // return 409 NOT_ENOUGH_STOCK naming the product and current quantityAvailable (re-read it once for the message).
    const flatItemsToReserve = [];
    for (const group of groups) {
      for (const item of group.items) {
        flatItemsToReserve.push({
          productId: item.productId,
          quantity: item.quantity,
        });
      }
    }

    // Deterministic sorting by productId string
    flatItemsToReserve.sort((a, b) => a.productId.toString().localeCompare(b.productId.toString()));

    const reserved = [];
    for (const item of flatItemsToReserve) {
      const success = await reserveStock(item.productId, item.quantity, db);
      if (!success) {
        // Roll back previously reserved lines and slot capacity tickets
        await rollbackReservations(reserved, db);
        for (const sId of reservedSlots) {
          await db.collection(COLLECTIONS.COUNTERS).updateOne({ _id: sId }, { $inc: { seq: -1 } });
        }
        await db.collection(COLLECTIONS.CHECKOUTS).updateOne({ _id: checkoutId }, { $set: { status: 'failed' } });

        const fresh = await db.collection(COLLECTIONS.PRODUCTS).findOne({ _id: toObjectId(item.productId) });
        const left = fresh ? fresh.quantityAvailable : 0;
        const name = fresh ? fresh.name : 'Product';
        throw new AppError(
          409,
          'NOT_ENOUGH_STOCK',
          `Only ${left} ${name} left.`,
          [{ productId: item.productId.toString(), code: 'NOT_ENOUGH_STOCK', message: `Only ${left} left.`, maxQuantity: left }]
        );
      }
      reserved.push(item);
    }

    // 5. Reserve order numbers: findOneAndUpdate({ _id: 'orderNumber' }, { $inc: { seq: groups.length } }, { upsert: true, returnDocument: 'after' })
    // gives a contiguous block; number i is seq - groups.length + 1 + i.
    const counterDoc = await db.collection(COLLECTIONS.COUNTERS).findOneAndUpdate(
      { _id: 'orderNumber' },
      { $inc: { seq: groups.length } },
      { upsert: true, returnDocument: 'after' }
    );
    const seqEnd = counterDoc.seq;
    const baseSeq = seqEnd - groups.length + 1;

    // 6. Build one order document per group: snapshot lines, totals, pickup { start, end, stallNumber, marketId },
    // cutoffAt, slotKey = farmerId + '|' + start.toISOString(), status: 'placed',
    // timeline: [{ status: 'placed', at: now, byRole: 'customer' }], customerName, farmerName, checkoutId, note, reviewed: false.
    const ordersToInsert = [];
    const summaries = [];

    for (let i = 0; i < validatedGroupContexts.length; i++) {
      const { group, farmer, matchedSlot, slotKey } = validatedGroupContexts[i];
      const orderNumber = `ML-${baseSeq + i}`;

      let subtotalCents = 0;
      const snapshotLines = group.items.map((item) => {
        const prod = productMap.get(item.productId.toString());
        const lineTotal = prod.priceCents * item.quantity;
        subtotalCents += lineTotal;
        return {
          productId: prod._id,
          name: prod.name,
          unit: prod.unit,
          priceCents: prod.priceCents,
          quantity: item.quantity,
          lineTotalCents: lineTotal,
          art: prod.art || 'carrot',
        };
      });

      const pStart = new Date(matchedSlot.start);
      const pEnd = new Date(matchedSlot.end);
      const cutoffAt = new Date(matchedSlot.cutoffAt);

      const orderDoc = {
        _id: new ObjectId(),
        orderNumber,
        checkoutId: checkoutId.toString(),
        customerId,
        customerName,
        farmerId: farmer._id,
        farmerUserId: farmer.userId,
        farmerName: farmer.stallName,
        marketId: toObjectId(matchedSlot.marketId),
        items: snapshotLines,
        subtotalCents,
        totalCents: subtotalCents,
        status: 'placed',
        pickup: {
          start: pStart,
          end: pEnd,
          stallNumber: farmer.stallNumber || '',
          marketId: toObjectId(matchedSlot.marketId),
          label: matchedSlot.label,
        },
        cutoffAt,
        slotKey,
        note: group.note ? group.note.trim() : '',
        timeline: [{ status: 'placed', at: now, byRole: 'customer' }],
        cancelReason: null,
        reviewed: false,
        idempotencyKey: `${idempotencyKey}:${farmer._id.toString()}`,
        pickupCode: generatePickupCode(),
        createdAt: now,
        updatedAt: now,
      };

      ordersToInsert.push(orderDoc);
    }

    // 7. insertMany(orders, { ordered: true }) inside try/catch with collision retry on pickupCode (up to 5 attempts).
    let inserted = false;
    let insertAttempts = 0;
    while (!inserted && insertAttempts < 5) {
      insertAttempts++;
      try {
        await db.collection(COLLECTIONS.ORDERS).insertMany(ordersToInsert, { ordered: true });
        inserted = true;
      } catch (insertErr) {
        if (insertErr.code === 11000 && (insertErr.message || '').includes('pickupCode') && insertAttempts < 5) {
          for (const ord of ordersToInsert) {
            ord.pickupCode = generatePickupCode();
          }
          continue;
        }
        await rollbackReservations(reserved, db);
        await db.collection(COLLECTIONS.CHECKOUTS).updateOne({ _id: checkoutId }, { $set: { status: 'failed' } });
        console.error(`[CHECKOUT INSERT ERROR] [reqId: ${reqId}]`, insertErr);
        throw AppError.internal('Failed to create orders. All inventory reservations rolled back.');
      }
    }

    for (const ord of ordersToInsert) {
      summaries.push(toOrderSummary(ord, { now }));
    }

    // 8. updateOne(checkouts, { status: 'done', orderIds, completedAt })
    await db.collection(COLLECTIONS.CHECKOUTS).updateOne(
      { _id: checkoutId },
      {
        $set: {
          status: 'done',
          orderIds: ordersToInsert.map((o) => o._id),
          completedAt: new Date(),
        },
      }
    );

    // 9. After the response is prepared (do not block it on these): create notifications (Customer: order_placed one per checkout listing Farmers;
    // each Farmer: new order) with insertMany, and call the mailer stub. Failures here are logged, never fail the checkout.
    setImmediate(async () => {
      try {
        const notifList = [];
        const farmerNames = [...new Set(ordersToInsert.map((o) => o.farmerName))].join(', ');
        const firstOrder = ordersToInsert[0];

        // Customer notification
        notifList.push({
          userId: customerId,
          type: 'order_placed',
          title: 'Pre-order placed',
          body: `Your pre-order ${firstOrder.orderNumber} is with ${farmerNames}. Pick up ${firstOrder.pickup?.label || ''}.`,
          data: { checkoutId: checkoutId.toString(), orderId: firstOrder._id.toString(), orderNumber: firstOrder.orderNumber },
        });

        // Farmer notifications
        const customerFirst = customerName ? customerName.split(' ')[0] : 'Customer';
        for (const order of ordersToInsert) {
          notifList.push({
            userId: order.farmerUserId,
            type: 'order_placed',
            title: 'New pre-order',
            body: `${customerFirst} placed order ${order.orderNumber} for ${order.pickup?.label || ''}.`,
            data: { orderId: order._id.toString(), orderNumber: order.orderNumber },
          });
        }

        await createNotifications(notifList, db);

        // Real mailer call
        if (customerEmail) {
          await mailer.sendOrderConfirmation(customerEmail, {
            orderNumber: firstOrder.orderNumber,
            pickupLabel: firstOrder.pickup?.label || '',
            farmerName: firstOrder.farmerName || 'Your grower',
            totalCents: ordersToInsert.reduce((sum, o) => sum + o.totalCents, 0),
          });
        }
      } catch (postErr) {
        console.error('[CHECKOUT POST-NOTIFICATION ERROR]', postErr);
      }
    });

    // 10. Return 201 { data: { checkoutId, orders: [orderSummary...] } }; on replay return 200 with the same body.
    return {
      isReplay: false,
      statusCode: 201,
      data: {
        checkoutId: checkoutId.toString(),
        orders: summaries,
      },
    };
  } catch (err) {
    if (err instanceof AppError) {
      throw err;
    }
    // Catch-all failure
    await db.collection(COLLECTIONS.CHECKOUTS).updateOne({ _id: checkoutId }, { $set: { status: 'failed' } });
    throw err;
  }
}
>>>>>>> bc73418815cde522512fe21a2af884eee3163165
