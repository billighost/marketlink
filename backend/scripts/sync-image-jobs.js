/**
 * Idempotently initializes and syncs image generation jobs for catalog items.
 * Populates imageGenJobs for products, farmer logos, farmer banners, and markets.
 */

import { connectDb, getDb, closeDb } from '../src/db/client.js';
import { COLLECTIONS } from '../src/db/collections.js';
import { env } from '../src/config/env.js';

export async function syncImageJobs() {
  const db = getDb();
  const jobsColl = db.collection(COLLECTIONS.IMAGE_GEN_JOBS);
  const now = new Date();

  let productsCount = 0;
  let farmerLogosCount = 0;
  let farmerBannersCount = 0;
  let marketsCount = 0;

  // 1. Products
  const products = await db.collection(COLLECTIONS.PRODUCTS).find({}).toArray();
  for (const p of products) {
    const hasImage = p.imageUrl && p.imageUrl.startsWith('https://res.cloudinary.com/');
    const existing = await jobsColl.findOne({ entityType: 'product', entityId: p._id });
    if (!existing) {
      await jobsColl.insertOne({
        entityType: 'product',
        entityId: p._id,
        status: hasImage ? 'done' : 'pending',
        promptUsed: null,
        generationMode: null,
        localFilePath: null,
        cloudinaryPublicId: p.imagePublicId || null,
        cloudinaryUrl: p.imageUrl || null,
        attempts: 0,
        lastError: null,
        generatedAt: null,
        uploadedAt: hasImage ? now : null,
        createdAt: now,
        updatedAt: now,
      });
      if (!hasImage) productsCount++;
    }
  }

  // 2. Farmers (logo & banner)
  const farmers = await db.collection(COLLECTIONS.FARMERS).find({}).toArray();
  for (const f of farmers) {
    // Logo
    const hasLogo = f.logoUrl && f.logoUrl.startsWith('https://res.cloudinary.com/');
    const existingLogo = await jobsColl.findOne({ entityType: 'farmer-logo', entityId: f._id });
    if (!existingLogo) {
      await jobsColl.insertOne({
        entityType: 'farmer-logo',
        entityId: f._id,
        status: hasLogo ? 'done' : 'pending',
        promptUsed: null,
        generationMode: null,
        localFilePath: null,
        cloudinaryPublicId: f.logoPublicId || null,
        cloudinaryUrl: f.logoUrl || null,
        attempts: 0,
        lastError: null,
        generatedAt: null,
        uploadedAt: hasLogo ? now : null,
        createdAt: now,
        updatedAt: now,
      });
      if (!hasLogo) farmerLogosCount++;
    }

    // Banner
    const hasBanner = (f.bannerUrl || f.imageUrl) && (f.bannerUrl || f.imageUrl).startsWith('https://res.cloudinary.com/');
    const existingBanner = await jobsColl.findOne({ entityType: 'farmer-banner', entityId: f._id });
    if (!existingBanner) {
      await jobsColl.insertOne({
        entityType: 'farmer-banner',
        entityId: f._id,
        status: hasBanner ? 'done' : 'pending',
        promptUsed: null,
        generationMode: null,
        localFilePath: null,
        cloudinaryPublicId: f.bannerPublicId || f.imagePublicId || null,
        cloudinaryUrl: f.bannerUrl || f.imageUrl || null,
        attempts: 0,
        lastError: null,
        generatedAt: null,
        uploadedAt: hasBanner ? now : null,
        createdAt: now,
        updatedAt: now,
      });
      if (!hasBanner) farmerBannersCount++;
    }
  }

  // 3. Markets (banner)
  const markets = await db.collection(COLLECTIONS.MARKETS).find({}).toArray();
  for (const m of markets) {
    const hasBanner = m.bannerUrl && m.bannerUrl.startsWith('https://res.cloudinary.com/');
    const existing = await jobsColl.findOne({ entityType: 'market', entityId: m._id });
    if (!existing) {
      await jobsColl.insertOne({
        entityType: 'market',
        entityId: m._id,
        status: hasBanner ? 'done' : 'pending',
        promptUsed: null,
        generationMode: null,
        localFilePath: null,
        cloudinaryPublicId: m.bannerPublicId || null,
        cloudinaryUrl: m.bannerUrl || null,
        attempts: 0,
        lastError: null,
        generatedAt: null,
        uploadedAt: hasBanner ? now : null,
        createdAt: now,
        updatedAt: now,
      });
      if (!hasBanner) marketsCount++;
    }
  }

  return {
    products: productsCount,
    farmerLogos: farmerLogosCount,
    farmerBanners: farmerBannersCount,
    markets: marketsCount,
  };
}

// CLI execution
if (process.argv[1] && process.argv[1].endsWith('sync-image-jobs.js')) {
  try {
    await connectDb();
    console.log('🔄 Syncing image generation jobs...');
    const result = await syncImageJobs();
    console.log('✓ Image generation jobs synced:');
    console.log(`  - Products pending:       ${result.products}`);
    console.log(`  - Farmer logos pending:   ${result.farmerLogos}`);
    console.log(`  - Farmer banners pending: ${result.farmerBanners}`);
    console.log(`  - Market banners pending: ${result.markets}`);
    await closeDb();
    process.exit(0);
  } catch (err) {
    console.error('Failed to sync image jobs:', err.message);
    process.exit(1);
  }
}
