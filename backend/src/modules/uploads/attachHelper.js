/**
 * Image attachment and ownership validation helper.
 * Enforces that image URLs belong to own Cloudinary/storage uploads in mediaUploads,
 * updates attachment links, and cleans up replaced/deleted assets.
 */

import { ObjectId } from 'mongodb';
import { COLLECTIONS } from '../../db/collections.js';
import { AppError } from '../../utils/errors.js';
import * as storage from './storage/index.js';

/**
 * Validates that an image belongs to the owner and is from our storage driver,
 * updates attachment references in mediaUploads, and cleans up previous asset if replaced.
 *
 * @param {object} options
 * @param {import('mongodb').Db} options.db
 * @param {string|null} options.imageUrl
 * @param {string|null} [options.imagePublicId]
 * @param {ObjectId} options.ownerUserId
 * @param {{ type: 'product'|'farmer', id: ObjectId }} options.attachTo
 * @param {string|null} [options.oldPublicId]
 * @returns {Promise<{ imageUrl: string|null, imagePublicId: string|null }>}
 */
export async function validateAndAttachImage({
  db,
  imageUrl,
  imagePublicId = null,
  ownerUserId,
  attachTo,
  oldPublicId = null,
}) {
  // If removing image
  if (imageUrl === null || imageUrl === '') {
    if (oldPublicId) {
      storage.deleteImage(oldPublicId).catch((err) => {
        console.warn(`[IMAGE DELETE WARNING] Failed to delete ${oldPublicId}:`, err.message);
      });
      await db.collection(COLLECTIONS.MEDIA_UPLOADS).deleteOne({ publicId: oldPublicId }).catch(() => {});
    }
    return { imageUrl: null, imagePublicId: null };
  }

  // Must be a string
  if (typeof imageUrl !== 'string') {
    throw AppError.validation('imageUrl must be a string or null', { field: 'imageUrl' });
  }

  // Must be from our own storage domain / folder
  if (!storage.isOwnUrl(imageUrl)) {
    throw AppError.validation('Invalid imageUrl: external URLs or untrusted storage domains are not permitted.', {
      field: 'imageUrl',
    });
  }

  // Query mediaUploads for ownership
  const query = {
    ownerUserId: new ObjectId(ownerUserId),
    $or: [{ url: imageUrl }],
  };
  if (imagePublicId) {
    query.$or.push({ publicId: imagePublicId });
  }

  const mediaRecord = await db.collection(COLLECTIONS.MEDIA_UPLOADS).findOne(query);

  if (!mediaRecord) {
    throw AppError.validation(
      'Referenced image does not exist or was uploaded by another account.',
      { field: 'imageUrl' }
    );
  }

  // If replacing an existing image
  if (oldPublicId && oldPublicId !== mediaRecord.publicId) {
    storage.deleteImage(oldPublicId).catch((err) => {
      console.warn(`[IMAGE DELETE WARNING] Failed to delete replaced image ${oldPublicId}:`, err.message);
    });
    await db.collection(COLLECTIONS.MEDIA_UPLOADS).deleteOne({ publicId: oldPublicId }).catch(() => {});
  }

  // Mark mediaUploads as attached
  await db.collection(COLLECTIONS.MEDIA_UPLOADS).updateOne(
    { _id: mediaRecord._id },
    { $set: { attachedTo: { type: attachTo.type, id: new ObjectId(attachTo.id) } } }
  );

  return {
    imageUrl: mediaRecord.url,
    imagePublicId: mediaRecord.publicId,
  };
}

/**
 * Removes and deletes an image asset on document deletion.
 *
 * @param {import('mongodb').Db} db
 * @param {string} publicId
 */
export async function detachAndDeleteImage(db, publicId) {
  if (!publicId) return;
  try {
    await storage.deleteImage(publicId);
    await db.collection(COLLECTIONS.MEDIA_UPLOADS).deleteOne({ publicId });
  } catch (err) {
    console.warn(`[IMAGE DELETE WARNING] Failed to detach/delete ${publicId}:`, err.message);
  }
}
