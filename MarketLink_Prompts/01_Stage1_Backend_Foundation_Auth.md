# MarketLink Backend: Stage 1 of 9 (Foundation, Database, Seed, Auth)

You are a **senior backend engineer**. MarketLink is a farmers-market **pre-order for pickup** platform (Customers, Farmers, Admins). The React front end already exists (guest pages and Customer app built with placeholder data; farmer/admin pages are still skeletons). We are now building the **full backend**, in stages. **This is Stage 1.** Build it properly, keep it fast, keep it simple enough for students to explain line by line, and **prove it works by running it**.

"Must" is not optional. Read this whole prompt before writing code. **Write a short plan first**, then build.

---

## 0. Decisions already made (do not change)

- **Stack: MERN option from the project brief**: **M**ongoDB, **E**xpress.js, **R**eact (existing front end), **N**ode.js.
- Backend lives in a **new `backend/` folder** inside the project. Do **not** move, rename or edit the existing front-end folder in this stage. Detect the current layout (if the front end is at the repo root, create `backend/` beside `src/`; if there is a wrapper folder, create it as a sibling of the front-end folder), choose the least disruptive option, and record it in your decisions list. Add a short root `README.md` note on how the two folders relate.
- "Raw and fastest queries" **means the official `mongodb` native driver**: **no Mongoose, no ODM, no ORM.** Every query is hand-written with the driver (`find`, `findOne`, `updateOne`, `bulkWrite`, `aggregate`, `countDocuments`, `findOneAndUpdate`), with **projections, indexes and atomic operators** chosen for speed (section 6).
- Plain **JavaScript (ES modules)**, no TypeScript, to match the front end.
- **No payment gateway, no delivery.** Customers pay in person at pickup.
- On screen and in user-facing API messages the words are **"Customer" and "Farmer"** (never "buyer" or "vendor"). Role values in the database and tokens are `customer`, `farmer`, `admin`. (Front-end folders use `buyer`/`vendor`; the API will use `customer`/`farmer`; a mapping happens in the front end later.)

## 1. Scope of Stage 1

**Build in this stage:**
1. Backend project scaffold, tooling and configuration.
2. MongoDB connection layer (pooled, singleton).
3. **Complete database design for the whole product** (all collections, validators, indexes), created by code, so later stages only add routes.
4. **Seed script** with rich realistic data for every collection.
5. Cross-cutting infrastructure: response format, errors, validation, security, logging, timing, rate limiting.
6. **Authentication and authorisation**: register (Customer and Farmer), login, refresh, logout, current user, forgot/reset password, change password, role guard.
7. **Guest-facing routes needed now**: health checks and the Contact form.
8. **Automated tests and manual smoke tests**, run and reported.

**Do NOT build in this stage:** markets/farmers/products/orders/reviews/favourites APIs, the feed, farmer or admin management APIs, or any front-end change. (Their collections, indexes and seed data **do** exist after this stage.)

**Roadmap, for context only (so your design supports it):**
Stage 2 catalog and discovery (markets, farmers, products, search, filters, home feed) · Stage 3 orders, favourites, reviews, notifications, assistant · Stage 4 farmer and admin APIs · Stage 5 performance, security hardening, full backend verification · Stage 6 connect front end (guest, auth, Customer) · Stage 7 connect and finish Farmer and Admin front end · Stage 8 remove every placeholder and fill data gaps · Stage 9 brief compliance audit and final polish.

---

## 2. Tooling and packages

Node **20 LTS or newer**. Use built-in Node features wherever possible. Keep `package.json` short. Allowed dependencies (justify any extra in one line):

| Package | Why |
|---|---|
| `express` (v5, so async errors reach the error handler automatically; check the current stable version with `npm view express version`) | HTTP framework |
| `mongodb` | Official driver (raw queries) |
| `dotenv` | Load `.env` (or use `node --env-file`, your choice; keep simple) |
| `cors` | Cross-origin (front end on another port) |
| `helmet` | Security headers |
| `express-rate-limit` | Brute-force and abuse protection |
| `jsonwebtoken` | Access tokens |
| `bcryptjs` | Password hashing (pure JS, installs everywhere) |
| `cookie-parser` | Read the refresh-token cookie |
| `compression` | Gzip responses |

**No** Mongoose, Passport, Joi/Zod, Lodash, Axios, Morgan, Winston, ts-node, supertest, jest, nodemon, or mongodb-memory-server. Instead:
- Development reload: `node --watch`.
- Tests: built-in **`node:test`** and `node:assert`, using `fetch` against a real test server.
- Validation: small **hand-written validators** in `src/utils/validate.js`.
- Logging: a tiny request logger in `src/middleware/requestLogger.js` using `console`.

Scripts in `package.json`: `dev`, `start`, `seed`, `indexes`, `test`, `smoke`.

**MongoDB**: the developer runs MongoDB locally (Community Server) or uses a free Atlas cluster. Configuration is by `MONGODB_URI`. Tests use a separate database (`marketlink_test`). Document both options in the README, with exact commands for Windows, macOS and Linux.

---

## 3. Folder structure (create exactly this, keep it shallow)

```
backend/
├─ package.json
├─ .env.example
├─ .gitignore
├─ README.md                    (install, env, run, seed, test, credentials, troubleshooting)
├─ docs/
│  ├─ DATABASE.md               (collections, fields, indexes, and WHY)
│  └─ API.md                    (every endpoint: method, path, auth, body, responses; grows each stage)
├─ scripts/
│  └─ smoke.sh                  (curl smoke test for a running server; also provide smoke.ps1 for Windows)
├─ src/
│  ├─ server.js                 (connect DB, ensure indexes, listen, graceful shutdown)
│  ├─ app.js                    (create the Express app: middleware order, routes, error handling)
│  ├─ config/
│  │  └─ env.js                 (read and validate environment variables, fail fast with clear messages)
│  ├─ db/
│  │  ├─ client.js              (MongoClient singleton: connectDb, getDb, closeDb)
│  │  ├─ collections.js         (names + $jsonSchema validators + createCollections())
│  │  ├─ indexes.js             (ensureIndexes(): every index for every collection)
│  │  └─ seed.js                (npm run seed)
│  ├─ middleware/
│  │  ├─ requestLogger.js       (method, path, status, ms; warn on slow requests; Server-Timing header)
│  │  ├─ sanitize.js            (block NoSQL operator injection in body/query/params)
│  │  ├─ rateLimits.js          (global + strict limiters, configurable by env)
│  │  ├─ auth.js                (requireAuth, requireRole(...roles), optionalAuth)
│  │  ├─ notFound.js
│  │  └─ errorHandler.js        (one JSON error shape, no stack traces in production)
│  ├─ modules/
│  │  ├─ health/                health.routes.js
│  │  ├─ auth/                  auth.routes.js, auth.service.js
│  │  ├─ users/                 users.routes.js, users.service.js
│  │  └─ contact/               contact.routes.js, contact.service.js
│  ├─ utils/
│  │  ├─ validate.js            (tiny validators: string, email, phone, password, enum, objectId, integer…)
│  │  ├─ tokens.js              (sign/verify JWT, random tokens, sha256)
│  │  ├─ errors.js              (AppError + helpers: badRequest, unauthorized, forbidden, notFound, conflict, unprocessable)
│  │  ├─ ids.js                 (toObjectId, toApi: _id → id, strip internal fields)
│  │  ├─ mailer.js              (STUB: logs the email to the console in dev; real SMTP later)
│  │  └─ time.js                (helpers for pickup dates relative to “now”, used by seed and later stages)
│  └─ constants.js              (roles, statuses, order statuses, days, units: one source of truth)
└─ tests/
   ├─ helpers.js                (boot server on a random port, test DB, reset + seed, fetch helpers, login helpers)
   ├─ health.test.js
   ├─ auth.test.js
   ├─ users.test.js
   ├─ contact.test.js
   ├─ security.test.js
   ├─ db.test.js                (indexes exist, explain plans use indexes, seed integrity)
   └─ perf.test.js
```

Each module has **thin routes** (parse input, validate, call the service, send the response) and a **service** file that holds **all database queries**. Routes never touch the database directly.

Code style: function-only, named exports, one short comment at the top of every file, comments above any non-obvious query explaining *why it is written that way*. No classes except `AppError`. No clever abstractions.

---

## 4. Conventions for the whole API

- **Base path** `/api`. Port `4000` by default.
- **JSON only.** Success: `{ "data": ..., "meta": { ... } }` (`meta` optional: pagination, counts). Errors: `{ "error": { "code": "VALIDATION_FAILED", "message": "Please check the highlighted fields.", "details": [ { "field": "email", "message": "Enter a valid email." } ] } }`.
- **Status codes**: 200, 201, 204, 400 (malformed), 401 (not signed in / bad token), 403 (wrong role or blocked account), 404, 409 (conflict, e.g. duplicate email), 413, 422 (validation), 429, 500. Stable machine-readable `code` strings: `VALIDATION_FAILED`, `INVALID_CREDENTIALS`, `UNAUTHENTICATED`, `TOKEN_EXPIRED`, `FORBIDDEN`, `ACCOUNT_SUSPENDED`, `ACCOUNT_INACTIVE`, `EMAIL_TAKEN`, `NOT_FOUND`, `RATE_LIMITED`, `PAYLOAD_TOO_LARGE`, `BAD_JSON`, `INTERNAL`.
- **IDs**: MongoDB `ObjectId` internally; the API always exposes them as a string field **`id`** (never `_id`). Use one helper (`toApi`) so this is done in one place, cheaply.
- **Money is stored as integer cents** (`priceCents`, `totalCents`). Never floats. The API returns cents; the front end formats.
- **Dates** are stored as BSON `Date` (UTC) and returned as ISO-8601 strings.
- **User-facing text** (error messages, emails) is warm, short, plain and uses "Customer" and "Farmer". Never leak internals ("user not found" vs "wrong password": always the generic "That email or password doesn't look right.").
- Emails are trimmed and lower-cased before storing and lookups.
- Every route validates its input **before** touching the database and rejects unknown or wrongly typed fields.

---

## 5. Database design (implement all of it now; the whole product depends on it)

Use the native driver. Create every collection explicitly with `createCollection` and a **`$jsonSchema` validator** (`validationLevel: "moderate"`, `validationAction: "error"`) so bad data is rejected at the database. Keep validators focused on required fields, types and enums.

Design principles (must follow): **embed what is read together; reference what changes independently; denormalise small read-heavy snapshots on purpose** (e.g. farmer name on a product, item prices on an order) to avoid joins. Document each denormalisation and how it is kept in sync (later stages update it).

### Collections and fields

**`users`** (all roles)
`_id, role ('customer'|'farmer'|'admin'), name, email (unique, lowercase), passwordHash, phone, address (string), status, homeMarketId?, savedMarketIds[] , notificationPrefs { orderUpdates, readyAlerts, weeklyPicks, restockAlerts } (booleans), createdAt, updatedAt, lastLoginAt`
`status`: Customers `active | inactive`; Farmers `pending | active | suspended | rejected`; Admins `active`.

**`farmers`** (Farmer profile, 1:1 with a `users` document of role farmer)
`_id, userId (unique), stallName, contactPerson, phone, email, specialty, story, since (year), stallNumber, marketIds[], operatingDays[] ('mon'..'sun'), pickupWindows[ { day, startMin, endMin } ] (minutes from midnight), cutoffMinutesBefore (int: how long before pickup start orders close), address, location { type: 'Point', coordinates: [lng, lat] }, art (illustration key used by the front end), listingEnabled (bool, denormalised: true only when the user's status is active), ratingAvg, ratingCount, salesCount, isTopSeller, isNew, createdAt, updatedAt`

**`markets`**
`_id, name, slug (unique), address, location (GeoJSON Point), schedule[ { day, openMin, closeMin } ], timezone, note, facilities[] (e.g. parking, step-free access), farmerCount (denormalised), status ('active'|'removed'), createdAt, updatedAt`

**`categories`**
`_id, name, slug (unique), sortOrder, art, active`

**`products`**
`_id, farmerId, farmerUserId (denormalised for fast ownership checks), farmer { stallName, stallNumber, art } (denormalised snapshot), marketIds[] (copied from the Farmer), categoryId, categorySlug (denormalised), name, description, priceCents, unit ('lb'|'bunch'|'loaf'|'jar'|'dozen'|'each'|'pint'|'bag'), quantityAvailable, lowStockThreshold, availability ('in'|'low'|'out'|'hidden'), tags[] ('seasonal','organic','new','bestseller'), art, weekly { enabled, defaultQty } (weekly stock template), ratingAvg, ratingCount, salesCount, moderation { removed (bool), reason?, at? }, createdAt, updatedAt`

**`orders`** (one order per Farmer; a multi-Farmer checkout creates several orders sharing a `checkoutId`)
`_id, orderNumber (unique, e.g. 'ML-1042'), checkoutId, customerId, customerName (snapshot), farmerId, farmerUserId, farmerName (snapshot), marketId, items[ { productId, name, unit, priceCents, quantity, lineTotalCents, art } ] (price snapshot), subtotalCents, totalCents, status ('placed'|'accepted'|'ready'|'completed'|'cancelled'|'declined'), pickup { start (Date), end (Date), stallNumber }, cutoffAt (Date), note, timeline[ { status, at, byRole } ], cancelReason?, reviewed (bool), createdAt, updatedAt`
Display mapping (front end later): placed → Placed, accepted → Accepted, ready → Ready for pickup, completed → Completed, cancelled/declined → Cancelled.

**`reviews`**
`_id, targetType ('farmer'|'product'), farmerId, productId?, customerId, customerName (snapshot), orderId, rating (1..5), comment, reply { text, at }?, status ('visible'|'removed'), createdAt`

**`favorites`**: `_id, userId, targetType ('product'|'farmer'), targetId, createdAt`
**`notifications`**: `_id, userId, type, title, body, data (object), readAt?, createdAt`
**`sessions`** (refresh tokens): `_id, userId, tokenHash, createdAt, expiresAt, revokedAt?, replacedBy?, userAgent, ip`
**`passwordResets`**: `_id, userId, tokenHash, expiresAt, usedAt?`
**`contactMessages`**: `_id, name, email, topic, message, createdAt, ip`
**`announcements`**: `_id, title, body, audience ('all'|'customer'|'farmer'), publishedAt, expiresAt?, createdBy`
**`moderationFlags`**: `_id, targetType ('listing'|'review'), targetId, reason, reporterId, status ('open'|'resolved'|'removed'), createdAt, resolvedAt?, resolvedBy?`
**`searchHistory`**: `_id, userId, term, at`
**`counters`**: `_id (e.g. 'orderNumber'), seq` (atomic sequence with `findOneAndUpdate` + `$inc`; used for order numbers in Stage 3)

### Indexes (create all of these in `ensureIndexes()`, idempotent, run at server start and via `npm run indexes`)

| Collection | Index | Serves |
|---|---|---|
| users | `{ email: 1 }` **unique** | login, register uniqueness |
| users | `{ role: 1, status: 1, createdAt: -1 }` | admin people lists |
| farmers | `{ userId: 1 }` **unique** | profile by user |
| farmers | `{ listingEnabled: 1, marketIds: 1, ratingAvg: -1 }` | farmers at a market, top rated |
| farmers | `{ listingEnabled: 1, isTopSeller: 1, salesCount: -1 }` | top-selling Farmers row |
| farmers | `{ location: '2dsphere' }` | nearby Farmers |
| farmers | text index on `stallName`, `specialty`, `story` (weights favour stallName) | search |
| markets | `{ slug: 1 }` **unique**; `{ location: '2dsphere' }`; `{ status: 1, name: 1 }` | market lists and nearby |
| categories | `{ slug: 1 }` **unique**; `{ active: 1, sortOrder: 1 }` | category chips |
| products | `{ farmerId: 1, availability: 1 }` | a Farmer's stock |
| products | `{ availability: 1, categorySlug: 1, priceCents: 1 }` | Browse filters |
| products | `{ marketIds: 1, availability: 1, createdAt: -1 }` | market view, "new this week" |
| products | `{ salesCount: -1 }` partial (`availability: { $ne: 'hidden' }`, `moderation.removed: false`) | best sellers |
| products | text index on `name`, `description`, `tags` (weights favour name) | search |
| orders | `{ orderNumber: 1 }` **unique** | lookups |
| orders | `{ customerId: 1, createdAt: -1 }` | Customer history |
| orders | `{ customerId: 1, status: 1, createdAt: -1 }` | Active vs Past |
| orders | `{ farmerId: 1, status: 1, createdAt: -1 }` | Farmer inbox |
| orders | `{ farmerId: 1, 'pickup.start': 1 }` | Farmer's pickup schedule |
| orders | `{ checkoutId: 1 }` | grouped checkout |
| reviews | `{ farmerId: 1, status: 1, createdAt: -1 }`; `{ productId: 1, status: 1, createdAt: -1 }` | review lists |
| reviews | `{ orderId: 1, targetType: 1, productId: 1, farmerId: 1 }` **unique** partial as appropriate | one review per order per target |
| favorites | `{ userId: 1, targetType: 1, targetId: 1 }` **unique**; `{ userId: 1, createdAt: -1 }` | favourites |
| notifications | `{ userId: 1, readAt: 1, createdAt: -1 }`; **TTL** on `createdAt` (90 days) | inbox |
| sessions | `{ tokenHash: 1 }` **unique**; `{ userId: 1 }`; **TTL** on `expiresAt` (`expireAfterSeconds: 0`) | refresh + cleanup |
| passwordResets | `{ tokenHash: 1 }` **unique**; **TTL** on `expiresAt` | reset flow |
| contactMessages | `{ createdAt: -1 }` | admin later |
| announcements | `{ audience: 1, publishedAt: -1 }` | banners |
| moderationFlags | `{ status: 1, createdAt: -1 }`; `{ targetType: 1, targetId: 1 }` | moderation queue |
| searchHistory | `{ userId: 1, at: -1 }`; **TTL** 60 days | recent searches |

Write `docs/DATABASE.md` explaining each collection, each denormalisation, and each index's purpose in one line (technical working notes for the team).

---

## 6. Query performance rules (apply from day one, and to every later stage)

1. **Every query is covered by an index** designed for it. Tests use `explain('executionStats')` on critical queries and **fail if a `COLLSCAN` appears** (Stage 1: login lookup, session lookup, contact write, seed integrity).
2. **Always project** only the fields needed. Never return `passwordHash`, `tokenHash` or internal fields.
3. **Prefer one query over several.** Use `aggregate` with `$match` first (uses indexes), then `$sort`, `$limit`, `$project`; use `$lookup` only when denormalisation is not appropriate, and always with an indexed foreign field.
4. **Pagination**: use **keyset (cursor) pagination** (`_id` or `createdAt` + `_id`) for feeds and long lists; `skip` only for small admin tables. Always cap `limit` (default 20, max 50).
5. **Atomic updates** with operators (`$inc`, `$set`, `$push`, conditional filters) instead of read-modify-write. Stock decrement (Stage 3) will use `updateOne({ _id, quantityAvailable: { $gte: qty } }, { $inc: { quantityAvailable: -qty } })`.
6. **Batch writes** with `bulkWrite` / `insertMany({ ordered: false })` (used by the seed).
7. **Counts**: `estimatedDocumentCount` for whole-collection counts, `countDocuments` with an indexed filter otherwise. Never count by fetching.
8. **One shared `MongoClient`** with a connection pool (`maxPoolSize` 20, `minPoolSize` 2, sensible `serverSelectionTimeoutMS`, `retryWrites`), created once at start-up.
9. **HTTP-level speed**: `compression`, ETag/`Cache-Control` where appropriate, JSON body limit 100kb, and a `Server-Timing` header showing total time. **Log a warning for any request slower than 150 ms** and show the route.
10. Never run a query inside a loop when one query with `$in` or an aggregation will do (no N+1).

**Performance budget (local, seeded DB)**: `GET /api/health` under 20 ms; login (dominated by bcrypt) under 400 ms; refresh, me, and all reads under 50 ms.

---

## 7. Security and infrastructure (must implement)

- `helmet` defaults; `cors` restricted to `CORS_ORIGINS` (comma-separated env, default `http://localhost:5173`) with `credentials: true`; `x-powered-by` disabled; `trust proxy` configurable by env.
- **Rate limits** (all configurable by env, and disabled by a `RATE_LIMIT_DISABLED=true` test flag except in the dedicated rate-limit test): global 300 requests/minute/IP; login 10 per 15 minutes per IP; register 20 per hour; forgot-password 5 per hour; contact 5 per hour.
- **`sanitize` middleware**: reject (400 `BAD_JSON`/`VALIDATION_FAILED`) any body, query or params containing keys that start with `$` or contain `.` (NoSQL operator injection like `{ "email": { "$gt": "" } }`). Validators additionally require **strings** where strings are expected.
- **Passwords**: bcrypt (`bcryptjs`, cost 10), minimum 8 characters, at least one letter and one number, maximum 72 bytes. Never log or return them.
- **JWT**: HS256, `JWT_SECRET` from env (min 32 characters, fail fast otherwise), issuer `marketlink`, payload `{ sub, role }`, **access token lifetime 15 minutes**. Verification in `requireAuth` is stateless (fast).
- **Refresh tokens**: 48 random bytes, sent as an **httpOnly, `SameSite=Lax`, `Secure` in production** cookie scoped to `/api/auth`, lifetime 30 days. Only the **SHA-256 hash** is stored in `sessions`. **Rotate on every refresh** (revoke the old, issue a new, set `replacedBy`). **Reuse detection**: presenting an already-rotated token revokes all of that user's sessions and returns 401.
- **Account status rules** (checked at login and at refresh, and again by requireRole for farmers where relevant):
  - Customer `inactive` → 403 `ACCOUNT_INACTIVE` with a warm message.
  - Farmer `suspended` or `rejected` → 403 `ACCOUNT_SUSPENDED`.
  - Farmer `pending` → **login succeeds**, and the user object carries `status: 'pending'` so the front end can show "Waiting for approval". (Stage 4 blocks product listing until approved.)
- **Error handler**: never expose stack traces in production; log the stack server-side with a request id; unknown errors become 500 `INTERNAL`. Handle malformed JSON (`BAD_JSON`), oversize bodies (413), and invalid ObjectId strings (404 or 422 as appropriate, never a 500).
- **Graceful shutdown** on SIGINT/SIGTERM (stop accepting, close the server, close the Mongo client). `unhandledRejection` and `uncaughtException` are logged and exit cleanly.
- **Environment** (`.env.example` with comments): `NODE_ENV, PORT, MONGODB_URI, DB_NAME, JWT_SECRET, CORS_ORIGINS, APP_BASE_URL (front end URL for reset links), RATE_LIMIT_DISABLED, TRUST_PROXY, LOG_SLOW_MS`. `config/env.js` validates them at start with clear errors.

---

## 8. Endpoints to build in Stage 1

All under `/api`. Validate everything. Return the conventions from section 4.

### Health
- `GET /health` → `{ data: { status: 'ok', uptimeSec, time } }` (no DB call, for load balancers).
- `GET /ready` → pings MongoDB (`{ ping: 1 }`); 200 if reachable, 503 if not.

### Auth
- `POST /auth/register/customer` → body: `name, phone, email, address, password` (all required). Creates `users` (role customer, status active). Returns 201 `{ user, accessToken }` and sets the refresh cookie (register signs the Customer in). Duplicate email → 409 `EMAIL_TAKEN`.
- `POST /auth/register/farmer` → body: `stallName, contactPerson, phone, email, address, password`. Creates a `users` doc (role farmer, status `pending`) **and** the `farmers` profile (defaults: empty markets, `listingEnabled: false`) using two inserts; if the second insert fails, remove the first (compensation, commented). Returns 201 with `user.status = 'pending'`.
- `POST /auth/login` → `{ email, password }`. Generic error for unknown email or wrong password (do the bcrypt compare against a dummy hash for unknown emails to keep timing similar). Applies account-status rules. Updates `lastLoginAt`. Returns `{ user, accessToken }` and sets the cookie.
- `POST /auth/refresh` → reads the cookie, rotates, returns `{ accessToken, user }`.
- `POST /auth/logout` → revokes the current session, clears the cookie, 204.
- `GET /auth/me` (auth) → the current user (safe fields only; for Farmers include `farmer: { stallName, approvalStatus }`).
- `POST /auth/forgot-password` → `{ email }`. **Always 200** with the same message. If the email exists: create a reset token (32 random bytes, stored hashed, 30-minute expiry, one active per user), and call `mailer.sendPasswordReset(email, link)`, where the link is `${APP_BASE_URL}/reset-password?token=...`. The stub mailer logs the link in development.
- `POST /auth/reset-password` → `{ token, password }`. Validates the token (unused, unexpired), sets the new hash, marks used, **revokes all sessions** for that user, 200.

### Users
- `GET /users/me` (auth) → the profile.
- `PATCH /users/me` (auth) → update allowed fields only: `name, phone, address, homeMarketId, savedMarketIds, notificationPrefs`. Email cannot be changed here. Unknown fields → 422.
- `POST /users/me/password` (auth) → `{ currentPassword, newPassword }`. Wrong current password → 401 `INVALID_CREDENTIALS`. Revoke other sessions.
- `DELETE /users/me/sessions` (auth) → sign out everywhere (revoke all sessions).

### Contact (guest)
- `POST /contact` → `{ name, email, topic, message }` (`topic` one of: `order`, `farmer-help`, `feedback`, `other`; message max 2000 chars). Stores in `contactMessages`, returns 201 with a warm message. Strict rate limit.

### Role guard demonstration route (so RBAC is proven now)
- `GET /auth/_ping/customer`, `/auth/_ping/farmer`, `/auth/_ping/admin`, each protected by `requireRole`, returning `{ data: { ok: true } }`. **Enabled only when `NODE_ENV !== 'production'`**, used by tests; remove or keep guarded and document it.

Add all of these to `docs/API.md` with request and response examples.

---

## 9. Seed data (`npm run seed`)

- **Idempotent and safe**: drops and recreates the target database's collections, then creates collections, validators, indexes and data. **Refuses to run when `NODE_ENV=production`** unless `--force` is passed. Uses `insertMany`/`bulkWrite` (fast, under a few seconds). Deterministic (fixed seeds), but **all dates are generated relative to "now"** with `utils/time.js` so cut-offs and pickup windows are always upcoming and Saturday-style market days always make sense.
- **Read the front end's `src/data/placeholders.js` and the existing Customer pages** and **port their content** (market, Farmer and product names, stories, prices, statuses, review text) into the seed, so that front-end integration later is seamless. Convert prices to cents. Extend where needed so that it is at least:
  - **4 markets** (Elm Street Market plus three more), with coordinates, schedules, facilities.
  - **7 categories** (Vegetables, Fruit, Bakery, Dairy and eggs, Honey and jam, Herbs and flowers, Meat and fish).
  - **1 admin, 12 Farmers** (11 `active`, 1 `pending`, 1 `suspended` for testing) and **8 Customers** (7 `active`, 1 `inactive`), including George Adams.
  - **40+ products** with varied prices, units, stock levels (some low, some out), tags, categories, weekly templates.
  - **20+ orders** across all statuses with correct `timeline` entries, price snapshots and future/past pickup slots (including one **Ready for pickup** and one **Accepted** for George).
  - **30+ reviews** with a few Farmer replies, **favourites** for George, **notifications**, **announcements** (2), **moderation flags** (2 open), **search history**, and **counters** initialised so the next order number continues the sequence.
  - Denormalised fields (`farmer` snapshot on products, `farmerCount` on markets, ratings, `salesCount`) **computed by the seed script from the data**, so everything is internally consistent.
- **Demo credentials** (print them at the end of the seed and put them in `README.md`; these are mandatory project deliverables):

| Role | Email | Password |
|---|---|---|
| Customer | `george@example.com` | `market123` |
| Customer (inactive) | `inactive.customer@example.com` | `market123` |
| Farmer (active) | `riverbend@example.com` | `market123` |
| Farmer (pending) | `pending.farmer@example.com` | `market123` |
| Farmer (suspended) | `suspended.farmer@example.com` | `market123` |
| Admin | `admin@marketlink.test` | `Admin12345` |

Add a few more Farmer and Customer accounts using the same password for testing.

---

## 10. Testing (mandatory, run it, report real output)

Write tests in `tests/` with `node:test`. **`npm test` must:** boot the app on a random port against `marketlink_test`, reset and seed the database once, run all suites, and shut down cleanly. **No test may depend on another test's leftovers** (create unique emails per test).

Cover at least:

**health.test.js**: `/health` 200 fast; `/ready` 200 with DB; unknown route → 404 JSON in the standard error shape.
**auth.test.js**:
- Customer register success (201, cookie set, no `passwordHash` in the body), duplicate email 409, invalid email/short password/missing fields → 422 with `details` per field, email case-insensitivity, extra unknown fields rejected.
- Farmer register success → status `pending`, profile created, rollback path tested (simulate failure if practical).
- Login: success; wrong password and unknown email return **identical** 401 bodies; inactive Customer 403; suspended Farmer 403; **pending Farmer succeeds with `status: 'pending'`**; `lastLoginAt` updated.
- Refresh: success and rotation (new cookie differs), **reuse of an old refresh token revokes all sessions** and returns 401, expired/revoked token 401, no cookie 401.
- Logout revokes; `me` works with a valid token, 401 without, 401 with a tampered or expired token (`TOKEN_EXPIRED`).
- Forgot/reset: always 200 for known and unknown emails; reset with the logged token works once; reused/expired token fails; sessions revoked after reset; old password no longer works; new password works.
**users.test.js**: get/patch profile (only allowed fields), change password (wrong current password fails), sign out everywhere.
**contact.test.js**: valid message stored; invalid topic/empty message/oversize message rejected; rate limit triggers 429 after the limit.
**security.test.js**: role guard (customer → farmer route 403; no token 401; admin OK); NoSQL injection attempts (`{"email":{"$gt":""},"password":"x"}`, `{"$where":...}`, query string `?email[$ne]=x`) all rejected; malformed JSON → 400 `BAD_JSON`; body over 100kb → 413; helmet headers present; CORS allows the configured origin and blocks others; login rate limit → 429 (a dedicated test with limits enabled); stack traces never appear in error bodies.
**db.test.js**: every expected collection exists with a validator; **every index in section 5 exists**; unique index blocks duplicate email even under a concurrent double insert; TTL indexes exist; **`explain('executionStats')` for the login lookup, the session lookup and one order-history query shows `IXSCAN` and not `COLLSCAN`**; seed integrity (referential checks: every product's `farmerId` exists, every order item references an existing product, every review's order exists, `markets.farmerCount` matches, no orphan favourites, order-number counter is above the largest seeded number).
**perf.test.js**: assert the performance budget from section 6 (health, me, refresh under the budgets, using a warm-up request and the median of several requests).

Also provide `scripts/smoke.sh` (and `smoke.ps1`): using `curl`, start-to-finish flow against a running server: health → register a Customer → me → refresh → logout → login as George → patch profile → forgot password → contact form.

---

## 11. Testing gate (MANDATORY for this stage; do not skip)

You may **not** call this stage finished until you have:
1. Started MongoDB and the server for real, run **`npm run seed`**, **`npm test`** and the **smoke script**, and pasted the **actual command output** in your report (pass/fail counts, timings).
2. **Fixed every failure** and re-run the full suite until it is green. Never weaken or delete a test to make it pass.
3. Manually exercised each endpoint in section 8 at least once with `curl` (or the smoke script) and recorded status code and a trimmed response.
4. Confirmed with `explain()` that the indexed queries use `IXSCAN`.
5. Confirmed the performance budget numbers with real measurements.
6. Run the server with `NODE_ENV=production` once to confirm: no stack traces in errors, cookies marked `Secure`, seed refuses without `--force`.
7. Started the front end (`npm run dev` in the front-end folder) to confirm nothing in it was changed or broken.
8. Written the results honestly. **If something is not verified, say "not verified" rather than "should work".**

---

## 12. Documentation deliverables (working notes for the team)

- `backend/README.md`: prerequisites, install (`npm install`), env setup, starting MongoDB (local and Atlas), `npm run seed`, `npm run dev`, `npm test`, credentials table, folder overview, troubleshooting.
- `backend/docs/DATABASE.md` and `backend/docs/API.md` as described.
- Root `README.md` addition: how the front end and backend fit together and how to run both.
- Keep documents factual and short. (The team will write its own final project report; these are technical notes.)

---

## 13. Final report (what to send back)

1. The final `backend/` folder tree.
2. **Test evidence**: `npm test` output summary, smoke test output, `explain()` results, performance numbers, production-mode check.
3. **Endpoint table**: method, path, auth, tested (yes/no), result.
4. **Decisions not in this prompt** (be specific) and anything not completed or unverified.
5. Instructions to run everything from a clean machine (a step-by-step list I can follow).

---

## 14. Acceptance checklist

- [ ] `backend/` exists beside the untouched front end; `npm install && npm run seed && npm run dev` works from scratch with a clean `.env` copied from `.env.example`
- [ ] Only the allowed packages are used; no Mongoose or ORM; all queries use the native driver
- [ ] Every collection, validator and index from section 5 is created by code and verified by tests
- [ ] Seed is idempotent, fast, consistent, ports the front-end placeholder content, and prints the credentials
- [ ] All endpoints in section 8 work and are documented in `docs/API.md`
- [ ] Standard success and error shapes everywhere; `id` not `_id`; money in cents
- [ ] Passwords hashed, JWT access tokens (15 min), rotating hashed refresh tokens with reuse detection, account status rules enforced
- [ ] NoSQL injection, malformed JSON, oversize bodies, wrong roles, expired tokens and rate limits all handled with the right status codes
- [ ] No `COLLSCAN` on critical queries; performance budget met
- [ ] `npm test` is fully green, with real output shown; smoke script passes
- [ ] Code is simple, commented at the top of every file, services hold all queries, routes stay thin
- [ ] No front-end files changed
- [ ] The words "Customer" and "Farmer" are used in all user-facing messages
