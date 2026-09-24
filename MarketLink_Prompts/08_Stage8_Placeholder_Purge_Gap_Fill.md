# MarketLink Stage 8 of 9: Purge Every Placeholder and Fill the Gaps

You are a **strict senior full-stack reviewer**. Stages 1 to 7 are done: the backend is verified, and the guest, Customer, Farmer and Admin front ends are connected. **Stage 8 proves that nothing fake remains**, fixes every gap between what the screens need and what the API provides, makes every empty and error state work with real (including brand-new and empty) data, and cleans the codebase so it is ready for the final compliance audit. This stage touches **both** backend and front end.

"Must" is not optional. Read this whole prompt first.

## Project context (read this first: you are starting a fresh session with no memory)

**MarketLink** is a farmers-market **pre-order for pickup** web app (React 18 + Vite front end, Node/Express + MongoDB backend in `backend/`, already built and verified). Roles: **Customer** (`customer`), **Farmer** (`farmer`), **Admin** (`admin`). No payment gateway, no delivery: Customers pay in person at pickup. **On screen always write "Customer" and "Farmer"**, never "buyer" or "vendor" (only folders and route prefixes `/buyer`, `/vendor`, `/admin` use those words; map API roles `customer → /buyer`, `farmer → /vendor`, `admin → /admin`). Order statuses shown to users are exactly: **Placed, Accepted, Ready for pickup, Completed, Cancelled** (API values `placed, accepted, ready, completed, cancelled, declined`; `declined` displays as Cancelled with a reason).

**Front-end rules that still apply (from the design system in `docs/DESIGN_SYSTEM.md`):**
- React 18, plain JSX, `react-router-dom`, `lucide-react`. **CSS Modules** next to each component plus the three global CSS files (`tokens.css`, `base.css`, `utils.css`). **No Tailwind, SCSS, Bootstrap, CSS-in-JS, UI kits.** New packages only with a one-line justification.
- Modules use `var(--token)` only (literals allowed: `0`, `1px`, `100%`, `auto`, breakpoints 480 / 768 / 1024 / 1280px). Mobile-first. No `!important` (except reduced-motion), no id selectors, max two nesting levels.
- **Light theme, mostly white.** Beet = primary button/active nav/links, carrot = warnings, herb = success, wood = hairlines. No gradients, no card shadows, no decorative colour. Idiqlat headings (weight 400, 18px+), Inter for the rest. 44px minimum touch targets. **One filled beet button per screen, per sheet, per step.**
- **Super minimal, clean, elegant, uncongested.** Follow the density budgets and minimal-UI rules from the repair pass. Customer app is **sheet-first**: tabs are pages, things you open are sheets (background-location pattern, replace-not-stack, thumb-draggable `BottomSheet`), bottom nav below 1024px, top nav from 1024px. Use `window.layoutCheck()` (dev tool in `src/dev/layoutCheck.js`): it must report **zero findings** at 320, 360, 390, 768, 1024, 1440 for every page and sheet you touch.
- Code is simple and explainable by students: function components and hooks only, short top-of-file comments, no clever abstractions.

**Backend contract:** `/api` base path. Success `{ data, meta }`; errors `{ error: { code, message, details:[{field,message}] } }`. IDs are string `id`. **Money is integer cents** (format with `formatPrice` in `utils/format.js`). Dates are ISO strings. Access token is a 15-minute JWT sent as `Authorization: Bearer`; the refresh token is an httpOnly cookie (`/api/auth/refresh`). The authoritative reference is `backend/docs/API.md`: read it, do not guess.

## Session start checklist (do this before writing code)

1. Read `backend/docs/API.md`, `backend/README.md`, `docs/DESIGN_SYSTEM.md`, `src/routes/AppRoutes.jsx`, `src/context/*`, `src/api/*` (if it exists).
2. Start MongoDB, `cd backend && npm run seed && npm test` (must be green), then `npm run dev` for the API, and `npm run dev` in the front end. Confirm you can sign in with the seeded demo accounts (credentials are in `backend/README.md`).
3. Write a short plan (files to create or change, in order), then build.

## If the front end needs data or behaviour the API does not offer

Do **not** invent placeholder data. **Add it to the backend** (route, service with index-backed native queries, validator, tests, `docs/API.md` entry) following the backend conventions in `backend/README.md` (`src/modules/<feature>/*.routes.js` + `*.service.js`, `node:test` tests, cents, `id`, cursor pagination, no COLLSCAN), run the backend suite, and list every addition in your report.

---

## 1. The placeholder purge (hunt, prove, delete)

### 1.1 Inventory (write it down first)
Run these searches (front end and backend) and list every hit with a decision (`remove`, `replace with API`, `real content`, `keep because...`):

```bash
grep -rniE "placeholder|mock|dummy|fake|lorem|sample|demo|temp|todo|fixme|hardcod" src
grep -rnE "setTimeout\(" src                      # fake loading delays
grep -rnE "Math\.random|faker" src                 # random data
grep -rnE "href=\"#\"|to=\"#\"" src                # dead links
grep -rnE "console\.(log|warn|error)" src          # debug output
grep -rnE "\[\s*\{\s*id:" src                      # inline data arrays
grep -rniE "placeholders" src backend/src          # the old data file
grep -rnE "\$[0-9]+\.[0-9]{2}" src                 # literal prices in components
```
Also scan for hard-coded numbers that should come from the API (counts, ratings, totals, distances, dates, "Saturday", "Elm Street"), fake user names, fake statuses, `MapPlaceholder` usages, `demoUsers`, credentials in the UI, and any component that renders data not sourced from an API response.

### 1.2 Delete and replace
- **Delete `src/data/placeholders.js`** (and any other data files) and every import of it. `npm run build` must succeed without it.
- Replace every remaining hard-coded value with API data. If the API lacks it, **add it to the backend** (route, service, validator, tests, docs) and list it in the report ("Backend additions" table: endpoint, why the UI needed it).
- **Remove `MapPlaceholder`** if unused (all maps are real `MapView`s now).
- Remove all debug logs, dead links, fake delays and unused code paths.
- **Legitimate static content is allowed only in `src/content/siteContent.js`** (team members, contact details, About text, help text, legal text). Each item there must be flagged `// TEAM: fill in` if it still contains sample text, and **you must list every such item for me** so the team can fill it in with real information.

### 1.3 Proof
After the purge, run the greps again and show they return only allowed hits. Then **start the front end with the backend stopped**: every screen must show the proper **error state with a retry**, never fake data or a blank screen. Restart the backend and confirm retry recovers without a reload.

---

## 2. Empty-database and brand-new-user walkthroughs

Using `npm run seed:minimal` (an Admin, categories, one market) in a fresh database, walk through the **entire product from zero** in the browser, on a phone-sized window and on desktop, and fix everything that breaks or looks odd with little or no data:

1. Guest home with no announcements, no board items, no Farmers: graceful (hide sections that would be empty rather than showing broken shells).
2. Register a **new Customer**: Home feed with **no data** (no Farmers yet), Browse empty, Markets with one market and no Farmers, Orders/Favourites/Notifications empty, Cart empty, Assistant answers gracefully when the database has nothing to offer.
3. Register a **new Farmer**: pending state, profile setup, cannot add products, Admin approves, add the first products, empty Orders/Reviews/Insights.
4. New Customer places the first order, Farmer accepts, ready, completes; Customer reviews; every screen updates and shows correct numbers on both sides.
5. Admin overview with tiny numbers, Reports with almost no data (no divide-by-zero, no `NaN`, no `Infinity`, charts with a single bar), People/Markets/Moderation/Settings empty states.
6. **Then re-run with the full seed and the large dataset** (`seed:large`) to check dense states: long names, 100+ rows, many notifications, long reviews, huge counts (`1,204`, `$12,840.50`), multi-Farmer carts, 30 batches of the feed.

Record what you found and fixed for each step.

---

## 3. Data correctness and consistency checks (UI vs database)

Verify by comparing screen values to the database (queries or `mongosh`/scripts) for at least:
- Cart totals vs `/cart/quote` vs created order totals; order totals after modify and cancel; stock counts after checkout, cancel, decline; Farmer revenue and best sellers vs a manual aggregation; Admin totals vs `countDocuments`; ratings and review counts after creating, editing, deleting and moderating reviews; market Farmer counts after approvals, suspensions and market changes; "Recently bought"; unread notification counts.
- **Dates and times**: pickup windows, cut-off countdowns and "opens Saturday" read correctly in the **market's timezone**, and around midnight and DST changes; the browser in a different timezone (change the OS/browser timezone) must not shift them.
- **Money**: no float errors anywhere (test `$0.10 + $0.20`-style totals, quantities up to 20, large totals), formatting consistent, cents on the wire only.
- Run `npm run verify:data` after the walkthroughs and after the concurrency test; drift must be zero.

Write automated checks where practical (backend tests for computed values, a small front-end formatting test file using Node's built-in test runner for `formatPrice`, `formatPickup`, `formatCountdown`).

---

## 4. Robustness and error handling sweep

Deliberately trigger and fix each of these in the browser: server stopped, server slow (add an artificial 3 s delay in the API in dev via an env flag `DEV_LATENCY_MS`, remove after), token expired mid-session (shorten `JWT` expiry in dev to verify silent refresh and retry), refresh cookie deleted, account suspended while signed in, 404 sheet ids, 409 (stock ran out while in cart, cut-off passed while on the Cart sheet, order already changed by the Farmer), 422 on every form, 429 on login/checkout/uploads/contact, offline mode, double-click on every primary button (no duplicate requests or double submissions), browser Back/Forward/refresh with a sheet open, deep links to every route, and rapid navigation while requests are in flight (no state updates on unmounted components, no stuck spinners).

Add a **root `ErrorBoundary`** with a friendly full-screen fallback ("Something broke on our side. Reload") and a global "network offline" banner. Make sure no error message exposes technical details.

---

## 5. Code cleanup and consistency

- Remove unused files, components, exports, CSS classes, images and packages (`depcheck`-style manual check). Components used in only one place (except layouts) are inlined.
- Consistent naming (camelCase CSS classes, PascalCase components), consistent imports (`@` alias), no duplicated helpers (format functions in one place), no leftover comments that restate code, top-of-file comments everywhere.
- **Front end**: `npm run build` clean without warnings, bundle analysis (largest chunks listed; vendor/admin/maps code-split), no `console` output in production build, `npm run preview` works against the backend running in `NODE_ENV=production`.
- **Backend**: no unused modules or dead routes, all env vars documented, `.env.example` complete, `uploads/` ignored by git, `npm audit` reviewed.
- Confirm the words "buyer" and "vendor" never appear on screen or in API messages; "Customer" and "Farmer" are used consistently (grep the built bundle strings).

---

## 6. Regression: quality bars re-checked across everything

- `window.layoutCheck()` **zero findings** at 320, 360, 390, 768, 1024, 1440 on **every** page and sheet of all four areas, with real data.
- Full keyboard pass on each area (skip link, nav, sheets, forms, tables, maps), focus visible everywhere, contrast passes, reduced motion respected, screen-reader landmarks and labels.
- Lighthouse mobile on: guest Home, Customer Home, a product sheet, Farmer Orders, Admin Reports. Targets: Performance 85+ (90+ on the guest and Customer Home), Accessibility 95+, Best Practices 95+.
- Backend: full suite green, `verify:data` clean, load test quick run (10 s per key scenario) still within targets.

---

## 7. Report specifics

In addition to the testing gate below, include:
1. The **inventory table** from 1.1 (every hit and its resolution) and the final grep outputs.
2. **Backend additions** (endpoint and reason) and **schema changes**.
3. A **page-by-page table** for all four areas: page or sheet, API calls used, states tested (loading / empty / error / success), result.
4. **Team to-do list**: every `// TEAM: fill in` item (team names, contact details, address, map coordinates, About text, logo/images licensing notes).
5. Bugs found in the walkthroughs and how each was fixed, and anything left open.

---

## 8. Acceptance checklist

- [ ] `placeholders.js` is deleted; all inventory greps are clean apart from the allowed `siteContent.js` items
- [ ] With the backend stopped, every screen shows an error state and recovers on retry; nothing shows fake data
- [ ] The whole product works from a minimal empty database and from the large dataset, with correct empty and dense states
- [ ] Screen values equal database values for carts, orders, stock, revenue, ratings, counts and dates (timezone-safe); no float money errors
- [ ] Double-submit, expired token, blocked account, 409/422/429, offline and rapid-navigation cases all behave
- [ ] `ErrorBoundary` and offline banner exist; no technical error text is shown to users
- [ ] Build is clean, code-split, no console output in production; unused code removed
- [ ] `layoutCheck()` clean on all pages and sheets in all four areas; Lighthouse targets met
- [ ] All backend additions have tests and docs; the backend suite is green and `verify:data` shows zero drift


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


## B. For front-end integration stages (6, 7, 8)

1. **Run backend and front end together** and walk through **every page and every action** in the browser (phone size and desktop size). For each page record: which API calls it makes (open the Network tab), the status codes, and that the UI shows real data.
2. **Placeholder proof**: run `grep -rn "placeholders" src` (and any old hard-coded arrays) and show that **no page or component imports placeholder data**. Delete `placeholders.js` in Stage 8 once nothing uses it.
3. **All states work with real data**: loading (skeletons), empty, error (server down, 401 expired token with automatic refresh, 403, 404, 422 field errors shown under fields, 429), and success. Try each on purpose (stop the server, use a wrong password, sign in as a suspended Farmer).
4. **Auth flows**: sign in, refresh on page reload, sign out, expired access token refreshes silently, blocked accounts show a clear message, role redirects work, wrong-role access shows the Unauthorized page.
5. **No console errors or warnings**, no failed network requests except the ones you triggered on purpose.
6. **Performance**: no request waterfalls that could be one call, no duplicate calls on mount (React StrictMode double calls handled), lists paginated or cursor-loaded, images/illustrations unchanged in weight. Check Lighthouse on Home.
7. Re-run the earlier front-end quality checks (`layoutCheck()` if present: zero findings at 360, 390, 768, 1024, 1440).
8. **Report table**: page or sheet, API calls used, states tested (loading / empty / error / success), result.


## Rules for the report at the end of every stage

- Start with **"Stage N status: PASS or FAIL"** and justify it.
- Include the **real command output** or screenshots of results.
- List **what you did not verify** and **what you would test next**.
- If any check fails, **fix it and re-run**; do not hand back a failing stage.
