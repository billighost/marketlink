import { connectDb, getDb, closeDb } from '../src/db/client.js';
import { COLLECTIONS } from '../src/db/collections.js';
import { syncImageJobs } from './sync-image-jobs.js';

// Canonical map of product names to their uploaded Cloudinary URLs
const PRODUCT_CLOUDINARY_URLS = {
  'Tuscan kale': 'https://res.cloudinary.com/dpnscafb/image/upload/v1790426985/marketlink/products/tjzrk4valun8agosxj7f.jpg',
  'Sweet corn': 'https://res.cloudinary.com/dpnscafb/image/upload/v1790426988/marketlink/products/gzjfrzd8hm0pnwjz1van.jpg',
  'Sourdough boule': 'https://res.cloudinary.com/dpnscafb/image/upload/v1790426991/marketlink/products/ozi6zkuzivcw5kzo9vtb.jpg',
  'Seeded rye loaf': 'https://res.cloudinary.com/dpnscafb/image/upload/v1790426992/marketlink/products/ox49znrkiq1mgahciy9c.jpg',
  'Almond pastry': 'https://res.cloudinary.com/dpnscafb/image/upload/v1790426996/marketlink/products/vzfrfufqbyeresitc83w.jpg',
  'Wildflower honey': 'https://res.cloudinary.com/dpnscafb/image/upload/v1790426998/marketlink/products/zbxto1fqhs85zdoluhem.jpg',
  'Honeycomb section': 'https://res.cloudinary.com/dpnscafb/image/upload/v1790427003/marketlink/products/azilkqqawu9lhvorlhmy.jpg',
  'Farm eggs': 'https://res.cloudinary.com/dpnscafb/image/upload/v1790427009/marketlink/products/nboxsjwj7qoazwc4at1b.jpg',
  'Half-dozen eggs': 'https://res.cloudinary.com/dpnscafb/image/upload/v1790427015/marketlink/products/v6c4mce2ixfssz41gz1c.jpg',
  'Pastured whole chicken': 'https://res.cloudinary.com/dpnscafb/image/upload/v1790427018/marketlink/products/tytvxfxdjta4ysgczxsf.jpg',
  'Aged farmhouse cheddar': 'https://res.cloudinary.com/dpnscafb/image/upload/v1790427020/marketlink/products/aftubt1pth7artwxomcv.jpg',
  'Cultured butter': 'https://res.cloudinary.com/dpnscafb/image/upload/v1790427024/marketlink/products/ylvpynttkz65kslkhswy.jpg',
  'Strawberries': 'https://res.cloudinary.com/dpnscafb/image/upload/v1790427032/marketlink/products/lhoyb2yo4vhosawwvzq4.jpg',
  'Blueberries': 'https://res.cloudinary.com/dpnscafb/image/upload/v1790427041/marketlink/products/elcwx0y9tbp3j1xzseka.jpg',
  'Mixed berry box': 'https://res.cloudinary.com/dpnscafb/image/upload/v1790427047/marketlink/products/nz0tgnb1xfol2ajo5aqe.jpg',
  'Red raspberries': 'https://res.cloudinary.com/dpnscafb/image/upload/v1790427055/marketlink/products/xzvt01ipf4zrwtdp5msx.jpg',
  'Oyster mushrooms': 'https://res.cloudinary.com/dpnscafb/image/upload/v1790427061/marketlink/products/bjp89y5l5y7rp6uiz6ng.jpg',
  'Shiitake cluster': 'https://res.cloudinary.com/dpnscafb/image/upload/v1790427068/marketlink/products/lmfsqmlmzqemrkhnwgqy.jpg',
  'Peach chutney': 'https://res.cloudinary.com/dpnscafb/image/upload/v1790427074/marketlink/products/xgiqypk13rcjisfklsdt.jpg',
  'Fresh basil pot': 'https://res.cloudinary.com/dpnscafb/image/upload/v1790427077/marketlink/products/kpo8izoyaz6dffgt04kt.jpg',
  'Dried lavender bunch': 'https://res.cloudinary.com/dpnscafb/image/upload/v1790427082/marketlink/products/mtktmmln1plyzusu1ohn.jpg',
  'Smoked fish pate': 'https://res.cloudinary.com/dpnscafb/image/upload/v1790427087/marketlink/products/cjfgrlt0sqckukx6drhs.jpg',
  'Grass-fed ground beef': 'https://res.cloudinary.com/dpnscafb/image/upload/v1790427090/marketlink/products/ubmpnb8x1ehkjzuzinmt.jpg',
  'Bartlett pears': 'https://res.cloudinary.com/dpnscafb/image/upload/v1790427093/marketlink/products/g7xecll3tz9opuphrr1f.jpg',
  'Sweet cherry tomatoes': 'https://res.cloudinary.com/dpnscafb/image/upload/v1790427096/marketlink/products/ochmhwpcwuqya4jznhwv.jpg',
  'Heirloom tomatoes': 'https://res.cloudinary.com/dpnscafb/image/upload/v1790427424/marketlink/products/jq2zz2jisnr8r7witj61.jpg',
  'Rainbow carrots': 'https://res.cloudinary.com/dpnscafb/image/upload/v1790427430/marketlink/products/ok3g1aqoe9yy6lufihdo.jpg',
};

async function main() {
  await connectDb();
  const db = getDb();
  const productsColl = db.collection(COLLECTIONS.PRODUCTS);

  console.log('🔄 Relinking Cloudinary URLs into products collection...');
  let updatedCount = 0;

  for (const [name, url] of Object.entries(PRODUCT_CLOUDINARY_URLS)) {
    // Extract publicId
    const match = url.match(/marketlink\/products\/[a-z0-9_-]+/i);
    const publicId = match ? match[0] : null;

    const res = await productsColl.updateOne(
      { name },
      {
        $set: {
          imageUrl: url,
          imagePublicId: publicId,
          updatedAt: new Date(),
        },
      }
    );

    if (res.matchedCount > 0) {
      updatedCount++;
      console.log(`✓ Relinked "${name}" -> ${url}`);
    } else {
      console.warn(`⚠️ Product not found with name: "${name}"`);
    }
  }

  console.log(`\n🎉 Successfully relinked ${updatedCount} products with Cloudinary URLs!`);

  // Now sync imageGenJobs so jobs collection is perfectly aligned
  console.log('\n🔄 Syncing imageGenJobs collection...');
  await syncImageJobs();
  console.log('✓ imageGenJobs synced!');

  await closeDb();
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
