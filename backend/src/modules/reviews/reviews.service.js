/**
 * Reviews module service layer.
 * Enforces verified-purchase constraints (completed orders only), author isolation,
 * 14-day edit windows, atomic pipeline aggregate maintenance, and moderation flagging.
 */

import { ObjectId } from 'mongodb';
import { getDb } from '../../db/client.js';
import { COLLECTIONS } from '../../db/collections.js';
import { toObjectId } from '../../utils/ids.js';
import { AppError } from '../../utils/errors.js';
import { toReviewItem } from '../../utils/shapes.js';

/**
 * Creates reviews for a completed order (one review per target per order).
 *
 * @param {string|ObjectId} orderId
 * @param {string|ObjectId} customerId
 * @param {object} payload - { farmer?: { rating, comment }, products?: Array<{ productId, rating, comment }> }
 * @param {object} [options]
 * @param {Date} [options.now=new Date()]
 * @returns {Promise<Array<object>>}
 */
export async function createOrderReviews(orderId, customerId, payload, { now = new Date() } = {}) {
  const db = getDb();
  const oid = toObjectId(orderId);
  const cid = toObjectId(customerId);

  // 1. Load order with customer ownership
  const order = await db.collection(COLLECTIONS.ORDERS).findOne({ _id: oid, customerId: cid });
  if (!order) {
    throw AppError.notFound('Order not found.');
  }

  // Must be completed
  if (order.status !== 'completed') {
    throw AppError.conflict(
      'Reviews can only be submitted for completed orders.',
      'ORDER_NOT_COMPLETED'
    );
  }

  const orderProductIds = new Set(order.items.map((it) => it.productId.toString()));
  const createdReviews = [];
  const insertedReviewDocs = [];

  // 2. Prepare reviews to create
  const itemsToCreate = [];

  if (payload.farmer) {
    itemsToCreate.push({
      targetType: 'farmer',
      targetId: order.farmerId,
      productId: null,
      rating: payload.farmer.rating,
      comment: payload.farmer.comment ? payload.farmer.comment.trim() : null,
      targetName: order.farmerName,
    });
  }

  if (Array.isArray(payload.products)) {
    for (const pRev of payload.products) {
      const pidStr = pRev.productId.toString();
      if (!orderProductIds.has(pidStr)) {
        throw AppError.unprocessable([
          { field: 'products', message: `Product ${pidStr} was not part of this order.` },
        ]);
      }

      const orderItem = order.items.find((it) => it.productId.toString() === pidStr);
      itemsToCreate.push({
        targetType: 'product',
        targetId: toObjectId(pRev.productId),
        productId: toObjectId(pRev.productId),
        rating: pRev.rating,
        comment: pRev.comment ? pRev.comment.trim() : null,
        targetName: orderItem ? orderItem.name : '',
      });
    }
  }

  if (itemsToCreate.length === 0) {
    throw AppError.unprocessable([
      { field: 'body', message: 'At least one farmer or product review must be provided.' },
    ]);
  }

  // 3. Insert reviews and update aggregates atomically
  for (const item of itemsToCreate) {
    const reviewDoc = {
      _id: new ObjectId(),
      targetType: item.targetType,
      farmerId: order.farmerId,
      productId: item.productId,
      customerId: order.customerId,
      customerName: order.customerName,
      orderId: order._id,
      rating: item.rating,
      comment: item.comment,
      reply: null,
      status: 'visible',
      createdAt: now,
    };

    try {
      await db.collection(COLLECTIONS.REVIEWS).insertOne(reviewDoc);
      insertedReviewDocs.push(reviewDoc);
    } catch (insertErr) {
      if (insertErr.code === 11000) {
        throw AppError.conflict(
          `You have already reviewed this ${item.targetType} for order ${order.orderNumber}.`,
          'ALREADY_REVIEWED'
        );
      }
      throw insertErr;
    }

    // Atomic aggregate update on target
    const targetColl =
      item.targetType === 'farmer' ? COLLECTIONS.FARMERS : COLLECTIONS.PRODUCTS;

    try {
      await db.collection(targetColl).updateOne({ _id: item.targetId }, [
        {
          $set: {
            ratingSum: { $add: [{ $ifNull: ['$ratingSum', 0] }, item.rating] },
            ratingCount: { $add: [{ $ifNull: ['$ratingCount', 0] }, 1] },
          },
        },
        {
          $set: {
            ratingAvg: {
              $round: [{ $divide: ['$ratingSum', '$ratingCount'] }, 1],
            },
          },
        },
      ]);
    } catch (aggErr) {
      // Roll back inserted review on aggregate failure
      await db.collection(COLLECTIONS.REVIEWS).deleteOne({ _id: reviewDoc._id });
      throw AppError.internal('Failed to update review ratings. Please try again.');
    }

    createdReviews.push(toReviewItem(reviewDoc, item.targetName));
  }

  // 4. Mark order reviewed: true
  await db.collection(COLLECTIONS.ORDERS).updateOne({ _id: order._id }, { $set: { reviewed: true } });

  return createdReviews;
}

/**
 * Updates a review authored by the customer within the 14-day window.
 *
 * @param {string|ObjectId} reviewId
 * @param {string|ObjectId} customerId
 * @param {object} updates - { rating?: number, comment?: string }
 * @param {object} [options]
 * @param {Date} [options.now=new Date()]
 * @returns {Promise<object>}
 */
export async function updateReview(reviewId, customerId, updates, { now = new Date() } = {}) {
  const db = getDb();
  const rid = toObjectId(reviewId);
  const cid = toObjectId(customerId);

  const review = await db.collection(COLLECTIONS.REVIEWS).findOne({ _id: rid, customerId: cid });
  if (!review) {
    throw AppError.notFound('Review not found.');
  }

  // 14-day edit window enforcement
  const ageMs = now.getTime() - new Date(review.createdAt).getTime();
  const fourteenDaysMs = 14 * 24 * 60 * 60 * 1000;
  if (ageMs > fourteenDaysMs) {
    throw AppError.conflict(
      'Reviews cannot be edited more than 14 days after submission.',
      'EDIT_WINDOW_EXPIRED'
    );
  }

  const setFields = {};
  let targetDelta = 0;

  if (updates.rating !== undefined && updates.rating !== review.rating) {
    targetDelta = updates.rating - review.rating;
    setFields.rating = updates.rating;
  }

  if (updates.comment !== undefined) {
    setFields.comment = updates.comment ? updates.comment.trim() : null;
  }

  if (targetDelta !== 0) {
    const targetColl =
      review.targetType === 'farmer' ? COLLECTIONS.FARMERS : COLLECTIONS.PRODUCTS;
    const targetId = review.targetType === 'farmer' ? review.farmerId : review.productId;

    await db.collection(targetColl).updateOne({ _id: targetId }, [
      {
        $set: {
          ratingSum: { $add: [{ $ifNull: ['$ratingSum', 0] }, targetDelta] },
        },
      },
      {
        $set: {
          ratingAvg: {
            $round: [{ $divide: ['$ratingSum', '$ratingCount'] }, 1],
          },
        },
      },
    ]);
  }

  if (Object.keys(setFields).length > 0) {
    await db.collection(COLLECTIONS.REVIEWS).updateOne({ _id: rid }, { $set: setFields });
  }

  const fresh = await db.collection(COLLECTIONS.REVIEWS).findOne({ _id: rid });
  return toReviewItem(fresh);
}

/**
 * Deletes a review authored by the customer within the 14-day window.
 *
 * @param {string|ObjectId} reviewId
 * @param {string|ObjectId} customerId
 * @param {object} [options]
 * @param {Date} [options.now=new Date()]
 * @returns {Promise<{ message: string }>}
 */
export async function deleteReview(reviewId, customerId, { now = new Date() } = {}) {
  const db = getDb();
  const rid = toObjectId(reviewId);
  const cid = toObjectId(customerId);

  const review = await db.collection(COLLECTIONS.REVIEWS).findOne({ _id: rid, customerId: cid });
  if (!review) {
    throw AppError.notFound('Review not found.');
  }

  // 14-day edit window
  const ageMs = now.getTime() - new Date(review.createdAt).getTime();
  const fourteenDaysMs = 14 * 24 * 60 * 60 * 1000;
  if (ageMs > fourteenDaysMs) {
    throw AppError.conflict(
      'Reviews cannot be deleted more than 14 days after submission.',
      'EDIT_WINDOW_EXPIRED'
    );
  }

  await db.collection(COLLECTIONS.REVIEWS).deleteOne({ _id: rid });

  // Atomic aggregate decrement on target
  const targetColl =
    review.targetType === 'farmer' ? COLLECTIONS.FARMERS : COLLECTIONS.PRODUCTS;
  const targetId = review.targetType === 'farmer' ? review.farmerId : review.productId;

  await db.collection(targetColl).updateOne({ _id: targetId }, [
    {
      $set: {
        ratingSum: { $subtract: ['$ratingSum', review.rating] },
        ratingCount: { $subtract: ['$ratingCount', 1] },
      },
    },
    {
      $set: {
        ratingAvg: {
          $cond: {
            if: { $lte: ['$ratingCount', 0] },
            then: 0,
            else: { $round: [{ $divide: ['$ratingSum', '$ratingCount'] }, 1] },
          },
        },
      },
    },
  ]);

  return { message: 'Review deleted successfully.' };
}

/**
 * Flags a review for moderation.
 *
 * @param {string|ObjectId} reviewId
 * @param {object} user - Authenticated user { id, role }
 * @param {string} reason - 3..300 chars
 * @param {object} [options]
 * @param {Date} [options.now=new Date()]
 * @returns {Promise<{ message: string }>}
 */
export async function flagReview(reviewId, user, reason, { now = new Date() } = {}) {
  const db = getDb();
  const rid = toObjectId(reviewId);
  const uid = toObjectId(user.id);

  const review = await db.collection(COLLECTIONS.REVIEWS).findOne({ _id: rid, status: 'visible' });
  if (!review) {
    throw AppError.notFound('Review not found.');
  }

  // Check if reporter already has an open flag for this review
  const existing = await db.collection(COLLECTIONS.MODERATION_FLAGS).findOne({
    targetType: 'review',
    targetId: rid,
    reporterId: uid,
    status: 'open',
  });

  if (existing) {
    throw AppError.conflict('You have already flagged this review for moderation.', 'ALREADY_FLAGGED');
  }

  await db.collection(COLLECTIONS.MODERATION_FLAGS).insertOne({
    _id: new ObjectId(),
    targetType: 'review',
    targetId: rid,
    reason: reason.trim(),
    reporterId: uid,
    status: 'open',
    createdAt: now,
  });

  return { message: 'Review flagged for moderation.' };
}
