import fs from 'node:fs';
import path from 'node:path';
import { connectDb, getDb, closeDb } from '../src/db/client.js';
import { COLLECTIONS } from '../src/db/collections.js';
import { uploadGeneratedImages } from './upload-generated-images.js';

const ARTIFACT_DIR = 'C:\\Users\\bb201\\.gemini\\antigravity-ide\\brain\\43694f26-0c10-4af3-9127-89f74403eaf7';

// Mapping from product name to artifact filename in brain directory
const PRODUCT_ARTIFACTS = {
  'Tuscan kale': 'tuscan_kale_crate_1790411592163.jpg',
  'Sweet corn': 'sweet_corn_bushel_1790426151059.jpg',
  'Sourdough boule': 'sourdough_boule_loaf_1790425805900.jpg',
  'Seeded rye loaf': 'seeded_rye_loaf_1790426200940.jpg',
  'Almond pastry': 'almond_croissant_pastry_1790398129906.jpg',
  'Wildflower honey': 'wildflower_honey_jar_1790398269517.jpg',
  'Honeycomb section': 'raw_honeycomb_slab_1790426251927.jpg',
  'Farm eggs': 'farm_eggs_carton_1790425986551.jpg',
  'Half-dozen eggs': 'half_dozen_eggs_1790397522659.jpg',
  'Pastured whole chicken': 'pastured_roasting_chicken_1790398416507.jpg',
  'Aged farmhouse cheddar': 'farmhouse_cheddar_wedge_1790397568475.jpg',
  'Cultured butter': 'cultured_butter_slab_1790424436110.jpg',
  'Strawberries': 'fresh_strawberries_pint_1790397620010.jpg',
  'Blueberries': 'fresh_blueberries_pint_1790397672818.jpg',
  'Mixed berry box': 'mixed_berry_box_1790397750632.jpg',
  'Red raspberries': 'red_raspberries_pint_1790426049449.jpg',
  'Oyster mushrooms': 'oyster_mushrooms_cluster_1790425208137.jpg',
  'Shiitake cluster': 'shiitake_cluster_basket_1790397819311.jpg',
  'Peach chutney': 'peach_chutney_jar_1790397891239.jpg',
  'Fresh basil pot': 'fresh_basil_pot_1790425305194.jpg',
  'Dried lavender bunch': 'dried_lavender_bunch_1790397968415.jpg',
  'Smoked fish pate': 'smoked_fish_pate_crock_1790426104997.jpg',
  'Grass-fed ground beef': 'ground_beef_butcher_1790425423977.jpg',
  'Bartlett pears': 'bartlett_pears_crate_1790398046912.jpg',
  'Sweet cherry tomatoes': 'cherry_tomatoes_basket_1790425524464.jpg',
};

async function main() {
  await connectDb();
  const db = getDb();
  const jobsColl = db.collection(COLLECTIONS.IMAGE_GEN_JOBS);
  const productsColl = db.collection(COLLECTIONS.PRODUCTS);

  const stagingDir = path.join(process.cwd(), 'scripts', 'generated', 'product');
  if (!fs.existsSync(stagingDir)) {
    fs.mkdirSync(stagingDir, { recursive: true });
  }

  let stagedCount = 0;
  for (const [name, artifactFilename] of Object.entries(PRODUCT_ARTIFACTS)) {
    const product = await productsColl.findOne({ name });
    if (!product) {
      console.warn(`Product not found in DB: "${name}"`);
      continue;
    }

    const artifactPath = path.join(ARTIFACT_DIR, artifactFilename);
    if (!fs.existsSync(artifactPath)) {
      console.warn(`Artifact not found: ${artifactPath}`);
      continue;
    }

    const stagedDest = path.join(stagingDir, `${product._id.toString()}.jpg`);
    fs.copyFileSync(artifactPath, stagedDest);

    await jobsColl.updateOne(
      { entityType: 'product', entityId: product._id },
      {
        $set: {
          status: 'generated',
          generationMode: 'agent',
          localFilePath: path.relative(process.cwd(), stagedDest),
          updatedAt: new Date(),
        },
      }
    );

    console.log(`✓ Staged and marked "${name}" (${product._id.toString()})`);
    stagedCount++;
  }

  console.log(`\n🎉 Successfully staged ${stagedCount} products for upload.`);
  console.log(`🚀 Starting Cloudinary cropping and upload process...\n`);

  await uploadGeneratedImages('products');
  await closeDb();
}

main().catch((err) => {
  console.error('Fatal error staging and uploading:', err);
  process.exit(1);
});
