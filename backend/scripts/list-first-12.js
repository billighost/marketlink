import { connectDb, getDb, closeDb } from '../src/db/client.js';

async function main() {
  await connectDb();
  const db = getDb();
  const jobs = await db.collection('imageGenJobs').find({ entityType: 'product', status: 'pending' }).limit(12).toArray();
  for (let i = 0; i < jobs.length; i++) {
    const job = jobs[i];
    const prod = await db.collection('products').findOne({ _id: job.entityId });
    console.log(`${i + 1}. [${prod._id}] ${prod.name} (${prod.categorySlug}) - "${prod.description}" (Unit: ${prod.unit})`);
  }
  await closeDb();
}

main().catch(console.error);
