import '../src/config/env.js';
import { ObjectId } from 'mongodb';
import { connectDb, closeDb } from '../src/db/client.js';
import { COLLECTIONS } from '../src/db/collections.js';

async function seedActivity() {
  console.log('Seeding vendor activity (orders & reviews) for active stalls...');
  const db = await connectDb();

  const farmers = await db.collection(COLLECTIONS.FARMERS).find({ listingEnabled: true }).toArray();
  const buyers = await db.collection(COLLECTIONS.USERS).find({ role: 'customer', status: 'active' }).toArray();
  const markets = await db.collection(COLLECTIONS.MARKETS).find({}).toArray();

  if (buyers.length === 0) {
    console.log('No active customers found.');
    await closeDb();
    return;
  }

  const defaultMarket = markets[0] || { _id: new ObjectId(), name: 'Downtown Farmers Market' };

  for (const farmer of farmers) {
    // Find products for this farmer
    const products = await db.collection(COLLECTIONS.PRODUCTS).find({ farmerId: farmer._id, archived: { $ne: true } }).toArray();
    if (products.length === 0) continue;

    // Check if farmer already has orders
    const existingOrdersCount = await db.collection(COLLECTIONS.ORDERS).countDocuments({ farmerId: farmer._id });
    if (existingOrdersCount < 3) {
      console.log(`Adding sample orders for farmer: ${farmer.stallName}...`);
      const sampleBuyer = buyers[0];
      const buyer2 = buyers[1] || sampleBuyer;

      const p1 = products[0];
      const p2 = products[1] || products[0];

      const now = new Date();
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);

      const newOrders = [
        // 1. Placed (New order)
        {
          _id: new ObjectId(),
          orderNumber: `ML-${Math.floor(1000 + Math.random() * 9000)}`,
          checkoutId: new ObjectId().toString(),
          customerId: sampleBuyer._id,
          customerName: sampleBuyer.name || 'Maya Lin',
          farmerId: farmer._id,
          farmerUserId: farmer.userId,
          farmerName: farmer.stallName,
          marketId: farmer.marketIds?.[0] || defaultMarket._id,
          items: [
            {
              productId: p1._id,
              name: p1.name,
              priceCents: p1.priceCents,
              quantity: 2,
              unit: p1.unit || 'lb',
              art: p1.art || 'basket',
            },
          ],
          subtotalCents: p1.priceCents * 2,
          totalCents: p1.priceCents * 2,
          status: 'placed',
          pickup: {
            start: tomorrow.toISOString(),
            end: new Date(tomorrow.getTime() + 2 * 3600000).toISOString(),
            windowLabel: 'Tomorrow 9:00 AM – 11:00 AM',
            dayLabel: 'Tomorrow',
          },
          cutoffAt: new Date(Date.now() + 12 * 3600000),
          completedAt: null,
          note: 'Please pack in a cardboard box if possible.',
          timeline: [{ status: 'placed', at: new Date(), byRole: 'buyer' }],
          cancelReason: null,
          reviewed: false,
          pickupCode: `PK-${Math.floor(1000 + Math.random() * 9000)}`,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        // 2. Accepted (Packing)
        {
          _id: new ObjectId(),
          orderNumber: `ML-${Math.floor(1000 + Math.random() * 9000)}`,
          checkoutId: new ObjectId().toString(),
          customerId: buyer2._id,
          customerName: buyer2.name || 'David Ross',
          farmerId: farmer._id,
          farmerUserId: farmer.userId,
          farmerName: farmer.stallName,
          marketId: farmer.marketIds?.[0] || defaultMarket._id,
          items: [
            {
              productId: p2._id,
              name: p2.name,
              priceCents: p2.priceCents,
              quantity: 3,
              unit: p2.unit || 'bunch',
              art: p2.art || 'carrot',
            },
          ],
          subtotalCents: p2.priceCents * 3,
          totalCents: p2.priceCents * 3,
          status: 'accepted',
          pickup: {
            start: tomorrow.toISOString(),
            end: new Date(tomorrow.getTime() + 2 * 3600000).toISOString(),
            windowLabel: 'Tomorrow 10:00 AM – 12:00 PM',
            dayLabel: 'Tomorrow',
          },
          cutoffAt: new Date(Date.now() + 12 * 3600000),
          completedAt: null,
          note: null,
          timeline: [
            { status: 'placed', at: new Date(Date.now() - 3600000), byRole: 'buyer' },
            { status: 'accepted', at: new Date(), byRole: 'farmer' },
          ],
          cancelReason: null,
          reviewed: false,
          pickupCode: `PK-${Math.floor(1000 + Math.random() * 9000)}`,
          createdAt: new Date(Date.now() - 3600000),
          updatedAt: new Date(),
        },
        // 3. Ready for pickup
        {
          _id: new ObjectId(),
          orderNumber: `ML-${Math.floor(1000 + Math.random() * 9000)}`,
          checkoutId: new ObjectId().toString(),
          customerId: sampleBuyer._id,
          customerName: sampleBuyer.name || 'Maya Lin',
          farmerId: farmer._id,
          farmerUserId: farmer.userId,
          farmerName: farmer.stallName,
          marketId: farmer.marketIds?.[0] || defaultMarket._id,
          items: [
            {
              productId: p1._id,
              name: p1.name,
              priceCents: p1.priceCents,
              quantity: 1,
              unit: p1.unit || 'lb',
              art: p1.art || 'basket',
            },
          ],
          subtotalCents: p1.priceCents,
          totalCents: p1.priceCents,
          status: 'ready',
          pickup: {
            start: now.toISOString(),
            end: new Date(now.getTime() + 2 * 3600000).toISOString(),
            windowLabel: 'Today 8:00 AM – 1:00 PM',
            dayLabel: 'Today',
          },
          cutoffAt: new Date(Date.now() - 3600000),
          completedAt: null,
          note: null,
          timeline: [
            { status: 'placed', at: new Date(Date.now() - 7200000), byRole: 'buyer' },
            { status: 'accepted', at: new Date(Date.now() - 3600000), byRole: 'farmer' },
            { status: 'ready', at: new Date(), byRole: 'farmer' },
          ],
          cancelReason: null,
          reviewed: false,
          pickupCode: `PK-${Math.floor(1000 + Math.random() * 9000)}`,
          createdAt: new Date(Date.now() - 7200000),
          updatedAt: new Date(),
        },
        // 4. Completed order
        {
          _id: new ObjectId(),
          orderNumber: `ML-${Math.floor(1000 + Math.random() * 9000)}`,
          checkoutId: new ObjectId().toString(),
          customerId: buyer2._id,
          customerName: buyer2.name || 'David Ross',
          farmerId: farmer._id,
          farmerUserId: farmer.userId,
          farmerName: farmer.stallName,
          marketId: farmer.marketIds?.[0] || defaultMarket._id,
          items: [
            {
              productId: p1._id,
              name: p1.name,
              priceCents: p1.priceCents,
              quantity: 2,
              unit: p1.unit || 'lb',
              art: p1.art || 'basket',
            },
          ],
          subtotalCents: p1.priceCents * 2,
          totalCents: p1.priceCents * 2,
          status: 'completed',
          pickup: {
            start: yesterday.toISOString(),
            end: new Date(yesterday.getTime() + 2 * 3600000).toISOString(),
            windowLabel: 'Yesterday 9:00 AM – 11:00 AM',
            dayLabel: 'Yesterday',
          },
          cutoffAt: yesterday,
          completedAt: yesterday,
          note: null,
          timeline: [
            { status: 'placed', at: new Date(yesterday.getTime() - 7200000), byRole: 'buyer' },
            { status: 'accepted', at: new Date(yesterday.getTime() - 3600000), byRole: 'farmer' },
            { status: 'ready', at: new Date(yesterday.getTime() - 1800000), byRole: 'farmer' },
            { status: 'completed', at: yesterday, byRole: 'farmer' },
          ],
          cancelReason: null,
          reviewed: true,
          pickupCode: `PK-${Math.floor(1000 + Math.random() * 9000)}`,
          createdAt: new Date(yesterday.getTime() - 7200000),
          updatedAt: yesterday,
        },
      ];

      await db.collection(COLLECTIONS.ORDERS).insertMany(newOrders);

      // Seed Reviews
      const existingReviews = await db.collection(COLLECTIONS.REVIEWS).countDocuments({ farmerId: farmer._id });
      if (existingReviews === 0) {
        const sampleReviews = [
          {
            _id: new ObjectId(),
            targetType: 'farmer',
            farmerId: farmer._id,
            productId: p1._id,
            customerId: sampleBuyer._id,
            customerName: sampleBuyer.name || 'Maya Lin',
            orderId: newOrders[3]._id,
            rating: 5,
            comment: `Incredible freshness and quality! The ${p1.name} were crisp and flavorful.`,
            reply: {
              text: 'Thank you so much Maya! We harvest everything early at dawn for peak taste.',
              createdAt: new Date(),
            },
            status: 'visible',
            createdAt: yesterday,
          },
          {
            _id: new ObjectId(),
            targetType: 'farmer',
            farmerId: farmer._id,
            productId: p2._id,
            customerId: buyer2._id,
            customerName: buyer2.name || 'David Ross',
            orderId: newOrders[3]._id,
            rating: 5,
            comment: 'Fast pickup, zero hassle. Will definitely order every market weekend!',
            reply: null,
            status: 'visible',
            createdAt: new Date(yesterday.getTime() + 3600000),
          },
        ];
        await db.collection(COLLECTIONS.REVIEWS).insertMany(sampleReviews);

        await db.collection(COLLECTIONS.FARMERS).updateOne(
          { _id: farmer._id },
          {
            $set: {
              ratingAvg: 5.0,
              ratingCount: 2,
              ratingSum: 10,
              salesCount: 14,
              updatedAt: new Date(),
            },
          }
        );
      }
    }
  }

  console.log('✓ Vendor activity seeded successfully.');
  await closeDb();
}

seedActivity().catch((err) => {
  console.error(err);
  process.exit(1);
});
