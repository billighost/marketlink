/**
 * Directly inspects MongoDB Atlas using native driver.
 * Prints document counts, indexes, and sample documents with secrets masked.
 */

import { connectDb, closeDb } from '../src/db/client.js';

async function inspect() {
  const db = await connectDb();
  console.log('\n======================================================');
  console.log(`📊 Direct Inspection of Database "${db.databaseName}"`);
  console.log('======================================================\n');

  // 1. Document counts per collection
  const collections = await db.listCollections().toArray();
  const counts = [];
  for (const coll of collections.sort((a, b) => a.name.localeCompare(b.name))) {
    const count = await db.collection(coll.name).countDocuments();
    counts.push({ Collection: coll.name, Documents: count });
  }
  console.log('Collection Document Counts:');
  console.table(counts);

  // 2. Indexes on users, products, orders
  for (const name of ['users', 'products', 'orders']) {
    console.log(`\nIndexes on "${name}":`);
    const idxs = await db.collection(name).indexes();
    console.table(idxs.map((i) => ({ name: i.name, key: JSON.stringify(i.key), unique: Boolean(i.unique) })));
  }

  // 3. Sample documents
  console.log('\nSample Document from "users" (passwordHash masked):');
  const user = await db.collection('users').findOne({});
  if (user) {
    user.passwordHash = '****[MASKED_BCRYPT_HASH]****';
    console.log(JSON.stringify(user, null, 2));
  }

  console.log('\nSample Document from "products":');
  const product = await db.collection('products').findOne({});
  console.log(JSON.stringify(product, null, 2));

  console.log('\nSample Document from "orders":');
  const order = await db.collection('orders').findOne({});
  console.log(JSON.stringify(order, null, 2));

  await closeDb();
}

inspect().catch(console.error);
