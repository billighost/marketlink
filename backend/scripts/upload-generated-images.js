/**
 * Companion upload script for MarketLink catalog images.
 * Crops generated images to canonical sizes via Python Pillow, uploads to Cloudinary,
 * updates MongoDB entity records, and updates imageGenJobs status.
 *
 * Usage: node scripts/upload-generated-images.js [--phase products|farmer-logos|farmer-banners|markets|all]
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { ObjectId } from 'mongodb';
import { connectDb, getDb, closeDb } from '../src/db/client.js';
import { COLLECTIONS } from '../src/db/collections.js';
import { saveImage } from '../src/modules/uploads/storage/cloudinary.js';
import { env } from '../src/config/env.js';

const execFileAsync = promisify(execFile);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CROP_SCRIPT_PATH = path.join(__dirname, 'crop_image.py');

// Canonical dimensions per entity type
const CANONICAL_SIZES = {
  product: { width: 1024, height: 768, folder: 'products' },
  'farmer-logo': { width: 800, height: 800, folder: 'farmers/logos' },
  'farmer-banner': { width: 1600, height: 900, folder: 'farmers/banners' },
  market: { width: 1600, height: 900, folder: 'markets' },
};

const PHASE_MAP = {
  products: 'product',
  'farmer-logos': 'farmer-logo',
  'farmer-banners': 'farmer-banner',
  markets: 'market',
};

function parseArgs() {
  const args = process.argv.slice(2);
  let targetPhase = 'all';

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--phase' && args[i + 1]) {
      targetPhase = args[i + 1].toLowerCase();
      i++;
    }
  }

  return targetPhase;
}

export async function uploadGeneratedImages(targetPhase = 'all') {
  const db = getDb();
  const jobsColl = db.collection(COLLECTIONS.IMAGE_GEN_JOBS);

  const query = { status: 'generated' };
  if (targetPhase !== 'all' && PHASE_MAP[targetPhase]) {
    query.entityType = PHASE_MAP[targetPhase];
  } else if (targetPhase !== 'all') {
    query.entityType = targetPhase;
  }

  const generatedJobs = await jobsColl.find(query).toArray();
  console.log(`\n📦 Found ${generatedJobs.length} generated image(s) ready for upload (Phase: ${targetPhase})...\n`);

  for (const job of generatedJobs) {
    const config = CANONICAL_SIZES[job.entityType];
    const entityIdObj = typeof job.entityId === 'string' ? new ObjectId(job.entityId) : job.entityId;

    try {
      if (!fs.existsSync(job.localFilePath)) {
        throw new Error(`File not found at localFilePath: ${job.localFilePath}`);
      }

      // 1. Run Python Pillow crop to canonical size
      const ext = path.extname(job.localFilePath) || '.png';
      const croppedPath = job.localFilePath.replace(ext, `_canonical${ext}`);
      
      await execFileAsync('python', [
        CROP_SCRIPT_PATH,
        job.localFilePath,
        croppedPath,
        String(config.width),
        String(config.height),
      ]);

      // 2. Read cropped buffer and upload to Cloudinary
      const buffer = fs.readFileSync(croppedPath);
      const mime = ext.toLowerCase() === '.png' ? 'image/png' : 'image/jpeg';

      const uploadResult = await saveImage({
        buffer,
        mime,
        folder: config.folder,
      });

      // 3. Update the matching MongoDB document
      const now = new Date();
      if (job.entityType === 'product') {
        await db.collection(COLLECTIONS.PRODUCTS).updateOne(
          { _id: entityIdObj },
          {
            $set: {
              imageUrl: uploadResult.url,
              imagePublicId: uploadResult.publicId,
              updatedAt: now,
            },
          }
        );
      } else if (job.entityType === 'farmer-logo') {
        await db.collection(COLLECTIONS.FARMERS).updateOne(
          { _id: entityIdObj },
          {
            $set: {
              logoUrl: uploadResult.url,
              logoPublicId: uploadResult.publicId,
              updatedAt: now,
            },
          }
        );
      } else if (job.entityType === 'farmer-banner') {
        await db.collection(COLLECTIONS.FARMERS).updateOne(
          { _id: entityIdObj },
          {
            $set: {
              bannerUrl: uploadResult.url,
              bannerPublicId: uploadResult.publicId,
              imageUrl: uploadResult.url, // maintain backward compatibility
              imagePublicId: uploadResult.publicId,
              updatedAt: now,
            },
          }
        );
      } else if (job.entityType === 'market') {
        await db.collection(COLLECTIONS.MARKETS).updateOne(
          { _id: entityIdObj },
          {
            $set: {
              bannerUrl: uploadResult.url,
              bannerPublicId: uploadResult.publicId,
              updatedAt: now,
            },
          }
        );
      }

      // 4. Mark job done
      await jobsColl.updateOne(
        { _id: job._id },
        {
          $set: {
            status: 'done',
            cloudinaryPublicId: uploadResult.publicId,
            cloudinaryUrl: uploadResult.url,
            uploadedAt: now,
            updatedAt: now,
          },
        }
      );

      // 5. Delete temp files
      try {
        if (fs.existsSync(job.localFilePath)) fs.unlinkSync(job.localFilePath);
        if (fs.existsSync(croppedPath)) fs.unlinkSync(croppedPath);
      } catch (cleanErr) {
        console.warn(`[WARN] Failed to delete temp file: ${cleanErr.message}`);
      }

      console.log(`✓ [${job.entityType}] ${job.entityId} -> uploaded: ${uploadResult.url}`);
    } catch (err) {
      console.error(`✗ [ERROR] Failed to process ${job.entityType} ${job.entityId}: ${err.message}`);
      await jobsColl.updateOne(
        { _id: job._id },
        {
          $set: {
            status: 'failed',
            lastError: err.message,
            updatedAt: new Date(),
          },
          $inc: { attempts: 1 },
        }
      );
    }
  }

  // Print Totals Table
  await printTotalsTable();
}

export async function printTotalsTable() {
  const db = getDb();
  const jobsColl = db.collection(COLLECTIONS.IMAGE_GEN_JOBS);

  const stats = await jobsColl
    .aggregate([
      {
        $group: {
          _id: { entityType: '$entityType', status: '$status' },
          count: { $sum: 1 },
        },
      },
    ])
    .toArray();

  const entityTypes = ['product', 'farmer-logo', 'farmer-banner', 'market'];
  const summary = {};

  for (const t of entityTypes) {
    summary[t] = { done: 0, generated: 0, pending: 0, failed: 0 };
  }

  for (const row of stats) {
    const { entityType, status } = row._id;
    if (summary[entityType] && summary[entityType][status] !== undefined) {
      summary[entityType][status] = row.count;
    }
  }

  console.log('\n============================= IMAGE GEN TOTALS =============================');
  console.log('| Phase / Entity Type | Done | Generated (Queued) | Pending | Failed | Total |');
  console.log('|---------------------|------|--------------------|---------|--------|-------|');

  for (const t of entityTypes) {
    const d = summary[t];
    const total = d.done + d.generated + d.pending + d.failed;
    console.log(
      `| ${t.padEnd(19)} | ${String(d.done).padStart(4)} | ${String(d.generated).padStart(18)} | ${String(d.pending).padStart(7)} | ${String(d.failed).padStart(6)} | ${String(total).padStart(5)} |`
    );
  }
  console.log('============================================================================\n');

  return summary;
}

// CLI execution
if (process.argv[1] && process.argv[1].endsWith('upload-generated-images.js')) {
  try {
    await connectDb();
    const phase = parseArgs();
    await uploadGeneratedImages(phase);
    await closeDb();
    process.exit(0);
  } catch (err) {
    console.error('Upload script execution failed:', err.message);
    process.exit(1);
  }
}
