/**
 * Denormalisation synchronization engine.
 * Implements the authoritative Stage 4 sync matrix (D3).
 * Ensures consistency across product snapshots, listing status, market farmerCounts,
 * category slugs, review ratings, and sales counts.
 */

import { getDb } from '../db/client.js';
import { COLLECTIONS } from '../db/collections.js';
import { toObjectId } from './ids.js';
import { revokeAllUserSessions } from '../modules/auth/auth.service.js';

/**
 * 1. Farmer approved or reinstated.
 * Sets farmer.listingEnabled = true, updates products.listed = true (respecting moderation/archived/hidden),
 * increments farmerCount on attended markets, and synchronizes categorySlugs.
 *
 * @param {string|import('mongodb').ObjectId} farmerId
 * @param {object} [options]
 * @returns {Promise<{ productsListedCount: number, marketsUpdatedCount: number }>}
 */
export async function syncFarmerApproval(farmerId, { wasListingEnabled, db: dbInstance } = {}) {
  const db = dbInstance || getDb();
  const fid = toObjectId(farmerId);

  const farmer = await db.collection(COLLECTIONS.FARMERS).findOne({ _id: fid });
  if (!farmer) return { productsListedCount: 0, marketsUpdatedCount: 0 };

  const wasListing = wasListingEnabled !== undefined ? wasListingEnabled : Boolean(farmer.listingEnabled);

  // Set listingEnabled = true on farmer
  await db.collection(COLLECTIONS.FARMERS).updateOne(
    { _id: fid },
    { $set: { listingEnabled: true, updatedAt: new Date() } }
  );

  // Update products listed state:
  // listed = true when !moderation.removed, !archived, and availability !== 'hidden'
  const prodRes = await db.collection(COLLECTIONS.PRODUCTS).updateMany(
    {
      farmerId: fid,
      'moderation.removed': { $ne: true },
      archived: { $ne: true },
      availability: { $ne: 'hidden' },
    },
    { $set: { listed: true, updatedAt: new Date() } }
  );

  let marketsUpdatedCount = 0;
  // If transitioning from not-listed to listed, increment farmerCount on their active markets
  if (!wasListing && Array.isArray(farmer.marketIds) && farmer.marketIds.length > 0) {
    const marketOps = farmer.marketIds.map((mId) => ({
      updateOne: {
        filter: { _id: toObjectId(mId) },
        update: { $inc: { farmerCount: 1 } },
      },
    }));
    const bulkRes = await db.collection(COLLECTIONS.MARKETS).bulkWrite(marketOps);
    marketsUpdatedCount = bulkRes.modifiedCount;
  }

  // Sync category slugs
  await syncFarmerCategorySlugs(fid, { db });

  return {
    productsListedCount: prodRes.modifiedCount,
    marketsUpdatedCount,
  };
}

/**
 * 2. Farmer suspended or rejected.
 * Sets farmer.listingEnabled = false, sets all farmer's products listed = false,
 * decrements farmerCount on attended markets, and revokes all active sessions.
 *
 * @param {string|import('mongodb').ObjectId} farmerId
 * @param {object} [options]
 * @returns {Promise<{ productsDelistedCount: number, marketsUpdatedCount: number }>}
 */
export async function syncFarmerSuspension(farmerId, { wasListingEnabled, db: dbInstance } = {}) {
  const db = dbInstance || getDb();
  const fid = toObjectId(farmerId);

  const farmer = await db.collection(COLLECTIONS.FARMERS).findOne({ _id: fid });
  if (!farmer) return { productsDelistedCount: 0, marketsUpdatedCount: 0 };

  const wasListing = wasListingEnabled !== undefined ? wasListingEnabled : Boolean(farmer.listingEnabled);

  // Set listingEnabled = false on farmer
  await db.collection(COLLECTIONS.FARMERS).updateOne(
    { _id: fid },
    { $set: { listingEnabled: false, updatedAt: new Date() } }
  );

  // Delist all products
  const prodRes = await db.collection(COLLECTIONS.PRODUCTS).updateMany(
    { farmerId: fid },
    { $set: { listed: false, updatedAt: new Date() } }
  );

  let marketsUpdatedCount = 0;
  // If transitioning from listed to not-listed, decrement farmerCount on attended markets
  if (wasListing && Array.isArray(farmer.marketIds) && farmer.marketIds.length > 0) {
    const marketOps = farmer.marketIds.map((mId) => ({
      updateOne: {
        filter: { _id: toObjectId(mId) },
        update: { $inc: { farmerCount: -1 } },
      },
    }));
    const bulkRes = await db.collection(COLLECTIONS.MARKETS).bulkWrite(marketOps);
    marketsUpdatedCount = bulkRes.modifiedCount;
  }

  // Revoke user sessions
  if (farmer.userId) {
    await revokeAllUserSessions(farmer.userId);
  }

  // Re-sync category slugs
  await syncFarmerCategorySlugs(fid, { db });

  return {
    productsDelistedCount: prodRes.modifiedCount,
    marketsUpdatedCount,
  };
}

/**
 * Convenience wrapper for farmer approval or suspension listing sync.
 *
 * @param {string|import('mongodb').ObjectId} farmerId
 * @param {boolean} isListed
 * @param {object} [options]
 */
export async function syncFarmerListed(farmerId, isListed, { wasListingEnabled, db } = {}) {
  if (isListed) {
    return syncFarmerApproval(farmerId, { wasListingEnabled, db });
  } else {
    return syncFarmerSuspension(farmerId, { wasListingEnabled, db });
  }
}

/**
 * 3. Farmer renames stall or changes stall number.
 * Updates denormalized product snapshots and stallNameLower on farmer.
 *
 * @param {string|import('mongodb').ObjectId} farmerId
 * @param {object} stallInfo - { stallName, stallNumber }
 * @param {object} [options]
 * @returns {Promise<{ productsUpdatedCount: number }>}
 */
export async function syncFarmerStallInfo(farmerId, { stallName, stallNumber }, { db: dbInstance } = {}) {
  const db = dbInstance || getDb();
  const fid = toObjectId(farmerId);

  const farmerUpdate = {};
  const productUpdate = {};

  if (stallName !== undefined) {
    farmerUpdate.stallName = stallName;
    farmerUpdate.stallNameLower = stallName.toLowerCase();
    productUpdate['farmer.stallName'] = stallName;
  }
  if (stallNumber !== undefined) {
    farmerUpdate.stallNumber = stallNumber;
    productUpdate['farmer.stallNumber'] = stallNumber;
  }

  if (Object.keys(farmerUpdate).length > 0) {
    farmerUpdate.updatedAt = new Date();
    await db.collection(COLLECTIONS.FARMERS).updateOne({ _id: fid }, { $set: farmerUpdate });
  }

  let productsUpdatedCount = 0;
  if (Object.keys(productUpdate).length > 0) {
    productUpdate.updatedAt = new Date();
    const res = await db.collection(COLLECTIONS.PRODUCTS).updateMany(
      { farmerId: fid },
      { $set: productUpdate }
    );
    productsUpdatedCount = res.modifiedCount;
  }

  return { productsUpdatedCount };
}

/**
 * 4. Farmer markets change.
 * Updates marketIds on products, calculates added/removed sets, and updates markets.farmerCount.
 *
 * @param {string|import('mongodb').ObjectId} farmerId
 * @param {Array<string|import('mongodb').ObjectId>} newMarketIds
 * @param {Array<string|import('mongodb').ObjectId>} [oldMarketIds]
 * @param {object} [options]
 * @returns {Promise<{ productsUpdatedCount: number, marketsUpdatedCount: number }>}
 */
export async function syncFarmerMarkets(farmerId, newMarketIds, oldMarketIds = [], { db: dbInstance } = {}) {
  const db = dbInstance || getDb();
  const fid = toObjectId(farmerId);

  const farmer = await db.collection(COLLECTIONS.FARMERS).findOne({ _id: fid });
  const isListed = farmer?.listingEnabled ?? false;
  const currentOldMarketIds = oldMarketIds.length > 0 ? oldMarketIds : (farmer?.marketIds || []);

  const oldStrs = new Set(currentOldMarketIds.map((id) => id.toString()));
  const newStrs = new Set((newMarketIds || []).map((id) => id.toString()));

  const added = [...newStrs].filter((id) => !oldStrs.has(id)).map((id) => toObjectId(id));
  const removed = [...oldStrs].filter((id) => !newStrs.has(id)).map((id) => toObjectId(id));

  const cleanNewMarketIds = (newMarketIds || []).map((id) => toObjectId(id));

  // Update marketIds on all products belonging to this farmer
  const prodRes = await db.collection(COLLECTIONS.PRODUCTS).updateMany(
    { farmerId: fid },
    { $set: { marketIds: cleanNewMarketIds, updatedAt: new Date() } }
  );

  let marketsUpdatedCount = 0;
  if (isListed && (added.length > 0 || removed.length > 0)) {
    const marketOps = [];
    for (const mId of added) {
      marketOps.push({
        updateOne: {
          filter: { _id: mId },
          update: { $inc: { farmerCount: 1 } },
        },
      });
    }
    for (const mId of removed) {
      marketOps.push({
        updateOne: {
          filter: { _id: mId },
          update: { $inc: { farmerCount: -1 } },
        },
      });
    }

    if (marketOps.length > 0) {
      const bulkRes = await db.collection(COLLECTIONS.MARKETS).bulkWrite(marketOps);
      marketsUpdatedCount = bulkRes.modifiedCount;
    }
  }

  return {
    productsUpdatedCount: prodRes.modifiedCount,
    marketsUpdatedCount,
  };
}

/**
 * 5. Synchronizes farmer.categorySlugs.
 * Computes distinct categorySlug of the farmer's LISTED products and updates farmer doc.
 *
 * @param {string|import('mongodb').ObjectId} farmerId
 * @param {object} [options]
 * @returns {Promise<Array<string>>}
 */
export async function syncFarmerCategorySlugs(farmerId, { db: dbInstance } = {}) {
  const db = dbInstance || getDb();
  const fid = toObjectId(farmerId);

  const distinctSlugs = await db
    .collection(COLLECTIONS.PRODUCTS)
    .distinct('categorySlug', {
      farmerId: fid,
      listed: true,
      categorySlug: { $exists: true, $ne: '' },
    });

  const sortedSlugs = (distinctSlugs || []).sort();

  await db.collection(COLLECTIONS.FARMERS).updateOne(
    { _id: fid },
    { $set: { categorySlugs: sortedSlugs, updatedAt: new Date() } }
  );

  return sortedSlugs;
}

/**
 * 6. Product availability, quantity, or listed state changed.
 * Evaluates listed = (farmer.listingEnabled && !moderation.removed && !archived && availability !== 'hidden')
 * and recomputes availability if quantity changed.
 *
 * @param {string|import('mongodb').ObjectId} productId
 * @param {object} [options]
 * @returns {Promise<object>} - Updated product doc
 */
export async function syncProductListing(productId, { db: dbInstance } = {}) {
  const db = dbInstance || getDb();
  const pid = toObjectId(productId);

  const product = await db.collection(COLLECTIONS.PRODUCTS).findOne({ _id: pid });
  if (!product) return null;

  const farmer = await db.collection(COLLECTIONS.FARMERS).findOne({ _id: product.farmerId });
  const isFarmerListed = farmer ? Boolean(farmer.listingEnabled) : false;

  const isRemoved = Boolean(product.moderation?.removed);
  const isArchived = Boolean(product.archived);
  const isHidden = product.availability === 'hidden';

  const shouldBeListed = isFarmerListed && !isRemoved && !isArchived && !isHidden;
  const previousListed = Boolean(product.listed);

  if (shouldBeListed !== previousListed) {
    await db.collection(COLLECTIONS.PRODUCTS).updateOne(
      { _id: pid },
      { $set: { listed: shouldBeListed, updatedAt: new Date() } }
    );
    await syncFarmerCategorySlugs(product.farmerId, { db });
  }

  return db.collection(COLLECTIONS.PRODUCTS).findOne({ _id: pid });
}

/**
 * 7. Category renamed.
 * Updates denormalized categorySlug on all products in this category and recomputes farmer categorySlugs.
 *
 * @param {string|import('mongodb').ObjectId} categoryId
 * @param {string} newSlug
 * @param {object} [options]
 * @returns {Promise<{ productsUpdatedCount: number, farmersUpdatedCount: number }>}
 */
export async function syncCategoryRename(categoryId, newSlug, { db: dbInstance } = {}) {
  const db = dbInstance || getDb();
  const cid = toObjectId(categoryId);

  // Find all affected farmers
  const affectedFarmers = await db
    .collection(COLLECTIONS.PRODUCTS)
    .distinct('farmerId', { categoryId: cid });

  // Update products
  const prodRes = await db.collection(COLLECTIONS.PRODUCTS).updateMany(
    { categoryId: cid },
    { $set: { categorySlug: newSlug, updatedAt: new Date() } }
  );

  // Sync categorySlugs for all affected farmers
  for (const fId of affectedFarmers) {
    await syncFarmerCategorySlugs(fId, { db });
  }

  return {
    productsUpdatedCount: prodRes.modifiedCount,
    farmersUpdatedCount: affectedFarmers.length,
  };
}

/**
 * 9. Market removed.
 * Pulls marketId from farmers and products, sets market farmerCount = 0.
 *
 * @param {string|import('mongodb').ObjectId} marketId
 * @param {object} [options]
 * @returns {Promise<{ farmersModifiedCount: number, productsModifiedCount: number }>}
 */
export async function syncMarketRemoved(marketId, { db: dbInstance } = {}) {
  const db = dbInstance || getDb();
  const mid = toObjectId(marketId);

  const farmerRes = await db.collection(COLLECTIONS.FARMERS).updateMany(
    { marketIds: mid },
    { $pull: { marketIds: mid }, $set: { updatedAt: new Date() } }
  );

  const prodRes = await db.collection(COLLECTIONS.PRODUCTS).updateMany(
    { marketIds: mid },
    { $pull: { marketIds: mid }, $set: { updatedAt: new Date() } }
  );

  await db.collection(COLLECTIONS.MARKETS).updateOne(
    { _id: mid },
    { $set: { farmerCount: 0, status: 'removed', updatedAt: new Date() } }
  );

  return {
    farmersModifiedCount: farmerRes.modifiedCount,
    productsModifiedCount: prodRes.modifiedCount,
  };
}

/**
 * 10. Review rating recalculation.
 * Atomically computes sum, count, and average from visible reviews and stores them on the target.
 *
 * @param {'farmer'|'product'} targetType
 * @param {string|import('mongodb').ObjectId} targetId
 * @param {object} [options]
 * @returns {Promise<{ ratingAvg: number, ratingCount: number, ratingSum: number }>}
 */
export async function syncReviewRating(targetType, targetId, { db: dbInstance } = {}) {
  const db = dbInstance || getDb();
  const tid = toObjectId(targetId);

  const filter =
    targetType === 'farmer'
      ? { farmerId: tid, targetType: 'farmer', status: 'visible' }
      : { productId: tid, targetType: 'product', status: 'visible' };

  const agg = await db
    .collection(COLLECTIONS.REVIEWS)
    .aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          sum: { $sum: '$rating' },
        },
      },
    ])
    .toArray();

  const count = agg[0]?.count || 0;
  const sum = agg[0]?.sum || 0;
  const avg = count > 0 ? Math.round((sum / count) * 10) / 10 : 0;

  const targetColl = targetType === 'farmer' ? COLLECTIONS.FARMERS : COLLECTIONS.PRODUCTS;
  await db.collection(targetColl).updateOne(
    { _id: tid },
    {
      $set: {
        ratingAvg: avg,
        ratingCount: count,
        ratingSum: sum,
        updatedAt: new Date(),
      },
    }
  );

  return { ratingAvg: avg, ratingCount: count, ratingSum: sum };
}
