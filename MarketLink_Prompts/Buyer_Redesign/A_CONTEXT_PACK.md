# A · MarketLink Context Pack

> This block is embedded at the top of every stage prompt. It is reproduced here on its own
> so a human can read it once. **Stages are self-contained — you never need to paste this.**

---

## 1. What MarketLink is

A full-stack web app from an SRS titled *"MarketLink — End-to-End Web Solutions"*,
theme **eGreen Basket**. It connects local farmers-market **Farmers** with **Customers**.

Tagline: **"Farm Fresh Just a Click Away."**

The real-world loop it models:

1. A Farmer runs a **stall** at a **market** that opens on specific days in specific windows.
2. The Farmer publishes weekly stock and prices.
3. A Customer browses what is actually available, **reserves items** and picks a pickup slot.
4. The Customer **collects in person at the market stall** and **pays there, in cash.**
5. Afterwards the Customer can review the produce and the stall.

**Hard scope limits from the SRS — never build these:**

- **No payment gateway.** Ever. Payment happens in person at pickup. No card fields,
  no Stripe, no "Pay now", no totals labelled "Amount charged".
- **No delivery or courier.** Pickup at the market only. No delivery addresses,
  no tracking maps, no couriers.
- **No farmer identity / licence / organic-certification verification.**

**Requirements the Customer side must satisfy (SRS 1.6, "Customer Features"):**

| Requirement | Where it lives |
|---|---|
| Register, log in, secure dashboard | `/login`, `/register`, `/buyer` |
| Browse markets by location and day; see who is at each market | Markets index, Market page |
| View a stall profile: name, location, operating days, weekly stock | Stall page |
| See markets and stalls on a map with markers and directions | Market page, Stall page |
| Browse categories with filters for price, category, market, day | Browse page |
| View produce detail: price, unit, quantity available, farmer | Produce page |
| Add to cart, pre-order against real stock | Basket to Checkout |
| Choose a pickup date and time slot inside the Farmer windows | Checkout |
| See order status (placed / accepted / ready / completed) | Orders, Order page |
| Cancel or modify before the Farmer cutoff | Order page |
| Order history + quick reorder | Orders, Order page |
| Favourite stalls and produce; restock alerts | Saved |
| Save preferred markets with route-friendly pickup details | You to Saved markets |
| AI assistant for market timings, availability, product questions | Assistant |
| Rate and review after an order completes; read others reviews | Order page, Produce page, Stall page |
| In-app alerts for confirmations and ready-for-pickup | Notifications |

**Non-functional requirements (SRS 1.7):** accessible (clear legible fonts and controls),
user-friendly, fast (minimal load time, smooth redirection even with large catalogues),
responsive across devices, secure, compatible with current browsers.

---

## 2. Stack

**Frontend** — repo root

- React 18.3 + Vite 6, `react-router-dom` 6.28
- **CSS Modules only.** `*.module.css` next to each component. Three globals:
  `src/styles/tokens.css`, `base.css`, `utils.css`, entered via `index.css`.
- **No Tailwind, no SCSS, no styled-components, no UI kit.** Do not add one.
- `lucide-react` for icons, `leaflet` for maps
- Alias: `@` maps to `src`
- Dev server: **port 3000**, proxies `/api` to `http://127.0.0.1:4000`

**Backend** — `backend/`

- Node + Express 5 + **native MongoDB driver** (no Mongoose)
- Module-per-feature: `backend/src/modules/<feature>/<feature>.routes.js` + `.service.js`
- JWT access token in memory + refresh cookie
- Port **4000**, all routes under `/api`
- Docs: `backend/docs/API.md` (the frozen contract), `DATABASE.md`

**Fonts**

- `Idiqlat` (local `.ttf` at `/fonts/Idiqlat/Idiqlat-Regular.ttf`) — headings.
  **It has exactly one weight: 400.** Never write `font-weight: 600` on a heading.
- `Inter` (Google Fonts, 400/500/600/700) — all UI and body text

---

## 3. Repo map (what matters for the buyer side)

```
src/
├─ api/            client.js (fetch + refresh) · catalog · orders · me · favorites ·
│                  notifications · assistant · auth
├─ components/
│  ├─ ui/          Button Card Chip Badge FormField ListRow Tabs Toggle Toast Stars
│  │               QuantityStepper SegmentedControl Skeleton EmptyState ErrorState
│  │               BottomSheet TimeSelect ConfirmStep StatusDot BackToTop MarketLinkLogo
│  ├─ layout/      BuyerTopBar BottomNav CartBar AnnouncementBar PageHeader HorizontalRow
│  │               SheetRoute Footer TopBar MarketDropdown WaveDivider ErrorBoundary
│  │               OfflineBanner
│  └─ domain/      ProductCard FarmerCard MarketCard OrderRow ReviewItem AddToCartButton
│                  Illustration MapView BarChart GlobalSearchModal
├─ context/        AuthContext CartContext FavoritesContext NotificationContext ToastContext
├─ hooks/          useQuery useFeed useInfiniteList useMutation useDebouncedValue
│                  useOpenSheet useNotificationCount useVisibleInterval useDocumentTitle
├─ layouts/        BuyerLayout GuestLayout VendorLayout AdminLayout
├─ pages/buyer/    Home Products Orders Favorites Profile Markets Farmers Reviews
│                  ProductDetail FarmerDetail MarketDetail Cart OrderConfirmed OrderDetail
│                  Assistant ProfileDetails SavedMarkets ProfileNotifications Help
├─ routes/         AppRoutes.jsx paths.js ProtectedRoute.jsx
├─ styles/         tokens.css base.css utils.css index.css
└─ dev/            layoutCheck.js   (responsive / overlap / touch-target auditor)
```

```
tests/            Playwright suites, plain .mjs, no test runner
├─ helpers.mjs    createTestContext(viewport) · loginAsCustomer(page)
├─ 01_guest.mjs  02_auth.mjs  03_customer.mjs  04_layout.mjs
└─ run_all.mjs    node tests/run_all.mjs
```

---

## 4. Commands

```bash
# backend (terminal 1)
cd backend
npm run seed          # reset + seed demo data
npm run dev           # http://localhost:4000/api
npm test              # 61 automated tests against marketlink_test
npm run routes        # print the route inventory

# frontend (terminal 2)
npm run dev           # http://localhost:3000
npm run build         # must succeed with no new warnings

# end-to-end
node tests/run_all.mjs
```

**Seeded credentials**

| Role | Email | Password |
|---|---|---|
| Customer | `george@example.com` | `market123` |
| Farmer | see `backend/src/db/seed.js` | — |
| Admin | see `backend/src/db/seed.js` | — |

**`layoutCheck()`** — import from `@/dev/layoutCheck`. It scans the live screen and returns
findings for: horizontal overflow, overlapping interactive/fixed elements, touch targets under
44x44, clipped or squeezed text, uneven cards inside `[data-check-even]`, distorted media
inside `[data-aspect]`. **Target: zero findings at 360, 390, 768, 1024, 1440.**

---

## 5. Existing API surface the buyer side uses

Base `/api`. Unauthenticated callers hit the `/api/public/...` mirror automatically
(`src/api/catalog.js` prefixes with `/public` when there is no access token).

```
GET  /categories
GET  /markets                       GET /markets/:id
GET  /markets/:id/farmers           GET /markets/:id/products
GET  /farmers                       GET /farmers/:id
GET  /farmers/:id/products          GET /farmers/:id/reviews
GET  /farmers/:id/pickup-slots
GET  /products                      GET /products/:id
GET  /products/:id/reviews          GET /products/:id/related
GET  /search/suggestions            GET|POST|DELETE /search/history
GET  /feed                          GET /feed/meta
GET  /home/summary
POST /cart/quote
POST /orders/checkout               GET /orders            GET /orders/:id
PATCH /orders/:id                   POST /orders/:id/cancel
GET  /orders/:id/reorder-preview    POST /orders/:id/reviews
PATCH /reviews/:id                  DELETE /reviews/:id    POST /reviews/:id/flag
GET  /favorites  /favorites/ids     PUT|DELETE /favorites/:type/:id
GET  /notifications                 POST /notifications/read-all  POST /notifications/:id/read
POST /assistant/message
GET  /users/me                      PATCH /users/me        POST /users/me/password
GET|PUT|DELETE /users/me/saved-markets[/:marketId]
PUT  /users/me/home-market/:marketId
GET  /announcements
```

**Response envelope:** `{ data, meta }` on success, `{ error: { code, message, details } }` on
failure. Cursor pagination lives in `meta.nextCursor` / `meta.hasMore`.

---

## 6. Conventions you must follow

**CSS Modules**

- One `.module.css` per component, same folder, same basename.
- Every colour, size, radius, duration comes from a `var(--token)`. **Zero raw hex, zero
  raw px** outside `tokens.css`. `1px` hairlines are the one allowed exception.
- camelCase class names. No global selectors, no `:global`, no `!important`.
- Mobile-first. Media queries only at **480 / 768 / 1024 / 1280**.

**Components**

- Named export **and** default export: `export function X() {}` then `export default X;`
- JSDoc block above the component saying what it is and any non-obvious spec.
- Props destructured in the signature with defaults.

**Data**

- Fetch through `src/api/*.js` helpers — never call `fetch` directly in a page.
- Read with `useQuery(['key', dep], ({ signal }) => apiCall(signal))`.
- Write with `useMutation`.
- **Never import `src/data/placeholders.js`.** It is dead. If you see it imported, that is a bug.

**Accessibility**

- Minimum touch target **44 x 44** (`--tap-min`).
- Every icon-only control needs `aria-label`.
- Visible focus ring everywhere (`--focus-ring`, `--focus-offset`).
- Honour `prefers-reduced-motion` on anything that moves.
- One `<h1>` per page; headings descend without skipping.

---

## 7. What is off-limits

- `src/pages/vendor/**`, `src/pages/admin/**`, `src/pages/guest/**` — do not edit unless a
  stage names the exact file.
- `src/layouts/VendorLayout.jsx`, `AdminLayout.jsx`, `GuestLayout.jsx`
- Existing backend routes and response fields — **extend, never break.**
- `package.json` dependencies — **do not add libraries.** Everything in this redesign is
  buildable with React, react-router-dom, lucide-react and leaflet, all already installed.
