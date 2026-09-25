/**
 * Minimal database seed script.
 * Populates only the essential baseline data: one Admin user, standard categories,
 * and one active market, leaving all entity collections empty.
 * Used for end-to-end full scenario tests and UI empty-state verification.
 */

import { ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';
import { env } from '../config/env.js';
import { connectDb, closeDb } from './client.js';
import { COLLECTIONS, createCollections } from './collections.js';
import { ensureIndexes } from './indexes.js';
import { assertSafeDatabase } from './safetyGuard.js';

export async function runMinimalSeed(force = false, targetDb = null) {
  const hasForce = force || process.argv.includes('--force');
  const targetDbName = process.env.DB_NAME || env.DB_NAME;
  const isExplicitDevSeed = env.isDevelopment || targetDbName === 'marketlink_test';

  // Run safety guard check before touching any database
  assertSafeDatabase(targetDbName, env.MONGODB_URI, 'minimal seed reset', {
    isExplicitDevSeed,
    nodeEnv: env.NODE_ENV,
    force: hasForce,
  });

  const startTime = Date.now();
  console.log(`\n======================================================`);
  console.log(`🌱  Starting MarketLink Minimal Seed on "${targetDbName}" (${env.NODE_ENV})...`);
  console.log(`======================================================\n`);

  const db = targetDb || (await connectDb(env.MONGODB_URI, targetDbName));

  // 1. Ensure collections and indexes exist
  await createCollections(db);
  await ensureIndexes(db);

  // 2. Clear existing documents across collections to ensure a fresh, clean slate
  for (const collName of Object.values(COLLECTIONS)) {
    try {
      await db.collection(collName).deleteMany({});
    } catch {
      // Ignore if collection does not exist
    }
  }
  console.log('✓ Cleared all entity data from collections.');

  const now = new Date();
  const adminPasswordHash = await bcrypt.hash('Admin12345', 10);

  // 3. Single Market: Elm Street Market
  const elmMarket = {
    _id: new ObjectId(),
    name: 'Elm Street Market',
    slug: 'elm-street-market',
    address: '200 Elm Street, Maplewood, NJ',
    location: { type: 'Point', coordinates: [-74.172, 40.735] },
    schedule: [{ day: 'sat', openMin: 480, closeMin: 780 }],
    timezone: 'America/New_York',
    note: 'Free parking behind the community centre.',
    facilities: ['parking', 'restrooms', 'wheelchair-accessible', 'atm'],
    status: 'active',
    farmerCount: 0,
    createdAt: now,
    updatedAt: now,
  };
  await db.collection(COLLECTIONS.MARKETS).insertOne(elmMarket);
  console.log('✓ Seeded 1 market (Elm Street Market).');

  // 4. Standard Categories
  const categoryDefs = [
    { name: 'Vegetables', slug: 'vegetables', sortOrder: 1, art: 'carrot' },
    { name: 'Fruit', slug: 'fruit', sortOrder: 2, art: 'strawberries' },
    { name: 'Bakery', slug: 'bakery', sortOrder: 3, art: 'sourdough-boule' },
    { name: 'Dairy and eggs', slug: 'dairy-and-eggs', sortOrder: 4, art: 'egg-carton' },
    { name: 'Honey and jam', slug: 'honey-and-jam', sortOrder: 5, art: 'honey-jar' },
    { name: 'Herbs and flowers', slug: 'herbs-and-flowers', sortOrder: 6, art: 'flowers' },
    { name: 'Meat and fish', slug: 'meat-and-fish', sortOrder: 7, art: 'sausages' },
  ];
  const categories = categoryDefs.map((c) => ({
    _id: new ObjectId(),
    ...c,
    active: true,
  }));
  await db.collection(COLLECTIONS.CATEGORIES).insertMany(categories);
  console.log(`✓ Seeded ${categories.length} categories.`);

  // 5. Admin User
  const adminUser = {
    _id: new ObjectId(),
    role: 'admin',
    name: 'Sam Torres',
    email: 'admin@marketlink.test',
    passwordHash: adminPasswordHash,
    phone: '(555) 999-0001',
    address: 'MarketLink HQ, 100 Main St, Maplewood',
    status: 'active',
    homeMarketId: elmMarket._id,
    savedMarketIds: [elmMarket._id],
    notificationPrefs: { orderUpdates: true, readyAlerts: true, weeklyPicks: true, restockAlerts: true },
    failedLogins: 0,
    lockUntil: null,
    createdAt: now,
    updatedAt: now,
    lastLoginAt: now,
  };
  await db.collection(COLLECTIONS.USERS).insertOne(adminUser);
  console.log('✓ Seeded 1 admin user (Sam Torres / admin@marketlink.test).');

  // 6. Initialize counters
  await db.collection(COLLECTIONS.COUNTERS).updateOne(
    { _id: 'orderNumber' },
    { $setOnInsert: { seq: 1000 } },
    { upsert: true }
  );
  console.log('✓ Initialized order sequence counter.');

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`\n🎉 Minimal Seed completed successfully in ${duration}s.`);

  return {
    adminUser,
    elmMarket,
    categories,
  };
}

// Direct CLI invocation
if (process.argv[1] && process.argv[1].endsWith('seedMinimal.js')) {
  import('../config/env.js')
    .then(() => runMinimalSeed())
    .then(() => closeDb())
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Minimal seed failed:', err);
      process.exit(1);
    });
}
