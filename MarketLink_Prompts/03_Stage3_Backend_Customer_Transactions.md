# MarketLink Backend: Stage 3 of 9 (Customer Transactions)

You are a **senior backend engineer**. Stages 1 (foundation, auth) and 2 (catalog, discovery, feed, slots) are complete. **Stage 3 builds everything a Customer does that changes data**: cart quoting, pre-order checkout, managing orders, the order state machine, reviews, favourites (with restock alerts), notifications, saved markets, the home summary and the rule-based assistant. Correctness under concurrency is the priority: **stock must never be oversold**, and **every route must work and be tested**.

"Must" is not optional. Read this whole prompt first.

## Project context (read this first: you are starting a fresh session with no memory)

**MarketLink** is a farmers-market **pre-order for pickup** platform with three roles: **Customer** (`customer`), **Farmer** (`farmer`), **Admin** (`admin`). No payment gateway, no delivery: Customers pay in person at pickup. User-facing text always says "Customer" and "Farmer".

**Stack (fixed): MERN.** MongoDB + Express 5 + Node 20+ (backend, plain JavaScript ES modules) and the existing React + Vite front end. The backend lives in `backend/`. **Database access uses the official `mongodb` native driver only** (no Mongoose, no ORM): hand-written queries, aggregation pipelines, projections, atomic operators, indexes designed per query.

**Conventions established in Stage 1 (keep following them):**
- Folder layout: `src/modules/<feature>/<feature>.routes.js` (thin: parse, validate, call service, respond) and `<feature>.service.js` (**all** database queries). Shared code in `src/utils`, `src/middleware`, `src/db`, `src/constants.js`. Tests in `tests/` using built-in `node:test` and `fetch` against a real test server and the `marketlink_test` database.
- API base path `/api`. Success: `{ "data": ..., "meta": {...} }`. Errors: `{ "error": { "code", "message", "details": [{field, message}] } }` with stable codes (`VALIDATION_FAILED`, `UNAUTHENTICATED`, `TOKEN_EXPIRED`, `FORBIDDEN`, `NOT_FOUND`, `EMAIL_TAKEN`, `RATE_LIMITED`, `INTERNAL`, ...).
- IDs are `ObjectId` internally and exposed as string `id` (never `_id`). **Money is integer cents.** Dates are BSON `Date`, returned as ISO strings.
- Auth: 15-minute HS256 access JWT (`Authorization: Bearer`), rotating hashed refresh tokens in an httpOnly cookie, `requireAuth`, `requireRole(...)`, account status rules (Customer `active|inactive`; Farmer `pending|active|suspended|rejected`).
- Validation: hand-written validators in `src/utils/validate.js`; **reject unknown fields**; `sanitize` middleware blocks `$`-operator injection; strings must be strings.
- Performance rules: every query index-backed, always project, cursor (keyset) pagination for lists (default limit 20, max 50), atomic operators, `bulkWrite`/`insertMany` for batches, no N+1, `maxTimeMS` on queries, one shared MongoClient.
- Collections already designed: `users, farmers, markets, categories, products, orders, reviews, favorites, notifications, sessions, passwordResets, contactMessages, announcements, moderationFlags, searchHistory, counters` (see `backend/docs/DATABASE.md`).
- Code style: simple and explainable by students. Function components/functions only, named exports, one short comment at the top of every file, comments above non-obvious queries explaining why. No clever abstractions. Only add a package if you justify it in one line.

## Session start checklist (do this before writing code)

1. Read `backend/README.md`, `backend/docs/DATABASE.md`, `backend/docs/API.md`, and skim `src/app.js`, `src/db/collections.js`, `src/db/indexes.js`, `src/db/seed.js`.
2. Start MongoDB, run `npm run seed` and `npm test` in `backend/`. **The baseline must be fully green before you change anything.** If it is not, fix that first and report it.
3. Write a short plan (files to create or change, in order), then build.

## Schema changes procedure (when this stage needs new fields, collections or indexes)

Update all of: `src/db/collections.js` (validators), `src/db/indexes.js`, `src/db/seed.js` (so seeded data includes the new fields and stays consistent), `docs/DATABASE.md`, and the tests in `tests/db.test.js`. Then re-run seed and the whole suite. Never leave the seed, validators, indexes and docs out of sync.

---

## 1. Scope

**Build:** sections 3 to 9 below, schema changes (section 2), tests and docs.
**Do not build:** Farmer or Admin management endpoints (Stage 4). The **order state machine** you build here is reused by Stage 4, so design it as a shared service function.
**No payment.** Orders are paid in person at pickup. No card fields anywhere.

---

## 2. Schema additions (apply the "Schema changes procedure")

- `orders.idempotencyKey` (string) with a **unique partial index** `{ customerId: 1, idempotencyKey: 1 }` (only when the key exists) so a double-clicked "Place pre-order" never creates duplicate orders.
- `orders.slotKey` (string like `<farmerId>|<start ISO>`) with index `{ slotKey: 1, status: 1 }` for slot capacity counting (Stage 4 adds `maxOrdersPerSlot`; enforce it here if the field exists, default 30 per slot).
- `reviews.ratingSum` maintenance uses `products.ratingSum/ratingCount` and `farmers.ratingSum/ratingCount` from Stage 2 (`ratingAvg = ratingSum / ratingCount`, updated in the same atomic pipeline update).
- `favorites`: add index `{ targetType: 1, targetId: 1 }` (for restock alerts).
- `notifications.type` enum: `order_placed, order_accepted, order_ready, order_completed, order_declined, order_cancelled, restock, announcement, review_reply, account`.
- Keep the seed consistent (orders with `slotKey`, `idempotencyKey` optional, ratingSum totals matching seeded reviews).

---

## 3. Cart quote and checkout

The **cart lives on the client** (in the browser). The server never trusts client prices.

### `POST /cart/quote` (Customer)
Body: `{ groups: [ { farmerId, items: [ { productId, quantity } ], slotStart? } ] }` (max 10 groups, 30 items per group, quantity 1..20).
Returns, per group and per line, **current truth**: `unitPriceCents`, `lineTotalCents`, `availability`, `quantityAvailable`, `issues[]` (`OUT_OF_STOCK`, `NOT_ENOUGH_STOCK` with `maxQuantity`, `PRICE_CHANGED` when the client sends `expectedPriceCents`, `UNAVAILABLE`, `FARMER_NOT_LISTED`), the Farmer's next open pickup `slots[]` (from `getUpcomingSlots`), `cutoffAt`, and totals (`subtotalCents`, `totalCents`). One query per collection using `$in` (no N+1). This is what the Cart sheet calls when it opens and when quantities change (debounced).

### `POST /orders/checkout` (Customer, `Idempotency-Key` header required)
Body: `{ groups: [ { farmerId, slotStart, note?, items: [ { productId, quantity } ] } ] }`.
Behaviour:
1. Validate everything: shapes, limits, one group per Farmer, all products belong to that Farmer, Farmer `listingEnabled`, products `listed`, slot exists in `getUpcomingSlots` and `isOpen` (before cut-off), slot capacity available, quantities within `quantityAvailable`, note max 200 chars. **Recompute all prices from the database.**
2. **Reserve stock atomically per line** with a **conditional update using an aggregation-pipeline update**, so the quantity check, decrement and `availability` recalculation happen in **one atomic operation**:
   `updateOne({ _id, listed: true, quantityAvailable: { $gte: qty } }, [ { $set: { quantityAvailable: { $subtract: ['$quantityAvailable', qty] } } }, { $set: { availability: { $switch: { branches: [ { case: { $lte: ['$quantityAvailable', 0] }, then: 'out' }, { case: { $lte: ['$quantityAvailable', '$lowStockThreshold'] }, then: 'low' } ], default: 'in' } } } }, { $set: { updatedAt: '$$NOW' } } ])`. If `matchedCount === 0`, stock ran out: **roll back** every reservation already made in this checkout (compensating `$inc` restores, then recompute availability), and return 409 `NOT_ENOUGH_STOCK` naming the product and the maximum available. (Explain in a comment why this works on a standalone MongoDB without transactions; if the deployment is a replica set, note that a transaction is an alternative.)
3. Create **one order per Farmer** sharing a `checkoutId`, with **price snapshots** in `items`, `subtotalCents`, `totalCents`, `pickup`, `cutoffAt`, `slotKey`, `status: 'placed'`, `timeline: [{ status: 'placed', at, byRole: 'customer' }]`, and a human-readable **`orderNumber` from the `counters` collection** (`findOneAndUpdate` with `$inc`, returned as `ML-<seq>`). Insert with `insertMany`. If the insert fails, roll back the stock.
4. **Idempotency**: a repeated request with the same key returns the **same result** (200 with the original orders) and changes nothing. Concurrent duplicates must resolve safely via the unique index (catch the duplicate-key error and return the existing result).
5. Increment nothing on `salesCount` yet (that happens on completion).
6. Create notifications: to the Customer (`order_placed`) and to each Farmer (new order); respect `notificationPrefs`; call `mailer.sendOrderConfirmation` (stub logs the email).
7. Response 201: `{ data: { checkoutId, orders: [orderSummary...] } }`.

Rate limit checkout (10 per minute per user).

---

## 4. Orders (Customer)

| Method and path | Notes |
|---|---|
| `GET /orders` | `tab=active|past` (active = placed, accepted, ready; past = completed, cancelled, declined), cursor paginated by `(createdAt, _id)`, returns `orderSummary` (`id, orderNumber, status, farmer {id, stallName, stallNumber, art}, pickup, cutoffAt, itemCount, totalCents, items preview (first 3 names + art), canModify, reviewed`). Uses the `customerId + status + createdAt` index. |
| `GET /orders/:id` | Full `orderDetail`: items, timeline (with timestamps), pickup, market (with `directionsUrls`), `canModify`, `canCancel`, `cutoffAt`, `cancelReason`, `reviewed`. Only the owner (404 for anyone else, never 403, so ids cannot be probed). |
| `PATCH /orders/:id` | **Modify before cut-off** and only while status is `placed`: change item quantities (1..20, set 0 to remove a line; cannot remove all lines: cancel instead), `note`, and `slotStart` (another open slot of the same Farmer). Stock adjusted atomically by the **difference** using the same pipeline-update technique (increase requires stock, decrease returns stock). Recompute totals, push a timeline entry `{ status: 'placed', at, byRole, note: 'modified' }`, notify the Farmer. After cut-off: 409 `CUTOFF_PASSED`. |
| `POST /orders/:id/cancel` | Customer may cancel while `placed` or `accepted` **and before cut-off**. Body `{ reason? }`. Restores stock atomically, sets `cancelled`, timeline, notifies the Farmer. Otherwise 409 with code `CANNOT_CANCEL` or `CUTOFF_PASSED`. |
| `GET /orders/:id/reorder-preview` | Returns the items of a past order with **current** price, availability and `maxQuantity` (for "Buy again"), and which are unavailable. |

Ownership is enforced in the **query filter** (`{ _id, customerId }`), not after fetching.

### The order state machine (`src/modules/orders/orderStateMachine.js`, shared with Stage 4)
One function `transitionOrder(order, toStatus, { byRole, byUserId, reason })` and a table of **allowed transitions**:
`placed → accepted | declined | cancelled` · `accepted → ready | cancelled` · `ready → completed | cancelled` · `completed`, `cancelled`, `declined` are terminal.
Which **role** may trigger which transition: Customer → `cancelled` (rules above); Farmer → `accepted, declined, ready, completed, cancelled`; Admin → `cancelled` (support). Each transition uses a **conditional update on the current status** (`{ _id, status: from }`) so two simultaneous transitions cannot both win, pushes a timeline entry, restores stock on `declined`/`cancelled`, on `completed` increments `salesCount` on the products and the Farmer with `$inc` and sets `completedAt`, and creates the right notification for the other party. Unit-test the full transition matrix (every allowed and every forbidden pair).

---

## 5. Reviews

- `POST /orders/:id/reviews` (Customer, owner, order must be `completed`): body `{ farmer?: { rating, comment }, products?: [ { productId, rating, comment } ] }` (at least one target; products must be in that order; rating integer 1..5; comment max 1000). **One review per order per target** (unique index; duplicate → 409 `ALREADY_REVIEWED`). Sets `orders.reviewed` when the Farmer review is done. Updates `ratingSum/ratingCount` on the target in the **same atomic pipeline update** (`ratingAvg` recomputed rounded to 1 decimal).
- `PATCH /reviews/:id` and `DELETE /reviews/:id` (author only, within 14 days): adjust rating aggregates by the difference in one atomic update.
- The public read endpoints from Stage 2 keep working; verify `customerName` privacy.
- `POST /reviews/:id/flag` (any signed-in role) creates a `moderationFlags` document (`targetType: 'review'`, reason 3..300 chars, one open flag per reporter per review).

---

## 6. Favourites and restock alerts

- `GET /favorites?type=product|farmer&cursor=` (returns `productCard` / `farmerCard` lists, most recent first, includes items that are sold out with a `backOn` hint when known).
- `GET /favorites/ids` → `{ productIds: [...], farmerIds: [...] }` (tiny and fast; used for hearts everywhere; capped at 500 each).
- `PUT /favorites/:type/:id` (idempotent add, 404 if the target is not listed) and `DELETE /favorites/:type/:id` (idempotent).
- **Restock alerts**: implement `notifyRestock(productId)` in `src/modules/favorites/`: when a product goes from `out` to `in/low` (Stage 4's stock updates call this), find favouriters through the `{ targetType, targetId }` index, respect `notificationPrefs.restockAlerts`, and `insertMany` notifications in one batch. Unit-test it now by calling it directly in a test.

---

## 7. Notifications and saved markets

- `GET /notifications?cursor=&unread=true` (with `meta.unreadCount` from an indexed count), `POST /notifications/:id/read`, `POST /notifications/read-all`.
- A single `createNotification(s)` helper used by every module; it honours the user's `notificationPrefs` (order updates, ready alerts, weekly picks, restock alerts) and writes with `insertMany` when sending to many users.
- `mailer.js` stub gains `sendOrderConfirmation`, `sendOrderReady` (log only, clearly commented as the place for real email later).
- `GET /users/me/saved-markets` returns `marketCard`s (with `directionsUrls`, next opening) for `savedMarketIds`; `PUT /users/me/saved-markets/:marketId` and `DELETE` (idempotent, max 10, market must exist and be active); `PUT /users/me/home-market/:marketId`.
- `GET /home/summary` (Customer): `{ readyForPickup: orderSummary|null (soonest ready order), nextPickup: orderSummary|null, unreadNotifications, cartHint? none }`, one round trip with parallel indexed queries.

---

## 8. Assistant (rule-based, no external AI)

`POST /assistant/message` (Customer): body `{ text (max 300) , history? (last 4 messages, optional) }`. Response `{ reply, cards: [ { type: 'product'|'farmer'|'market', id } ], suggestions: [string] }`.
Build a small **intent matcher** (keywords and patterns, no external service) that answers from the real database:
- **Market timings** ("when does Elm Street close?") → market schedule.
- **Farmer availability** ("is Riverbend at Elm Street on Saturday?").
- **Who sells X** ("who sells eggs?") using the text index and category names.
- **Product details and price** ("how much are tomatoes?").
- **What's fresh on <day>**, **cut-off and pickup windows** ("when is the cut-off for Oak & Mill?").
- **Help** and a graceful fallback with 3 suggestions. Replies are warm and short; unknown input never returns an error.
Cards contain ids only; the front end fetches or the reply may embed `productCard`/`farmerCard` where cheap. Keep it deterministic and fast (under 60 ms). Rate limit: 30 per minute per user. Comment where a real AI service (or tawk.to/Zapier per the brief) could plug in later.

---

## 9. Security and integrity requirements

- **Ownership everywhere** through query filters. Customers can never read or change another Customer's orders, favourites, notifications, search history or reviews (404).
- **Farmer/Admin accounts cannot use Customer-only routes** (403).
- Validate ObjectIds; reject unknown fields; sanitize; enforce rate limits (checkout, assistant, review creation 20/hour).
- **No negative stock, ever**, and no lost or double-counted stock across cancel/modify/decline (verified by the invariant test below).
- Timeline entries are append-only.

---

## 10. Tests

Write tests for every endpoint (happy path, validation, 401/403/404/409, edge cases) plus these **critical scenarios**:
1. **Oversell race**: a product has 10 units; **50 concurrent checkouts** each requesting 1 (different Customers) → **exactly 10 succeed, 40 get `NOT_ENOUGH_STOCK`, quantity ends at 0, availability `out`, no negative values**, order numbers all unique.
2. **Multi-line rollback**: a checkout with three lines where the third fails leaves **all stock exactly as before** and creates no orders.
3. **Idempotency**: same key twice, and 10 parallel identical requests → one set of orders.
4. **Modify/cancel/decline stock arithmetic**: increase, decrease, remove line, cancel, and concurrent cancel + accept (only one wins). After a random sequence of operations, `stock + reserved-in-active-orders === initial stock` (invariant test).
5. **Cut-off**: modify and cancel after cut-off fail with the right code (use fixed `now` injection).
6. **State machine matrix**: every allowed and forbidden transition by role.
7. **Reviews**: only completed orders, one per target, aggregates correct (`ratingAvg` after add, edit, delete), privacy of `customerName`.
8. **Favourites and restock**: idempotent add/remove, `notifyRestock` respects preferences and creates one notification per favouriter.
9. **Notifications**: created for each event, unread counts, mark read, isolation.
10. **Assistant**: each intent returns a sensible reply from seeded data; nonsense input returns the fallback, never an error.
11. **Security**: IDOR attempts on every `:id` route with a second Customer's token (expect 404), NoSQL injection in bodies and queries, oversize payloads, wrong-role calls.
12. **Explain and performance**: every new query uses an index (`IXSCAN`), reads under 50 ms, `cart/quote` under 60 ms for 10 lines, checkout (excluding bcrypt) under 120 ms for 3 groups.
13. **Regression**: all Stage 1 and Stage 2 tests pass.

Add a **data invariants script** `npm run verify:data` (used in tests after the concurrency scenarios): no negative quantities, `availability` consistent with quantity and threshold, every order's `totalCents` equals the sum of its lines, `orders.timeline` last status equals `status`, order numbers unique, rating aggregates equal recomputation from `reviews`.

---

## 11. Docs and report

Update `docs/API.md`, `docs/DATABASE.md`, README. Final report per the testing gate below, including the **concurrency test results** (numbers), the state-machine matrix, an endpoint table and timings.

---

## 12. Acceptance checklist

- [ ] Quote, checkout, list/detail/modify/cancel/reorder-preview all work; prices always come from the database
- [ ] Stock never oversells or goes negative under 50 concurrent checkouts; rollbacks are correct
- [ ] Idempotency-Key makes checkout safe to retry
- [ ] State machine is shared, conditional, role-aware and fully tested
- [ ] Reviews update aggregates atomically; one review per order per target; privacy respected
- [ ] Favourites, restock alerts, notifications, saved markets, home summary and assistant all work
- [ ] Ownership enforced in query filters; IDOR attempts return 404
- [ ] `verify:data` passes after all concurrency scenarios; no `COLLSCAN`; budgets met
- [ ] Stage 1 and 2 tests still pass; docs and seed in sync; no front-end files changed


---

# MarketLink: Testing Gate (paste at the END of every stage prompt)

**This stage is NOT finished until everything below is proven by running it.** Do not say "should work". Show evidence, or say "not verified".


## A. For backend stages (2 to 5, and any backend additions in 8)

1. **Write automated tests first-class, not as an afterthought.** For every new endpoint cover: the happy path, every validation error (422), missing or invalid token (401), wrong role (403), not found (404), conflicts (409), edge cases (empty lists, limits, boundary values), and ownership rules (a Farmer can never touch another Farmer's data; a Customer never sees another Customer's orders).
2. **Run the full suite from a clean database** (`npm run seed` then `npm test`). Paste the real output (pass/fail counts, duration). **All earlier stages' tests must still pass** (regression). Fix every failure. Never delete or weaken a test to make it pass.
3. **Manually call every new endpoint** with `curl` (or extend `scripts/smoke.sh`) and record the status code and a trimmed response for each. Test with each seeded role.
4. **Performance proof**: run `explain('executionStats')` on every new query and confirm **no `COLLSCAN`**, `totalDocsExamined` close to `nReturned`, and projections in place. Measure response times on the seeded database and confirm the budget (reads under 50 ms, feeds and search under 80 ms, writes under 100 ms, excluding bcrypt). Log and fix anything slower.
5. **Concurrency and integrity proof** where relevant (stock, order numbers, unique constraints): run parallel requests in a test and show the results are correct (no overselling, no duplicate order numbers).
6. **Security check on the new routes**: injection attempts, oversized input, role bypass attempts, IDOR attempts (changing an id in the URL to someone else's), and rate limits where applicable.
7. **Update `docs/API.md` and `docs/DATABASE.md`** so they match reality (every route documented with an example).
8. **Report table**: endpoint, method, auth, tests written, tested manually (yes/no), result. Any "no" must be explained and fixed before finishing.
9. Confirm the front end still starts and no front-end file was broken.


## Rules for the report at the end of every stage

- Start with **"Stage N status: PASS or FAIL"** and justify it.
- Include the **real command output** or screenshots of results.
- List **what you did not verify** and **what you would test next**.
- If any check fails, **fix it and re-run**; do not hand back a failing stage.
