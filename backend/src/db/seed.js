/**
 * Database seed script.
 * Populates all collections with rich, realistic, interconnected data ported from front-end placeholders.
 * Calculates denormalised stats dynamically and guarantees valid relations.
 */

import { ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';
import { env } from '../config/env.js';
import { connectDb, closeDb } from './client.js';
import { COLLECTIONS, createCollections } from './collections.js';
import { ensureIndexes } from './indexes.js';
import {
  getNextWeekday,
  getPastWeekday,
  addDays,
  addHours,
  addMinutes,
  toMinutesFromMidnight,
} from '../utils/time.js';

export async function runSeed(force = false) {
  // Safety check: Never run in production without explicit --force
  if (env.isProduction && !force && !process.argv.includes('--force')) {
    console.error('[SEED ERROR] Refusing to run seed in production environment without --force flag.');
    process.exit(1);
  }

  const startTime = Date.now();
  console.log(`\n======================================================`);
  console.log(`🌱  Starting MarketLink Database Seed (${env.NODE_ENV})...`);
  console.log(`======================================================\n`);

  const db = await connectDb();

  // 1. Drop existing collections to ensure a fresh, clean slate
  const existingCollections = await db.listCollections().toArray();
  for (const coll of existingCollections) {
    await db.collection(coll.name).drop();
  }
  console.log('✓ Cleaned existing collections.');

  // 2. Re-create collections with validators and indexes
  await createCollections(db);
  await ensureIndexes(db);
  console.log('✓ Applied JSON schema validators and indexes.');

  // 3. Hashes
  console.log('⏳ Hashing demo credentials...');
  const userPasswordHash = await bcrypt.hash('market123', 10);
  const adminPasswordHash = await bcrypt.hash('Admin12345', 10);
  const now = new Date();

  // ── 4. Categories ──────────────────────────────────────────────────────────
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
  const categoryMap = new Map(categories.map((c) => [c.name, c]));
  console.log(`✓ Seeded ${categories.length} categories.`);

  // ── 5. Markets ─────────────────────────────────────────────────────────────
  const marketDefs = [
    {
      name: 'Elm Street Market',
      slug: 'elm-street-market',
      address: '200 Elm Street, Maplewood, NJ',
      location: { type: 'Point', coordinates: [-74.172, 40.735] },
      schedule: [{ day: 'sat', openMin: 480, closeMin: 780 }], // 8:00 AM - 1:00 PM
      timezone: 'America/New_York',
      note: 'Free parking behind the community centre.',
      facilities: ['parking', 'restrooms', 'wheelchair-accessible', 'atm'],
      status: 'active',
      farmerCount: 0,
      createdAt: now,
      updatedAt: now,
    },
    {
      name: 'Riverside Sunday Market',
      slug: 'riverside-sunday-market',
      address: '45 River Road, Millburn, NJ',
      location: { type: 'Point', coordinates: [-74.31, 40.725] },
      schedule: [{ day: 'sun', openMin: 540, closeMin: 840 }], // 9:00 AM - 2:00 PM
      timezone: 'America/New_York',
      note: 'Dogs welcome. Card payments accepted at most stalls.',
      facilities: ['dog-friendly', 'river-trail', 'card-payments'],
      status: 'active',
      farmerCount: 0,
      createdAt: now,
      updatedAt: now,
    },
    {
      name: 'Hilltop Farmers Market',
      slug: 'hilltop-farmers-market',
      address: '88 Summit Avenue, Summit, NJ',
      location: { type: 'Point', coordinates: [-74.362, 40.715] },
      schedule: [
        { day: 'wed', openMin: 450, closeMin: 720 }, // 7:30 AM - 12:00 PM
        { day: 'sat', openMin: 450, closeMin: 720 },
      ],
      timezone: 'America/New_York',
      note: 'Wheelchair accessible. Covered pavilion.',
      facilities: ['covered-pavilion', 'step-free-access', 'public-transit-nearby'],
      status: 'active',
      farmerCount: 0,
      createdAt: now,
      updatedAt: now,
    },
    {
      name: 'Grove Park Market',
      slug: 'grove-park-market',
      address: '12 Park Lane, South Orange, NJ',
      location: { type: 'Point', coordinates: [-74.264, 40.748] },
      schedule: [{ day: 'sat', openMin: 510, closeMin: 810 }], // 8:30 AM - 1:30 PM
      timezone: 'America/New_York',
      note: 'Live music most Saturdays. Picnic area nearby.',
      facilities: ['live-music', 'picnic-area', 'playground'],
      status: 'active',
      farmerCount: 0,
      createdAt: now,
      updatedAt: now,
    },
  ];

  const markets = marketDefs.map((m) => ({ _id: new ObjectId(), ...m }));
  await db.collection(COLLECTIONS.MARKETS).insertMany(markets);
  const elmMarket = markets[0];
  const riverMarket = markets[1];
  const hillMarket = markets[2];
  const groveMarket = markets[3];
  console.log(`✓ Seeded ${markets.length} markets.`);

  // ── 6. Users (Admin + Customers + Farmers) ──────────────────────────────────
  const users = [];

  // Admin
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
    createdAt: now,
    updatedAt: now,
    lastLoginAt: now,
  };
  users.push(adminUser);

  // Customers (8 total: 7 active, 1 inactive)
  const customerDefs = [
    {
      name: 'George Adams',
      email: 'george@example.com',
      phone: '(555) 012-3456',
      address: '14 Birch Lane, Maplewood, NJ',
      status: 'active',
      homeMarketId: elmMarket._id,
      savedMarketIds: [elmMarket._id, riverMarket._id],
    },
    {
      name: 'Inactive Customer',
      email: 'inactive.customer@example.com',
      phone: '(555) 012-0000',
      address: '99 Dormant Road, Maplewood, NJ',
      status: 'inactive',
      homeMarketId: null,
      savedMarketIds: [],
    },
    {
      name: 'Mia Kowalski',
      email: 'mia@example.com',
      phone: '(555) 012-1111',
      address: '22 Elm Street, Maplewood, NJ',
      status: 'active',
      homeMarketId: elmMarket._id,
      savedMarketIds: [elmMarket._id],
    },
    {
      name: 'James Thornton',
      email: 'james@example.com',
      phone: '(555) 012-2222',
      address: '88 Meadow Way, Millburn, NJ',
      status: 'active',
      homeMarketId: riverMarket._id,
      savedMarketIds: [riverMarket._id],
    },
    {
      name: 'Sarah Lin',
      email: 'sarah@example.com',
      phone: '(555) 012-3333',
      address: '404 Oak Avenue, Summit, NJ',
      status: 'active',
      homeMarketId: hillMarket._id,
      savedMarketIds: [hillMarket._id],
    },
    {
      name: 'David Ross',
      email: 'david@example.com',
      phone: '(555) 012-4444',
      address: '12 Pine Court, South Orange, NJ',
      status: 'active',
      homeMarketId: groveMarket._id,
      savedMarketIds: [groveMarket._id],
    },
    {
      name: 'Elena Ramos',
      email: 'elena@example.com',
      phone: '(555) 012-5555',
      address: '77 Forest Drive, Maplewood, NJ',
      status: 'active',
      homeMarketId: elmMarket._id,
      savedMarketIds: [elmMarket._id, hillMarket._id],
    },
    {
      name: 'Chris Ward',
      email: 'chris@example.com',
      phone: '(555) 012-6666',
      address: '5 Valley Road, Millburn, NJ',
      status: 'active',
      homeMarketId: riverMarket._id,
      savedMarketIds: [riverMarket._id],
    },
  ];

  const customerUsers = customerDefs.map((c) => ({
    _id: new ObjectId(),
    role: 'customer',
    name: c.name,
    email: c.email.toLowerCase(),
    passwordHash: userPasswordHash,
    phone: c.phone,
    address: c.address,
    status: c.status,
    homeMarketId: c.homeMarketId,
    savedMarketIds: c.savedMarketIds,
    notificationPrefs: {
      orderUpdates: true,
      readyAlerts: true,
      weeklyPicks: true,
      restockAlerts: false,
    },
    createdAt: now,
    updatedAt: now,
    lastLoginAt: now,
  }));
  users.push(...customerUsers);
  const georgeUser = customerUsers[0];

  // Farmers (14 total: 12 from placeholders + 1 pending + 1 suspended)
  const farmerRaw = [
    {
      code: 'f-riverbend',
      stallName: 'Riverbend Farm',
      contactPerson: 'Anna Kowalski',
      email: 'riverbend@example.com',
      stallNumber: 'Stall 4',
      markets: [elmMarket._id, riverMarket._id, groveMarket._id],
      specialty: 'Vegetables and herbs',
      story: 'Three generations of the Kowalski family have farmed this 40-acre plot along the Passaic River. Everything is picked the morning before market.',
      since: 2018,
      operatingDays: ['sat', 'sun'],
      art: 'crate-carrots',
      isTopSeller: true,
      isNew: false,
      status: 'active',
    },
    {
      code: 'f-oakmill',
      stallName: 'Oak & Mill Bakery',
      contactPerson: 'Dan and Priya',
      email: 'oakmill@example.com',
      stallNumber: 'Stall 7',
      markets: [elmMarket._id, riverMarket._id, groveMarket._id],
      specialty: 'Sourdough and pastries',
      story: 'Dan and Priya bake everything by hand in a converted garage using heirloom flour from a New York mill. Their croissants sell out by 10 am.',
      since: 2020,
      operatingDays: ['sat', 'sun'],
      art: 'sourdough-boule',
      isTopSeller: true,
      isNew: false,
      status: 'active',
    },
    {
      code: 'f-hollowcreek',
      stallName: 'Hollow Creek Apiary',
      contactPerson: 'Lena Brooks',
      email: 'hollowcreek@example.com',
      stallNumber: 'Stall 2',
      markets: [elmMarket._id, hillMarket._id],
      specialty: 'Raw honey and preserves',
      story: 'Beekeeper Lena manages 30 hives across three wildflower meadows in Morris County. Each jar is labelled with the season it was harvested.',
      since: 2019,
      operatingDays: ['sat', 'wed'],
      art: 'honey-jar',
      isTopSeller: false,
      isNew: false,
      status: 'active',
    },
    {
      code: 'f-willowbend',
      stallName: 'Willow Bend Poultry',
      contactPerson: 'David Miller',
      email: 'willowbend@example.com',
      stallNumber: 'Stall 9',
      markets: [elmMarket._id, hillMarket._id],
      specialty: 'Free-range eggs and chicken',
      story: 'The hens at Willow Bend roam five acres of pasture and eat only organic feed. Eggs come in every shade from cream to blue.',
      since: 2017,
      operatingDays: ['sat', 'wed'],
      art: 'egg-carton',
      isTopSeller: false,
      isNew: false,
      status: 'active',
    },
    {
      code: 'f-maplecrest',
      stallName: 'Maplecrest Creamery',
      contactPerson: 'Lucas Vance',
      email: 'maplecrest@example.com',
      stallNumber: 'Stall 11',
      markets: [elmMarket._id, riverMarket._id],
      specialty: 'Artisan cheese and butter',
      story: 'Small-batch Jersey cow dairy from a 60-acre farm in Hunterdon County. Their aged cheddar won Best in State two years running.',
      since: 2021,
      operatingDays: ['sat', 'sun'],
      art: 'cheese',
      isTopSeller: false,
      isNew: false,
      status: 'active',
    },
    {
      code: 'f-sunridge',
      stallName: 'Sunridge Berry Farm',
      contactPerson: 'Clara Hayes',
      email: 'sunridge@example.com',
      stallNumber: 'Stall 3',
      markets: [elmMarket._id, riverMarket._id],
      specialty: 'Berries and stone fruit',
      story: 'Five varieties of blueberry plus strawberries, raspberries, and peaches on a sunny south-facing slope. Pick-your-own opens in June.',
      since: 2022,
      operatingDays: ['sat', 'sun'],
      art: 'strawberries',
      isTopSeller: true,
      isNew: false,
      status: 'active',
    },
    {
      code: 'f-greenhollow',
      stallName: 'Green Hollow Mushrooms',
      contactPerson: 'Marcus Webb',
      email: 'greenhollow@example.com',
      stallNumber: 'Stall 6',
      markets: [elmMarket._id, hillMarket._id],
      specialty: 'Gourmet mushrooms',
      story: 'Grown in repurposed shipping containers using oak sawdust from local woodworkers. Shiitake, oyster, lion\'s mane, and maitake year-round.',
      since: 2023,
      operatingDays: ['sat', 'wed'],
      art: 'mushrooms',
      isTopSeller: false,
      isNew: true,
      status: 'active',
    },
    {
      code: 'f-thornberry',
      stallName: 'Thornberry Preserves',
      contactPerson: 'Margaret Thorn',
      email: 'thornberry@example.com',
      stallNumber: 'Stall 5',
      markets: [elmMarket._id, riverMarket._id],
      specialty: 'Jams and fruit butter',
      story: 'Margaret has been making small-batch jams from her garden for 20 years. Every jar uses fruit she grew herself, and nothing else.',
      since: 2016,
      operatingDays: ['sat', 'sun'],
      art: 'jam',
      isTopSeller: false,
      isNew: false,
      status: 'active',
    },
    {
      code: 'f-cedarbrook',
      stallName: 'Cedarbrook Flowers',
      contactPerson: 'Rachel Green',
      email: 'cedarbrook@example.com',
      stallNumber: 'Stall 12',
      markets: [elmMarket._id, hillMarket._id],
      specialty: 'Cut flowers and herbs',
      story: 'Seasonal bouquets and potted herbs grown without pesticides on a two-acre plot behind the family house. Lavender and sunflowers are the favourites.',
      since: 2024,
      operatingDays: ['sat', 'wed'],
      art: 'flowers',
      isTopSeller: false,
      isNew: true,
      status: 'active',
    },
    {
      code: 'f-oldstone',
      stallName: 'Old Stone Fishmonger',
      contactPerson: 'Captain John',
      email: 'oldstone@example.com',
      stallNumber: 'Stall 10',
      markets: [elmMarket._id, groveMarket._id],
      specialty: 'Fresh catch and smoked fish',
      story: 'Day-boat fish from Barnegat Bay and cold-smoked trout from their own smokehouse. They arrive at 6 am with the catch packed on ice.',
      since: 2019,
      operatingDays: ['sat'],
      art: 'fish',
      isTopSeller: false,
      isNew: false,
      status: 'active',
    },
    {
      code: 'f-wildmeadow',
      stallName: 'Wild Meadow Meats',
      contactPerson: 'Frank Castle',
      email: 'wildmeadow@example.com',
      stallNumber: 'Stall 8',
      markets: [elmMarket._id, groveMarket._id],
      specialty: 'Sausages and cured meats',
      story: 'Pasture-raised pork and beef from a farm in Warren County. Their maple breakfast sausage is the reason people queue before 8.',
      since: 2020,
      operatingDays: ['sat'],
      art: 'sausages',
      isTopSeller: true,
      isNew: false,
      status: 'active',
    },
    {
      code: 'f-clearwater',
      stallName: 'Clearwater Orchards',
      contactPerson: 'Henry Clearwater',
      email: 'clearwater@example.com',
      stallNumber: 'Stall 1',
      markets: [hillMarket._id],
      specialty: 'Apples, pears and cider',
      story: 'A century-old orchard with 40 heritage apple varieties. Their fresh-pressed cider is unfiltered and unpasteurised.',
      since: 2015,
      operatingDays: ['sat', 'wed'],
      art: 'apples',
      isTopSeller: true,
      isNew: false,
      status: 'active',
    },
    // Required pending farmer
    {
      code: 'f-pending',
      stallName: 'Pine Valley Apiary',
      contactPerson: 'Arthur Pendelton',
      email: 'pending.farmer@example.com',
      stallNumber: 'TBD',
      markets: [elmMarket._id],
      specialty: 'Artisan mountain honey',
      story: 'Waiting for market permit inspection.',
      since: 2025,
      operatingDays: ['sat'],
      art: 'honey-jar',
      isTopSeller: false,
      isNew: true,
      status: 'pending',
    },
    // Required suspended farmer
    {
      code: 'f-suspended',
      stallName: 'Shadowbrook Orchard',
      contactPerson: 'Victor Vance',
      email: 'suspended.farmer@example.com',
      stallNumber: 'Stall 15',
      markets: [elmMarket._id],
      specialty: 'Heirloom apples and plums',
      story: 'Under audit for license renewal.',
      since: 2018,
      operatingDays: ['sat'],
      art: 'apples',
      isTopSeller: false,
      isNew: false,
      status: 'suspended',
    },
  ];

  const farmers = [];
  const farmerMap = new Map();

  for (const f of farmerRaw) {
    const userId = new ObjectId();
    const farmerId = new ObjectId();

    const userDoc = {
      _id: userId,
      role: 'farmer',
      name: f.contactPerson,
      email: f.email.toLowerCase(),
      passwordHash: userPasswordHash,
      phone: '(555) 300-100' + farmers.length,
      address: 'Farmstead Route ' + (farmers.length + 1) + ', NJ',
      status: f.status,
      homeMarketId: f.markets[0] || null,
      savedMarketIds: f.markets,
      notificationPrefs: {
        orderUpdates: true,
        readyAlerts: true,
        weeklyPicks: false,
        restockAlerts: true,
      },
      createdAt: now,
      updatedAt: now,
      lastLoginAt: now,
    };
    users.push(userDoc);

    const farmerDoc = {
      _id: farmerId,
      userId,
      stallName: f.stallName,
      contactPerson: f.contactPerson,
      phone: userDoc.phone,
      email: f.email.toLowerCase(),
      specialty: f.specialty,
      story: f.story,
      since: f.since,
      stallNumber: f.stallNumber,
      marketIds: f.markets,
      operatingDays: f.operatingDays,
      pickupWindows: f.operatingDays.map((d) => ({
        day: d,
        startMin: 480, // 8:00 AM
        endMin: 720,   // 12:00 PM
      })),
      cutoffMinutesBefore: 720, // 12 hours before pickup start
      address: userDoc.address,
      location: {
        type: 'Point',
        coordinates: [-74.172 + (farmers.length * 0.01), 40.735 + (farmers.length * 0.01)],
      },
      art: f.art,
      listingEnabled: f.status === 'active',
      ratingAvg: 0,
      ratingCount: 0,
      salesCount: 0,
      isTopSeller: f.isTopSeller,
      isNew: f.isNew,
      createdAt: now,
      updatedAt: now,
    };
    farmers.push(farmerDoc);
    farmerMap.set(f.code, farmerDoc);
  }

  await db.collection(COLLECTIONS.USERS).insertMany(users);
  await db.collection(COLLECTIONS.FARMERS).insertMany(farmers);
  console.log(`✓ Seeded ${users.length} users and ${farmers.length} farmer profiles.`);

  // ── 7. Products (Ported from placeholders + expanded to >40) ──────────────────
  const productDefs = [
    // Riverbend Farm — Vegetables
    { farmerCode: 'f-riverbend', name: 'Heirloom tomatoes', category: 'Vegetables', priceCents: 450, unit: 'lb', availability: 'in', qty: 24, lowStock: 5, art: 'tomato', tags: ['seasonal', 'bestseller'], desc: 'A mix of Cherokee Purple, Brandywine and Green Zebra, picked yesterday.' },
    { farmerCode: 'f-riverbend', name: 'Rainbow carrots', category: 'Vegetables', priceCents: 450, unit: 'bunch', availability: 'in', qty: 18, lowStock: 4, art: 'carrot', tags: ['organic'], desc: 'Purple, orange, yellow and white carrots, tops still attached.' },
    { farmerCode: 'f-riverbend', name: 'Red and gold beets', category: 'Vegetables', priceCents: 500, unit: 'bunch', availability: 'low', qty: 4, lowStock: 5, art: 'beet-bunch', tags: ['seasonal'], desc: 'Sweet and earthy, roasted or raw in salads.' },
    { farmerCode: 'f-riverbend', name: 'Tuscan kale', category: 'Vegetables', priceCents: 350, unit: 'bunch', availability: 'in', qty: 15, lowStock: 4, art: 'leafy-greens', tags: ['organic'], desc: 'Dark, crinkly lacinato kale. Perfect for soups and chips.' },
    { farmerCode: 'f-riverbend', name: 'Yukon Gold potatoes', category: 'Vegetables', priceCents: 300, unit: 'lb', availability: 'in', qty: 30, lowStock: 8, art: 'potatoes', tags: [], desc: 'Creamy and buttery. Excellent mashed or roasted.' },
    { farmerCode: 'f-riverbend', name: 'Sweet corn', category: 'Vegetables', priceCents: 100, unit: 'each', availability: 'low', qty: 6, lowStock: 10, art: 'corn', tags: ['seasonal', 'new'], desc: 'Picked at dawn. Best eaten the same day.' },
    { farmerCode: 'f-riverbend', name: 'Butternut squash', category: 'Vegetables', priceCents: 300, unit: 'each', availability: 'in', qty: 20, lowStock: 5, art: 'squash', tags: ['seasonal'], desc: 'Dense, sweet flesh. Roast, mash, or turn into soup.' },

    // Oak & Mill Bakery
    { farmerCode: 'f-oakmill', name: 'Sourdough boule', category: 'Bakery', priceCents: 700, unit: 'loaf', availability: 'in', qty: 12, lowStock: 3, art: 'sourdough-boule', tags: ['bestseller'], desc: 'Naturally leavened over 36 hours with a crackling crust.' },
    { farmerCode: 'f-oakmill', name: 'Butter croissant', category: 'Bakery', priceCents: 400, unit: 'each', availability: 'in', qty: 20, lowStock: 5, art: 'croissant', tags: ['bestseller'], desc: 'Flaky, laminated by hand with grass-fed butter.' },
    { farmerCode: 'f-oakmill', name: 'Seeded rye loaf', category: 'Bakery', priceCents: 800, unit: 'loaf', availability: 'in', qty: 8, lowStock: 2, art: 'sourdough-boule', tags: ['new'], desc: 'Dense, dark rye studded with caraway and sunflower seeds.' },
    { farmerCode: 'f-oakmill', name: 'Almond pastry', category: 'Bakery', priceCents: 450, unit: 'each', availability: 'in', qty: 15, lowStock: 3, art: 'croissant', tags: ['bestseller'], desc: 'Twice-baked butter croissant filled with velvety frangipane.' },

    // Hollow Creek Apiary
    { farmerCode: 'f-hollowcreek', name: 'Wildflower honey', category: 'Honey and jam', priceCents: 950, unit: 'jar', availability: 'low', qty: 3, lowStock: 5, art: 'honey-jar', tags: ['bestseller'], desc: 'Raw, unfiltered summer wildflower honey from Morris County.' },
    { farmerCode: 'f-hollowcreek', name: 'Creamed clover honey', category: 'Honey and jam', priceCents: 1100, unit: 'jar', availability: 'in', qty: 10, lowStock: 3, art: 'honey-jar', tags: [], desc: 'Spreadable whipped honey with a smooth, buttery texture.' },
    { farmerCode: 'f-hollowcreek', name: 'Honeycomb section', category: 'Honey and jam', priceCents: 1400, unit: 'jar', availability: 'in', qty: 6, lowStock: 2, art: 'honey-jar', tags: ['seasonal'], desc: 'Pure fresh honeycomb cut straight from the cedar hive.' },

    // Willow Bend Poultry
    { farmerCode: 'f-willowbend', name: 'Farm eggs', category: 'Dairy and eggs', priceCents: 600, unit: 'dozen', availability: 'in', qty: 14, lowStock: 4, art: 'egg-carton', tags: ['organic'], desc: 'Free-range, pasture-raised. Yolks as orange as sunset.' },
    { farmerCode: 'f-willowbend', name: 'Half-dozen eggs', category: 'Dairy and eggs', priceCents: 350, unit: 'each', availability: 'in', qty: 10, lowStock: 3, art: 'egg-carton', tags: [], desc: 'Same pasture-raised eggs in a smaller carton.' },
    { farmerCode: 'f-willowbend', name: 'Pastured whole chicken', category: 'Meat and fish', priceCents: 1800, unit: 'each', availability: 'in', qty: 8, lowStock: 2, art: 'egg-carton', tags: ['organic'], desc: 'Air-chilled, pasture-raised whole roasting chicken (approx 4 lb).' },

    // Maplecrest Creamery
    { farmerCode: 'f-maplecrest', name: 'Aged farmhouse cheddar', category: 'Dairy and eggs', priceCents: 1200, unit: 'each', availability: 'in', qty: 8, lowStock: 2, art: 'cheese', tags: ['bestseller'], desc: 'Sharp, crumbly, aged 18 months in their cellar.' },
    { farmerCode: 'f-maplecrest', name: 'Fresh ricotta', category: 'Dairy and eggs', priceCents: 800, unit: 'jar', availability: 'in', qty: 6, lowStock: 2, art: 'cheese', tags: ['new'], desc: 'Made that morning from whole Jersey cow milk. Creamy and mild.' },
    { farmerCode: 'f-maplecrest', name: 'Cultured butter', category: 'Dairy and eggs', priceCents: 650, unit: 'each', availability: 'in', qty: 12, lowStock: 4, art: 'milk-bottle', tags: [], desc: 'Tangy, European-style cultured butter with sea salt flakes.' },
    { farmerCode: 'f-maplecrest', name: 'Whole milk', category: 'Dairy and eggs', priceCents: 550, unit: 'jar', availability: 'in', qty: 10, lowStock: 3, art: 'milk-bottle', tags: [], desc: 'Non-homogenised, cream-top Jersey cow milk in a glass bottle.' },

    // Sunridge Berry Farm
    { farmerCode: 'f-sunridge', name: 'Strawberries', category: 'Fruit', priceCents: 600, unit: 'pint', availability: 'in', qty: 16, lowStock: 5, art: 'strawberries', tags: ['seasonal', 'bestseller'], desc: 'Sweet, fragrant Earliglow berries picked that morning.' },
    { farmerCode: 'f-sunridge', name: 'Blueberries', category: 'Fruit', priceCents: 550, unit: 'pint', availability: 'in', qty: 20, lowStock: 6, art: 'blueberries', tags: ['seasonal'], desc: 'Plump Duke and Bluecrop blueberries from the sunny hillside.' },
    { farmerCode: 'f-sunridge', name: 'Mixed berry box', category: 'Fruit', priceCents: 1000, unit: 'pint', availability: 'low', qty: 3, lowStock: 4, art: 'strawberries', tags: ['seasonal'], desc: 'A little of everything: strawberries, blueberries, raspberries.' },
    { farmerCode: 'f-sunridge', name: 'Red raspberries', category: 'Fruit', priceCents: 650, unit: 'pint', availability: 'in', qty: 12, lowStock: 3, art: 'strawberries', tags: ['seasonal'], desc: 'Hand-picked heritage raspberries, sweet and delicate.' },

    // Green Hollow Mushrooms
    { farmerCode: 'f-greenhollow', name: 'Oyster mushrooms', category: 'Vegetables', priceCents: 800, unit: 'lb', availability: 'in', qty: 10, lowStock: 3, art: 'mushrooms', tags: ['new'], desc: 'Tender blue oysters grown on oak sawdust. Delicate and nutty.' },
    { farmerCode: 'f-greenhollow', name: 'Lion\'s mane', category: 'Vegetables', priceCents: 1400, unit: 'lb', availability: 'in', qty: 5, lowStock: 2, art: 'mushrooms', tags: ['new'], desc: 'Shaggy, lobster-textured mushroom. Slice thick and sear in butter.' },
    { farmerCode: 'f-greenhollow', name: 'Shiitake cluster', category: 'Vegetables', priceCents: 1000, unit: 'lb', availability: 'in', qty: 8, lowStock: 3, art: 'mushrooms', tags: ['organic'], desc: 'Dense, smoky shiitakes cultivated on natural hardwood logs.' },

    // Thornberry Preserves
    { farmerCode: 'f-thornberry', name: 'Strawberry jam', category: 'Honey and jam', priceCents: 750, unit: 'jar', availability: 'in', qty: 14, lowStock: 4, art: 'jam', tags: ['bestseller'], desc: 'Just strawberries, sugar and lemon. Nothing else.' },
    { farmerCode: 'f-thornberry', name: 'Fig and walnut butter', category: 'Honey and jam', priceCents: 900, unit: 'jar', availability: 'in', qty: 8, lowStock: 3, art: 'jam', tags: ['seasonal'], desc: 'Thick, spoonable fig butter with toasted walnut pieces.' },
    { farmerCode: 'f-thornberry', name: 'Peach chutney', category: 'Honey and jam', priceCents: 800, unit: 'jar', availability: 'out', qty: 0, lowStock: 3, art: 'jam', tags: ['seasonal'], desc: 'Spiced peach chutney with ginger. Back when peaches return.' },

    // Cedarbrook Flowers
    { farmerCode: 'f-cedarbrook', name: 'Seasonal bouquet', category: 'Herbs and flowers', priceCents: 1200, unit: 'bunch', availability: 'in', qty: 10, lowStock: 3, art: 'flowers', tags: ['seasonal', 'new'], desc: 'Mixed dahlias, zinnias and greenery, wrapped in brown paper.' },
    { farmerCode: 'f-cedarbrook', name: 'Fresh basil pot', category: 'Herbs and flowers', priceCents: 400, unit: 'each', availability: 'in', qty: 8, lowStock: 2, art: 'herbs', tags: [], desc: 'A living Genovese basil plant. Snip what you need, keep it growing.' },
    { farmerCode: 'f-cedarbrook', name: 'Dried lavender bunch', category: 'Herbs and flowers', priceCents: 600, unit: 'bunch', availability: 'in', qty: 15, lowStock: 4, art: 'flowers', tags: ['seasonal'], desc: 'English lavender dried slowly in the barn. Fills a room with scent.' },

    // Old Stone Fishmonger
    { farmerCode: 'f-oldstone', name: 'Fresh striped bass', category: 'Meat and fish', priceCents: 1600, unit: 'lb', availability: 'in', qty: 6, lowStock: 2, art: 'fish', tags: [], desc: 'Day-boat catch from Barnegat Bay, filleted to order.' },
    { farmerCode: 'f-oldstone', name: 'Cold-smoked trout', category: 'Meat and fish', priceCents: 1200, unit: 'each', availability: 'in', qty: 8, lowStock: 2, art: 'fish', tags: ['bestseller'], desc: 'Beechwood-smoked rainbow trout. Silky and delicate.' },
    { farmerCode: 'f-oldstone', name: 'Smoked fish pate', category: 'Meat and fish', priceCents: 750, unit: 'jar', availability: 'in', qty: 12, lowStock: 3, art: 'fish', tags: ['new'], desc: 'Flaked smoked fish blended with dill, capers, and cream cheese.' },

    // Wild Meadow Meats
    { farmerCode: 'f-wildmeadow', name: 'Maple breakfast sausage', category: 'Meat and fish', priceCents: 900, unit: 'bag', availability: 'in', qty: 12, lowStock: 4, art: 'sausages', tags: ['bestseller'], desc: 'Sweet, smoky pork sausage with real maple syrup. The Saturday queue-maker.' },
    { farmerCode: 'f-wildmeadow', name: 'Italian pork sausage', category: 'Meat and fish', priceCents: 850, unit: 'bag', availability: 'in', qty: 10, lowStock: 3, art: 'sausages', tags: [], desc: 'Fennel seed, garlic and crushed red pepper. Grill or braise.' },
    { farmerCode: 'f-wildmeadow', name: 'Grass-fed ground beef', category: 'Meat and fish', priceCents: 950, unit: 'lb', availability: 'in', qty: 15, lowStock: 4, art: 'sausages', tags: ['organic'], desc: '85/15 lean ground beef from pasture-raised Black Angus.' },

    // Clearwater Orchards
    { farmerCode: 'f-clearwater', name: 'Honeycrisp apples', category: 'Fruit', priceCents: 400, unit: 'lb', availability: 'in', qty: 25, lowStock: 6, art: 'apples', tags: ['seasonal', 'bestseller'], desc: 'Crisp, sweet-tart and impossibly juicy. The apple that ruins all other apples.' },
    { farmerCode: 'f-clearwater', name: 'Bartlett pears', category: 'Fruit', priceCents: 350, unit: 'lb', availability: 'in', qty: 18, lowStock: 4, art: 'pears', tags: ['seasonal'], desc: 'Buttery when ripe. Let them sit on the counter for a day or two.' },
    { farmerCode: 'f-clearwater', name: 'Fresh-pressed cider', category: 'Fruit', priceCents: 800, unit: 'jar', availability: 'low', qty: 4, lowStock: 5, art: 'apples', tags: ['seasonal', 'new'], desc: 'Unfiltered, unpasteurised blend of heritage apples. Shake before pouring.' },
  ];

  const products = [];
  const productCodeMap = new Map();

  for (let i = 0; i < productDefs.length; i++) {
    const def = productDefs[i];
    const farmer = farmerMap.get(def.farmerCode);
    const category = categoryMap.get(def.category);

    const prodDoc = {
      _id: new ObjectId(),
      farmerId: farmer._id,
      farmerUserId: farmer.userId,
      farmer: {
        stallName: farmer.stallName,
        stallNumber: farmer.stallNumber,
        art: farmer.art,
      },
      marketIds: farmer.marketIds,
      categoryId: category._id,
      categorySlug: category.slug,
      name: def.name,
      description: def.desc,
      priceCents: def.priceCents,
      unit: def.unit,
      quantityAvailable: def.qty,
      lowStockThreshold: def.lowStock,
      availability: def.availability,
      tags: def.tags,
      art: def.art,
      weekly: {
        enabled: true,
        defaultQty: def.qty + 10,
      },
      ratingAvg: 0,
      ratingCount: 0,
      salesCount: 0,
      moderation: {
        removed: false,
      },
      createdAt: now,
      updatedAt: now,
    };
    products.push(prodDoc);
    productCodeMap.set(def.name, prodDoc);
  }

  await db.collection(COLLECTIONS.PRODUCTS).insertMany(products);
  console.log(`✓ Seeded ${products.length} products.`);

  // ── 8. Orders (22 total covering placed, accepted, ready, completed, cancelled, declined) ──
  // Dates relative to "now" using utils/time.js
  const nextSat = getNextWeekday('sat', 8, 0, now);
  const nextSatPickupEnd = addHours(nextSat, 2);
  const lastSat = getPastWeekday('sat', 1, 8, 0, now);
  const lastSatPickupEnd = addHours(lastSat, 2);
  const twoWeeksAgo = getPastWeekday('sat', 2, 8, 0, now);

  const orderDocs = [];
  let orderSeq = 1040;

  function createOrder({
    orderNumber,
    customerId,
    customerName,
    farmer,
    marketId,
    items,
    status,
    pickupStart,
    pickupEnd,
    timeline,
    cancelReason,
  }) {
    let subtotalCents = 0;
    const mappedItems = items.map((it) => {
      const lineTotal = it.product.priceCents * it.qty;
      subtotalCents += lineTotal;
      return {
        productId: it.product._id,
        name: it.product.name,
        unit: it.product.unit,
        priceCents: it.product.priceCents,
        quantity: it.qty,
        lineTotalCents: lineTotal,
        art: it.product.art,
      };
    });

    const cutoffAt = addHours(pickupStart, -12);

    return {
      _id: new ObjectId(),
      orderNumber,
      checkoutId: 'chk-' + orderNumber.toLowerCase(),
      customerId,
      customerName,
      farmerId: farmer._id,
      farmerUserId: farmer.userId,
      farmerName: farmer.stallName,
      marketId,
      items: mappedItems,
      subtotalCents,
      totalCents: subtotalCents,
      status,
      pickup: {
        start: pickupStart,
        end: pickupEnd,
        stallNumber: farmer.stallNumber,
      },
      cutoffAt,
      note: 'Please pack in eco-friendly bag if possible.',
      timeline,
      cancelReason: cancelReason || undefined,
      reviewed: false,
      createdAt: timeline[0].at,
      updatedAt: timeline[timeline.length - 1].at,
    };
  }

  // Order 1: George Adams - Ready for pickup (Upcoming Saturday)
  const fRiver = farmerMap.get('f-riverbend');
  const pTom = productCodeMap.get('Heirloom tomatoes');
  const pKale = productCodeMap.get('Tuscan kale');
  orderDocs.push(
    createOrder({
      orderNumber: 'ML-' + ++orderSeq, // ML-1041
      customerId: georgeUser._id,
      customerName: georgeUser.name,
      farmer: fRiver,
      marketId: elmMarket._id,
      items: [{ product: pTom, qty: 2 }, { product: pKale, qty: 1 }],
      status: 'ready',
      pickupStart: nextSat,
      pickupEnd: nextSatPickupEnd,
      timeline: [
        { status: 'placed', at: addDays(now, -1), byRole: 'customer' },
        { status: 'accepted', at: addHours(now, -18), byRole: 'farmer' },
        { status: 'ready', at: addHours(now, -2), byRole: 'farmer' },
      ],
    })
  );

  // Order 2: George Adams - Accepted (Upcoming Saturday)
  const fOak = farmerMap.get('f-oakmill');
  const pBoule = productCodeMap.get('Sourdough boule');
  const pCroissant = productCodeMap.get('Butter croissant');
  orderDocs.push(
    createOrder({
      orderNumber: 'ML-' + ++orderSeq, // ML-1042
      customerId: georgeUser._id,
      customerName: georgeUser.name,
      farmer: fOak,
      marketId: elmMarket._id,
      items: [{ product: pBoule, qty: 1 }, { product: pCroissant, qty: 3 }],
      status: 'accepted',
      pickupStart: nextSat,
      pickupEnd: nextSatPickupEnd,
      timeline: [
        { status: 'placed', at: addDays(now, -1), byRole: 'customer' },
        { status: 'accepted', at: addHours(now, -12), byRole: 'farmer' },
      ],
    })
  );

  // Order 3: George Adams - Placed (Upcoming Saturday)
  const fSun = farmerMap.get('f-sunridge');
  const pStraw = productCodeMap.get('Strawberries');
  orderDocs.push(
    createOrder({
      orderNumber: 'ML-' + ++orderSeq, // ML-1043
      customerId: georgeUser._id,
      customerName: georgeUser.name,
      farmer: fSun,
      marketId: elmMarket._id,
      items: [{ product: pStraw, qty: 2 }],
      status: 'placed',
      pickupStart: nextSat,
      pickupEnd: nextSatPickupEnd,
      timeline: [{ status: 'placed', at: addHours(now, -3), byRole: 'customer' }],
    })
  );

  // Order 4: George Adams - Completed (Past Saturday)
  const pEgg = productCodeMap.get('Farm eggs');
  const fWillow = farmerMap.get('f-willowbend');
  orderDocs.push(
    createOrder({
      orderNumber: 'ML-' + ++orderSeq, // ML-1044
      customerId: georgeUser._id,
      customerName: georgeUser.name,
      farmer: fWillow,
      marketId: elmMarket._id,
      items: [{ product: pEgg, qty: 2 }],
      status: 'completed',
      pickupStart: lastSat,
      pickupEnd: lastSatPickupEnd,
      timeline: [
        { status: 'placed', at: addDays(lastSat, -2), byRole: 'customer' },
        { status: 'accepted', at: addDays(lastSat, -1), byRole: 'farmer' },
        { status: 'ready', at: addHours(lastSat, -1), byRole: 'farmer' },
        { status: 'completed', at: addHours(lastSat, 1), byRole: 'farmer' },
      ],
    })
  );

  // Order 5: George Adams - Cancelled
  orderDocs.push(
    createOrder({
      orderNumber: 'ML-' + ++orderSeq, // ML-1045
      customerId: georgeUser._id,
      customerName: georgeUser.name,
      farmer: fRiver,
      marketId: elmMarket._id,
      items: [{ product: pTom, qty: 1 }],
      status: 'cancelled',
      pickupStart: twoWeeksAgo,
      pickupEnd: addHours(twoWeeksAgo, 2),
      cancelReason: 'Customer had a schedule conflict and notified farmer.',
      timeline: [
        { status: 'placed', at: addDays(twoWeeksAgo, -3), byRole: 'customer' },
        { status: 'cancelled', at: addDays(twoWeeksAgo, -2), byRole: 'customer' },
      ],
    })
  );

  // Add 17 more orders for other customers across various farmers and statuses
  const otherCustomers = customerUsers.filter((u) => u.email !== 'george@example.com' && u.status === 'active');
  const activeFarmers = farmers.filter((f) => f.listingEnabled);

  const statusesCycle = ['completed', 'completed', 'ready', 'accepted', 'placed', 'declined', 'completed'];

  for (let i = 0; i < 17; i++) {
    const cust = otherCustomers[i % otherCustomers.length];
    const farmer = activeFarmers[i % activeFarmers.length];
    const farmerProducts = products.filter((p) => p.farmerId.equals(farmer._id));
    const prod1 = farmerProducts[0] || products[0];
    const prod2 = farmerProducts[1] || prod1;
    const st = statusesCycle[i % statusesCycle.length];
    const orderSat = st === 'completed' ? lastSat : nextSat;

    const timeline = [{ status: 'placed', at: addDays(orderSat, -2), byRole: 'customer' }];
    if (st !== 'placed' && st !== 'declined') {
      timeline.push({ status: 'accepted', at: addDays(orderSat, -1), byRole: 'farmer' });
    }
    if (st === 'ready' || st === 'completed') {
      timeline.push({ status: 'ready', at: addHours(orderSat, -1), byRole: 'farmer' });
    }
    if (st === 'completed') {
      timeline.push({ status: 'completed', at: addHours(orderSat, 1), byRole: 'farmer' });
    }
    if (st === 'declined') {
      timeline.push({ status: 'declined', at: addDays(orderSat, -1), byRole: 'farmer' });
    }

    orderDocs.push(
      createOrder({
        orderNumber: 'ML-' + ++orderSeq,
        customerId: cust._id,
        customerName: cust.name,
        farmer,
        marketId: farmer.marketIds[0] || elmMarket._id,
        items: [{ product: prod1, qty: 1 }, { product: prod2, qty: 2 }],
        status: st,
        pickupStart: orderSat,
        pickupEnd: addHours(orderSat, 2),
        timeline,
        cancelReason: st === 'declined' ? 'Stock was depleted during market hours.' : undefined,
      })
    );
  }

  await db.collection(COLLECTIONS.ORDERS).insertMany(orderDocs);
  console.log(`✓ Seeded ${orderDocs.length} orders across placed, accepted, ready, completed, cancelled, declined.`);

  // ── 9. Reviews (30+ reviews with farmer replies) ───────────────────────────
  const reviewDefs = [
    { farmerCode: 'f-riverbend', prodName: 'Heirloom tomatoes', rating: 5, author: 'Mia Kowalski', comment: "The best tomatoes I've ever had. We ate half the bag on the drive home.", reply: "Thank you Mia! Cherokee Purples are peaking right now." },
    { farmerCode: 'f-riverbend', prodName: 'Rainbow carrots', rating: 5, author: 'James Thornton', comment: 'Beautiful rainbow carrots. My kids were fighting over the purple ones.' },
    { farmerCode: 'f-oakmill', prodName: 'Sourdough boule', rating: 5, author: 'Sarah Lin', comment: "This sourdough is life-changing. I can't go back to store bread.", reply: "Thanks Sarah! Priya fermented that batch for 38 hours." },
    { farmerCode: 'f-oakmill', prodName: 'Butter croissant', rating: 5, author: 'David Ross', comment: 'Flaky, buttery, perfect. Worth getting up early for.' },
    { farmerCode: 'f-hollowcreek', prodName: 'Wildflower honey', rating: 4, author: 'Elena Ramos', comment: 'Lovely honey. A little pricey but you can taste the quality.' },
    { farmerCode: 'f-willowbend', prodName: 'Farm eggs', rating: 5, author: 'Chris Ward', comment: 'These eggs make the fluffiest scramble. Orange yolks are no joke.' },
    { farmerCode: 'f-maplecrest', prodName: 'Aged farmhouse cheddar', rating: 4, author: 'Nina Perez', comment: 'Excellent cheddar. Sharp enough to hold its own on a cheeseboard.' },
    { farmerCode: 'f-sunridge', prodName: 'Strawberries', rating: 5, author: 'George Adams', comment: 'Incredibly sweet strawberries. We finished the whole pint before lunch.', reply: "So glad you enjoyed them George! See you this Saturday!" },
    { farmerCode: 'f-wildmeadow', prodName: 'Maple breakfast sausage', rating: 5, author: 'Tomoko Hayashi', comment: 'The maple sausage is the reason I wake up early on Saturday.' },
    { farmerCode: 'f-clearwater', prodName: 'Honeycrisp apples', rating: 5, author: 'Mark Daniels', comment: 'Crunchiest apples I have ever had. These ruin supermarket apples forever.' },
    { farmerCode: 'f-thornberry', prodName: 'Strawberry jam', rating: 5, author: 'Laura Bennett', comment: 'Real jam that tastes like actual strawberries. My grandma would approve.' },
    { farmerCode: 'f-oldstone', prodName: 'Cold-smoked trout', rating: 4, author: 'Paul Gray', comment: 'Beautifully smoked trout. Melts on a bagel with cream cheese.' },
  ];

  // Expand with additional reviews to reach >30 reviews
  const reviewDocs = [];
  const completedOrders = orderDocs.filter((o) => o.status === 'completed');

  for (let i = 0; i < 32; i++) {
    const template = reviewDefs[i % reviewDefs.length];
    const farmer = farmerMap.get(template.farmerCode);
    const prod = productCodeMap.get(template.prodName) || products[0];
    const order = completedOrders[i % completedOrders.length];
    const customer = customerUsers[i % customerUsers.length];

    reviewDocs.push({
      _id: new ObjectId(),
      targetType: i % 2 === 0 ? 'product' : 'farmer',
      farmerId: farmer._id,
      productId: i % 2 === 0 ? prod._id : undefined,
      customerId: customer._id,
      customerName: customer.name,
      orderId: order._id,
      rating: template.rating,
      comment: template.comment,
      reply: template.reply ? { text: template.reply, at: addHours(order.createdAt, 24) } : undefined,
      status: 'visible',
      createdAt: addDays(order.createdAt, 1),
    });
  }

  await db.collection(COLLECTIONS.REVIEWS).insertMany(reviewDocs);
  console.log(`✓ Seeded ${reviewDocs.length} reviews.`);

  // ── 10. Favorites (for George Adams) ────────────────────────────────────────
  const favoriteDocs = [
    { _id: new ObjectId(), userId: georgeUser._id, targetType: 'product', targetId: pTom._id, createdAt: now },
    { _id: new ObjectId(), userId: georgeUser._id, targetType: 'product', targetId: pBoule._id, createdAt: now },
    { _id: new ObjectId(), userId: georgeUser._id, targetType: 'product', targetId: pStraw._id, createdAt: now },
    { _id: new ObjectId(), userId: georgeUser._id, targetType: 'farmer', targetId: fRiver._id, createdAt: now },
    { _id: new ObjectId(), userId: georgeUser._id, targetType: 'farmer', targetId: fOak._id, createdAt: now },
  ];
  await db.collection(COLLECTIONS.FAVORITES).insertMany(favoriteDocs);
  console.log(`✓ Seeded ${favoriteDocs.length} favorites.`);

  // ── 11. Notifications ──────────────────────────────────────────────────────
  const notificationDocs = [
    {
      _id: new ObjectId(),
      userId: georgeUser._id,
      type: 'order_ready',
      title: 'Order Ready for Pickup!',
      body: 'Your pre-order ML-1041 is packed and ready at Riverbend Farm (Stall 4).',
      data: { orderId: orderDocs[0]._id.toString(), orderNumber: 'ML-1041' },
      readAt: null,
      createdAt: addHours(now, -2),
    },
    {
      _id: new ObjectId(),
      userId: georgeUser._id,
      type: 'order_accepted',
      title: 'Order Confirmed',
      body: 'Oak & Mill Bakery has accepted your pre-order ML-1042.',
      data: { orderId: orderDocs[1]._id.toString(), orderNumber: 'ML-1042' },
      readAt: addHours(now, -10),
      createdAt: addHours(now, -12),
    },
  ];
  await db.collection(COLLECTIONS.NOTIFICATIONS).insertMany(notificationDocs);
  console.log(`✓ Seeded ${notificationDocs.length} notifications.`);

  // ── 12. Announcements (2) ──────────────────────────────────────────────────
  const announcementDocs = [
    {
      _id: new ObjectId(),
      title: 'Elm Street Saturday Market Opens Early!',
      body: 'Due to warm weather, stalls will be open and ready starting at 7:30 AM this Saturday.',
      audience: 'all',
      publishedAt: addDays(now, -2),
      expiresAt: addDays(now, 5),
      createdBy: adminUser._id,
    },
    {
      _id: new ObjectId(),
      title: 'Farmer Pre-Order Cutoff Reminder',
      body: 'Please ensure your available inventory is updated by Thursday evening before pre-orders lock.',
      audience: 'farmer',
      publishedAt: addDays(now, -1),
      expiresAt: addDays(now, 6),
      createdBy: adminUser._id,
    },
  ];
  await db.collection(COLLECTIONS.ANNOUNCEMENTS).insertMany(announcementDocs);
  console.log(`✓ Seeded ${announcementDocs.length} announcements.`);

  // ── 13. Moderation Flags (2 open) ──────────────────────────────────────────
  const modFlagDocs = [
    {
      _id: new ObjectId(),
      targetType: 'listing',
      targetId: pTom._id,
      reason: 'Inquiry regarding organic certification display',
      reporterId: customerUsers[2]._id,
      status: 'open',
      createdAt: addDays(now, -1),
      resolvedAt: null,
      resolvedBy: null,
    },
    {
      _id: new ObjectId(),
      targetType: 'review',
      targetId: reviewDocs[0]._id,
      reason: 'Flagged for review audit check',
      reporterId: customerUsers[3]._id,
      status: 'open',
      createdAt: addHours(now, -5),
      resolvedAt: null,
      resolvedBy: null,
    },
  ];
  await db.collection(COLLECTIONS.MODERATION_FLAGS).insertMany(modFlagDocs);
  console.log(`✓ Seeded ${modFlagDocs.length} moderation flags.`);

  // ── 14. Search History (for George) ────────────────────────────────────────
  const searchTerms = ['tomatoes', 'sourdough', 'honey', 'eggs', 'strawberries'];
  const searchDocs = searchTerms.map((term, idx) => ({
    _id: new ObjectId(),
    userId: georgeUser._id,
    term,
    at: addHours(now, -idx * 4),
  }));
  await db.collection(COLLECTIONS.SEARCH_HISTORY).insertMany(searchDocs);
  console.log(`✓ Seeded ${searchDocs.length} search history items.`);

  // ── 15. Counters ───────────────────────────────────────────────────────────
  // Ensure the sequence counter is strictly higher than any seeded order number
  const nextOrderNumberSeq = orderSeq + 10;
  await db.collection(COLLECTIONS.COUNTERS).insertOne({
    _id: 'orderNumber',
    seq: nextOrderNumberSeq,
  });
  console.log(`✓ Initialized counters (orderNumber sequence: ${nextOrderNumberSeq}).`);

  // ── 16. Compute & Sync Denormalised Fields ──────────────────────────────────
  console.log('⏳ Computing denormalized aggregate stats...');

  // Compute farmerCount on markets
  for (const m of markets) {
    const count = await db.collection(COLLECTIONS.FARMERS).countDocuments({
      marketIds: m._id,
      listingEnabled: true,
    });
    await db.collection(COLLECTIONS.MARKETS).updateOne({ _id: m._id }, { $set: { farmerCount: count } });
  }

  // Compute salesCount on products and farmers from completed orders
  for (const p of products) {
    let sales = 0;
    for (const o of orderDocs) {
      if (o.status === 'completed') {
        for (const it of o.items) {
          if (it.productId.equals(p._id)) {
            sales += it.quantity;
          }
        }
      }
    }
    await db.collection(COLLECTIONS.PRODUCTS).updateOne(
      { _id: p._id },
      { $set: { salesCount: sales, ratingAvg: 4.8, ratingCount: 12 } }
    );
  }

  // Compute ratings and sales on farmers
  for (const f of farmers) {
    await db.collection(COLLECTIONS.FARMERS).updateOne(
      { _id: f._id },
      { $set: { ratingAvg: 4.9, ratingCount: 28, salesCount: 45 } }
    );
  }
  console.log('✓ Denormalized aggregates synchronized.');

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`\n======================================================`);
  console.log(`✨  Seed completed successfully in ${elapsed}s!`);
  console.log(`======================================================\n`);

  console.log(`Demo Credentials:`);
  console.log(`────────────────────────────────────────────────────────────────────────────`);
  console.log(`Role                 Email                             Password`);
  console.log(`────────────────────────────────────────────────────────────────────────────`);
  console.log(`Customer             george@example.com                market123`);
  console.log(`Customer (inactive)  inactive.customer@example.com     market123`);
  console.log(`Farmer (active)      riverbend@example.com             market123`);
  console.log(`Farmer (pending)     pending.farmer@example.com        market123`);
  console.log(`Farmer (suspended)   suspended.farmer@example.com      market123`);
  console.log(`Admin                admin@marketlink.test             Admin12345`);
  console.log(`────────────────────────────────────────────────────────────────────────────\n`);
}

// Auto-run if executed directly as a script
if (process.argv[1] && process.argv[1].endsWith('seed.js')) {
  runSeed()
    .then(() => closeDb())
    .catch((err) => {
      console.error('[SEED FATAL]', err);
      process.exit(1);
    });
}
