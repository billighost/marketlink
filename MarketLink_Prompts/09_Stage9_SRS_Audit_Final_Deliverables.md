# MarketLink Stage 9 of 9: SRS Compliance Audit, Final Polish and Deliverables

You are a **strict QA lead and full-stack engineer**. The product is built, connected and cleaned (Stages 1 to 8). **Stage 9 re-reads the project brief (the SRS) line by line and proves that every requirement is implemented and working**, fixes every gap, prepares the app for hosting, and prepares the materials the team needs for submission and evaluation. **Nothing may be left "partial" without a written reason and a fix.**

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

**The SRS** is `MarketLink_End-to-End_Web_Solutions_SRS.pdf`. Look for it in the repository (`docs/`) or the uploaded files. **If you cannot find it, stop and ask me to provide it; do not work from memory.** The requirement checklist in section 2 is a **starting point only**: your job is to read the actual document and build the table from it, adding anything this list misses.

---

## 1. Rules about documentation (important)

The SRS forbids using AI to produce ready-made documentation and requires that AI tools used be acknowledged. Therefore:
- You may produce **technical working notes, checklists, tables, outlines and templates** (traceability table, demo shot list, code map, install steps). You must **not** write the team's project report prose.
- For the project report, produce only an **outline with headings and a bullet list of facts and evidence sources** per section (so the team can write it in their own words), never finished paragraphs.
- Create `docs/AI_USAGE.md` as a **template** the team fills in honestly (tools used, what for, what they changed and understood). Do not invent entries.

---

## 2. Step one: SRS traceability table (`docs/SRS_TRACEABILITY.md`)

Create a table with one row per requirement: **ID, requirement (quoted or closely paraphrased from the SRS), implemented where (route/API endpoint + page/sheet + component), how it was tested (test name or manual steps), status (Done / Fixed in this stage / Optional-not done with reason)**. Include **all** of the following, plus anything else in the document:

**Customer**
- Registration with **name, contact number, e-mail ID and address**; secure login and dashboard access; save **multiple favourite** Farmers and products; (optional) sharing accounts among family members: decide, document the decision.
- Browse nearby farmers markets **by location and day** and see the **list of Farmers at each market**; view a Farmer's profile (stall name, location, operating days, **current weekly stock**); markets and Farmer stalls on an **embedded map** (Google Maps API or OpenStreetMap) **with location markers and directions to the selected pickup point**.
- Browse product categories with **filters for price, category, market and day**; product details with **price, unit, quantity available, Farmer**.
- Cart; place a pre-order against available stock; **select a pickup date and time slot within the Farmer's windows**; view order status (placed, accepted, ready for pickup, completed); **cancel or modify before the Farmer's cut-off**; **no payment** (paid at pickup).
- Manage orders (view, modify, cancel); order history and **quick reorder**; favourites for quick access and **restock alerts**; **save preferred market locations** and route-friendly pickup details.
- Optional AI assistant: find items across markets and Farmers; answer market timings, Farmer availability, pickup windows, product details.
- Reviews and ratings **after an order is completed**, for Farmers and products; view other Customers' reviews before ordering.

**Farmer**
- Registration with **stall/business name, contact person, contact number, e-mail ID, address**; profile enhancement (markets sold at, operating days, pickup windows, address, **map pin, latitude and longitude**).
- Manage weekly stock: **add, edit, view, delete** products with **name, category, price, unit, quantity, description, image**; recurring **weekly stock template**; mark **sold out / temporarily unavailable**.
- Pre-orders: view, **accept or decline**, mark **ready for pickup**; set **cut-off times** and manage **pickup slots**.
- Order history and insights: past sales, best sellers, **Total Orders, Pending Orders, Revenue Summary**; view and respond to reviews.

**Admin**
- Secure dedicated login and dashboard separate from Customer and Farmer views; key metrics (**total Farmers, Customers, markets, orders**).
- **Approve or suspend Farmers before they can list products**; activate or deactivate Customers.
- Add, edit, remove markets (name, address, operating days, timings, map coordinates or embedded map links).
- Content moderation (remove inappropriate listings or reviews).
- Reports: total orders, **revenue summary across markets**, **most active Farmers**.
- System configuration: product categories and platform-wide notifications/announcements.

**Other features**
- Role-based access control (users access only features relevant to their role).
- **Search, sort, filter** for markets, Farmers, products (location, category, price, market day) with **map-based results where location discovery is required**.
- Responsive, mobile-friendly design; **notifications** (e-mail or in-app) for order confirmations and orders ready for pickup; feedback and ratings; **About Us** (team and platform information); **Contact Us** (static team contact information **with Google Maps showing location**).

**Non-functional**: safe to use (no malicious or unnecessary downloads), accessibility (clear legible fonts, UI elements, navigation), user-friendliness, operability, performance (minimal load time, smooth redirection, large catalogues), scalability (peak market days), security (authentication, only registered users access certain features), availability (24/7 design), compatibility (latest browsers, various devices).

**Constraints**: no payment gateway; pickup only, no delivery/courier; **no Farmer identity/licence/certification verification**; images and videos subject to licensing and copyright (confirm every image, illustration and font used is owned, licensed or open-licensed; list them).

**Deliverables**: problem definition, design specifications, diagrams (flowcharts, data flow diagrams), database design, test data used, **installation instructions (mandatory)**, **user credentials for all types of users with passwords (mandatory)**, no source code in the documentation, zip with a ReadMe listing assumptions and database scripts, hosted URL (preferred), **demo video (mandatory)** covering all functional requirements.

Note the SRS's example wording: it lists Java/C#/PHP/Python/**MongoDB, Express.js, React, Node.js** as backend options and **MySQL/SQL Server/MongoDB/JSON** as databases, and asks for `.sql` files; with MongoDB the equivalent is the seed/index scripts and a JSON export. State this in the ReadMe assumptions.

---

## 3. Step two: prove every row, fix every gap

1. For **each row**, verify it **in the running app** (browser, phone-size and desktop) and/or with an automated test, and fill the "tested" column with evidence. Do not mark Done from memory or from reading code.
2. Every gap or weakness you find gets **fixed in this stage** (backend with tests per the testing gate, front end with real data, docs updated). Typical things to check carefully: the **Sort** control on every list; filtering by **market day**; **map markers and directions** on markets and Farmers; **"Contact Us" with Google Maps showing location** (the map is OpenStreetMap via Leaflet: the SRS says "Google Maps"; keep OSM for keyless operation but **add a "Open in Google Maps" link** and note the decision in the ReadMe assumptions); **weekly stock visible on the Farmer profile**; **restock alerts** actually delivered after a Farmer restocks; **email notifications**: in-app notifications satisfy "e-mail or in-app"; if I confirm SMTP credentials are available, add optional real e-mail through `nodemailer` (one-line justification) behind `SMTP_*` env vars with a clean fallback to the log stub; **family account sharing** (optional: document as not implemented, or implement a minimal "household members" if it is quick and safe); Farmer **cut-off times per Farmer** and **slot management** visible in both UIs; **"images" for products** (upload or illustration) end to end; **delete product** behaviour; **admin separation** of views.
3. Re-run **all suites**: backend tests (Stages 1 to 5 and later additions), `verify:data`, the end-to-end backend scenario, and the front-end formatting tests. Everything green.

---

## 4. Step three: non-functional verification (evidence required)

- **Safe**: confirm there are no automatic downloads; CSV export only downloads on explicit click; uploads are validated; dependencies audited (`npm audit` for both projects, findings fixed or documented); no secrets in the repo (scan).
- **Accessibility**: automated pass (Lighthouse Accessibility 95+ on 5 key pages) plus a manual pass: keyboard-only walkthrough for each role, focus order, visible focus, labels, contrast, zoom to 200%, reduced motion, screen-reader spot check of one flow per role. Record results.
- **Usability**: five-minute task tests written as a script for each role (register → first meaningful action) and record where a first-time user could stumble; fix small issues.
- **Performance**: Lighthouse mobile scores (Home guest, Customer Home, Browse, Farmer Orders, Admin Reports); backend load-test summary from Stage 5 re-run on the final build; front-end bundle sizes; time-to-interactive notes.
- **Scalability**: a short technical note (stateless API, indexes, pool sizing, pagination, what breaks first at 10x load, and what would be done: caching, read replicas, CDN, queue for notifications).
- **Security**: re-run the Stage 5 security suite; final manual checks of token handling, CORS, cookies, rate limits and production mode.
- **Availability**: health/readiness endpoints, graceful restart, DB reconnect behaviour, notes for uptime monitoring.
- **Compatibility**: test the latest **Chrome, Firefox and Edge** (and Safari if available or documented as not tested) at phone, tablet and desktop sizes; list any differences fixed. Test iOS Safari behaviours where possible (bottom nav safe areas, input zoom, sheet dragging).

---

## 5. Step four: hosting readiness

- Add an optional **single-server production mode**: when `SERVE_FRONTEND=true`, Express serves the built front end (`../dist`) with correct cache headers (hashed assets long-lived, `index.html` no-cache) and an **SPA fallback** that never swallows `/api` or `/uploads` 404s. Add `npm run build:all` and `npm run start:prod` at the repository root that build the front end and start the backend.
- Provide `docs/DEPLOYMENT.md` (final): MongoDB Atlas setup, environment variables for production, CORS/cookie settings, a step-by-step for one common free-tier host (choose one, e.g. Render or Railway) for the single-server mode, health-check path, and how to seed the hosted database with demo data (safely, with `--force`). Include a **pre-flight checklist** (secrets set, `NODE_ENV=production`, indexes built, seed run, admin password changed or demo credentials documented).
- Verify by running the production-mode server locally and walking one flow per role.

---

## 6. Step five: submission materials (working notes and templates only; see section 1)

Create in `docs/`:
1. **`SRS_TRACEABILITY.md`** (finished).
2. **`INSTALLATION.md`**: exact steps to run everything from a clean machine (Node, MongoDB local or Atlas, env files, `npm install` in both projects, seed, run, test), with troubleshooting. **Mandatory deliverable.**
3. **`CREDENTIALS.md`**: a table of demo accounts for every user type (Customer, inactive Customer, active/pending/suspended Farmer, Admin) with passwords, plus what each is for. **Mandatory deliverable.**
4. **`TEST_DATA.md`**: what the seed contains (counts by collection, notable records, seeded scenarios per role) and how to reset it.
5. **`DATABASE_SCRIPTS.md`**: explains that database and collection definitions, validators and indexes are created by `db/collections.js`, `db/indexes.js`, and data by `db/seed.js` (the MongoDB equivalent of `.sql` scripts), and how to export JSON (`scripts/export-json.js`) and `mongodump`.
6. **`README_ASSUMPTIONS.md`**: the assumptions list for the zip's ReadMe (MongoDB/MERN choice and SQL scripts equivalent, OpenStreetMap instead of Google Maps plus Google link, cart on the client, rule-based assistant, in-app notifications, no Farmer verification, no delivery/payment, timezone handling, image licensing).
7. **`DEMO_SCRIPT.md`**: a **shot list for the mandatory demo video**, in order, covering **every functional requirement** for Customer, Farmer and Admin (what to click, what to say in one line, expected result, which credentials), with an estimated timing per segment and a tip list for recording (window size, seed reset, stable data).
8. **`REPORT_OUTLINE.md`**: **outline only** for the project report (Problem Definition, Design Specifications, Diagrams, Database Design, Test Data, Installation, Credentials): for each, list the facts and the file/screen where evidence exists, and which diagrams the team should draw (activity flowcharts for browse-to-order, order lifecycle, farmer approval; context and data-flow diagrams; ER diagram of the collections). **No finished prose.**
9. **`CODE_MAP.md`**: a map of "where is the code for feature X" (frontend page/component → API route → service → collection) for every major feature, plus **10 likely evaluator questions per area with a pointer to the relevant code** (not written answers), so the team can prepare to explain their own work.
10. **`AI_USAGE.md`**: the blank template described in section 1.

---

## 7. Step six: final polish and freeze

- Fix any remaining visual or interaction issues found while recording the walkthroughs (spacing, truncation, focus, loading flashes), keeping the calm, minimal, mostly-white design.
- Ensure the repository is tidy: root `README.md` with a 10-line quick start, consistent scripts, `.gitignore` (node_modules, `.env`, `uploads/`, `dist/`), no stray files, no debug code.
- **Final full run** from a clean clone and a fresh database: install both projects, seed, run tests, build, start production mode, walk through the demo script. Fix anything that breaks and re-run.

---

## 8. Final report

Start with **"Stage 9 status: PASS or FAIL"** and include:
1. The finished **traceability table** (or a summary with the file link) with counts: Done / Fixed in this stage / Optional not done, and the **reason for every non-Done row**.
2. All **gaps found and fixed** (requirement → fix → test).
3. Evidence for the non-functional checks (scores, tools, browsers, numbers).
4. The **clean-clone run** results (commands and outputs).
5. The list of **team to-dos** that only humans can do (fill team info, real images or licences, record the video, write the report, fill `AI_USAGE.md`, choose the hosting account, change demo passwords for hosting).
6. Anything not verified.

---

## 9. Acceptance checklist

- [ ] Every SRS requirement has a row, evidence and a status; nothing is "partial" without a reason and a fix
- [ ] All backend suites, `verify:data`, end-to-end scenario and front-end tests are green
- [ ] Non-functional evidence is recorded for every non-functional requirement
- [ ] Production single-server mode works; deployment notes are complete and tested locally
- [ ] Installation, credentials, test data, database scripts, assumptions, demo script, outline, code map and AI-usage template exist (technical notes and templates only, no finished report prose)
- [ ] A clean clone with a fresh database runs the full product for all three roles
- [ ] Only "Customer" and "Farmer" appear on screen; no placeholders remain


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


## C. For the final audit stage (9)

1. Re-read the SRS (`MarketLink_End-to-End_Web_Solutions_SRS.pdf`) line by line and build a **traceability table**: each requirement → where it is implemented (route + page) → how it was tested → status. **Nothing may be left "partial" without a written reason and a fix.**
2. Run the full backend suite, then the full end-to-end walkthrough for all three roles from a fresh seed. Paste the results.
3. Verify the non-functional requirements (safe, accessible, user-friendly, performance, scalability notes, security, availability notes, compatibility) with evidence: Lighthouse, browsers tested, load test numbers, security checks.
4. Confirm the mandatory deliverables: install instructions, credentials for every user type, test data description, database setup scripts, README with assumptions, hosted URL plan, and demo-video script covering every functional requirement.


## Rules for the report at the end of every stage

- Start with **"Stage N status: PASS or FAIL"** and justify it.
- Include the **real command output** or screenshots of results.
- List **what you did not verify** and **what you would test next**.
- If any check fails, **fix it and re-run**; do not hand back a failing stage.
