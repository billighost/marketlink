import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { connectDb, getDb, closeDb } from '../src/db/client.js';
import { COLLECTIONS } from '../src/db/collections.js';
import { syncImageJobs } from './sync-image-jobs.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ARTIFACT_DIR = 'C:\\Users\\bb201\\.gemini\\antigravity-ide\\brain\\43694f26-0c10-4af3-9127-89f74403eaf7';
const STAGING_DIR = path.join(__dirname, 'generated', 'product');

const MATCH_RULES = [
  { name: 'Heirloom tomatoes', pattern: /heirloom_tomatoes/i },
  { name: 'Rainbow carrots', pattern: /rainbow_carrots/i },
  { name: 'Red and gold beets', pattern: /red_gold_beets/i },
  { name: 'Tuscan kale', pattern: /tuscan_kale/i },
  { name: 'Yukon Gold potatoes', pattern: /yukon_gold_potatoes/i },
  { name: 'Sweet corn', pattern: /sweet_corn/i },
  { name: 'Butternut squash', pattern: /butternut_squash/i },
  { name: 'Sourdough boule', pattern: /sourdough_boule/i },
  { name: 'Butter croissant', pattern: /butter_croissant/i },
  { name: 'Seeded rye loaf', pattern: /seeded_rye_loaf/i },
  { name: 'Almond pastry', pattern: /almond_croissant/i },
  { name: 'Wildflower honey', pattern: /wildflower_honey/i },
  { name: 'Creamed clover honey', pattern: /creamed_clover_honey/i },
  { name: 'Honeycomb section', pattern: /raw_honeycomb/i },
  { name: 'Farm eggs', pattern: /farm_eggs/i },
  { name: 'Half-dozen eggs', pattern: /half_dozen_eggs/i },
  { name: 'Pastured whole chicken', pattern: /pastured_roasting_chicken/i },
  { name: 'Aged farmhouse cheddar', pattern: /farmhouse_cheddar/i },
  { name: 'Fresh ricotta', pattern: /fresh_ricotta/i },
  { name: 'Cultured butter', pattern: /cultured_butter/i },
  { name: 'Whole milk', pattern: /whole_milk/i },
  { name: 'Strawberries', pattern: /fresh_strawberries/i },
  { name: 'Blueberries', pattern: /fresh_blueberries/i },
  { name: 'Mixed berry box', pattern: /mixed_berry_box/i },
  { name: 'Red raspberries', pattern: /red_raspberries/i },
  { name: 'Oyster mushrooms', pattern: /oyster_mushrooms/i },
  { name: "Lion's mane", pattern: /lions_mane/i },
  { name: 'Shiitake cluster', pattern: /shiitake_cluster/i },
  { name: 'Strawberry jam', pattern: /strawberry_jam/i },
  { name: 'Fig and walnut butter', pattern: /fig_walnut_butter/i },
  { name: 'Peach chutney', pattern: /peach_chutney/i },
  { name: 'Seasonal bouquet', pattern: /seasonal_farm_bouquet/i },
  { name: 'Fresh basil pot', pattern: /fresh_basil/i },
  { name: 'Dried lavender bunch', pattern: /dried_lavender/i },
  { name: 'Fresh striped bass', pattern: /striped_bass/i },
  { name: 'Smoked fish pate', pattern: /smoked_fish_pate/i },
  { name: 'Grass-fed ground beef', pattern: /ground_beef/i },
  { name: 'Bartlett pears', pattern: /bartlett_pears/i },
  { name: 'Sweet cherry tomatoes', pattern: /cherry_tomatoes/i },
];

async function main() {
  await connectDb();
  const db = getDb();

  console.log('1. Syncing imageGenJobs collection...');
  await syncImageJobs();

  if (!fs.existsSync(STAGING_DIR)) {
    fs.mkdirSync(STAGING_DIR, { recursive: true });
  }

  const files = fs.readdirSync(ARTIFACT_DIR).filter(f => f.endsWith('.jpg') || f.endsWith('.png'));
  const products = await db.collection(COLLECTIONS.PRODUCTS).find({}).toArray();
  const jobsColl = db.collection(COLLECTIONS.IMAGE_GEN_JOBS);

  let stagedCount = 0;

  for (const rule of MATCH_RULES) {
    const product = products.find(p => p.name.toLowerCase() === rule.name.toLowerCase());
    if (!product) {
      console.warn(`Product not found in DB: "${rule.name}"`);
      continue;
    }

    const matchedFile = files.find(f => rule.pattern.test(f));
    if (!matchedFile) {
      console.warn(`No artifact file found matching pattern for: "${rule.name}"`);
      continue;
    }

    const srcPath = path.join(ARTIFACT_DIR, matchedFile);
    const destPath = path.join(STAGING_DIR, `${product._id.toString()}.jpg`);

    fs.copyFileSync(srcPath, destPath);

    await jobsColl.updateOne(
      { entityType: 'product', entityId: product._id },
      {
        $set: {
          status: 'generated',
          generationMode: 'agent',
          localFilePath: destPath,
          generatedAt: new Date(),
          updatedAt: new Date(),
        },
      }
    );

    console.log(`✓ Staged [${product._id.toString()}] ${product.name} <- ${matchedFile}`);
    stagedCount++;
  }

  console.log(`\n🎉 Staged ${stagedCount} images into ${STAGING_DIR}`);
  await closeDb();
}

main().catch(err => {
  console.error('Fatal error staging:', err);
  process.exit(1);
});
