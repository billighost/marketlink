/**
 * Admin Moderation service layer.
 * Moderates listing flags and review reports with batch target pre-fetching (zero N+1 queries),
 * dismiss/remove resolution, and atomic rating aggregate reversal.
 */

import { ObjectId } from 'mongodb';
import { getDb } from '../../../db/client.js';
import { COLLECTIONS } from '../../../db/collections.js';
import { toObjectId } from '../../../utils/ids.js';
import { AppError } from '../../../utils/errors.js';
import { syncFarmerCategorySlugs, syncReviewRating } from '../../../utils/sync.js';
import { writeAudit } from '../../../utils/audit.js';

/**
 * Lists moderation flags with batch-loaded target previews to prevent N+1 queries.
 *
 * @param {object} [query={}]
 * @returns {Promise<{ data: Array<object>, meta: object }>}
 */
export async function listModerationFlags(query = {}) {
  const db = getDb();
  const filter = {};

  if (query.status) {
    filter.status = query.status;
  }

  if (query.targetType) {
    filter.targetType = query.targetType;
  }

  const limit = Math.min(100, Math.max(1, parseInt(query.limit || 20, 10)));

  const [flags, countAgg] = await Promise.all([
    db
      .collection(COLLECTIONS.MODERATION_FLAGS)
      .find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit)
      .toArray(),
    db
      .collection(COLLECTIONS.MODERATION_FLAGS)
      .aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }])
      .toArray(),
  ]);

  const counts = { open: 0, resolved: 0, removed: 0 };
  for (const c of countAgg) {
    if (c._id in counts) counts[c._id] = c.count;
  }

  // Pre-load listings and reviews in exactly 2 batch queries
  const listingIds = flags
    .filter((f) => f.targetType === 'listing')
    .map((f) => toObjectId(f.targetId));

  const reviewIds = flags
    .filter((f) => f.targetType === 'review')
    .map((f) => toObjectId(f.targetId));

  const [listings, reviews] = await Promise.all([
    listingIds.length > 0
      ? db
          .collection(COLLECTIONS.PRODUCTS)
          .find({ _id: { $in: listingIds } })
          .toArray()
      : [],
    reviewIds.length > 0
      ? db
          .collection(COLLECTIONS.REVIEWS)
          .find({ _id: { $in: reviewIds } })
          .toArray()
      : [],
  ]);

  const listingMap = new Map(listings.map((p) => [p._id.toString(), p]));
  const reviewMap = new Map(reviews.map((r) => [r._id.toString(), r]));

  const data = flags.map((f) => {
    let preview = null;
    const tid = f.targetId.toString();

    if (f.targetType === 'listing') {
      const prod = listingMap.get(tid);
      if (prod) {
        preview = {
          id: prod._id.toString(),
          name: prod.name,
          priceCents: prod.priceCents,
          farmerName: prod.farmer?.stallName || '',
          imageUrl: prod.imageUrl ?? null,
          art: prod.art,
          listed: prod.listed,
        };
      }
    } else if (f.targetType === 'review') {
      const rev = reviewMap.get(tid);
      if (rev) {
        preview = {
          id: rev._id.toString(),
          rating: rev.rating,
          comment: rev.comment,
          customerName: rev.customerName,
          status: rev.status,
        };
      }
    }

    return {
      id: f._id.toString(),
      targetType: f.targetType,
      targetId: f.targetId.toString(),
      reason: f.reason,
      status: f.status,
      reporterId: f.reporterId ? f.reporterId.toString() : null,
      note: f.note || null,
      preview,
      createdAt: f.createdAt instanceof Date ? f.createdAt.toISOString() : f.createdAt,
    };
  });

  return {
    data,
    meta: {
      nextCursor: null,
      counts,
    },
  };
}

/**
 * Removes a product directly by administrator.
 *
 * @param {object} adminActor
 * @param {string|ObjectId} productId
 * @param {string} [note]
 * @returns {Promise<object>}
 */
export async function removeProductByAdmin(adminActor, productId, note) {
  if (!productId || !ObjectId.isValid(productId)) {
    throw AppError.notFound('Product not found');
  }

  const db = getDb();
  const pid = toObjectId(productId);

  const product = await db.collection(COLLECTIONS.PRODUCTS).findOne({ _id: pid });
  if (!product) {
    throw AppError.notFound('Product not found');
  }

  const now = new Date();
  await db.collection(COLLECTIONS.PRODUCTS).updateOne(
    { _id: pid },
    {
      $set: {
        'moderation.removed': true,
        listed: false,
        updatedAt: now,
      },
    }
  );

  await syncFarmerCategorySlugs(product.farmerId, db);

  await writeAudit(
    adminActor,
    'product.remove',
    { type: 'product', id: pid },
    { name: product.name, note }
  );

  return { id: pid.toString(), status: 'removed' };
}

/**
 * Removes a review directly by administrator and reverses rating aggregates.
 *
 * @param {object} adminActor
 * @param {string|ObjectId} reviewId
 * @param {string} [note]
 * @returns {Promise<object>}
 */
export async function removeReviewByAdmin(adminActor, reviewId, note) {
  if (!reviewId || !ObjectId.isValid(reviewId)) {
    throw AppError.notFound('Review not found');
  }

  const db = getDb();
  const rid = toObjectId(reviewId);

  const review = await db.collection(COLLECTIONS.REVIEWS).findOne({ _id: rid });
  if (!review) {
    throw AppError.notFound('Review not found');
  }

  const now = new Date();
  await db.collection(COLLECTIONS.REVIEWS).updateOne(
    { _id: rid },
    { $set: { status: 'removed', updatedAt: now } }
  );

  // Atomic rating reversal on target
  const targetId = review.targetType === 'farmer' ? review.farmerId : review.productId;
  await syncReviewRating(review.targetType, targetId, { db });

  await writeAudit(
    adminActor,
    'review.remove',
    { type: 'review', id: rid },
    { targetType: review.targetType, targetId, note }
  );

  return { id: rid.toString(), status: 'removed' };
}

/**
 * Resolves a moderation flag (dismiss or remove).
 *
 * @param {object} adminActor
 * @param {string|ObjectId} flagId
 * @param {object} param2
 * @param {'dismiss'|'remove'} param2.action
 * @param {string} [param2.note]
 * @returns {Promise<object>}
 */
export async function resolveModerationFlag(adminActor, flagId, { action, note }) {
  if (!flagId || !ObjectId.isValid(flagId)) {
    throw AppError.notFound('Moderation flag not found');
  }

  if (!action || !['dismiss', 'remove'].includes(action)) {
    throw AppError.validation("Action must be either 'dismiss' or 'remove'", { field: 'action' });
  }

  const db = getDb();
  const fid = toObjectId(flagId);

  const flag = await db.collection(COLLECTIONS.MODERATION_FLAGS).findOne({ _id: fid });
  if (!flag) {
    throw AppError.notFound('Moderation flag not found');
  }

  const now = new Date();
  const nextStatus = action === 'dismiss' ? 'resolved' : 'removed';

  await db.collection(COLLECTIONS.MODERATION_FLAGS).updateOne(
    { _id: fid },
    {
      $set: {
        status: nextStatus,
        note: note ? note.trim() : null,
        resolvedBy: toObjectId(adminActor.id),
        resolvedAt: now,
        updatedAt: now,
      },
    }
  );

  if (action === 'remove') {
    if (flag.targetType === 'listing') {
      await removeProductByAdmin(adminActor, flag.targetId, note);
    } else if (flag.targetType === 'review') {
      await removeReviewByAdmin(adminActor, flag.targetId, note);
    }
  }

  await writeAudit(
    adminActor,
    'moderation.resolve',
    { type: 'moderationFlag', id: fid },
    { action, note, targetType: flag.targetType, targetId: flag.targetId }
  );

  return { id: fid.toString(), status: nextStatus };
}
