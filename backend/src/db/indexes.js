/**
 * MongoDB indexes setup for all collections.
 * Creates unique, compound, 2dsphere, full-text, and TTL indexes idempotently.
 */

import { COLLECTIONS } from './collections.js';

/**
 * Ensures all required indexes exist across all collections in the database.
 * Idempotent: can be safely executed repeatedly at startup and in scripts.
 *
 * @param {import('mongodb').Db} db
 */
export async function ensureIndexes(db) {
  // ── 1. Users ──
  await db.collection(COLLECTIONS.USERS).createIndex(
    { email: 1 },
    { unique: true, name: 'idx_users_email_unique' }
  );
  await db.collection(COLLECTIONS.USERS).createIndex(
    { role: 1, status: 1, createdAt: -1 },
    { name: 'idx_users_role_status_created' }
  );

  // ── 2. Farmers ──
  await db.collection(COLLECTIONS.FARMERS).createIndex(
    { userId: 1 },
    { unique: true, name: 'idx_farmers_userId_unique' }
  );
  await db.collection(COLLECTIONS.FARMERS).createIndex(
    { listingEnabled: 1, marketIds: 1, ratingAvg: -1 },
    { name: 'idx_farmers_listing_markets_rating' }
  );
  await db.collection(COLLECTIONS.FARMERS).createIndex(
    { listingEnabled: 1, isTopSeller: 1, salesCount: -1 },
    { name: 'idx_farmers_listing_topseller_sales' }
  );
  await db.collection(COLLECTIONS.FARMERS).createIndex(
    { location: '2dsphere' },
    { name: 'idx_farmers_location_2dsphere' }
  );
  await db.collection(COLLECTIONS.FARMERS).createIndex(
    { stallName: 'text', specialty: 'text', story: 'text' },
    {
      weights: { stallName: 10, specialty: 5, story: 1 },
      name: 'idx_farmers_text_search',
    }
  );
  // Stage 2 additions: prefix search, random walker, category slugs, and sort indexes
  await db.collection(COLLECTIONS.FARMERS).createIndex(
    { listingEnabled: 1, stallNameLower: 1 },
    { name: 'idx_farmers_listing_stallNameLower' }
  );
  await db.collection(COLLECTIONS.FARMERS).createIndex(
    { listingEnabled: 1, rnd: 1 },
    { name: 'idx_farmers_listing_rnd' }
  );
  await db.collection(COLLECTIONS.FARMERS).createIndex(
    { listingEnabled: 1, categorySlugs: 1, ratingAvg: -1 },
    { name: 'idx_farmers_listing_categorySlugs_rating' }
  );
  await db.collection(COLLECTIONS.FARMERS).createIndex(
    { listingEnabled: 1, ratingAvg: -1, _id: -1 },
    { name: 'idx_farmers_sort_rating' }
  );
  await db.collection(COLLECTIONS.FARMERS).createIndex(
    { listingEnabled: 1, salesCount: -1, _id: -1 },
    { name: 'idx_farmers_sort_top' }
  );
  await db.collection(COLLECTIONS.FARMERS).createIndex(
    { listingEnabled: 1, createdAt: -1, _id: -1 },
    { name: 'idx_farmers_sort_new' }
  );
  await db.collection(COLLECTIONS.FARMERS).createIndex(
    { listingEnabled: 1, stallName: 1, _id: 1 },
    { name: 'idx_farmers_sort_name' }
  );
  await db.collection(COLLECTIONS.FARMERS).createIndex(
    { listingEnabled: 1, operatingDays: 1 },
    { name: 'idx_farmers_listing_operatingDays' }
  );

  // ── 3. Markets ──
  await db.collection(COLLECTIONS.MARKETS).createIndex(
    { slug: 1 },
    { unique: true, name: 'idx_markets_slug_unique' }
  );
  await db.collection(COLLECTIONS.MARKETS).createIndex(
    { location: '2dsphere' },
    { name: 'idx_markets_location_2dsphere' }
  );
  await db.collection(COLLECTIONS.MARKETS).createIndex(
    { status: 1, name: 1 },
    { name: 'idx_markets_status_name' }
  );

  // ── 4. Categories ──
  await db.collection(COLLECTIONS.CATEGORIES).createIndex(
    { slug: 1 },
    { unique: true, name: 'idx_categories_slug_unique' }
  );
  await db.collection(COLLECTIONS.CATEGORIES).createIndex(
    { active: 1, sortOrder: 1 },
    { name: 'idx_categories_active_sortOrder' }
  );

  // ── 5. Products ──
  await db.collection(COLLECTIONS.PRODUCTS).createIndex(
    { farmerId: 1, availability: 1 },
    { name: 'idx_products_farmer_availability' }
  );
  await db.collection(COLLECTIONS.PRODUCTS).createIndex(
    { availability: 1, categorySlug: 1, priceCents: 1 },
    { name: 'idx_products_browse_filters' }
  );
  await db.collection(COLLECTIONS.PRODUCTS).createIndex(
    { marketIds: 1, availability: 1, createdAt: -1 },
    { name: 'idx_products_market_created' }
  );
  await db.collection(COLLECTIONS.PRODUCTS).createIndex(
    { salesCount: -1 },
    {
      name: 'idx_products_bestsellers_partial',
      partialFilterExpression: {
        'moderation.removed': false,
      },
    }
  );
  await db.collection(COLLECTIONS.PRODUCTS).createIndex(
    { name: 'text', description: 'text', tags: 'text' },
    {
      weights: { name: 10, tags: 5, description: 1 },
      name: 'idx_products_text_search',
    }
  );
  // Stage 2 additions: prefix search, random walker, keyset sort indexes
  await db.collection(COLLECTIONS.PRODUCTS).createIndex(
    { listed: 1, nameLower: 1 },
    { name: 'idx_products_listed_nameLower' }
  );
  await db.collection(COLLECTIONS.PRODUCTS).createIndex(
    { listed: 1, rnd: 1 },
    { name: 'idx_products_listed_rnd' }
  );
  await db.collection(COLLECTIONS.PRODUCTS).createIndex(
    { listed: 1, categorySlug: 1, rnd: 1 },
    { name: 'idx_products_listed_categorySlug_rnd' }
  );
  await db.collection(COLLECTIONS.PRODUCTS).createIndex(
    { listed: 1, priceCents: 1, rnd: 1 },
    { name: 'idx_products_listed_priceCents_rnd' }
  );
  await db.collection(COLLECTIONS.PRODUCTS).createIndex(
    { listed: 1, tags: 1, rnd: 1 },
    { name: 'idx_products_listed_tags_rnd' }
  );
  await db.collection(COLLECTIONS.PRODUCTS).createIndex(
    { listed: 1, marketIds: 1, salesCount: -1 },
    { name: 'idx_products_listed_marketIds_sales' }
  );
  await db.collection(COLLECTIONS.PRODUCTS).createIndex(
    { listed: 1, farmerId: 1, availability: 1 },
    { name: 'idx_products_listed_farmer_availability' }
  );
  await db.collection(COLLECTIONS.PRODUCTS).createIndex(
    { listed: 1, availability: 1, createdAt: -1, _id: -1 },
    { name: 'idx_products_sort_newest' }
  );
  await db.collection(COLLECTIONS.PRODUCTS).createIndex(
    { listed: 1, availability: 1, categorySlug: 1, priceCents: 1, _id: 1 },
    { name: 'idx_products_sort_price_asc_cat' }
  );
  await db.collection(COLLECTIONS.PRODUCTS).createIndex(
    { listed: 1, availability: 1, priceCents: 1, _id: 1 },
    { name: 'idx_products_sort_price_asc' }
  );
  await db.collection(COLLECTIONS.PRODUCTS).createIndex(
    { listed: 1, availability: 1, salesCount: -1, _id: -1 },
    { name: 'idx_products_sort_popular' }
  );
  await db.collection(COLLECTIONS.PRODUCTS).createIndex(
    { listed: 1, featuredScore: -1, _id: -1 },
    { name: 'idx_products_sort_featured' }
  );

  // ── 6. Orders ──
  await db.collection(COLLECTIONS.ORDERS).createIndex(
    { orderNumber: 1 },
    { unique: true, name: 'idx_orders_orderNumber_unique' }
  );
  await db.collection(COLLECTIONS.ORDERS).createIndex(
    { customerId: 1, createdAt: -1 },
    { name: 'idx_orders_customer_created' }
  );
  await db.collection(COLLECTIONS.ORDERS).createIndex(
    { customerId: 1, status: 1, createdAt: -1 },
    { name: 'idx_orders_customer_status_created' }
  );
  await db.collection(COLLECTIONS.ORDERS).createIndex(
    { farmerId: 1, status: 1, createdAt: -1 },
    { name: 'idx_orders_farmer_status_created' }
  );
  await db.collection(COLLECTIONS.ORDERS).createIndex(
    { farmerId: 1, 'pickup.start': 1 },
    { name: 'idx_orders_farmer_pickup_schedule' }
  );
  await db.collection(COLLECTIONS.ORDERS).createIndex(
    { checkoutId: 1 },
    { name: 'idx_orders_checkoutId' }
  );
  await db.collection(COLLECTIONS.ORDERS).createIndex(
    { customerId: 1, idempotencyKey: 1 },
    {
      unique: true,
      name: 'idx_orders_customer_idempotency_unique',
      partialFilterExpression: { idempotencyKey: { $exists: true } },
    }
  );
  await db.collection(COLLECTIONS.ORDERS).createIndex(
    { slotKey: 1, status: 1 },
    { name: 'idx_orders_slotKey_status' }
  );
  await db.collection(COLLECTIONS.ORDERS).createIndex(
    { farmerId: 1, status: 1, completedAt: -1 },
    { name: 'idx_orders_farmer_status_completed' }
  );
  await db.collection(COLLECTIONS.ORDERS).createIndex(
    { farmerId: 1, createdAt: -1 },
    { name: 'idx_orders_farmer_created' }
  );
  await db.collection(COLLECTIONS.ORDERS).createIndex(
    { status: 1, createdAt: -1 },
    { name: 'idx_orders_status_created' }
  );
  await db.collection(COLLECTIONS.ORDERS).createIndex(
    { createdAt: -1 },
    { name: 'idx_orders_created' }
  );
  await db.collection(COLLECTIONS.ORDERS).createIndex(
    { marketId: 1, status: 1, createdAt: -1 },
    { name: 'idx_orders_market_status_created' }
  );

  // ── 6b. Checkouts ──
  await db.collection(COLLECTIONS.CHECKOUTS).createIndex(
    { customerId: 1, idempotencyKey: 1 },
    { unique: true, name: 'idx_checkouts_customer_idempotency_unique' }
  );
  await db.collection(COLLECTIONS.CHECKOUTS).createIndex(
    { createdAt: -1 },
    { name: 'idx_checkouts_created' }
  );

  // ── 7. Reviews ──
  await db.collection(COLLECTIONS.REVIEWS).createIndex(
    { farmerId: 1, status: 1, createdAt: -1 },
    { name: 'idx_reviews_farmer_status_created' }
  );
  await db.collection(COLLECTIONS.REVIEWS).createIndex(
    { productId: 1, status: 1, createdAt: -1 },
    { name: 'idx_reviews_product_status_created' }
  );
  await db.collection(COLLECTIONS.REVIEWS).createIndex(
    { orderId: 1, targetType: 1, productId: 1, farmerId: 1 },
    {
      unique: true,
      name: 'idx_reviews_single_per_target_unique',
      partialFilterExpression: { orderId: { $exists: true } },
    }
  );

  // ── 8. Favorites ──
  await db.collection(COLLECTIONS.FAVORITES).createIndex(
    { userId: 1, targetType: 1, targetId: 1 },
    { unique: true, name: 'idx_favorites_user_target_unique' }
  );
  await db.collection(COLLECTIONS.FAVORITES).createIndex(
    { userId: 1, createdAt: -1 },
    { name: 'idx_favorites_user_created' }
  );
  await db.collection(COLLECTIONS.FAVORITES).createIndex(
    { targetType: 1, targetId: 1 },
    { name: 'idx_favorites_targetType_targetId' }
  );

  // ── 9. Notifications ──
  await db.collection(COLLECTIONS.NOTIFICATIONS).createIndex(
    { userId: 1, readAt: 1, createdAt: -1 },
    { name: 'idx_notifications_user_inbox' }
  );
  await db.collection(COLLECTIONS.NOTIFICATIONS).createIndex(
    { userId: 1, type: 1, createdAt: -1 },
    { name: 'idx_notifications_user_type_created' }
  );
  await db.collection(COLLECTIONS.NOTIFICATIONS).createIndex(
    { createdAt: 1 },
    { expireAfterSeconds: 90 * 24 * 60 * 60, name: 'idx_notifications_ttl_90d' }
  );

  // ── 10. Sessions (Refresh Tokens) ──
  await db.collection(COLLECTIONS.SESSIONS).createIndex(
    { tokenHash: 1 },
    { unique: true, name: 'idx_sessions_tokenHash_unique' }
  );
  await db.collection(COLLECTIONS.SESSIONS).createIndex(
    { userId: 1 },
    { name: 'idx_sessions_userId' }
  );
  await db.collection(COLLECTIONS.SESSIONS).createIndex(
    { expiresAt: 1 },
    { expireAfterSeconds: 0, name: 'idx_sessions_ttl' }
  );

  // ── 11. Password Resets ──
  await db.collection(COLLECTIONS.PASSWORD_RESETS).createIndex(
    { tokenHash: 1 },
    { unique: true, name: 'idx_passwordResets_tokenHash_unique' }
  );
  await db.collection(COLLECTIONS.PASSWORD_RESETS).createIndex(
    { expiresAt: 1 },
    { expireAfterSeconds: 0, name: 'idx_passwordResets_ttl' }
  );

  // ── 12. Contact Messages ──
  await db.collection(COLLECTIONS.CONTACT_MESSAGES).createIndex(
    { createdAt: -1 },
    { name: 'idx_contactMessages_created' }
  );
  await db.collection(COLLECTIONS.CONTACT_MESSAGES).createIndex(
    { status: 1, createdAt: -1 },
    { name: 'idx_contactMessages_status_created' }
  );

  // ── 13. Announcements ──
  await db.collection(COLLECTIONS.ANNOUNCEMENTS).createIndex(
    { audience: 1, publishedAt: -1 },
    { name: 'idx_announcements_audience_published' }
  );

  // ── 14. Moderation Flags ──
  await db.collection(COLLECTIONS.MODERATION_FLAGS).createIndex(
    { status: 1, createdAt: -1 },
    { name: 'idx_moderationFlags_status_created' }
  );
  await db.collection(COLLECTIONS.MODERATION_FLAGS).createIndex(
    { targetType: 1, targetId: 1 },
    { name: 'idx_moderationFlags_target' }
  );
  await db.collection(COLLECTIONS.MODERATION_FLAGS).createIndex(
    { targetType: 1, targetId: 1, reporterId: 1, status: 1 },
    { name: 'idx_moderationFlags_target_reporter_status' }
  );

  // ── 15. Search History ──
  await db.collection(COLLECTIONS.SEARCH_HISTORY).createIndex(
    { userId: 1, at: -1 },
    { name: 'idx_searchHistory_user_at' }
  );
  await db.collection(COLLECTIONS.SEARCH_HISTORY).createIndex(
    { at: 1 },
    { expireAfterSeconds: 60 * 24 * 60 * 60, name: 'idx_searchHistory_ttl_60d' }
  );

  // ── 16. Audit Log ──
  await db.collection(COLLECTIONS.AUDIT_LOG).createIndex(
    { at: -1 },
    { name: 'idx_auditLog_at' }
  );
  await db.collection(COLLECTIONS.AUDIT_LOG).createIndex(
    { targetType: 1, targetId: 1 },
    { name: 'idx_auditLog_target' }
  );
  await db.collection(COLLECTIONS.AUDIT_LOG).createIndex(
    { at: 1 },
    { expireAfterSeconds: 365 * 24 * 60 * 60, name: 'idx_auditLog_ttl_365d' }
  );

  // ── 17. Reports ──
  await db.collection(COLLECTIONS.REPORTS).createIndex(
    { generatedAt: -1 },
    { name: 'idx_reports_generatedAt' }
  );
}
