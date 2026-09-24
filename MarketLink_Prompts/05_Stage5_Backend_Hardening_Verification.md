# MarketLink Backend: Stage 5 of 9 (Hardening, Performance and Full Backend Verification)

You are a **senior backend engineer and security reviewer**. The backend is feature-complete (Stages 1 to 4). **Stage 5 is the "prove it" stage**: audit every route, load-test with a large dataset, profile and fix slow queries, harden security and reliability, verify data integrity, and freeze the API contract. **No new product features** unless an audit finding requires a fix. Be strict and honest: you are the last line of defence before the front end is connected.

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

## 1. Route inventory and contract freeze

1. Write `scripts/routes.js` that lists **every registered route** (method, path, auth, role, module) by introspecting the Express router. Compare with `docs/API.md`: **every route must be documented and every documented route must exist**. Fix drift.
2. Ensure **every route has at least one automated test** for the happy path and one for its main failure. Produce a coverage table (`route → test file → test names`) and add the missing tests. Add a test that fails when a new route is registered without a documentation entry (reads `routes.js` output and `API.md`).
3. Verify the **response shapes** against the contract of Stage 2 to 4 (a shape test per shape: no `_id`, no `passwordHash`, no `tokenHash`, no internal counters, money as integer cents, ISO dates, `id` strings).
4. Add `docs/API.md` sections for **error codes** (a complete table: code, HTTP status, when it happens) and **pagination rules**. Add `requests.http` (REST Client format) with one working example per route group for manual testing.

---

## 2. Large dataset and load testing

### 2.1 `npm run seed:large`
Generate a large, realistic, consistent dataset (in a separate database `marketlink_large`): **~40 markets, 400 Farmers, 8,000 products, 20,000 Customers, 150,000 orders across all statuses over 12 months, 50,000 reviews, 60,000 favourites, 100,000 notifications**. Use `insertMany({ ordered: false })` in batches of 5,000 and generate everything in memory in streams (must finish in a few minutes, and never need more than ~1 GB of RAM). All denormalised fields must be computed correctly (run `verify:data` on it).

### 2.2 `scripts/loadtest.js` (no packages)
A load generator using built-in `fetch` (or `http` with a keep-alive agent) with configurable concurrency (default 50) and duration (default 20 s per scenario) that reports **requests/second, p50, p95, p99 latency, error rate** per scenario. Scenarios (each with a realistic mix of parameters and pre-obtained tokens):
`GET /products` (with random filters and sorts, cursors), `GET /products?q=`, `GET /products/:id`, `GET /farmers`, `GET /markets?lat&lng`, `GET /search/suggestions`, `GET /feed` (walking 10 batches), `GET /orders`, `POST /cart/quote`, `POST /orders/checkout` (with fresh Customers and enough stock), `GET /farmer/orders`, `GET /farmer/insights`, `GET /admin/overview`, `GET /admin/reports/summary`, `POST /auth/login` (bcrypt-bound), a **mixed** scenario (70% reads, 20% quotes, 10% writes).

**Targets on the large dataset (local machine, 50 concurrent, warm)**: catalog reads p95 under 80 ms; `/feed` p95 under 120 ms; suggestions p95 under 40 ms; `orders` lists p95 under 80 ms; quote p95 under 100 ms; checkout p95 under 200 ms; farmer insights p95 under 200 ms; admin reports p95 under 500 ms; error rate 0% (except intended 429s); no memory growth beyond 30% over a 5-minute mixed run.

### 2.3 Profile and fix
- Turn on the **MongoDB profiler** (`db.setProfilingLevel(1, { slowms: 30 })`) during the load runs and analyse `system.profile`: list every operation that is slow, uses `COLLSCAN`, has `docsExamined` more than 3x `nReturned`, or an in-memory `SORT`. **Fix each** (index change, query rewrite, projection, denormalisation, cursor pagination) and re-measure. Document each fix as *symptom → cause → fix → before/after numbers* in `docs/PERFORMANCE.md`.
- Review the **connection pool** settings under load (`maxPoolSize`, queue wait times), keep-alive, compression thresholds (skip compressing tiny bodies), and `ETag` behaviour. Add `maxTimeMS` to every query (2 s default, 5 s for reports) and a per-request timeout (`server.requestTimeout`, `headersTimeout`, `keepAliveTimeout` set deliberately).
- Confirm **no unbounded query** exists (every list has a limit, every aggregation starts with an indexed `$match`, `allowDiskUse` only where justified), no N+1 patterns, and no `skip` on large offsets.
- Verify **index hygiene**: list unused indexes (`$indexStats`) after the load run, remove redundant ones, and confirm total index size is reasonable. Confirm write speed did not regress from over-indexing (checkout scenario).

---

## 3. Security hardening (OWASP API Top 10 review, with tests)

Create `tests/security-full.test.js` and a written checklist in `docs/SECURITY.md` (technical notes) covering, with **proof for each**:

1. **Broken object-level authorisation (IDOR)**: a two-user, three-role matrix that calls **every `:id` route** with another user's or another role's resource ids. Expected: 404 (or 403 for role), never data. Generate the matrix from `routes.js` so new routes cannot be forgotten.
2. **Broken authentication**: token tampering (`alg: none`, wrong secret, wrong issuer, expired), refresh-token reuse and theft simulation, cookie flags (`HttpOnly`, `SameSite`, `Secure` in production, path), logout everywhere, password reset token single use and expiry. Add **account lockout**: after 5 failed logins for the same email within 15 minutes, respond 429 `TOO_MANY_ATTEMPTS` for 15 minutes (counter in `users`: `failedLogins`, `lockUntil`; still return the generic message pattern and equal timing); a successful login resets it. Tests included.
3. **Excessive data exposure**: shape tests (section 1) and a scan of all responses in the load test for forbidden keys.
4. **Mass assignment**: every write route rejects unknown and privileged fields (`role`, `status`, `listingEnabled`, `ratingSum`, `priceCents` on orders, etc.).
5. **Rate limits**: verify per-route classes (auth, checkout, uploads, exports, assistant, contact) and the global limit; confirm limits are keyed correctly behind a proxy (`trust proxy` on/off tests).
6. **Injection**: NoSQL operator injection in bodies, query strings, params, headers, and cursors; **ReDoS/regex injection** (all user text escaped or prefix-only); CSV formula injection; header injection; oversized and deeply nested JSON (limit depth); prototype pollution keys (`__proto__`, `constructor`).
7. **Security misconfiguration**: `helmet` headers, strict CORS (origin allow-list, no wildcard with credentials), `x-powered-by` off, production error output (no stack), `NODE_ENV=production` refuses weak `JWT_SECRET` and default credentials, directory listing off for `/uploads`, uploads served with `nosniff`, no source maps or `.env` served.
8. **Unrestricted resource consumption**: body limits per route class, upload limit, pagination limits, aggregation time limits, export streaming memory usage.
9. **Improper inventory**: the route inventory test (section 1).
10. **Unsafe consumption of data**: stored values that are later rendered (names, notes, reviews, announcements) are returned as plain strings; the API never returns HTML; document that the front end must render as text. Strip control characters.
11. **Secrets and dependencies**: `npm audit` (fix or document each finding), no secrets in the repo (`git grep` scan for keys), `.env.example` only, log redaction for `authorization`, `cookie`, `password`, tokens.
12. **Business-logic abuse**: replaying checkout, negative or fractional quantities, huge quantities, quantity overflow, price tampering (client-sent prices ignored), reviewing someone else's order, reviewing twice, cancelling completed orders, closed-account actions with a still-valid access token (document the max 15-minute window and prove refresh fails immediately).

Fix every finding. Report anything you intentionally accept, with the reason.

---

## 4. Reliability and operations

- **Database outage**: kill MongoDB during a load run: requests get a clean 503 `SERVICE_UNAVAILABLE` (not hangs or crashes), `/ready` reports 503, and the API **recovers automatically** when MongoDB returns. Test and document.
- **Graceful shutdown under load**: SIGTERM during a load run completes in-flight requests, refuses new ones, closes the client, exits 0. Test.
- **Structured logging**: one JSON line per request with `requestId`, method, path (without query secrets), status, ms, user id and role (no PII beyond ids), and slow-query warnings; `LOG_LEVEL` env; every error log includes the request id, and responses include an `X-Request-Id` header.
- **Health**: `/health` (liveness), `/ready` (DB ping and index check), `/api/version` (name, version, commit if available).
- **Startup safety**: index creation is idempotent and never blocks traffic for long (create in the background at start, `/ready` reflects progress); startup fails fast with clear messages for missing env or unreachable DB (with retry and backoff up to a limit).
- **Clock and timezones**: all slot and cut-off computations tested around DST changes and midnight; server runs in UTC.
- **Backups and data export**: `scripts/export-json.js` writes every collection to `backend/db-export/<collection>.json` (excluding password hashes, token hashes and sessions) for reviewers, and document `mongodump`/`mongorestore` commands.

---

## 5. Data integrity

Extend `npm run verify:data` into a **complete invariant checker** and run it on the seeded database, the large dataset, and after every concurrency test:
- No negative stock; `availability` matches quantity and threshold; `listed` matches Farmer status, moderation and availability.
- Every order's `totalCents` equals the sum of lines; timeline last status equals `status`; terminal orders have no later timeline; every order references an existing Farmer and Customer; order numbers unique and below the counter.
- `ratingSum/ratingCount` equal recomputation from visible `reviews`; `salesCount` equals completed order quantities; `markets.farmerCount`, `farmers.categorySlugs`, product `farmer` snapshots and `marketIds` match their sources.
- No orphan favourites, notifications, sessions, flags. Report drift counts (must be zero) and provide `--fix` for safe repairs.

---

## 6. Full end-to-end backend scenario (script and test)

`tests/e2e-flow.test.js` runs the **entire product flow through the HTTP API only**, from an empty minimal seed: Admin signs in → creates a market and a category → a new Farmer registers (pending) → tries to create a product (403) → Admin approves → Farmer sets profile (market, days, windows, cut-off, map pin) and creates products, uploads an image, applies the weekly template → a new Customer registers, browses the feed and Browse, searches, favourites, gets a quote, checks out → Farmer receives the order, accepts, marks ready → Customer sees notifications and the Ready status → Farmer completes → Customer reviews Farmer and product → Farmer replies → another Customer flags the review → Admin resolves the flag (remove) and the rating recalculates → Admin views the dashboard and reports and exports CSV → Admin suspends the Farmer and the catalog updates instantly. Assert **every response** and the final `verify:data` result. Also `scripts/smoke.sh` (and `.ps1`) updated to cover the main path of each role.

Add `npm run seed:minimal` (only an Admin, categories and one market) used by this test and by the front-end empty-state checks later.

---

## 7. Documentation (technical working notes)

Finalize `README.md` (how to run everything, all scripts, all env vars, credentials, troubleshooting), `docs/API.md` (complete, matches `routes.js`), `docs/DATABASE.md`, `docs/PERFORMANCE.md` (measurements and fixes), `docs/SECURITY.md`, `docs/TESTING.md` (how to run each suite, what each covers), and `docs/DEPLOYMENT.md` (env for production, MongoDB Atlas setup, CORS and cookie settings for a hosted front end, a single-server option where Express serves the built front end, and **scalability notes**: stateless API, horizontal scaling, indexes, pool sizing, caching options, what would change at 10x load). Keep them factual and short; the team writes its own final report.

---

## 8. Acceptance checklist

- [ ] `routes.js` inventory equals `API.md`; every route has tests; the drift test exists
- [ ] Load-test targets met on the large dataset, with numbers in `PERFORMANCE.md`; no `COLLSCAN`, no blocking sorts, no unbounded queries
- [ ] Every OWASP item in section 3 has a test or written proof; all findings fixed or explicitly accepted
- [ ] IDOR matrix generated from the route inventory passes
- [ ] Lockout, token, cookie, upload and injection tests pass
- [ ] DB outage and graceful shutdown behave; logs are structured and redacted
- [ ] `verify:data` reports zero drift on seeded and large datasets and after concurrency runs
- [ ] The full end-to-end scenario passes from the minimal seed
- [ ] All docs finalized; `npm test` fully green (Stages 1 to 5); `npm audit` reviewed
- [ ] No front-end files changed


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
