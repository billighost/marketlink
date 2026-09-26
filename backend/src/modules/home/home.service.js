
/**
 * Home summary module service layer.
 * Provides consolidated customer home overview with ready orders, next pickup,
 * recent orders, favorite farmers, fresh today, nearby markets, and restock alerts.
 */

import { getDb } from '../../db/client.js';
import { COLLECTIONS } from '../../db/collections.js';
import { toObjectId } from '../../utils/ids.js';
import { toOrderSummary } from '../orders/orderShapes.js';
import { toProductCard, toFarmerCard } from '../../utils/shapes.js';

/**
 * Returns a fast, consolidated summary for the customer home dashboard.
 *
 * @param {string|import('mongodb').ObjectId} customerId
 * @param {object} [options]
 * @param {Date} [options.now=new Date()]
 * @returns {Promise<object>}
 */
export async function getHomeSummary(customerId, { now = new Date() } = {}) {
  const db = getDb();
  const cid = toObjectId(customerId);

  // 1. Fetch user doc for saved/favorite IDs and homeMarketId
  const user = await db.collection(COLLECTIONS.USERS).findOne({ _id: cid });

  // Concurrently fetch orders, notifications, fresh products, markets, and favorites
  const [
    readyOrder,
    nextOrder,
    recentOrdersRaw,
    unreadNotifications,
    favoriteDocs,
    freshProductsRaw,
    marketsRaw,
  ] = await Promise.all([
    // Soonest order marked ready for pickup
    db
      .collection(COLLECTIONS.ORDERS)
      .find({ customerId: cid, status: 'ready' })
      .sort({ 'pickup.start': 1 })
      .limit(1)
      .next(),

    // Soonest placed or accepted order scheduled for upcoming pickup
    db
      .collection(COLLECTIONS.ORDERS)
      .find({ customerId: cid, status: { $in: ['placed', 'accepted'] } })
      .sort({ 'pickup.start': 1 })
      .limit(1)
      .next(),

    // Recent orders (up to 4)
    db
      .collection(COLLECTIONS.ORDERS)
      .find({ customerId: cid })
      .sort({ createdAt: -1 })
      .limit(4)
      .toArray(),

    // Unread notifications count
    db.collection(COLLECTIONS.NOTIFICATIONS).countDocuments({ userId: cid, readAt: null }),

    // Customer favorites
    db
      .collection(COLLECTIONS.FAVORITES)
      .find({ userId: cid })
      .toArray(),

    // Fresh Today: seasonal or in-stock produce
    db
      .collection(COLLECTIONS.PRODUCTS)
      .find({
        listed: { $ne: false },
        availability: 'in',
        quantityAvailable: { $gt: 0 },
      })
      .sort({ featuredScore: -1, ratingAvg: -1, createdAt: -1 })
      .limit(8)
      .toArray(),

    // Nearby / active markets
    db
      .collection(COLLECTIONS.MARKETS)
      .find({ status: 'active' })
      .sort({ farmerCount: -1, name: 1 })
      .limit(6)
      .toArray(),
  ]);

  // Resolve favorite farmers
  const favFarmerIds = favoriteDocs
    .filter((f) => f.targetType === 'farmer')
    .map((f) => toObjectId(f.targetId));

  let favoriteFarmers = [];
  if (favFarmerIds.length > 0) {
    const rawFarmers = await db
      .collection(COLLECTIONS.FARMERS)
      .find({ _id: { $in: favFarmerIds }, listingEnabled: { $ne: false } })
      .limit(6)
      .toArray();
    favoriteFarmers = rawFarmers.map((f) => toFarmerCard(f, marketsRaw));
  } else {
    // If no explicit favorites, show top rated active farmers
    const topFarmers = await db
      .collection(COLLECTIONS.FARMERS)
      .find({ listingEnabled: { $ne: false } })
      .sort({ ratingAvg: -1, salesCount: -1 })
      .limit(4)
      .toArray();
    favoriteFarmers = topFarmers.map((f) => toFarmerCard(f, marketsRaw));
  }

  // Resolve restock alerts: products user favorited or ordered that are in stock
  const favProductIds = favoriteDocs
    .filter((f) => f.targetType === 'product')
    .map((f) => toObjectId(f.targetId));

  let restockAlerts = [];
  if (favProductIds.length > 0) {
    const restocked = await db
      .collection(COLLECTIONS.PRODUCTS)
      .find({
        _id: { $in: favProductIds },
        listed: { $ne: false },
        availability: 'in',
      })
      .limit(6)
      .toArray();
    restockAlerts = restocked.map(toProductCard);
  }

  // If no favorited products restocked, find recently restocked or low stock items that are back
  if (restockAlerts.length === 0) {
    const backInStock = await db
      .collection(COLLECTIONS.PRODUCTS)
      .find({
        listed: { $ne: false },
        availability: 'in',
        tags: 'bestseller',
      })
      .limit(4)
      .toArray();
    restockAlerts = backInStock.map(toProductCard);
  }

  return {
    readyForPickup: readyOrder ? toOrderSummary(readyOrder, { now }) : null,
    nextPickup: nextOrder ? toOrderSummary(nextOrder, { now }) : null,
    recentOrders: recentOrdersRaw.map((o) => toOrderSummary(o, { now })),
    favoriteFarmers,
    freshToday: freshProductsRaw.slice(0, 6).map(toProductCard),
    nearbyMarkets: marketsRaw.map((m) => ({
      id: m._id.toString(),
      name: m.name,
      address: m.address,
      schedule: m.schedule || [],
      farmerCount: m.farmerCount || 0,
      facilities: m.facilities || [],
      location: m.location || null,
      imageUrl: m.imageUrl || null,
    })),
    restockAlerts,
    unreadNotifications,
    cartHint: null,
  };
}
 
