/**
 * Users service layer.
 * Manages user profile queries, updates, password modifications, and session invalidations.
 */

import { getDb } from '../../db/client.js';
import { COLLECTIONS } from '../../db/collections.js';
import { toObjectId } from '../../utils/ids.js';

/**
 * Updates a user's profile with allowed patch fields.
 *
 * @param {string} userId
 * @param {object} updates
 * @returns {Promise<any|null>} Updated user document
 */
export async function updateUserProfile(userId, updates) {
  const db = getDb();
  const objId = toObjectId(userId);

  const setDoc = {
    ...updates,
    updatedAt: new Date(),
  };

  const result = await db.collection(COLLECTIONS.USERS).findOneAndUpdate(
    { _id: objId },
    { $set: setDoc },
    { returnDocument: 'after', projection: { passwordHash: 0 } }
  );

  return result;
}

/**
 * Updates user password hash.
 *
 * @param {string} userId
 * @param {string} newPasswordHash
 */
export async function updateUserPassword(userId, newPasswordHash) {
  const db = getDb();
  const objId = toObjectId(userId);
  await db.collection(COLLECTIONS.USERS).updateOne(
    { _id: objId },
    {
      $set: {
        passwordHash: newPasswordHash,
        updatedAt: new Date(),
      },
    }
  );
}
