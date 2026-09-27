import '../src/config/env.js';
import { connectDb, closeDb } from '../src/db/client.js';

async function run() {
  const db = await connectDb();
  const farmers = await db.collection('farmers').find({}).toArray();
  for (const f of farmers) {
    if (!f.listingEnabled) {
      console.log('Activating farmer:', f.stallName, f._id);
      await db.collection('farmers').updateOne({ _id: f._id }, { $set: { listingEnabled: true, updatedAt: new Date() } });
      await db.collection('users').updateOne({ _id: f.userId }, { $set: { status: 'active', updatedAt: new Date() } });
      await db.collection('products').updateMany(
        { farmerId: f._id, archived: { $ne: true }, availability: { $ne: 'hidden' } },
        { $set: { listed: true, updatedAt: new Date() } }
      );
    }
  }
  console.log('All farmers activated.');
  await closeDb();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
