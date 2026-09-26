/**
 * Phase 2 Image Generation Script (Gemini API Direct Mode).
 *
 * NOTE: This script is prepared for Phase 2 and is intentionally DORMANT.
 * DO NOT RUN or configure active keys until explicitly requested with:
 * "now use the API keys".
 *
 * When triggered, it queries pending jobs in imageGenJobs, calls Google's
 * Gemini image generation endpoint using rotating keys, saves the binary output,
 * updates the job status to 'generated' with generationMode: 'api', and hands off
 * to upload-generated-images.js.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ObjectId } from 'mongodb';
import { connectDb, getDb, closeDb } from '../src/db/client.js';
import { COLLECTIONS } from '../src/db/collections.js';
import {
  buildProductPrompt,
  buildFarmerLogoPrompt,
  buildFarmerBannerPrompt,
  buildMarketBannerPrompt,
} from './prompt-builder.js';
import { uploadGeneratedImages } from './upload-generated-images.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const GENERATED_DIR = path.join(__dirname, 'generated');

// Phase 2 Configuration Defaults
const GEMINI_IMAGE_MODEL = process.env.GEMINI_IMAGE_MODEL || 'gemini-3.1-flash-image';
const IMAGES_PER_RUN = parseInt(process.env.IMAGES_PER_RUN || '12', 10);

class KeyRotator {
  constructor(keysString = '') {
    this.keys = keysString
      .split(',')
      .map((k) => k.trim())
      .filter(Boolean);
    this.index = 0;
  }

  hasKeys() {
    return this.keys.length > 0;
  }

  getKey() {
    if (!this.hasKeys()) return null;
    const key = this.keys[this.index % this.keys.length];
    this.index++;
    return key;
  }
}

/**
 * Calls Gemini generateContent to synthesize an image.
 */
async function callGeminiImageGen({ prompt, aspectRatio, apiKey }) {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_IMAGE_MODEL}:generateContent?key=${apiKey}`;

  const payload = {
    contents: [
      {
        role: 'user',
        parts: [{ text: prompt }],
      },
    ],
    generationConfig: {
      responseModalities: ['TEXT', 'IMAGE'],
      imageConfig: {
        aspectRatio: aspectRatio || '4:3',
      },
    },
  };

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(30000),
  });

  if (res.status === 429) {
    const errorBody = await res.text().catch(() => '');
    const err = new Error(`Quota exceeded (HTTP 429): ${errorBody}`);
    err.isQuotaExceeded = true;
    throw err;
  }

  if (!res.ok) {
    const errorBody = await res.text().catch(() => '');
    throw new Error(`Gemini API Error (status ${res.status}): ${errorBody}`);
  }

  const data = await res.json();
  const candidates = data?.candidates || [];
  if (candidates.length === 0) {
    throw new Error('No candidate received from Gemini API');
  }

  const parts = candidates[0]?.content?.parts || [];
  let imageBase64 = null;
  let mimeType = 'image/png';

  for (const part of parts) {
    if (part.inlineData && part.inlineData.data) {
      imageBase64 = part.inlineData.data;
      mimeType = part.inlineData.mimeType || mimeType;
      break;
    }
  }

  if (!imageBase64) {
    throw new Error('Gemini response did not contain inlineData image payload');
  }

  return {
    buffer: Buffer.from(imageBase64, 'base64'),
    mimeType,
  };
}

export async function runApiImageGeneration() {
  const isTriggered = process.argv.includes('--force-api') || process.env.ENABLE_PHASE2_IMAGE_GEN === 'true';
  if (!isTriggered) {
    console.log('⛔ [PHASE 2 DORMANT] API-key generation mode is currently dormant.');
    console.log('Per instructions, this script stays dormant until the explicit trigger "now use the API keys".');
    console.log('Run with --force-api or ENABLE_PHASE2_IMAGE_GEN=true only when instructed.');
    return;
  }

  const rawKeys = process.env.GEMINI_API_KEYS || '';
  const rotator = new KeyRotator(rawKeys);

  if (!rotator.hasKeys()) {
    console.error('⛔ [PHASE 2 DORMANT] No GEMINI_API_KEYS configured.');
    console.error('This script is dormant until you provide GEMINI_API_KEYS and explicitly say "now use the API keys".');
    return;
  }

  await connectDb();
  const db = getDb();
  const jobsColl = db.collection(COLLECTIONS.IMAGE_GEN_JOBS);

  // Phase order: product -> farmer-logo -> farmer-banner -> market
  const phases = ['product', 'farmer-logo', 'farmer-banner', 'market'];
  let currentJobs = [];
  let currentPhase = null;

  for (const p of phases) {
    const pending = await jobsColl.find({ entityType: p, status: 'pending' }).limit(IMAGES_PER_RUN).toArray();
    if (pending.length > 0) {
      currentJobs = pending;
      currentPhase = p;
      break;
    }
  }

  if (currentJobs.length === 0) {
    console.log('✓ All catalog image generation jobs are already completed!');
    await closeDb();
    return;
  }

  console.log(`\n🚀 Starting API Generation run: Phase "${currentPhase}", batch size ${currentJobs.length}...\n`);
  let generatedThisRun = 0;

  for (const job of currentJobs) {
    const apiKey = rotator.getKey();
    let entity = null;
    let prompt = '';
    let aspect = '4:3';

    if (job.entityType === 'product') {
      entity = await db.collection(COLLECTIONS.PRODUCTS).findOne({ _id: job.entityId });
      if (entity) prompt = buildProductPrompt(entity);
      aspect = '4:3';
    } else if (job.entityType === 'farmer-logo') {
      entity = await db.collection(COLLECTIONS.FARMERS).findOne({ _id: job.entityId });
      if (entity) prompt = buildFarmerLogoPrompt(entity);
      aspect = '1:1';
    } else if (job.entityType === 'farmer-banner') {
      entity = await db.collection(COLLECTIONS.FARMERS).findOne({ _id: job.entityId });
      if (entity) prompt = buildFarmerBannerPrompt(entity);
      aspect = '16:9';
    } else if (job.entityType === 'market') {
      entity = await db.collection(COLLECTIONS.MARKETS).findOne({ _id: job.entityId });
      if (entity) prompt = buildMarketBannerPrompt(entity);
      aspect = '16:9';
    }

    if (!entity) {
      console.warn(`[SKIP] Entity not found for job ${job._id} (${job.entityType} ${job.entityId})`);
      await jobsColl.updateOne({ _id: job._id }, { $set: { status: 'skipped', updatedAt: new Date() } });
      continue;
    }

    try {
      console.log(`[GENERATING] ${job.entityType} "${entity.name || entity.stallName}"...`);
      const { buffer, mimeType } = await callGeminiImageGen({
        prompt,
        aspectRatio: aspect,
        apiKey,
      });

      const outDir = path.join(GENERATED_DIR, job.entityType);
      fs.mkdirSync(outDir, { recursive: true });
      const ext = mimeType === 'image/jpeg' ? '.jpg' : '.png';
      const outPath = path.join(outDir, `${job.entityId.toString()}${ext}`);
      fs.writeFileSync(outPath, buffer);

      await jobsColl.updateOne(
        { _id: job._id },
        {
          $set: {
            status: 'generated',
            generationMode: 'api',
            promptUsed: prompt,
            localFilePath: outPath,
            generatedAt: new Date(),
            updatedAt: new Date(),
          },
        }
      );

      generatedThisRun++;
      console.log(`✓ Saved ${outPath}`);
    } catch (err) {
      if (err.isQuotaExceeded) {
        console.warn(`\n⚠️  Quota reached on API keys. Stopping cleanly without hammering.\n`);
        break;
      }
      console.error(`✗ Generation failed for ${job.entityId}: ${err.message}`);
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

  console.log(`\nGenerated ${generatedThisRun} images via Gemini API.`);

  // If anything was generated, trigger companion upload
  if (generatedThisRun > 0) {
    console.log('\n⬆️  Triggering companion upload to Cloudinary...');
    await uploadGeneratedImages(currentPhase);
  }

  await closeDb();
}

if (process.argv[1] && process.argv[1].endsWith('generate-catalog-images-api.js')) {
  runApiImageGeneration()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Fatal API generation error:', err);
      process.exit(1);
    });
}
