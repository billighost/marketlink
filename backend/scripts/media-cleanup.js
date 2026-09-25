/**
 * Media cleanup job.
 * Scans mediaUploads for unattached uploads (attachedTo: null) older than 24 hours,
 * deletes them from Cloudinary / storage driver, and removes their database records.
 */

import { connectDb, closeDb, getDb } from '../src/db/client.js';
import { COLLECTIONS } from '../src/db/collections.js';
import * as storage from '../src/modules/uploads/storage/index.js';

/**
 * Runs media cleanup on the active database.
 *
 * @param {import('mongodb').Db} [customDb]
 * @returns {Promise<{ scanned: number, deleted: number, failed: number }>}
 */
export async function runMediaCleanup(customDb) {
  const db = customDb || getDb();
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const orphans = await db
    .collection(COLLECTIONS.MEDIA_UPLOADS)
    .find({
      attachedTo: null,
      createdAt: { $lt: cutoff },
    })
    .toArray();

  let deleted = 0;
  let failed = 0;

  for (const doc of orphans) {
    try {
      if (doc.publicId) {
        await storage.deleteImage(doc.publicId);
      }
      await db.collection(COLLECTIONS.MEDIA_UPLOADS).deleteOne({ _id: doc._id });
      deleted++;
    } catch (err) {
      failed++;
      console.warn(`[MEDIA CLEANUP] Failed to delete ${doc.publicId}:`, err.message);
    }
  }

  return { scanned: orphans.length, deleted, failed };
}

// Standalone execution if run directly via CLI (npm run jobs:media)
if (process.argv[1]?.endsWith('media-cleanup.js')) {
  (async () => {
    try {
      console.log('\n🧹 Starting Media Cleanup Job...');
      const db = await connectDb();
      const stats = await runMediaCleanup(db);
      console.log(`✓ Scanned: ${stats.scanned} unattached uploads (>24h old)`);
      console.log(`✓ Deleted: ${stats.deleted}`);
      console.log(`✓ Failed: ${stats.failed}\n`);
      await closeDb();
      process.exit(0);
    } catch (err) {
      console.error('❌ Media cleanup failed:', err);
      process.exit(1);
    }
  })();
}
