/**
 * Contact service layer.
 * Handles database persistence for guest and user support messages.
 */

import { getDb } from '../../db/client.js';
import { COLLECTIONS } from '../../db/collections.js';

/**
 * Saves a contact message to the contactMessages collection.
 *
 * @param {object} params
 * @param {string} params.name
 * @param {string} params.email
 * @param {string} params.topic
 * @param {string} params.message
 * @param {string} [params.ip]
 * @returns {Promise<import('mongodb').InsertOneResult>}
 */
export async function createContactMessage({ name, email, topic, message, ip }) {
  const db = getDb();
  const doc = {
    name,
    email,
    topic,
    message,
    ip: ip || 'unknown',
    createdAt: new Date(),
  };

  // Direct insert into contactMessages; indexed by createdAt for reverse-chronological retrieval
  return db.collection(COLLECTIONS.CONTACT_MESSAGES).insertOne(doc);
}
