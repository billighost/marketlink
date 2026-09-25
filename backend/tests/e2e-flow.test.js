/**
 * Full End-to-End Product Scenario Test (Stage 5 D8).
 * Runs the entire product lifecycle through HTTP API only, starting from the minimal seed:
 *
 *  1. Admin signs in
 *  2. Admin creates a market and a category
 *  3. A new Farmer registers (status: pending)
 *  4. Pending Farmer attempts to create product -> 403 FARMER_NOT_APPROVED
 *  5. Admin approves Farmer stall
 *  6. Farmer configures profile, creates products, applies weekly restock template
 *  7. A new Customer registers
 *  8. Customer browses feed, searches catalog, adds favorites
 *  9. Customer requests cart quote and checks out with Idempotency-Key
 * 10. Farmer retrieves incoming orders, accepts, and marks ready
 * 11. Customer receives notification and verifies Ready status
 * 12. Farmer completes the order
 * 13. Customer reviews the completed order (farmer rating & comments)
 * 14. Farmer posts a public stall reply
 * 15. A second Customer flags the review for moderation
 * 16. Admin resolves the flag with content removal; ratings recalculate
 * 17. Admin inspects dashboard KPIs, report summaries, and exports CSV
 * 18. Admin suspends the Farmer; products are delisted from catalog immediately
 * 19. Final assertion: run verify:data invariant checker (assert 0 drift)
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { setupTestEnvironment, teardownTestEnvironment, request, loginUser } from './helpers.js';
import { runMinimalSeed } from '../src/db/seedMinimal.js';
import { runVerifyData } from '../scripts/verify-data.js';

describe('Stage 5 Full End-to-End Scenario Suite (18 Steps from Minimal Seed)', () => {
  let db;

  // Persona tokens & identifiers
  let adminToken;
  let farmerToken;
  let farmerUserId;
  let farmerProfileId;
  let customerToken;
  let customerUserId;
  let customer2Token;

  // Created resource IDs
  let createdMarketId;
  let createdCategoryId;
  let createdProductId;
  let createdOrderId;
  let createdReviewId;
  let createdFlagId;

  before(async () => {
    const testEnv = await setupTestEnvironment();
    db = testEnv.db;

    // Reset to minimal seed: 1 admin, 1 market, baseline categories, order counter
    await runMinimalSeed(true, db);
  });

  after(async () => {
    await teardownTestEnvironment();
  });

  // ── Step 1: Admin signs in ──
  it('Step 1: Admin signs in successfully with seeded credentials', async () => {
    const adminLogin = await loginUser('admin@marketlink.test', 'Admin12345');
    adminToken = adminLogin.accessToken;
    assert.ok(adminToken, 'Admin access token received');
    assert.equal(adminLogin.user.role, 'admin');
  });

  // ── Step 2: Admin creates market and category ──
  it('Step 2: Admin creates a new market venue and product category', async () => {
    // 2a. Create Market
    const marketRes = await request('/api/admin/markets', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        name: 'Highland Park Greenmarket',
        address: '500 Highland Ave, Highland Park, NJ',
        location: {
          lat: 40.495,
          lng: -74.425,
        },
        schedule: [{ day: 'sat', openMin: 540, closeMin: 780 }],
        timezone: 'America/New_York',
        note: 'Outdoor community market pavilion.',
        facilities: ['parking', 'restrooms'],
      },
    });
    assert.equal(marketRes.status, 201);
    const marketData = await marketRes.json();
    createdMarketId = marketData.data.id;
    assert.ok(createdMarketId);

    // 2b. Create Category
    const catRes = await request('/api/admin/categories', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        name: 'Organic Roots',
        slug: 'organic-roots',
        sortOrder: 15,
        art: 'carrot',
      },
    });
    assert.equal(catRes.status, 201);
    const catData = await catRes.json();
    createdCategoryId = catData.data.id;
    assert.ok(createdCategoryId);
  });

  // ── Step 3: Farmer registers ──
  it('Step 3: New Farmer registers with initial pending approval status', async () => {
    const regRes = await request('/api/auth/register/farmer', {
      method: 'POST',
      body: {
        stallName: 'Heritage Orchard & Roots',
        contactPerson: 'David Miller',
        phone: '555-321-7654',
        email: 'david@heritageorchard.test',
        address: '88 Cider Mill Rd',
        password: 'FarmerPassword123!',
      },
    });
    assert.equal(regRes.status, 201);
    const regData = await regRes.json();
    farmerToken = regData.data.accessToken;
    farmerUserId = regData.data.user.id;
    assert.equal(regData.data.user.status, 'pending');
    assert.equal(regData.data.user.role, 'farmer');
  });

  // ── Step 4: Pending Farmer product creation is blocked ──
  it('Step 4: Pending Farmer product creation is rejected with 403 FARMER_NOT_APPROVED', async () => {
    const prodRes = await request('/api/farmer/products', {
      method: 'POST',
      headers: { Authorization: `Bearer ${farmerToken}` },
      body: {
        name: 'Heirloom Russet Potatoes',
        categoryId: createdCategoryId,
        priceCents: 450,
        unit: 'bunch',
        quantityAvailable: 30,
        tags: ['organic'],
        art: 'carrot',
      },
    });
    assert.equal(prodRes.status, 403);
    const errBody = await prodRes.json();
    assert.equal(errBody.error.code, 'FARMER_NOT_APPROVED');
  });

  // ── Step 5: Admin approves Farmer ──
  it('Step 5: Admin approves pending Farmer stall', async () => {
    // Find farmer profile ID from admin farmers list
    const listRes = await request('/api/admin/farmers?status=pending', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.equal(listRes.status, 200);
    const listData = await listRes.json();
    const targetFarmer = listData.data.find((f) => f.userId === farmerUserId || f.id === farmerUserId || f.stallName === 'Heritage Orchard & Roots');
    assert.ok(targetFarmer, 'Pending farmer found in admin queue');
    farmerProfileId = targetFarmer.farmerId || targetFarmer.id;

    const approveRes = await request(`/api/admin/farmers/${farmerProfileId}/approve`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.equal(approveRes.status, 200);
    const approveData = await approveRes.json();
    assert.equal(approveData.data.status, 'active');
  });

  // ── Step 6: Farmer sets profile, creates products, applies weekly template ──
  it('Step 6: Farmer configures profile, publishes products, and applies weekly inventory template', async () => {
    // 6a. Update profile
    const profileRes = await request('/api/farmer/profile', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${farmerToken}` },
      body: {
        marketIds: [createdMarketId],
        operatingDays: ['sat'],
        pickupWindows: [
          { day: 'sat', startMin: 540, endMin: 780, slotMinutes: 30, capacityPerSlot: 10 },
        ],
        cutoffMinutesBefore: 180,
      },
    });
    assert.equal(profileRes.status, 200);

    // 6b. Create Product
    const prodRes = await request('/api/farmer/products', {
      method: 'POST',
      headers: { Authorization: `Bearer ${farmerToken}` },
      body: {
        name: 'Heirloom Russet Potatoes',
        description: 'Naturally grown farm-fresh potatoes.',
        categoryId: createdCategoryId,
        priceCents: 450,
        unit: 'bunch',
        quantityAvailable: 50,
        lowStockThreshold: 5,
        tags: ['organic'],
        art: 'carrot',
      },
    });
    assert.equal(prodRes.status, 201);
    const prodData = await prodRes.json();
    createdProductId = prodData.data.id;
    assert.ok(createdProductId);

    // 6c. Configure and apply weekly restock template
    const tplRes = await request('/api/farmer/weekly-template', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${farmerToken}` },
      body: {
        items: [
          {
            productId: createdProductId,
            defaultQty: 40,
            enabled: true,
          },
        ],
      },
    });
    assert.equal(tplRes.status, 200);

    const applyRes = await request('/api/farmer/weekly-template/apply', {
      method: 'POST',
      headers: { Authorization: `Bearer ${farmerToken}` },
    });
    assert.equal(applyRes.status, 200);
  });

  // ── Step 7: Customer registers ──
  it('Step 7: New Customer registers an active account', async () => {
    const custRes = await request('/api/auth/register/customer', {
      method: 'POST',
      body: {
        name: 'Clara Oswald',
        email: 'clara@souffle.test',
        phone: '555-777-8899',
        address: '42 Meadow Lane, Maplewood',
        password: 'CustomerPass123!',
      },
    });
    assert.equal(custRes.status, 201);
    const custData = await custRes.json();
    customerToken = custData.data.accessToken;
    customerUserId = custData.data.user.id;
    assert.ok(customerToken);
  });

  // ── Step 8: Customer browses, searches, favourites ──
  it('Step 8: Customer explores discovery feed, searches catalog, and favorites product', async () => {
    // 8a. Browse Feed
    const feedRes = await request('/api/feed', {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    assert.equal(feedRes.status, 200);

    // 8b. Search Catalog
    const searchRes = await request('/api/products?q=Potatoes', {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    assert.equal(searchRes.status, 200);
    const searchData = await searchRes.json();
    assert.ok(Array.isArray(searchData.data));
    assert.ok(searchData.data.length >= 1, 'Search returned newly created product');

    // 8c. Add to Favorites
    const favRes = await request(`/api/favorites/product/${createdProductId}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    assert.equal(favRes.status, 200);

    const favIdsRes = await request('/api/favorites/ids', {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    assert.equal(favIdsRes.status, 200);
    const favIds = await favIdsRes.json();
    assert.ok(favIds.data.productIds.includes(createdProductId));
  });

  // ── Step 9: Customer cart quote and checkout ──
  it('Step 9: Customer obtains cart quote and checks out with Idempotency-Key', async () => {
    // 9a. Request Quote
    const quoteRes = await request('/api/cart/quote', {
      method: 'POST',
      headers: { Authorization: `Bearer ${customerToken}` },
      body: {
        groups: [
          {
            farmerId: farmerProfileId,
            items: [{ productId: createdProductId, quantity: 2 }],
          },
        ],
      },
    });
    assert.equal(quoteRes.status, 200);
    const quoteData = await quoteRes.json();
    assert.equal(quoteData.data.groups[0].lines[0].unitPriceCents, 450);
    assert.equal(quoteData.data.groups[0].subtotalCents, 900);
    const selectedSlot = quoteData.data.groups[0].slots[0];
    assert.ok(selectedSlot, 'Available pickup slot returned in quote');

    // 9b. Submit Checkout
    const checkoutRes = await request('/api/orders/checkout', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${customerToken}`,
        'Idempotency-Key': 'e2e-checkout-key-001',
      },
      body: {
        groups: [
          {
            farmerId: farmerProfileId,
            slotStart: selectedSlot.start,
            items: [{ productId: createdProductId, quantity: 2 }],
          },
        ],
      },
    });
    assert.equal(checkoutRes.status, 201);
    const checkoutData = await checkoutRes.json();
    assert.ok(checkoutData.data.orders.length > 0);
    createdOrderId = checkoutData.data.orders[0].id;
    assert.ok(createdOrderId);
  });

  // ── Step 10: Farmer receives, accepts, marks ready ──
  it('Step 10: Farmer views incoming orders, confirms, and transitions to ready', async () => {
    // 10a. Farmer order list
    const ordersRes = await request('/api/farmer/orders', {
      headers: { Authorization: `Bearer ${farmerToken}` },
    });
    assert.equal(ordersRes.status, 200);
    const ordersData = await ordersRes.json();
    const orderDoc = ordersData.data.find((o) => o.id === createdOrderId);
    assert.ok(orderDoc, 'Placed order present in farmer queue');
    assert.equal(orderDoc.status, 'placed');

    // 10b. Accept Order
    const acceptRes = await request(`/api/farmer/orders/${createdOrderId}/accept`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${farmerToken}` },
    });
    assert.equal(acceptRes.status, 200);
    const acceptData = await acceptRes.json();
    assert.equal(acceptData.data.status, 'accepted');

    // 10c. Mark Ready
    const readyRes = await request(`/api/farmer/orders/${createdOrderId}/ready`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${farmerToken}` },
    });
    assert.equal(readyRes.status, 200);
    const readyData = await readyRes.json();
    assert.equal(readyData.data.status, 'ready');
  });

  // ── Step 11: Customer sees Ready status and alert ──
  it('Step 11: Customer verifies order Ready status and notification update', async () => {
    const orderRes = await request(`/api/orders/${createdOrderId}`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    assert.equal(orderRes.status, 200);
    const orderData = await orderRes.json();
    assert.equal(orderData.data.status, 'ready');

    const notifRes = await request('/api/notifications', {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    assert.equal(notifRes.status, 200);
    const notifData = await notifRes.json();
    assert.ok(notifData.data.length >= 1, 'Customer received order status notifications');
  });

  // ── Step 12: Farmer completes order ──
  it('Step 12: Farmer marks order completed upon customer pickup', async () => {
    const completeRes = await request(`/api/farmer/orders/${createdOrderId}/complete`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${farmerToken}` },
    });
    assert.equal(completeRes.status, 200);
    const completeData = await completeRes.json();
    assert.equal(completeData.data.status, 'completed');
  });

  // ── Step 13: Customer reviews order ──
  it('Step 13: Customer submits verified review for completed order', async () => {
    const reviewRes = await request(`/api/orders/${createdOrderId}/reviews`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${customerToken}` },
      body: {
        farmer: {
          rating: 5,
          comment: 'Outstanding potatoes! Crispy and fresh.',
        },
      },
    });
    assert.equal(reviewRes.status, 201);
    const reviewData = await reviewRes.json();
    createdReviewId = reviewData.data.reviews[0].id;
    assert.ok(createdReviewId);
  });

  // ── Step 14: Farmer replies to review ──
  it('Step 14: Farmer posts public reply to customer review', async () => {
    const replyRes = await request(`/api/farmer/reviews/${createdReviewId}/reply`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${farmerToken}` },
      body: {
        text: 'Thank you Clara! We look forward to seeing you next Saturday.',
      },
    });
    assert.equal(replyRes.status, 200);
    const replyData = await replyRes.json();
    assert.equal(replyData.data.reply.text, 'Thank you Clara! We look forward to seeing you next Saturday.');
  });

  // ── Step 15: Another customer flags the review ──
  it('Step 15: Second Customer flags the review for moderation', async () => {
    // Register Customer 2
    const cust2Res = await request('/api/auth/register/customer', {
      method: 'POST',
      body: {
        name: 'Rory Williams',
        email: 'rory@nurse.test',
        phone: '555-888-9900',
        address: '42 Meadow Lane, Maplewood',
        password: 'CustomerPass123!',
      },
    });
    assert.equal(cust2Res.status, 201);
    const cust2Data = await cust2Res.json();
    customer2Token = cust2Data.data.accessToken;

    const flagRes = await request(`/api/reviews/${createdReviewId}/flag`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${customer2Token}` },
      body: {
        reason: 'Questionable competitor claim in comment.',
      },
    });
    assert.equal(flagRes.status, 200);
  });

  // ── Step 16: Admin resolves moderation flag ──
  it('Step 16: Admin resolves flag with removal and verifies rating recomputation', async () => {
    const modRes = await request('/api/admin/moderation', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.equal(modRes.status, 200);
    const modData = await modRes.json();
    const targetFlag = modData.data.find((f) => f.targetId === createdReviewId);
    assert.ok(targetFlag, 'Flagged review found in moderation queue');
    createdFlagId = targetFlag.id;

    // Resolve flag by removing review
    const resolveRes = await request(`/api/admin/moderation/${createdFlagId}/resolve`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        action: 'remove',
        note: 'Violates content policy.',
      },
    });
    assert.equal(resolveRes.status, 200);

    // Verify review status is now removed
    const farmerProfRes = await request(`/api/farmers/${farmerProfileId}`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    assert.equal(farmerProfRes.status, 200);
    const farmerData = await farmerProfRes.json();
    // Rating sum/count should have rolled back
    assert.equal(farmerData.data.ratingCount, 0);
  });

  // ── Step 17: Admin dashboard, reports & CSV export ──
  it('Step 17: Admin inspects platform overview, revenue summary, and exports orders CSV', async () => {
    // Overview dashboard
    const overviewRes = await request('/api/admin/overview', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.equal(overviewRes.status, 200);

    // Reports summary
    const summaryRes = await request('/api/admin/reports/summary', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.equal(summaryRes.status, 200);

    // CSV streaming export
    const exportRes = await request('/api/admin/reports/export?type=orders', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.equal(exportRes.status, 200);
    const csvContent = await exportRes.text();
    assert.ok(csvContent.includes('Order Number') || csvContent.includes('orderNumber') || csvContent.length > 0);
  });

  // ── Step 18: Admin suspends Farmer and verifies instant catalog delisting ──
  it('Step 18: Admin suspends Farmer stall and verifies immediate catalog delisting', async () => {
    const suspendRes = await request(`/api/admin/farmers/${farmerProfileId}/suspend`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        reason: 'Temporary regulatory inquiry.',
      },
    });
    assert.equal(suspendRes.status, 200);

    // Public catalog query should instantly omit suspended farmer's products
    const catalogRes = await request('/api/products?q=Potatoes', {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    assert.equal(catalogRes.status, 200);
    const catalogData = await catalogRes.json();
    const found = catalogData.data.some((p) => p.id === createdProductId);
    assert.equal(found, false, 'Suspended farmer products delisted from public search immediately');
  });

  // ── Step 19: Data Invariant Verification ──
  it('Step 19: Data invariant verification reports 0 drift across all 12 platform rules', async () => {
    const { ok, results } = await runVerifyData({ db });
    assert.equal(ok, true, 'All 12 data invariants must pass with 0 drift');
    for (const r of results) {
      assert.equal(r.drift, 0, `Invariant ${r.name} should have 0 drift, got ${r.drift}`);
    }
  });
});
