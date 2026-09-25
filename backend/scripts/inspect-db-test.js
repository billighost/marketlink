import '../src/config/env.js';
import { connectDb, closeDb } from '../src/db/client.js';
import { COLLECTIONS } from '../src/db/collections.js';

async function main() {
  const db = await connectDb(process.env.MONGODB_URI, 'marketlink_test');
  const farmers = await db.collection(COLLECTIONS.FARMERS).find({}).toArray();
  console.log('Farmers count in marketlink_test:', farmers.length);
  farmers.forEach(f => console.log('  Farmer:', f.stallName, 'ID:', f._id.toString()));

  const products = await db.collection(COLLECTIONS.PRODUCTS).find({}).toArray();
  console.log('Products count in marketlink_test:', products.length);
  const orphanProducts = [];
  const farmerIdSet = new Set(farmers.map(f => f._id.toString()));
  for (const p of products) {
    if (!farmerIdSet.has(p.farmerId.toString())) {
      orphanProducts.push({ name: p.name, farmerId: p.farmerId.toString() });
    }
  }
  console.log('Orphan products count:', orphanProducts.length);
  if (orphanProducts.length > 0) {
    console.log('Sample orphan products:', orphanProducts.slice(0, 5));
  }
  await closeDb();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
