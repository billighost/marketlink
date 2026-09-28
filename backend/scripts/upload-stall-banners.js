import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { connectDb, getDb, closeDb } from '../src/db/client.js';
import { COLLECTIONS } from '../src/db/collections.js';
import { saveImage } from '../src/modules/uploads/storage/cloudinary.js';

const BRAIN_DIR = 'C:/Users/DELL/.gemini/antigravity-ide/brain/c6e2e912-a1ef-4ec0-ad85-9bcd3553accc';

const STALL_IMAGE_FILES = [
  { stallName: 'Riverbend Farm', file: 'riverbend_stall_banner_1790551285845.jpg' },
  { stallName: 'Green Hollow Mushrooms', file: 'green_hollow_mushrooms_banner_1790551306087.jpg' },
  { stallName: 'Hollow Creek Apiary', file: 'hollow_creek_apiary_banner_1790551322864.jpg' },
  { stallName: 'Thornberry Preserves', file: 'thornberry_preserves_banner_1790551341149.jpg' },
  { stallName: 'Old Stone Fishmonger', file: 'old_stone_fishmonger_banner_1790551361516.jpg' },
  { stallName: 'Wild Meadow Meats', file: 'wild_meadow_meats_banner_1790551380117.jpg' },
  { stallName: 'Clearwater Orchards', file: 'clearwater_orchards_banner_1790551400309.jpg' },
  { stallName: 'Shadowbrook Orchard', file: 'shadowbrook_orchard_banner_1790551424290.jpg' },
  { stallName: 'Billighost', file: 'billighost_stall_banner_1790551449263.jpg' },
  { stallName: 'Sunny Acre Orchards', file: 'sunny_acre_orchards_banner_1790551470982.jpg' },
  { stallName: 'Willow Bend Poultry', file: 'willow_bend_poultry_banner_1790551488865.jpg' },
  { stallName: 'Cedarbrook Flowers', file: 'cedarbrook_flowers_banner_1790551510643.jpg' },
  { stallName: 'Oak & Mill Bakery', file: 'oak_mill_bakery_banner_1790551534192.jpg' },
];

async function main() {
  await connectDb();
  const db = getDb();
  const farmersColl = db.collection(COLLECTIONS.FARMERS);

  const uploadedMap = {};

  for (const item of STALL_IMAGE_FILES) {
    const fullPath = path.join(BRAIN_DIR, item.file);
    if (!fs.existsSync(fullPath)) {
      console.warn(`File not found: ${fullPath}`);
      continue;
    }

    console.log(`Processing "${item.stallName}" with ${item.file}...`);
    const buffer = fs.readFileSync(fullPath);

    try {
      const uploaded = await saveImage({
        buffer,
        mime: 'image/jpeg',
        folder: 'farmers',
      });

      console.log(`  Uploaded to Cloudinary: ${uploaded.url}`);
      uploadedMap[item.stallName] = uploaded;

      const res = await farmersColl.updateOne(
        { stallName: item.stallName },
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

      console.log(`  Updated MongoDB for "${item.stallName}" (matched: ${res.matchedCount})\n`);
    } catch (err) {
      console.error(`  Error uploading for "${item.stallName}":`, err.message);
    }
  }

  // Update Pine Valley Apiary with the honey banner if uploaded
  if (uploadedMap['Hollow Creek Apiary']) {
    const h = uploadedMap['Hollow Creek Apiary'];
    await farmersColl.updateOne(
      { stallName: 'Pine Valley Apiary' },
      {
        $set: {
          imageUrl: h.url,
          imagePublicId: h.publicId,
          bannerUrl: h.url,
          bannerPublicId: h.publicId,
          updatedAt: new Date(),
        },
      }
    );
    console.log('Updated Pine Valley Apiary with honey banner.');
  }

  // Update micheal with the bakery banner
  if (uploadedMap['Oak & Mill Bakery']) {
    const b = uploadedMap['Oak & Mill Bakery'];
    await farmersColl.updateOne(
      { stallName: 'micheal' },
      {
        $set: {
          imageUrl: b.url,
          imagePublicId: b.publicId,
          bannerUrl: b.url,
          bannerPublicId: b.publicId,
          updatedAt: new Date(),
        },
      }
    );
    console.log('Updated micheal with bakery banner.');
  }

  console.log('All stall banners uploaded and database updated successfully!');
  await closeDb();
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
