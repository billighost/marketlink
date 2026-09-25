/**
 * Migration script: Migrate local uploads from backend/uploads to Cloudinary.
 *
 * Usage:
 *   node scripts/migrate-uploads-to-cloudinary.js           # Dry-run
 *   node scripts/migrate-uploads-to-cloudinary.js --apply   # Apply migration
 */

import fs from 'node:fs';
import path from 'node:path';
import { connectDb, closeDb } from '../src/db/client.js';
import { COLLECTIONS } from '../src/db/collections.js';
import { env } from '../src/config/env.js';
import * as cloudinaryDriver from '../src/modules/uploads/storage/cloudinary.js';
import { detectImageType, parseDimensions } from '../src/modules/uploads/uploads.service.js';

async function migrateUploads() {
  const isApply = process.argv.includes('--apply');
  console.log('\n======================================================');
  console.log(`📦  Migrating Local Uploads to Cloudinary [${isApply ? 'APPLY MODE' : 'DRY-RUN'}]`);
  console.log('======================================================\n');

  const db = await connectDb();

  // Find products and farmers with local /uploads/ URLs
  const products = await db
    .collection(COLLECTIONS.PRODUCTS)
    .find({ imageUrl: { $regex: '^/uploads/' } })
    .toArray();

  const farmers = await db
    .collection(COLLECTIONS.FARMERS)
    .find({ imageUrl: { $regex: '^/uploads/' } })
    .toArray();

  const totalCandidates = products.length + farmers.length;
  console.log(`Found ${totalCandidates} documents with local /uploads/ URLs (Products: ${products.length}, Farmers: ${farmers.length})`);

  if (totalCandidates === 0) {
    console.log('✓ No documents with local /uploads/ URLs found in database. Nothing to migrate.');
    await closeDb();
    return;
  }

  let moved = 0;
  let missingFiles = 0;
  let failures = 0;

  // Process Products
  for (const prod of products) {
    const filename = path.basename(prod.imageUrl);
    const localPath = path.join(env.UPLOAD_DIR, filename);

    if (!fs.existsSync(localPath)) {
      console.warn(`[MISSING FILE] Product ${prod._id} references missing file: ${localPath}`);
      missingFiles++;
      continue;
    }

    if (!isApply) {
      console.log(`[DRY-RUN] Would upload ${filename} for Product "${prod.name}" (${prod._id})`);
      moved++;
      continue;
    }

    try {
      const buffer = await fs.promises.readFile(localPath);
      const detected = detectImageType(buffer) || { mime: 'image/jpeg' };
      const uploadRes = await cloudinaryDriver.saveImage({
        buffer,
        mime: detected.mime,
        folder: 'products',
      });

      // Update product document
      await db.collection(COLLECTIONS.PRODUCTS).updateOne(
        { _id: prod._id },
        {
          $set: {
            imageUrl: uploadRes.url,
            imagePublicId: uploadRes.publicId,
            updatedAt: new Date(),
          },
        }
      );

      // Insert mediaUploads record
      await db.collection(COLLECTIONS.MEDIA_UPLOADS).insertOne({
        publicId: uploadRes.publicId,
        url: uploadRes.url,
        ownerUserId: prod.farmerUserId,
        kind: 'product',
        bytes: uploadRes.bytes,
        width: uploadRes.width,
        height: uploadRes.height,
        attachedTo: { type: 'product', id: prod._id },
        createdAt: new Date(),
      });

      console.log(`✓ Migrated Product ${prod._id} -> ${uploadRes.publicId}`);
      moved++;
    } catch (err) {
      console.error(`❌ Failed to migrate product ${prod._id}:`, err.message);
      failures++;
    }
  }

  // Process Farmers
  for (const farmer of farmers) {
    const filename = path.basename(farmer.imageUrl);
    const localPath = path.join(env.UPLOAD_DIR, filename);

    if (!fs.existsSync(localPath)) {
      console.warn(`[MISSING FILE] Farmer ${farmer._id} references missing file: ${localPath}`);
      missingFiles++;
      continue;
    }

    if (!isApply) {
      console.log(`[DRY-RUN] Would upload ${filename} for Farmer "${farmer.stallName}" (${farmer._id})`);
      moved++;
      continue;
    }

    try {
      const buffer = await fs.promises.readFile(localPath);
      const detected = detectImageType(buffer) || { mime: 'image/jpeg' };
      const uploadRes = await cloudinaryDriver.saveImage({
        buffer,
        mime: detected.mime,
        folder: 'farmers',
      });

      // Update farmer document
      await db.collection(COLLECTIONS.FARMERS).updateOne(
        { _id: farmer._id },
        {
          $set: {
            imageUrl: uploadRes.url,
            imagePublicId: uploadRes.publicId,
            updatedAt: new Date(),
          },
        }
      );

      // Insert mediaUploads record
      await db.collection(COLLECTIONS.MEDIA_UPLOADS).insertOne({
        publicId: uploadRes.publicId,
        url: uploadRes.url,
        ownerUserId: farmer.userId,
        kind: 'farmer',
        bytes: uploadRes.bytes,
        width: uploadRes.width,
        height: uploadRes.height,
        attachedTo: { type: 'farmer', id: farmer._id },
        createdAt: new Date(),
      });

      console.log(`✓ Migrated Farmer ${farmer._id} -> ${uploadRes.publicId}`);
      moved++;
    } catch (err) {
      console.error(`❌ Failed to migrate farmer ${farmer._id}:`, err.message);
      failures++;
    }
  }

  console.log('\n======================================================');
  console.log(`Migration Summary:`);
  console.log(`  Moved:         ${moved}`);
  console.log(`  Missing Files: ${missingFiles}`);
  console.log(`  Failures:      ${failures}`);
  console.log('======================================================\n');

  await closeDb();
}

migrateUploads().catch((err) => {
  console.error('Fatal migration error:', err);
  process.exit(1);
});
