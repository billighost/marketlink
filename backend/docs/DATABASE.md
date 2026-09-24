# MarketLink Database Design (Native MongoDB Driver)

> Technical reference and schema architecture for the MarketLink platform.  
> Built with raw MongoDB queries, `$jsonSchema` validators, explicit indexes, and targeted denormalization.

---

## 1. Architectural Principles

1. **Native Driver (`mongodb`) Only**: No Mongoose, ODM, or ORM. Queries use native driver methods (`find`, `findOne`, `updateOne`, `bulkWrite`, `aggregate`, `findOneAndUpdate`).
2. **Embed vs. Reference**:
   - **Embed** what is read and displayed together (e.g. order item snapshots, pickup slots, timeline history, notification preferences).
   - **Reference** entities that change independently (e.g. users, products, markets, farmers).
3. **Intentional Denormalization**:
   - Small read-heavy snapshots are denormalized at write time to avoid expensive multi-collection joins on high-traffic browsing and checkout queries.
4. **Integer Cents**: All financial values (`priceCents`, `subtotalCents`, `totalCents`, `lineTotalCents`) are stored strictly as integers. No floating point.
5. **UTC BSON Dates**: All timestamps stored as BSON `Date` (UTC) and returned as ISO-8601 strings.
6. **Identifiers**: Internal MongoDB `ObjectId` internally; exposed publicly as `id` string via `toApi()`.

---

## 2. Collections and Fields

### `users`
Stores accounts for all three roles: Customers, Farmers, and Admins.
- `_id`: ObjectId
- `role`: `'customer' | 'farmer' | 'admin'`
- `name`: String (full name)
- `email`: String (lowercase, unique)
- `passwordHash`: String (bcrypt cost 10)
- `phone`: String
- `address`: String
- `status`: Customer (`active | inactive`), Farmer (`pending | active | suspended | rejected`), Admin (`active`)
- `homeMarketId`: ObjectId | null (preferred local market)
- `savedMarketIds`: Array<ObjectId> (bookmarked markets)
- `notificationPrefs`: `{ orderUpdates: bool, readyAlerts: bool, weeklyPicks: bool, restockAlerts: bool }`
- `createdAt`, `updatedAt`: Date
- `lastLoginAt`: Date

### `farmers`
Farmer profile, exactly 1:1 with a `users` document where `role === 'farmer'`.
- `_id`: ObjectId
- `userId`: ObjectId (unique 1:1 link to `users._id`)
- `stallName`: String (public market display name)
- `contactPerson`: String
- `phone`: String
- `email`: String
- `specialty`: String (e.g. "Organic vegetables and heritage tomatoes")
- `story`: String (farmer bio / farm background)
- `since`: Integer (year established)
- `stallNumber`: String (e.g. "Stall 4")
- `marketIds`: Array<ObjectId> (markets where farmer operates)
- `operatingDays`: Array<'mon'..'sun'>
- `pickupWindows`: Array<{ day, startMin, endMin }> (minutes from midnight, e.g. 480 for 8:00 AM)
- `cutoffMinutesBefore`: Integer (pre-order close window before pickup start)
- `address`: String
- `location`: GeoJSON Point `{ type: 'Point', coordinates: [lng, lat] }`
- `art`: String (illustration asset key used by the front end)
- `listingEnabled`: Boolean (denormalized: true only when user's status is `active`)
- `ratingAvg`: Double (1.0 to 5.0)
- `ratingCount`: Integer
- `ratingSum`: Integer (cumulative rating total for atomic avg recalculation)
- `salesCount`: Integer (total units sold across completed orders)
- `stallNameLower`: String (lowercase stallName for anchored prefix suggestions)
- `categorySlugs`: Array<String> (denormalized from active products for farmer browse filtering)
- `rnd`: Double in `[0,1)` (assigned via Mulberry32 PRNG for deterministic random sampling)
- `imageUrl`: String | null
- `isTopSeller`: Boolean
- `isNew`: Boolean
- `createdAt`, `updatedAt`: Date

### `markets`
Physical farmers market locations.
- `_id`: ObjectId
- `name`: String
- `slug`: String (unique URL slug)
- `address`: String
- `location`: GeoJSON Point `{ type: 'Point', coordinates: [lng, lat] }`
- `schedule`: Array<{ day, openMin, closeMin }>
- `timezone`: String (e.g. "America/New_York")
- `note`: String (parking, entry instructions)
- `facilities`: Array<String> (e.g. 'parking', 'restrooms', 'wheelchair-accessible')
- `farmerCount`: Integer (denormalized: active attending farmers)
- `status`: `'active' | 'removed'`
- `createdAt`, `updatedAt`: Date

### `categories`
Product categorization taxonomy.
- `_id`: ObjectId
- `name`: String
- `slug`: String (unique)
- `sortOrder`: Integer
- `art`: String (icon/illustration key)
- `active`: Boolean

### `products`
Goods offered by farmers for pre-order.
- `_id`: ObjectId
- `farmerId`: ObjectId (references `farmers._id`)
- `farmerUserId`: ObjectId (denormalized for fast ownership authorization checks)
- `farmer`: `{ stallName, stallNumber, art }` (denormalized display snapshot)
- `marketIds`: Array<ObjectId> (inherited from farmer)
- `categoryId`: ObjectId (references `categories._id`)
- `categorySlug`: String (denormalized for fast browse queries)
- `name`: String
- `nameLower`: String (lowercase name for anchored prefix queries and text search fallback)
- `description`: String
- `priceCents`: Integer (cents)
- `unit`: `'lb' | 'bunch' | 'loaf' | 'jar' | 'dozen' | 'each' | 'pint' | 'bag'`
- `quantityAvailable`: Integer (active stock for upcoming market day)
- `lowStockThreshold`: Integer
- `availability`: `'in' | 'low' | 'out' | 'hidden'`
- `listed`: Boolean (denormalized: true iff farmer.listingEnabled, !moderation.removed, and availability !== 'hidden')
- `tags`: Array<String> ('seasonal', 'organic', 'new', 'bestseller')
- `art`: String
- `imageUrl`: String | null
- `weekly`: `{ enabled: bool, defaultQty: int }` (inventory reset template)
- `ratingAvg`: Double
- `ratingCount`: Integer
- `ratingSum`: Integer
- `salesCount`: Integer
- `featuredScore`: Integer (recomputed ranking: salesCount*2 + ratingAvg*ratingCount + bonus)
- `rnd`: Double in `[0,1)` (assigned via Mulberry32 PRNG for deterministic random sampling in feed)
- `moderation`: `{ removed: bool, reason?: string, at?: Date }`
- `createdAt`, `updatedAt`: Date

### `checkouts`
Idempotent checkout sessions tracking atomic multi-vendor pre-orders.
- `_id`: ObjectId
- `customerId`: ObjectId
- `idempotencyKey`: String
- `status`: `'pending' | 'completed' | 'failed'`
- `orderIds`: Array<ObjectId>
- `orders`: Array<Object> (serialized summary snapshots for cached duplicate replay)
- `error`: Object | null
- `createdAt`: Date
- `completedAt`: Date | null

### `orders`
One order per farmer. A multi-farmer checkout creates multiple orders sharing a `checkoutId`.
- `_id`: ObjectId
- `orderNumber`: String (unique, e.g. "ML-1041")
- `checkoutId`: String | ObjectId (grouped checkout session)
- `idempotencyKey`: String (unique per customer partial)
- `slotKey`: String (`<farmerId>|<start ISO>` for capacity checks)
- `customerId`: ObjectId
- `customerName`: String (snapshot at order placement)
- `farmerId`: ObjectId
- `farmerUserId`: ObjectId
- `farmerName`: String (snapshot)
- `marketId`: ObjectId
- `items`: Array<{ productId, name, unit, priceCents, quantity, lineTotalCents, art }> (immutable price snapshot)
- `subtotalCents`: Integer
- `totalCents`: Integer
- `status`: `'placed' | 'accepted' | 'ready' | 'completed' | 'cancelled' | 'declined'`
- `pickup`: `{ start: Date, end: Date, stallNumber: string }`
- `cutoffAt`: Date
- `note`: String
- `timeline`: Array<{ status, at: Date, byRole: string }>
- `cancelReason`: String (optional)
- `reviewed`: Boolean
- `createdAt`, `updatedAt`: Date

### `reviews`
Ratings and customer reviews for farmers and products.
- `_id`: ObjectId
- `targetType`: `'farmer' | 'product'`
- `farmerId`: ObjectId
- `productId`: ObjectId (optional)
- `customerId`: ObjectId
- `customerName`: String (snapshot)
- `orderId`: ObjectId
- `rating`: Integer (1 to 5)
- `comment`: String
- `reply`: `{ text: string, at: Date }` (optional farmer response)
- `status`: `'visible' | 'removed'`
- `createdAt`: Date

### `favorites`
Customer bookmarks for products and farmers.
- `_id`: ObjectId
- `userId`: ObjectId
- `targetType`: `'product' | 'farmer'`
- `targetId`: ObjectId
- `createdAt`: Date

### `notifications`
Customer and farmer system alerts.
- `_id`: ObjectId
- `userId`: ObjectId
- `type`: `'order_placed' | 'order_accepted' | 'order_ready' | 'order_completed' | 'order_declined' | 'order_cancelled' | 'restock' | 'announcement' | 'review_reply' | 'account'`
- `title`: String
- `body`: String
- `data`: Object (e.g. `{ orderId, orderNumber }`)
- `readAt`: Date | null
- `createdAt`: Date (TTL: 90 days)

### `sessions`
Hashed refresh token session tracking with rotation and reuse defense.
- `_id`: ObjectId
- `userId`: ObjectId
- `tokenHash`: String (SHA-256 unique)
- `createdAt`: Date
- `expiresAt`: Date (TTL: 30 days)
- `revokedAt`: Date | null
- `replacedBy`: String | null (SHA-256 hash of rotated token)
- `userAgent`: String
- `ip`: String

### `passwordResets`
Secure password reset token storage.
- `_id`: ObjectId
- `userId`: ObjectId
- `tokenHash`: String (SHA-256 unique)
- `expiresAt`: Date (TTL: 30 minutes)
- `usedAt`: Date | null

### `contactMessages`
Guest and customer inquiries submitted through the contact form.
- `_id`: ObjectId
- `name`: String
- `email`: String
- `topic`: `'order' | 'farmer-help' | 'feedback' | 'other'`
- `message`: String (max 2000 chars)
- `createdAt`: Date
- `ip`: String

### `announcements`
Admin broadcast banners for all users or specific roles.
- `_id`: ObjectId
- `title`: String
- `body`: String
- `audience`: `'all' | 'customer' | 'farmer'`
- `publishedAt`: Date
- `expiresAt`: Date | null
- `createdBy`: ObjectId

### `moderationFlags`
Content review queue for flagged listings or abusive reviews.
- `_id`: ObjectId
- `targetType`: `'listing' | 'review'`
- `targetId`: ObjectId
- `reason`: String
- `reporterId`: ObjectId
- `status`: `'open' | 'resolved' | 'removed'`
- `createdAt`: Date
- `resolvedAt`: Date | null
- `resolvedBy`: ObjectId | null

### `searchHistory`
Recent user search terms for auto-suggestions.
- `_id`: ObjectId
- `userId`: ObjectId
- `term`: String
- `at`: Date (TTL: 60 days)

### `counters`
Atomic sequence counters for generating sequential order numbers.
- `_id`: String (e.g. 'orderNumber')
- `seq`: Long / Integer (incremented via `$inc`)

---

## 3. Denormalization Strategy & Synchronization

| Snapshot Field | Target Location | Why Denormalized | Synchronization Mechanism |
|---|---|---|---|
| `farmerUserId` | `products` | Allows single-query ownership check during product editing without loading the Farmer document | Stored at product creation |
| `farmer { stallName, stallNumber, art }` | `products` | Renders catalog cards instantly without `$lookup` to `farmers` collection | Updated on farmer profile change |
| `categorySlug` | `products` | Enables direct indexed filtering by category slug | Stored at product creation |
| `farmerCount` | `markets` | Renders market discovery cards with farmer totals without count queries | Recalculated when farmer active status changes |
| `items[].lineTotalCents` & price snapshot | `orders` | Preserves historical pricing even if product prices change later | Immutable snapshot on order placement |
| `customerName` & `farmerName` | `orders` | Allows instant order invoice rendering without user lookups | Immutable snapshot on order placement |
| `listingEnabled` | `farmers` | Fast filtering for active approved farmers | Updated when user account status changes |
| `salesCount`, `ratingAvg` | `farmers`, `products` | Powers top sellers and search sorting without aggregate calculations | Recalculated periodically or on review/order completion |

---

## 4. Index Catalog & Purpose

| Collection | Index Key | Purpose |
|---|---|---|
| `users` | `{ email: 1 }` **unique** | Fast login credential lookup and duplicate email prevention |
| `users` | `{ role: 1, status: 1, createdAt: -1 }` | Admin user filtering and pagination |
| `farmers` | `{ userId: 1 }` **unique** | Enforces 1:1 user-to-farmer invariant and fast profile lookup |
| `farmers` | `{ listingEnabled: 1, marketIds: 1, ratingAvg: -1 }` | Market view farmer directory sorted by rating |
| `farmers` | `{ listingEnabled: 1, isTopSeller: 1, salesCount: -1 }` | Homepage "Top Selling Farmers" row |
| `farmers` | `{ location: '2dsphere' }` | Geospatial discovery of nearby farmers |
| `farmers` | Text `{ stallName: 10, specialty: 5, story: 1 }` | Full-text search across farmer stalls and stories |
| `markets` | `{ slug: 1 }` **unique** | URL slug resolution |
| `markets` | `{ location: '2dsphere' }` | Geospatial discovery of nearest markets |
| `markets` | `{ status: 1, name: 1 }` | Active market list |
| `categories` | `{ slug: 1 }` **unique** | Category URL lookup |
| `categories` | `{ active: 1, sortOrder: 1 }` | Category navigation bar ordering |
| `products` | `{ farmerId: 1, availability: 1 }` | Farmer's inventory dashboard |
| `products` | `{ availability: 1, categorySlug: 1, priceCents: 1 }` | Catalog filtering and price sorting |
| `products` | `{ marketIds: 1, availability: 1, createdAt: -1 }` | Market product view & "New This Week" row |
| `products` | `{ salesCount: -1 }` partial (`moderation.removed: false`) | Top selling products row |
| `products` | Text `{ name: 10, tags: 5, description: 1 }` | Full-text catalog search |
| `checkouts` | `{ customerId: 1, idempotencyKey: 1 }` **unique** | Enforces idempotent checkout requests per customer |
| `checkouts` | `{ createdAt: 1 }` | Checkout session ordering and lifecycle tracking |
| `orders` | `{ orderNumber: 1 }` **unique** | Direct lookup by order number |
| `orders` | `{ customerId: 1, idempotencyKey: 1 }` **unique partial** | Prevents duplicate order placement on network retries |
| `orders` | `{ slotKey: 1, status: 1 }` | Fast slot capacity calculation and limits |
| `orders` | `{ customerId: 1, createdAt: -1 }` | Customer order history |
| `orders` | `{ customerId: 1, status: 1, createdAt: -1 }` | Customer Active vs. Past order tabs |
| `orders` | `{ farmerId: 1, status: 1, createdAt: -1 }` | Farmer inbox status filtering |
| `orders` | `{ farmerId: 1, 'pickup.start': 1 }` | Farmer pickup schedule calendar |
| `orders` | `{ checkoutId: 1 }` | Multi-farmer grouped checkout lookup |
| `reviews` | `{ farmerId: 1, status: 1, createdAt: -1 }` | Farmer profile review list |
| `reviews` | `{ productId: 1, status: 1, createdAt: -1 }` | Product detail review list |
| `reviews` | `{ orderId: 1, targetType: 1, productId: 1, farmerId: 1 }` **unique** | Prevents duplicate reviews for the same order item |
| `favorites` | `{ userId: 1, targetType: 1, targetId: 1 }` **unique** | Prevents duplicate bookmarking |
| `favorites` | `{ targetType: 1, targetId: 1 }` | Restock alert lookup of customers who favorited a product |
| `favorites` | `{ userId: 1, targetType: 1, createdAt: -1 }` | Keyset pagination of customer favorites |
| `favorites` | `{ userId: 1, createdAt: -1 }` | User favorites listing |
| `notifications` | `{ userId: 1, readAt: 1, createdAt: -1 }` | Unread notifications query |
| `notifications` | `{ userId: 1, type: 1, createdAt: -1 }` | Deduplication and type-filtered notification lookup |
| `notifications` | `{ createdAt: 1 }` (TTL: 90 days) | Automatic cleanup of stale notifications |
| `moderationFlags` | `{ targetType: 1, targetId: 1, reporterId: 1, status: 1 }` | Single open flag per reporter per target verification |
| `sessions` | `{ tokenHash: 1 }` **unique** | Fast refresh token hash lookup |
| `farmers` | `{ listingEnabled: 1, stallNameLower: 1 }` | Fast anchored prefix match on farmer stall names |
| `farmers` | `{ listingEnabled: 1, rnd: 1 }` | Fast index-based pseudo-random sampling for feed |
| `farmers` | `{ listingEnabled: 1, categorySlugs: 1, ratingAvg: -1 }` | Farmer directory filtered by category slug |
| `farmers` | `{ listingEnabled: 1, ratingAvg: -1, _id: -1 }` | Keyset pagination for rating sort |
| `farmers` | `{ listingEnabled: 1, salesCount: -1, _id: -1 }` | Keyset pagination for top sellers sort |
| `farmers` | `{ listingEnabled: 1, createdAt: -1, _id: -1 }` | Keyset pagination for new farmers sort |
| `farmers` | `{ listingEnabled: 1, stallName: 1, _id: 1 }` | Keyset pagination for alphabetical name sort |
| `farmers` | `{ listingEnabled: 1, operatingDays: 1 }` | Resolves active farmers by operating day |
| `products` | `{ listed: 1, nameLower: 1 }` | Fast anchored prefix matching on product names |
| `products` | `{ listed: 1, rnd: 1 }` | Fast index-based pseudo-random sampling for feed walker |
| `products` | `{ listed: 1, availability: 1, createdAt: -1, _id: -1 }` | Keyset pagination for newest sort |
| `products` | `{ listed: 1, availability: 1, categorySlug: 1, priceCents: 1, _id: 1 }` | Keyset pagination for price_asc with category |
| `products` | `{ listed: 1, availability: 1, priceCents: 1, _id: 1 }` | Keyset pagination for price_asc / price_desc without category |
| `products` | `{ listed: 1, availability: 1, salesCount: -1, _id: -1 }` | Keyset pagination for popular sort |
| `products` | `{ listed: 1, featuredScore: -1, _id: -1 }` | Keyset pagination for featured sort |
| `sessions` | `{ userId: 1 }` | Global session revocation for a user |
| `sessions` | `{ expiresAt: 1 }` (TTL: 0s) | Automatic expired session cleanup |
| `passwordResets` | `{ tokenHash: 1 }` **unique** | Fast password reset token lookup |
| `passwordResets` | `{ expiresAt: 1 }` (TTL: 0s) | Automatic expired reset token cleanup |
| `contactMessages` | `{ createdAt: -1 }` | Reverse-chronological admin message inbox |
| `announcements` | `{ audience: 1, publishedAt: -1 }` | Banner display by user role |
| `moderationFlags` | `{ status: 1, createdAt: -1 }` | Moderation queue |
| `moderationFlags` | `{ targetType: 1, targetId: 1 }` | Content flag status lookups |
| `searchHistory` | `{ userId: 1, at: -1 }` | Recent searches by user |
| `searchHistory` | `{ at: 1 }` (TTL: 60 days) | Automatic cleanup of search history |


