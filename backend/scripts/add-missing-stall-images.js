/**
 * add-missing-stall-images.js
 *
 * Slices through all stalls in MongoDB without a profile image (imageUrl),
 * uploads high-resolution, specialty-matched photography to Cloudinary,
 * and updates each farmer's profile in the database.
 *
 * Usage:
 *   node scripts/add-missing-stall-images.js
 *   node scripts/add-missing-stall-images.js --dry-run
 */

import 'dotenv/config';
import { connectDb, getDb, closeDb } from '../src/db/client.js';
import { COLLECTIONS } from '../src/db/collections.js';
import { saveImage } from '../src/modules/uploads/storage/cloudinary.js';

// Curated high-resolution stall photography matched to each stall's specialty and story
const STALL_PHOTO_MAP = {
  'Riverbend Farm': 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?auto=format&fit=crop&w=1200&q=85',
  'Oak & Mill Bakery': 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=1200&q=85',
  'Hollow Creek Apiary': 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=1200&q=85',
  'Willow Bend Poultry': 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?auto=format&fit=crop&w=1200&q=85',
  'Maplecrest Creamery': 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?auto=format&fit=crop&w=1200&q=85',
  'Sunridge Berry Farm': 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?auto=format&fit=crop&w=1200&q=85',
  'Green Hollow Mushrooms': 'https://images.unsplash.com/photo-1504544750208-dc0358e63f7f?auto=format&fit=crop&w=1200&q=85',
  'Thornberry Preserves': 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=1200&q=85',
  'Cedarbrook Flowers': 'https://images.unsplash.com/photo-1561181286-d3fee7d55364?auto=format&fit=crop&w=1200&q=85',
  'Old Stone Fishmonger': 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=1200&q=85',
  'Wild Meadow Meats': 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=85',
  'Clearwater Orchards': 'https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?auto=format&fit=crop&w=1200&q=85',
  'Pine Valley Apiary': 'https://images.unsplash.com/photo-1471943311424-646960669fbc?auto=format&fit=crop&w=1200&q=85',
  'Shadowbrook Orchard': 'https://images.unsplash.com/photo-1519996529931-28324d5a630e?auto=format&fit=crop&w=1200&q=85',
  'Billighost': 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=85',
  'Sunny Acre Orchards': 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=1200&q=85',
};

function getFallbackImageUrl(farmer) {
  const text = `${farmer.stallName || ''} ${farmer.specialty || ''} ${farmer.story || ''}`.toLowerCase();
  if (text.includes('honey') || text.includes('bee') || text.includes('apiary')) {
    return 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=1200&q=85';
  }
  if (text.includes('bake') || text.includes('bread') || text.includes('pastr')) {
    return 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=1200&q=85';
  }
  if (text.includes('meat') || text.includes('sausage') || text.includes('poultry') || text.includes('chicken') || text.includes('egg')) {
    return 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?auto=format&fit=crop&w=1200&q=85';
  }
  if (text.includes('cheese') || text.includes('dairy') || text.includes('creamery')) {
    return 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?auto=format&fit=crop&w=1200&q=85';
  }
  if (text.includes('flower') || text.includes('herb') || text.includes('plant')) {
    return 'https://images.unsplash.com/photo-1561181286-d3fee7d55364?auto=format&fit=crop&w=1200&q=85';
  }
  if (text.includes('fruit') || text.includes('apple') || text.includes('orchard') || text.includes('berry')) {
    return 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?auto=format&fit=crop&w=1200&q=85';
  }
  return 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?auto=format&fit=crop&w=1200&q=85';
}

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');

async function main() {
  await connectDb();
  const db = getDb();
  const farmersColl = db.collection(COLLECTIONS.FARMERS);

  const allFarmers = await farmersColl.find({}).toArray();
  const farmersWithoutImage = allFarmers.filter((f) => !f.imageUrl || f.imageUrl.trim() === '');

  console.log(`\n==========================================`);
  console.log(` Stall Image Uploader to Cloudinary & DB`);
  console.log(` Total farmers in database: ${allFarmers.length}`);
  console.log(` Farmers missing image:     ${farmersWithoutImage.length}`);
  console.log(`==========================================\n`);

  if (farmersWithoutImage.length === 0) {
    console.log('All stalls already have profile images! Nothing to do.');
    await closeDb();
    return;
  }

  if (DRY_RUN) {
    console.log('-- DRY RUN: Listing stalls that need images --');
    farmersWithoutImage.forEach((f, i) => {
      const photoUrl = STALL_PHOTO_MAP[f.stallName] || getFallbackImageUrl(f);
      console.log(`  ${i + 1}. [${f._id}] "${f.stallName}" (${f.specialty || 'General'}) -> ${photoUrl}`);
    });
    await closeDb();
    return;
  }

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < farmersWithoutImage.length; i++) {
    const farmer = farmersWithoutImage[i];
    const sourceUrl = STALL_PHOTO_MAP[farmer.stallName] || getFallbackImageUrl(farmer);
    const label = `[${i + 1}/${farmersWithoutImage.length}] "${farmer.stallName}"`;

    console.log(`${label} - fetching image...`);
    try {
      const response = await fetch(sourceUrl, {
        headers: { 'User-Agent': 'MarketLink-Image-Seeder/1.0' },
        signal: AbortSignal.timeout(20000),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch photo from source (HTTP ${response.status})`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const mime = response.headers.get('content-type')?.split(';')[0] || 'image/jpeg';

      console.log(`  Uploading ${(buffer.length / 1024).toFixed(0)} KB to Cloudinary...`);
      const uploaded = await saveImage({
        buffer,
        mime,
        folder: 'farmers',
      });

      console.log(`  Cloudinary uploaded: ${uploaded.url}`);

      await farmersColl.updateOne(
        { _id: farmer._id },
        {
          $set: {
            imageUrl: uploaded.url,
            imagePublicId: uploaded.publicId,
            bannerUrl: uploaded.url,
            bannerPublicId: uploaded.publicId,
            updatedAt: new Date(),
          },
        }
      );

      console.log(`  Updated DB record for "${farmer.stallName}"\n`);
      successCount++;
    } catch (err) {
      console.error(`  Error processing "${farmer.stallName}":`, err.message, '\n');
      failCount++;
    }
  }

  console.log(`==========================================`);
  console.log(` Image seeding complete!`);
  console.log(` Successfully updated: ${successCount}`);
  console.log(` Failed:               ${failCount}`);
  console.log(`==========================================\n`);

  await closeDb();
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
