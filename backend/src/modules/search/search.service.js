/**
 * Search module service layer.
 * Prefix-based suggestions (< 30ms) across products, farmers, and categories.
 * User search history tracking with deduplication and 10-item cap per user.
 */

import { ObjectId } from 'mongodb';
import { getDb } from '../../db/client.js';
import { COLLECTIONS } from '../../db/collections.js';
import { toObjectId } from '../../utils/ids.js';
import { AppError } from '../../utils/errors.js';
import { escapeForPrefix } from '../../utils/query.js';

/**
 * Provides instant search suggestions for query prefixes.
 *
 * @param {string} q - Raw search query string (minimum 2 chars)
 * @returns {Promise<{ products: Array, farmers: Array, categories: Array }>}
 */
export async function getSuggestions(q) {
  const db = getDb();
  const trimmed = q.trim();
  const esc = escapeForPrefix(trimmed.toLowerCase());
  const prefixRegex = new RegExp('^' + esc);

  const [products, farmers, categories] = await Promise.all([
    // Up to 5 product suggestions matching name prefix or word prefix
    db
      .collection(COLLECTIONS.PRODUCTS)
      .find(
        { listed: true, nameLower: new RegExp('(?:^|\\s)' + esc) },
        { projection: { name: 1, art: 1, priceCents: 1, unit: 1 } }
      )
      .limit(5)
      .toArray(),

    // Up to 3 farmer suggestions matching stall name prefix or word prefix
    db
      .collection(COLLECTIONS.FARMERS)
      .find(
        { listingEnabled: true, stallNameLower: new RegExp('(?:^|\\s)' + esc) },
        { projection: { stallName: 1, specialty: 1, art: 1 } }
      )
      .limit(3)
      .toArray(),

    // Up to 3 category suggestions matching slug or name
    db
      .collection(COLLECTIONS.CATEGORIES)
      .find(
        {
          active: true,
          $or: [
            { slug: new RegExp('^' + esc) },
            { name: new RegExp('(?:^|\\s)' + escapeForPrefix(trimmed), 'i') },
          ],
        },
        { projection: { slug: 1, name: 1, art: 1 } }
      )
      .sort({ sortOrder: 1 })
      .limit(3)
      .toArray(),
  ]);

  return {
    products: products.map((p) => ({
      id: p._id.toString(),
      name: p.name,
      art: p.art || null,
      priceCents: p.priceCents,
      unit: p.unit,
    })),
    farmers: farmers.map((f) => ({
      id: f._id.toString(),
      stallName: f.stallName,
      specialty: f.specialty || '',
      art: f.art || 'stall',
    })),
    categories: categories.map((c) => ({
      slug: c.slug,
      name: c.name,
      art: c.art || null,
    })),
  };
}

/**
 * Retrieves the latest 10 search history entries for a user.
 *
 * @param {string} userId
 * @returns {Promise<Array<{ id: string, term: string, at: string }>>}
 */
export async function getSearchHistory(userId) {
  const db = getDb();
  const userObjId = toObjectId(userId);

  const entries = await db
    .collection(COLLECTIONS.SEARCH_HISTORY)
    .find({ userId: userObjId })
    .sort({ at: -1 })
    .limit(10)
    .toArray();

  return entries.map((e) => ({
    id: e._id.toString(),
    term: e.term,
    at: e.at ? e.at.toISOString() : new Date().toISOString(),
  }));
}

/**
 * Records or updates a search term in the user's history, capped at 10 items.
 *
 * @param {string} userId
 * @param {string} term
 * @returns {Promise<{ id: string, term: string, at: string }>>}
 */
export async function recordSearchHistory(userId, term) {
  const db = getDb();
  const userObjId = toObjectId(userId);
  const cleanTerm = term.trim();
  const now = new Date();

  // Deduplicate: upsert term for this user, updating timestamp
  await db.collection(COLLECTIONS.SEARCH_HISTORY).updateOne(
    { userId: userObjId, term: cleanTerm },
    {
      $set: { at: now },
      $setOnInsert: { userId: userObjId, term: cleanTerm },
    },
    { upsert: true }
  );

  // Enforce 10-item cap per user by removing oldest entries
  const allEntries = await db
    .collection(COLLECTIONS.SEARCH_HISTORY)
    .find({ userId: userObjId }, { projection: { _id: 1 } })
    .sort({ at: -1 })
    .toArray();

  if (allEntries.length > 10) {
    const excessIds = allEntries.slice(10).map((d) => d._id);
    await db
      .collection(COLLECTIONS.SEARCH_HISTORY)
      .deleteMany({ _id: { $in: excessIds } });
  }

  const saved = await db
    .collection(COLLECTIONS.SEARCH_HISTORY)
    .findOne({ userId: userObjId, term: cleanTerm });

  return {
    id: saved._id.toString(),
    term: saved.term,
    at: saved.at.toISOString(),
  };
}

/**
 * Deletes a single search history entry owned by the user.
 *
 * @param {string} userId
 * @param {string} historyId
 */
export async function deleteSearchHistoryItem(userId, historyId) {
  const db = getDb();
  const userObjId = toObjectId(userId);
  let histObjId;
  try {
    histObjId = toObjectId(historyId);
  } catch {
    throw new AppError(404, 'NOT_FOUND', 'Search history entry not found');
  }

  const result = await db
    .collection(COLLECTIONS.SEARCH_HISTORY)
    .deleteOne({ _id: histObjId, userId: userObjId });

  if (result.deletedCount === 0) {
    throw new AppError(404, 'NOT_FOUND', 'Search history entry not found');
  }

  return { success: true };
}

/**
 * Clears all search history for a user.
 *
 * @param {string} userId
 * @returns {Promise<{ deletedCount: number }>}
 */
export async function clearSearchHistory(userId) {
  const db = getDb();
  const userObjId = toObjectId(userId);

  const result = await db
    .collection(COLLECTIONS.SEARCH_HISTORY)
    .deleteMany({ userId: userObjId });

  return { deletedCount: result.deletedCount };
}
