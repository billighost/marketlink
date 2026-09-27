import { connectDb, getDb, closeDb } from '../src/db/client.js';

async function main() {
  await connectDb();
  const db = getDb();

  const total = await db.collection('products').countDocuments();
  const withCloudinary = await db.collection('products').countDocuments({
    imageUrl: { $regex: '^https://res.cloudinary.com/' },
    imagePublicId: { $ne: null },
  });

  console.log(`Total products: ${total}`);
  console.log(`Products with valid Cloudinary image & public ID: ${withCloudinary}`);

  const sampleProducts = await db.collection('products').find({}).limit(5).toArray();
  for (const p of sampleProducts) {
    console.log(`\n✓ [${p.categorySlug}] ${p.name}`);
    console.log(`  URL: ${p.imageUrl}`);
    console.log(`  Public ID: ${p.imagePublicId}`);
  }

  // Check explain executionStats on imageGenJobs
  const explain = await db.collection('imageGenJobs')
    .find({ entityType: 'product', status: 'done' })
    .explain('executionStats');
  
  const stage = explain.executionStats.executionStages.stage;
  console.log(`\nQuery execution plan stage for imageGenJobs: ${stage}`);
  console.log(`Total docs examined: ${explain.executionStats.totalDocsExamined}, nReturned: ${explain.executionStats.nReturned}`);

  await closeDb();
}

main().catch(console.error);
