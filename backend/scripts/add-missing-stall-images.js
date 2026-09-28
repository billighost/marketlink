import 'dotenv/config';
import { connectDb, getDb, closeDb } from '../src/db/client.js';
import { COLLECTIONS } from '../src/db/collections.js';
import { saveImage } from '../src/modules/uploads/storage/cloudinary.js';

const STALL_PHOTO_MAP = {
  'Riverbend Farm': 'https://res.cloudinary.com/dpnscafb/image/upload/v1790551607/marketlink/farmers/dga545dhj29qy4y78szu.jpg',
  'Oak & Mill Bakery': 'https://res.cloudinary.com/dpnscafb/image/upload/v1790551628/marketlink/farmers/bkmyeb7qftnzlhvfu3ah.jpg',
  'Hollow Creek Apiary': 'https://res.cloudinary.com/dpnscafb/image/upload/v1790551610/marketlink/farmers/vkcwedr2vlb6c2jtddsz.jpg',
  'Willow Bend Poultry': 'https://res.cloudinary.com/dpnscafb/image/upload/v1790551624/marketlink/farmers/dqtf9xe4jyf4cemom6yi.jpg',
  'Maplecrest Creamery': 'https://res.cloudinary.com/dpnscafb/image/upload/v1790545911/marketlink/farmers/faygpypahhptwprzmyen.jpg',
  'Sunridge Berry Farm': 'https://res.cloudinary.com/dpnscafb/image/upload/v1790545913/marketlink/farmers/blhn5fvdsjtgzlwn9fuv.jpg',
  'Green Hollow Mushrooms': 'https://res.cloudinary.com/dpnscafb/image/upload/v1790551609/marketlink/farmers/hllchb2rjr9wmbpzi3ea.jpg',
  'Thornberry Preserves': 'https://res.cloudinary.com/dpnscafb/image/upload/v1790551611/marketlink/farmers/ckvgizdlrsq5duou6dlj.jpg',
  'Cedarbrook Flowers': 'https://res.cloudinary.com/dpnscafb/image/upload/v1790551626/marketlink/farmers/v2nqlagn4vzc1nifxhsc.jpg',
  'Old Stone Fishmonger': 'https://res.cloudinary.com/dpnscafb/image/upload/v1790551613/marketlink/farmers/hzph1zmsjrfhcphv9tpq.jpg',
  'Wild Meadow Meats': 'https://res.cloudinary.com/dpnscafb/image/upload/v1790551614/marketlink/farmers/t0iixrnaqvajyyx5abhm.jpg',
  'Clearwater Orchards': 'https://res.cloudinary.com/dpnscafb/image/upload/v1790551618/marketlink/farmers/r6kfp33p4anxxswvylay.jpg',
  'Pine Valley Apiary': 'https://res.cloudinary.com/dpnscafb/image/upload/v1790551610/marketlink/farmers/vkcwedr2vlb6c2jtddsz.jpg',
  'Shadowbrook Orchard': 'https://res.cloudinary.com/dpnscafb/image/upload/v1790551620/marketlink/farmers/fm5wdfcclihlcoa3uzjv.jpg',
  'Billighost': 'https://res.cloudinary.com/dpnscafb/image/upload/v1790551621/marketlink/farmers/m5o4adgsygipj8afbfum.jpg',
  'Sunny Acre Orchards': 'https://res.cloudinary.com/dpnscafb/image/upload/v1790551623/marketlink/farmers/z1edqwlzffa7tp2tbqkw.jpg',
  'micheal': 'https://res.cloudinary.com/dpnscafb/image/upload/v1790551628/marketlink/farmers/bkmyeb7qftnzlhvfu3ah.jpg',
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
