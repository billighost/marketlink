/**
 * Announcements module service layer.
 * Queries active system and market announcements filtered by user role.
 */

import { getDb } from '../../db/client.js';
import { COLLECTIONS } from '../../db/collections.js';

/**
 * Lists active announcements tailored to the requester's role.
 *
 * @param {string} [role] - 'customer' | 'farmer' | 'admin' | null
 * @returns {Promise<Array<object>>}
 */
export async function listActiveAnnouncements(role = null) {
  const db = getDb();
  const now = new Date();

  const audienceFilter = role ? { $in: ['all', role] } : 'all';

  const filter = {
    audience: audienceFilter,
    publishedAt: { $lte: now },
    $or: [{ expiresAt: { $exists: false } }, { expiresAt: null }, { expiresAt: { $gte: now } }],
  };

  const docs = await db
    .collection(COLLECTIONS.ANNOUNCEMENTS)
    .find(filter, {
      projection: {
        _id: 1,
        title: 1,
        body: 1,
        audience: 1,
        publishedAt: 1,
        expiresAt: 1,
      },
    })
    .sort({ publishedAt: -1 })
    .toArray();

  return docs.map((doc) => ({
    id: doc._id.toString(),
    title: doc.title,
    body: doc.body,
    audience: doc.audience,
    publishedAt: doc.publishedAt instanceof Date ? doc.publishedAt.toISOString() : doc.publishedAt,
    expiresAt: doc.expiresAt instanceof Date ? doc.expiresAt.toISOString() : doc.expiresAt || null,
  }));
}
