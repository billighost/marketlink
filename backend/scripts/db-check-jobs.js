import { connectDb, getDb, closeDb } from '../src/db/client.js';

async function main() {
  await connectDb();
  const db = getDb();
  const stats = await db.collection('imageGenJobs').aggregate([
    { $group: { _id: { entityType: '$entityType', status: '$status' }, count: { $sum: 1 } } }
  ]).toArray();
  console.log('imageGenJobs status:');
  console.table(stats.map(s => ({ type: s._id.entityType, status: s._id.status, count: s.count })));

  const totalProducts = await db.collection('products').countDocuments();
  const productsWithCloudinary = await db.collection('products').countDocuments({ imageUrl: { $regex: '^https://res.cloudinary.com' } });
  console.log('Total products:', totalProducts, 'with Cloudinary:', productsWithCloudinary);

  const totalFarmers = await db.collection('farmers').countDocuments();
  const farmersWithBanner = await db.collection('farmers').countDocuments({ bannerUrl: { $regex: '^https://res.cloudinary.com' } });
  const farmersWithLogo = await db.collection('farmers').countDocuments({ logoUrl: { $regex: '^https://res.cloudinary.com' } });
  console.log('Total farmers:', totalFarmers, 'with Cloudinary banner:', farmersWithBanner, 'with logo:', farmersWithLogo);

  const totalMarkets = await db.collection('markets').countDocuments();
  const marketsWithBanner = await db.collection('markets').countDocuments({ bannerUrl: { $regex: '^https://res.cloudinary.com' } });
  console.log('Total markets:', totalMarkets, 'with Cloudinary banner:', marketsWithBanner);

  // List all products and their status
  const products = await db.collection('products').find({}, { projection: { name: 1, categorySlug: 1, imageUrl: 1 } }).toArray();
  console.log('\nAll products:');
  console.table(products.map(p => ({
    id: p._id.toString(),
    name: p.name,
    category: p.categorySlug,
    hasCloudinary: (p.imageUrl || '').startsWith('https://res.cloudinary.com')
  })));

  await closeDb();
}

main().catch(console.error);
