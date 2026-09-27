/**
 * Feed module service layer.
 * Endless home feed engine with curated Batch 0, 13 modular templates,
 * deterministic 6-batch deduplication, and /feed/meta summary line.
 */

import crypto from 'node:crypto';
import { ObjectId } from 'mongodb';
import { getDb } from '../../db/client.js';
import { COLLECTIONS } from '../../db/collections.js';
import { toObjectId } from '../../utils/ids.js';
import { AppError } from '../../utils/errors.js';
import { toProductCard, toFarmerCard, toMarketCard } from '../../utils/shapes.js';
import { encodeCursor, decodeCursor } from '../../utils/cursor.js';
import { getNextSlotsForAllFarmers, zonedTimeToUtc, computeMarketClock } from '../../utils/slots.js';
import { FEED_TEMPLATES } from './feed.templates.js';

// Cache for recent batch item IDs: key = `${userId}:${seed}:${batch}` -> Set<id>
const batchHistoryCache = new Map();

/**
 * 32-bit FNV/crypto hash for deterministic integer seed.
 *
 * @param {string} str
 * @returns {number}
 */
export function hash32(str) {
  const hash = crypto.createHash('sha256').update(String(str)).digest();
  return hash.readUInt32BE(0);
}

/**
 * Gets UTC calendar date bucket for daily seed rotation.
 *
 * @param {Date} [d=new Date()]
 * @returns {string} YYYY-MM-DD
 */
export function getDayBucket(d = new Date()) {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(
    d.getUTCDate()
  ).padStart(2, '0')}`;
}

/**
 * Loads all active markets mapped for farmer card enrichment.
 */
let allMarketsCache = null;
let allMarketsCacheTime = 0;
async function getAllMarkets(db) {
  const now = Date.now();
  if (allMarketsCache && now - allMarketsCacheTime < 60000) {
    return allMarketsCache;
  }
  const markets = await db.collection(COLLECTIONS.MARKETS).find().toArray();
  allMarketsCache = markets;
  allMarketsCacheTime = now;
  return markets;
}

/**
 * Builds curated Batch 0 sections.
 */
async function buildBatch0(db, user, seed, now) {
  const allMarkets = await getAllMarkets(db);
  const sections = [];

  // 1. Featured today (featureRow, 3 products from different farmers)
  const topFeatured = await db
    .collection(COLLECTIONS.PRODUCTS)
    .find({
      listed: true,
      availability: 'in',
      $or: [{ tags: 'seasonal' }, { tags: 'bestseller' }],
    })
    .sort({ featuredScore: -1 })
    .limit(15)
    .toArray();

  const seenFarmers = new Set();
  const featured = [];
  for (const p of topFeatured) {
    const fId = p.farmerId.toString();
    if (!seenFarmers.has(fId)) {
      seenFarmers.add(fId);
      featured.push(p);
      if (featured.length === 3) break;
    }
  }

  if (featured.length > 0) {
    sections.push({
      id: 'featured-today',
      type: 'featureRow',
      title: 'Featured today',
      subtitle: 'Three things worth walking over for.',
      seeAll: { path: '/products', query: { sort: 'featured' } },
      items: featured.map(toProductCard),
    });
  }

  // 2. Recently bought (productRow, from caller's completed orders)
  const recentOrders = await db
    .collection(COLLECTIONS.ORDERS)
    .aggregate([
      { $match: { customerId: toObjectId(user.id), status: 'completed' } },
      { $sort: { completedAt: -1 } },
      { $limit: 10 },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.productId',
          lastBoughtAt: { $first: '$completedAt' },
        },
      },
      { $sort: { lastBoughtAt: -1 } },
      { $limit: 12 },
    ])
    .toArray();

  if (recentOrders.length > 0) {
    const recentIds = recentOrders.map((r) => r._id);
    const boughtProducts = await db
      .collection(COLLECTIONS.PRODUCTS)
      .find({ _id: { $in: recentIds }, listed: true })
      .toArray();

    const orderTimeMap = new Map(
      recentOrders.map((r) => [r._id.toString(), r.lastBoughtAt])
    );

    const orderedBought = boughtProducts
      .map((p) => {
        const card = toProductCard(p);
        const lastBoughtAt = orderTimeMap.get(p._id.toString());
        if (lastBoughtAt) {
          card.lastBoughtAt = lastBoughtAt.toISOString();
        }
        return card;
      })
      .sort((a, b) => new Date(b.lastBoughtAt) - new Date(a.lastBoughtAt));

    if (orderedBought.length > 0) {
      sections.push({
        id: 'recently-bought',
        type: 'productRow',
        title: 'Buy Again',
        subtitle: 'Reorder fresh items from your previous orders',
        seeAll: { path: '/orders', query: { tab: 'past' } },
        items: orderedBought,
      });
    }
  }

  // 3. Because you liked this farmer (from favorites or frequent order affinity)
  let likedFarmerId = null;
  const favFarmer = await db
    .collection(COLLECTIONS.FAVORITES)
    .findOne({ userId: toObjectId(user.id), targetType: 'farmer' });

  if (favFarmer) {
    likedFarmerId = favFarmer.targetId;
  } else {
    const frequentFarmerOrder = await db
      .collection(COLLECTIONS.ORDERS)
      .aggregate([
        { $match: { customerId: toObjectId(user.id), status: { $in: ['completed', 'ready', 'accepted'] } } },
        { $group: { _id: '$farmerId', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 1 },
      ])
      .toArray();
    if (frequentFarmerOrder.length > 0) {
      likedFarmerId = frequentFarmerOrder[0]._id;
    }
  }

  if (likedFarmerId) {
    const likedFarmer = await db
      .collection(COLLECTIONS.FARMERS)
      .findOne({ _id: likedFarmerId, listingEnabled: true });

    if (likedFarmer) {
      const favProds = await db
        .collection(COLLECTIONS.PRODUCTS)
        .find({
          farmerId: likedFarmer._id,
          listed: true,
          availability: { $in: ['in', 'low'] },
        })
        .limit(8)
        .toArray();

      if (favProds.length >= 3) {
        sections.push({
          id: 'from-favorite',
          type: 'productRow',
          title: `Because you liked ${likedFarmer.stallName}`,
          subtitle: likedFarmer.specialty
            ? `${likedFarmer.specialty} freshly picked for your basket`
            : 'Fresh produce directly from the stall',
          seeAll: { path: `/stalls/${likedFarmer._id}` },
          items: favProds.map(toProductCard),
        });
      }
    }
  }

  // 4. Fresh from your favorite market (from favorites or preferred homeMarketId)
  let favoriteMarketId = null;
  const favMarket = await db
    .collection(COLLECTIONS.FAVORITES)
    .findOne({ userId: toObjectId(user.id), targetType: 'market' });

  if (favMarket) {
    favoriteMarketId = favMarket.targetId;
  } else {
    const userDoc = await db.collection(COLLECTIONS.USERS).findOne({ _id: toObjectId(user.id) });
    if (userDoc?.homeMarketId) {
      favoriteMarketId = toObjectId(userDoc.homeMarketId);
    }
  }

  if (favoriteMarketId) {
    const marketDoc = allMarkets.find((m) => m._id.toString() === favoriteMarketId.toString());
    if (marketDoc) {
      const marketProds = await db
        .collection(COLLECTIONS.PRODUCTS)
        .find({
          marketIds: marketDoc._id,
          listed: true,
          availability: { $in: ['in', 'low'] },
        })
        .sort({ salesCount: -1, featuredScore: -1 })
        .limit(10)
        .toArray();

      if (marketProds.length >= 3) {
        sections.push({
          id: 'favorite-market-fresh',
          type: 'productRow',
          title: `Fresh from ${marketDoc.name}`,
          subtitle: `Seasonal harvest available at ${marketDoc.name}`,
          seeAll: { path: '/products', query: { market: marketDoc._id.toString() } },
          items: marketProds.map(toProductCard),
        });
      }
    }
  }

  // 5. Available this weekend (farmers operating on sat or sun)
  const slotMap = await getNextSlotsForAllFarmers();
  const weekendFarmers = await db
    .collection(COLLECTIONS.FARMERS)
    .find({ operatingDays: { $in: ['sat', 'sun'] }, listingEnabled: true }, { projection: { _id: 1 } })
    .toArray();

  if (weekendFarmers.length > 0) {
    const weekendFarmerIds = weekendFarmers.map((f) => f._id);
    const weekendProds = await db
      .collection(COLLECTIONS.PRODUCTS)
      .find({
        farmerId: { $in: weekendFarmerIds },
        listed: true,
        availability: { $in: ['in', 'low'] },
      })
      .sort({ salesCount: -1, featuredScore: -1 })
      .limit(10)
      .toArray();

    if (weekendProds.length >= 3) {
      const weekendCards = weekendProds.map((p) => {
        const card = toProductCard(p);
        const slot = slotMap.get(p.farmerId.toString());
        if (slot && slot.cutoffAt) {
          card.cutoffAt = typeof slot.cutoffAt === 'string' ? slot.cutoffAt : slot.cutoffAt.toISOString();
        }
        return card;
      });

      sections.push({
        id: 'available-this-weekend',
        type: 'productRow',
        title: 'Available this weekend',
        subtitle: 'Pre-order before cutoff for Saturday & Sunday collection',
        seeAll: { path: '/products', query: { day: 'sat' } },
        items: weekendCards,
      });
    }
  }

  // 6. Top-selling Farmers (farmerRow)
  const topFarmers = await db
    .collection(COLLECTIONS.FARMERS)
    .find({ listingEnabled: true, isTopSeller: true })
    .sort({ salesCount: -1, _id: 1 })
    .limit(10)
    .toArray();

  if (topFarmers.length > 0) {
    sections.push({
      id: 'top-farmers',
      type: 'farmerRow',
      title: 'Top-selling Farmers',
      items: topFarmers.map((f) => toFarmerCard(f, allMarkets)),
    });
  }

  // 7. Order soon (productRow, cutoff <= 24h away)
  const soonFarmerIds = [];
  const nowMs = now.getTime();

  for (const [farmerIdStr, slot] of slotMap.entries()) {
    if (slot && slot.isOpen && slot.cutoffAt) {
      const slotCutoffMs = new Date(slot.cutoffAt).getTime();
      const diffMs = slotCutoffMs - nowMs;
      if (diffMs > 0 && diffMs <= 24 * 60 * 60 * 1000) {
        soonFarmerIds.push(toObjectId(farmerIdStr));
      }
    }
  }

  if (soonFarmerIds.length > 0) {
    const soonProds = await db
      .collection(COLLECTIONS.PRODUCTS)
      .find({
        farmerId: { $in: soonFarmerIds },
        listed: true,
        availability: { $in: ['in', 'low'] },
      })
      .sort({ salesCount: -1 })
      .limit(10)
      .toArray();

    if (soonProds.length > 0) {
      const soonCards = soonProds.map((p) => {
        const card = toProductCard(p);
        const slot = slotMap.get(p.farmerId.toString());
        if (slot && slot.cutoffAt) {
          card.cutoffAt = typeof slot.cutoffAt === 'string' ? slot.cutoffAt : slot.cutoffAt.toISOString();
        }
        return card;
      });

      sections.push({
        id: 'order-soon',
        type: 'productRow',
        title: 'Order soon',
        items: soonCards,
      });
    }
  }

  // 8. New this week (productRow)
  const weekAgo = new Date(nowMs - 7 * 86400000);
  const newProds = await db
    .collection(COLLECTIONS.PRODUCTS)
    .find({
      listed: true,
      availability: { $in: ['in', 'low'] },
      createdAt: { $gte: weekAgo },
    })
    .sort({ createdAt: -1 })
    .limit(10)
    .toArray();

  if (newProds.length >= 3) {
    sections.push({
      id: 'new-this-week',
      type: 'productRow',
      title: 'New this week',
      items: newProds.map(toProductCard),
    });
  }

  return sections;
}

/**
 * Loads user profile context (top category, home market, favourites).
 */
async function getUserProfile(db, user) {
  const userObjId = toObjectId(user.id);
  const userDoc = await db.collection(COLLECTIONS.USERS).findOne({ _id: userObjId });

  // Top category from last 5 completed orders
  const topCatAgg = await db
    .collection(COLLECTIONS.ORDERS)
    .aggregate([
      { $match: { customerId: userObjId, status: 'completed' } },
      { $sort: { completedAt: -1 } },
      { $limit: 5 },
      { $unwind: '$items' },
      { $group: { _id: '$items.categorySlug', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 1 },
    ])
    .toArray();

  let topCategorySlug = topCatAgg.length > 0 ? topCatAgg[0]._id : null;
  let topCategoryName = null;

  if (!topCategorySlug) {
    const favProducts = await db
      .collection(COLLECTIONS.FAVORITES)
      .find({ userId: userObjId, targetType: 'product' })
      .toArray();

    if (favProducts.length > 0) {
      const favProdIds = favProducts.map((f) => f.targetId);
      const favCatAgg = await db
        .collection(COLLECTIONS.PRODUCTS)
        .aggregate([
          { $match: { _id: { $in: favProdIds } } },
          { $group: { _id: '$categorySlug', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 1 },
        ])
        .toArray();
      if (favCatAgg.length > 0) {
        topCategorySlug = favCatAgg[0]._id;
      }
    }
  }

  if (topCategorySlug) {
    const cat = await db.collection(COLLECTIONS.CATEGORIES).findOne({ slug: topCategorySlug });
    if (cat) topCategoryName = cat.name;
  }

  // Favourite farmer IDs
  const favs = await db
    .collection(COLLECTIONS.FAVORITES)
    .find({ userId: userObjId, targetType: 'farmer' })
    .toArray();

  const favouriteFarmerIds = favs.map((f) => f.targetId.toString());

  return {
    homeMarketId: userDoc?.homeMarketId ? toObjectId(userDoc.homeMarketId) : null,
    topCategorySlug,
    topCategoryName,
    favouriteFarmerIds,
  };
}

/**
 * Retrieves a page/batch of feed sections.
 *
 * @param {object} user - Authenticated user object
 * @param {string|null} [cursorStr=null] - Encoded cursor
 * @param {Date} [now=new Date()] - Injected clock
 * @returns {Promise<{ sections: Array, meta: object }>}
 */
export async function getFeed(user, cursorStr = null, now = new Date()) {
  const db = getDb();
  let batch = 0;
  let seed = 0;

  if (cursorStr) {
    const decoded = decodeCursor(cursorStr, 'feed');
    batch = decoded.k[0];
    seed = decoded.seed;
  } else {
    const dayBucket = getDayBucket(now);
    seed = hash32(`${user.id}:${dayBucket}`);
    batch = 0;
  }

  const allMarkets = await getAllMarkets(db);
  const userProfile = await getUserProfile(db, user);

  let homeMarketName = 'Market';
  if (userProfile.homeMarketId) {
    const m = allMarkets.find((x) => x._id.toString() === userProfile.homeMarketId.toString());
    if (m) homeMarketName = m.name;
  }

  let sections = [];

  if (batch === 0) {
    sections = await buildBatch0(db, user, seed, now);
  } else {
    // Deduplication window: collect IDs used in previous 5 batches
    const exclude = new Set();
    const startBatch = Math.max(1, batch - 5);
    for (let b = startBatch; b < batch; b++) {
      const cacheKey = `${user.id}:${seed}:${b}`;
      const cachedIds = batchHistoryCache.get(cacheKey);
      if (cachedIds) {
        for (const id of cachedIds) exclude.add(id);
      }
    }

    const ctx = {
      db,
      user,
      seed,
      batch,
      exclude,
      userProfile,
      homeMarketName,
      allMarkets,
      now,
    };

    // Rotate through templates starting at (batch * 3) % templates.length
    const offset = (batch * 3) % FEED_TEMPLATES.length;
    let attempts = 0;
    let lastType = null;

    while (sections.length < 3 && attempts < FEED_TEMPLATES.length * 2) {
      const idx = (offset + attempts) % FEED_TEMPLATES.length;
      attempts++;
      const tmpl = FEED_TEMPLATES[idx];

      // Alternating row types when possible
      if (sections.length > 0 && tmpl.type === lastType && attempts <= FEED_TEMPLATES.length) {
        continue;
      }

      const built = await tmpl.build(ctx);
      if (built && built.items && built.items.length >= 3) {
        const title = typeof tmpl.title === 'function' ? tmpl.title(ctx) : tmpl.title;
        sections.push({
          id: tmpl.id,
          type: tmpl.type,
          title,
          seeAll: built.seeAll,
          items: built.items,
        });
        lastType = tmpl.type;

        // Record returned IDs in exclude for intra-batch and cross-batch dedupe
        for (const item of built.items) {
          if (item.id) ctx.exclude.add(item.id);
        }
      }
    }

    // If fewer than 3 sections could be filled due to strict cross-batch exclusions,
    // run a fallback pass keeping only intra-batch exclusions so every batch has 3 sections.
    if (sections.length < 3) {
      const intraBatchExclude = new Set();
      for (const s of sections) {
        for (const item of s.items) {
          if (item.id) intraBatchExclude.add(item.id);
        }
      }
      ctx.exclude = intraBatchExclude;
      let fallbackAttempts = 0;
      while (sections.length < 3 && fallbackAttempts < FEED_TEMPLATES.length) {
        const idx = (offset + fallbackAttempts) % FEED_TEMPLATES.length;
        fallbackAttempts++;
        const tmpl = FEED_TEMPLATES[idx];
        if (sections.some((s) => s.id === tmpl.id)) continue;
        const built = await tmpl.build(ctx);
        if (built && built.items && built.items.length >= 3) {
          const title = typeof tmpl.title === 'function' ? tmpl.title(ctx) : tmpl.title;
          sections.push({
            id: tmpl.id,
            type: tmpl.type,
            title,
            seeAll: built.seeAll,
            items: built.items,
          });
          for (const item of built.items) {
            if (item.id) ctx.exclude.add(item.id);
          }
        }
      }
    }

    // Cache the IDs produced by this batch
    const thisBatchIds = new Set();
    for (const s of sections) {
      for (const item of s.items) {
        if (item.id) thisBatchIds.add(item.id);
      }
    }
    batchHistoryCache.set(`${user.id}:${seed}:${batch}`, thisBatchIds);
  }

  // Next cursor increments batch
  const nextCursor = encodeCursor(
    { v: 1, s: 'feed', k: [batch + 1], seed },
    'feed'
  );

  return {
    sections,
    meta: {
      nextCursor,
      batch,
      hasMore: true,
    },
  };
}

/**
 * Returns header metadata for /feed/meta: greetingName, homeMarket, nextOpening, nextCutoffAt, line.
 *
 * @param {object} user
 * @param {Date} [now=new Date()]
 */
export async function getFeedMeta(user, now = new Date()) {
  const db = getDb();
  const allMarkets = await getAllMarkets(db);
  const userDoc = await db.collection(COLLECTIONS.USERS).findOne({ _id: toObjectId(user.id) });

  let homeMarket = null;
  const marketId = userDoc?.homeMarketId || user.homeMarketId;
  if (marketId) {
    homeMarket = allMarkets.find((m) => m._id.toString() === marketId.toString());
  }
  if (!homeMarket && allMarkets.length > 0) {
    homeMarket = allMarkets.find((m) => m.status === 'active') || allMarkets[0];
  }

  const greetingName = userDoc?.name ? userDoc.name.split(' ')[0] : (user.name ? user.name.split(' ')[0] : 'Friend');

  if (!homeMarket) {
    return {
      greetingName,
      homeMarket: null,
      clock: computeMarketClock(null, now),
      nextOpening: null,
      nextCutoffAt: null,
      line: 'Welcome to MarketLink!',
    };
  }

  const tz = homeMarket.timezone || 'America/New_York';
  const marketCard = toMarketCard(homeMarket, { now });
  const clock = computeMarketClock(homeMarket, now);

  // Compute next opening from market schedule
  let nextOpening = null;
  let nextCutoffAt = null;
  let line = `Welcome to ${homeMarket.name}!`;

  if (homeMarket.schedule && homeMarket.schedule.length > 0) {
    const dayMap = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 };
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    // Find next upcoming schedule day within next 14 days
    for (let d = 0; d < 14; d++) {
      const probeMs = now.getTime() + d * 86400000;
      const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: tz,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        weekday: 'short',
      }).formatToParts(new Date(probeMs));

      const getPart = (type) => parts.find((p) => p.type === type)?.value;
      const weekdayShort = getPart('weekday').toLowerCase().slice(0, 3);
      const sched = homeMarket.schedule.find((s) => s.day === weekdayShort);

      if (sched) {
        const year = Number(getPart('year'));
        const month = Number(getPart('month'));
        const day = Number(getPart('day'));

        const start = zonedTimeToUtc({ year, month, day, minutes: sched.openMin }, tz);
        const end = zonedTimeToUtc({ year, month, day, minutes: sched.closeMin }, tz);

        if (end.getTime() > now.getTime()) {
          nextOpening = { start: start.toISOString(), end: end.toISOString() };
          // Cutoff is 14 hours before pickup start (e.g. Friday 6pm for Saturday 8am)
          const cutoff = new Date(start.getTime() - 14 * 60 * 60 * 1000);
          nextCutoffAt = cutoff.toISOString();

          // Build line in market timezone
          const openDayName = new Intl.DateTimeFormat('en-US', { timeZone: tz, weekday: 'long' }).format(start);
          const openHourFmt = new Intl.DateTimeFormat('en-US', { timeZone: tz, hour: 'numeric', minute: 'numeric' }).format(start).toLowerCase().replace(':00', '').replace(' ', '');
          const cutoffDayName = new Intl.DateTimeFormat('en-US', { timeZone: tz, weekday: 'long' }).format(cutoff);
          const cutoffHourFmt = new Intl.DateTimeFormat('en-US', { timeZone: tz, hour: 'numeric', minute: 'numeric' }).format(cutoff).toLowerCase().replace(':00', '').replace(' ', '');

          line = `${homeMarket.name} opens ${openDayName} at ${openHourFmt}. Order by ${cutoffDayName}, ${cutoffHourFmt}.`;
          break;
        }
      }
    }
  }

  return {
    greetingName,
    homeMarket: marketCard,
    clock,
    nextOpening,
    nextCutoffAt,
    line,
  };
}
