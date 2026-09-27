# Stage 3 · The public catalogue — six pages, one implementation

You are working on **MarketLink**. Stages 1–2 of the Guest redesign are done: 27 public
capabilities were curled signed out, `docs/CATALOGUE_SHARING.md` records the sharing strategy,
the shell was rebuilt, and Home, About and Contact are live.

This is **the largest stage in the pack**. Six public pages currently total **~11,700 lines**
and are a second implementation of six buyer pages. You will extract **one shared catalogue**
and reduce both sides to thin wrappers.

| Route | File | Lines today | Becomes |
|---|---|---|---|
| `/markets` | `guest/Market.jsx` | 617 + 1,416 | `<MarketsView audience="guest" />` |
| `/markets/:id` | `guest/MarketDetail.jsx` | 1,062 + 1,572 | `<MarketView audience="guest" />` |
| `/farmers` | `guest/Farmers.jsx` | 897 + 1,339 | `<StallsView audience="guest" />` |
| `/farmers/:id` | `guest/FarmerDetail.jsx` | 564 + 923 | `<StallView audience="guest" />` |
| `/products` | `guest/Products.jsx` | 509 + 845 | `<BrowseView audience="guest" />` |
| `/products/:id` | `guest/ProductDetail.jsx` | 870 + 1,298 | `<ProduceView audience="guest" />` |

**Target: every page wrapper under 40 lines.** The shared views carry the work, and the buyer
pages become wrappers too.

Go slowly. Extract one view at a time and load both the guest and buyer route after each.

---

# PART 1 · Context

## 1.1 What MarketLink is

A Farmer runs a **stall** at a **market** open on specific days. A Customer browses what is
available, **reserves** items, picks a pickup slot, then **collects in person and pays cash at
the stall**. **No payment gateway. No delivery.**

## 1.2 The SRS requirements this stage satisfies — for signed-out visitors

> Customers can browse nearby farmers markets **by location and day** and view the **list of
> Farmers present at each market**.
>
> Customers can view a Farmer's profile including **stall name, location, operating days, and
> current weekly stock**.
>
> Customers can view markets and Farmer stalls on an **embedded map with location markers and
> directions**.
>
> Customers can browse product categories with **filters for price, category, market, and day**.
>
> Customers can view product details including **price, unit, quantity available, and Farmer**.
>
> Customers can **view reviews left by other customers before ordering**.

All of this must work **without an account**. The public catalogue is the product demo.

## 1.3 Stack and rules

React 18.3, Vite 6, react-router-dom 6.28. **CSS Modules only. No new dependencies.**
Breakpoints **480 / 768 / 1024 / 1280**. Idiqlat headings **weight 400 only**.
Every value from a `var(--token)`; no raw hex, no raw px beyond `1px` hairlines.

**Accent budget: two beet elements per screen**, one of which is the header `Sign up`.

## 1.4 The capability matrix — everything this stage must make work

| # | Capability | Endpoint (signed out) | View |
|---|---|---|---|
| 2 | List markets, filter by day | `GET /api/public/markets` | `MarketsView` |
| 3 | Market detail | `GET /api/public/markets/:id` | `MarketView` |
| 4 | Stalls at a market | `GET /api/public/markets/:id/farmers` | `MarketView` |
| 5 | Produce at a market | `GET /api/public/markets/:id/products` | `MarketView` |
| 6 | List stalls | `GET /api/public/farmers` | `StallsView` |
| 7 | Stall detail | `GET /api/public/farmers/:id` | `StallView` |
| 8 | Stall produce | `GET /api/public/farmers/:id/products` | `StallView` |
| 9 | Stall reviews | `GET /api/public/farmers/:id/reviews` | `StallView` |
| 10 | Stall pickup slots | `GET /api/public/farmers/:id/pickup-slots` | `StallView` |
| 11 | List produce, filtered | `GET /api/public/products` | `BrowseView` |
| 12 | Produce detail | `GET /api/public/products/:id` | `ProduceView` |
| 13 | Produce reviews | `GET /api/public/products/:id/reviews` | `ProduceView` |
| 14 | Related produce | `GET /api/public/products/:id/related` | `ProduceView` |
| 15 | Categories | `GET /api/categories` | `BrowseView` filters |

**Re-curl all fourteen signed out before you start**, and re-check the **public vs authenticated
key diff** Stage 1 recorded. That diff is the whole risk in this stage: if the public mirror
omits a field the buyer view depends on, you must handle it, not crash.

## 1.5 Off-limits

`src/pages/vendor/**`, `src/pages/admin/**` and their layouts. `backend/**`. `package.json`.
The auth pages (stage 4).

**`src/pages/buyer/**` is in scope for this stage only** — and only to replace six page bodies
with wrappers. You change no buyer behaviour, no buyer route, no buyer styling. Every buyer page
must be screenshot-identical afterwards.

---

# PART 2 · The extraction

## 2.1 The two rules, restated

**Rule 1 — `audience` changes actions and links. It never changes content.**

A guest sees the same produce name, price, unit, stock line, stall, description, pickup windows
and reviews as a signed-in customer. Only what they can *do* differs. Hiding prices or stock from
guests destroys the one reason the public catalogue exists.

**Rule 2 — link targets come from one map.**

```jsx
// src/components/catalogue/routes.js
export const CATALOGUE_ROUTES = {
  guest: {
    browse:  '/products',          produce: (id) => `/products/${id}`,
    stalls:  '/farmers',           stall:   (id) => `/farmers/${id}`,
    markets: '/markets',           market:  (id) => `/markets/${id}`,
  },
  buyer: {
    browse:  '/buyer/products',    produce: (id) => `/buyer/products/${id}`,
    stalls:  '/buyer/stalls',      stall:   (id) => `/buyer/stalls/${id}`,
    markets: '/buyer/markets',     market:  (id) => `/buyer/markets/${id}`,
  },
};
export const useCatalogueRoutes = (audience) => CATALOGUE_ROUTES[audience] || CATALOGUE_ROUTES.guest;
```

Note the guest routes keep `/farmers` while buyer uses `/buyer/stalls`. The **label** is "Stalls"
on both; only the URL differs, and changing public URLs would break existing links and the test
suite. Use the map; do not "tidy" the guest paths.

## 2.2 The complete `audience` fork table

**This is the entire difference between the two sides.** If you find yourself adding a fork not
on this list, stop and ask whether it is really an action difference.

| Element | `buyer` | `guest` |
|---|---|---|
| Add to basket | `<AddToCartButton />` | `<Button to={login(next)}>Sign in to reserve</Button>` |
| Quantity stepper | interactive | not rendered |
| Favourite heart | `<FavouriteButton />` | `<Button to={login(next)}>Sign in to save</Button>` |
| Pickup windows | selectable chips | **read-only** `<span>`s, same information |
| Sticky action bar | price + stepper + Add | price + `Sign in to reserve` |
| "Ask MarketLink" link | shown | not rendered |
| Reviews: write one | shown on completed orders | not rendered |
| Reviews: read them | shown | **shown** — this is content, not action |
| Breadcrumb / back link | buyer routes | guest routes |
| Saved-market controls | shown | not rendered |

`login(next)` is `/login?next=<encodeURIComponent(currentPath)>`. **Stage 4 must honour `next`**
and redirect there after sign-in. Note this contract in your report.

## 2.3 Where the views live

```
src/components/catalogue/
  routes.js
  MarketsView.jsx  + .module.css
  MarketView.jsx   + .module.css
  StallsView.jsx   + .module.css
  StallView.jsx    + .module.css
  BrowseView.jsx   + .module.css
  ProduceView.jsx  + .module.css
```

Each signature:

```jsx
/**
 * @param {'guest'|'buyer'} audience  chooses actions and link targets, never content
 */
export function ProduceView({ audience = 'guest' }) {
  const routes = useCatalogueRoutes(audience);
  const { id } = useParams();
  // ...one implementation
}
```

Each view reads its own params and fetches its own data. The wrapper supplies only the frame.

## 2.4 What a page wrapper looks like

```jsx
import React from 'react';
import Page from '@/components/layout/Page';
import ProduceView from '@/components/catalogue/ProduceView';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

/** Public produce detail page. Content lives in the shared ProduceView. */
export function ProductDetail() {
  useDocumentTitle('Produce · MarketLink');
  return (
    <Page width="detail">
      <ProduceView audience="guest" />
    </Page>
  );
}

export default ProductDetail;
```

**Under 40 lines, with no `.module.css` at all** in most cases. If a wrapper needs its own CSS,
that styling probably belongs in the view.

## 2.5 The order to extract in

Simplest first, so the pattern is proven before the hard ones:

1. **`MarketsView`** — a list with a day filter. Fewest moving parts.
2. **`StallsView`** — a list with a category filter.
3. **`MarketView`** — detail + map + two child lists.
4. **`StallView`** — detail + day-dots + pickup windows + produce + reviews.
5. **`BrowseView`** — filters, URL sync, cursor pagination. The most state.
6. **`ProduceView`** — the most forks, and the most-visited detail page.

**After each one**: load the guest route **and** the buyer route, confirm both render, and commit.
Six extractions in one pass with no intermediate check is how this goes wrong.

## 2.6 Reconciling the two implementations

The buyer versions were redesigned recently; the guest versions were not. **Take the buyer
implementation as the base** — it already follows the current design system, uses the shared
components (`DayDots`, `PickupWindows`, `LocationBlock`, `StockLine`, `StallInline`), and has
passed a responsive sweep.

Then read the guest version and **carry across anything genuinely better or missing**. Likely
candidates: SEO metadata, richer descriptions, a sort control the buyer side lacks. List what
you carried across and what you dropped, and why.

**Anything in the guest version that only exists because it was written separately — different
spacing, a second card style, a bespoke filter chip — is dropped.** That is the point.

---

# PART 3 · What each view must contain

These mirror the buyer pages built earlier. Where a component already exists, **import it; do
not rebuild it.**

## 3.1 `MarketsView`

- `PageTitle` "Markets", context line with the count
- **List / Map toggle**, persisted in the URL (`?view=map`); **List is the default**
- **Day chips** — the SRS's "browse markets by location and day"
- Row cards: market name (Idiqlat `--text-h3`), open/closed line from `clock`, meta line
  (town · distance · stall count), `DayDots`
- Map view: one `MapView` with every marker, selection scrolls the card into view
- Empty: `EmptyState` with a "Try a different day" action

## 3.2 `MarketView`

- Back link, market name, address
- `MarketClock` with the progress rule when open — **the same component as the buyer side**, so
  the public and signed-in views can never disagree
- **Opening days**: `DayDots` plus the readable schedule line
- `LocationBlock`: `MapView` + address + **Get directions** (OpenStreetMap,
  `rel="noopener noreferrer"`)
- **Stalls at this market**: grid of `FarmerCard variant="stall"`
- **Fresh at this market**: `HorizontalRow` of `ProductCard`
- Guest only: a quiet line under the title — `Sign in to reserve produce for collection.`
- Bad id: `EmptyState scene="lost-path"` with a link back to `/markets`

## 3.3 `StallsView`

- `PageTitle` "Stalls", count context
- One non-wrapping chip row: `All`, `Open today`, then top categories
- Grid of `FarmerCard variant="stall"`, 2 / 3 / 4 columns
- Sorted with the shared `byOpenThenScarcity` comparator — **import it**; three pages showing
  the same stalls in different orders reads as a bug

## 3.4 `StallView`

Satisfies "stall name, location, operating days, and current weekly stock":

- Avatar, stall name (Idiqlat `--text-h1`), farmer name, rating
- `DayDots` with today's ring, and the open-state line
- `PickupWindows` — **read-only for guests**, selectable for buyers
- About the stall
- **On the table today**: category chips + produce grid; sold-out items stay visible and dimmed
- `LocationBlock` with the map and directions
- Reviews with farmer replies — **shown to guests**, this is content
- Guest CTA: one `Sign in to reserve` under the header

## 3.5 `BrowseView`

Satisfies "filters for price, category, market, and day":

- Sticky search + Filters button + one non-wrapping category chip row
- `FilterPanel` — sheet below 1024, rail at 1024+; **all five axes**: category, market, **day**,
  **price**, availability, plus sort
- Every filter mirrored in the URL; a pasted filtered URL reproduces the view exactly
- Grid 2 / 3 / 4 columns, `minmax(0, 1fr)`
- Cursor pagination with a skeleton tail
- Empty and error states with retry

**If the public endpoint does not support `day` or a price ceiling**, filter client-side over the
loaded page and **say so explicitly in your report**. Do not silently drop an SRS requirement.

## 3.6 `ProduceView`

Satisfies "price, unit, quantity available, and Farmer":

- 4/3 illustration tile, name, **price with unit**, `StockLine` (quantity available)
- `StallInline` with `DayDots` and a link to the stall
- Description
- `PickupWindows` with the cutoff sentence — read-only for guests
- **Also on this stall** and **Similar at other stalls**
- Reviews — shown to guests
- Sticky bar below 768: price + `Add to basket` (buyer) or `Sign in to reserve` (guest)
- Sold out: `Sign in to be told when it is back` for guests
- Bad id: `lost-path` empty state

---

# PART 4 · Your skills for this stage

### Skill 1 · Extract one, verify both routes, commit

Six extractions in one pass produces a white screen with six suspects. One view, load
`/products/:id` **and** `/buyer/products/:id`, commit. Slower to type, far faster to finish.

### Skill 2 · The buyer version is the base

It is newer, follows the current design system, and already passed a responsive sweep. Starting
from the guest version means re-doing that work. Read the guest one for anything genuinely
better, carry that across, drop the rest.

### Skill 3 · One route map, never inline ternaries

Forty `audience === 'buyer' ? ... : ...` expressions at link sites is how the two sides drift
apart again within a month. One import, one lookup.

### Skill 4 · Fork actions, never content

The moment a guest sees less information, the catalogue stops being an argument for signing up.
If a fork hides a fact rather than a button, it is wrong.

### Skill 5 · Read-only beats disabled

Guest pickup windows render as static `<span>`s, not disabled buttons. A disabled button invites
a press and then refuses; static text is simply information.

### Skill 6 · Carry `next` through the sign-in link

`/login?next=/products/abc` means a visitor who signs in to reserve lands back on the produce
item they wanted. Without it they land on a generic home page and abandon. Stage 4 honours the
parameter; this stage must set it everywhere.

### Skill 7 · Screenshot the buyer side before and after

You are editing buyer page files. The only proof they are unchanged is a before/after comparison.
Take the screenshots before you start.

### Skill 8 · Handle the field diff explicitly

If `/public/products/:id` omits a field the buyer view renders, decide once: omit that block for
guests, or show a fallback. Write the decision in the view with a comment. Discovering it as a
runtime crash in front of a judge is the alternative.

---

# PART 5 · Hard rules — never do these

1. **Never let `audience` change content.** Actions and links only.
2. **Never hide prices, stock, descriptions or reviews from guests.**
3. **Never inline an audience ternary at a link site.** Use `CATALOGUE_ROUTES`.
4. **Never render a disabled button where static text will do.**
5. **Never change buyer behaviour, routes or styling.** Wrappers only.
6. **Never change the public guest URLs** (`/markets`, `/farmers`, `/products`). Labels change; paths do not.
7. **Never rebuild a component that already exists** — `DayDots`, `PickupWindows`,
   `LocationBlock`, `StockLine`, `StallInline`, `MarketClock`, `FilterPanel`, `MapView`.
8. **Never leave a page wrapper over 40 lines**, or give it its own CSS without justifying it.
9. **Never silently drop the `day` or `price` filter.** Implement it, client-side if needed, and report.
10. **Never omit the `next` parameter** on a guest sign-in CTA.
11. **Never crash on a bad id or a missing public field.**
12. **Never use bare `1fr` in a grid.** `minmax(0, 1fr)`.
13. **Never use a raw hex or raw px**, a gradient, a card shadow, `!important` or `:global`.
14. **Never add a dependency. Never touch vendor, admin or the backend.**

---

# PART 6 · Definition of done

- [ ] All 14 capabilities re-curled signed out; the public/authenticated key diff re-checked
      and every missing field handled with a documented decision
- [ ] `src/components/catalogue/routes.js` exists; **zero inline audience ternaries at link sites**
- [ ] All six views built, each taking `audience`
- [ ] All six **guest** pages are wrappers **under 40 lines**
- [ ] All six **buyer** pages are wrappers **under 40 lines**
- [ ] Buyer pages verified screenshot-identical before and after
- [ ] The complete fork table implemented exactly — no fork outside it
- [ ] Guest CTAs all carry `?next=<current path>`
- [ ] Guest pickup windows are read-only static text, not disabled buttons
- [ ] Reviews visible to guests on both stall and produce pages
- [ ] All five SRS filter axes work on `/products`
- [ ] Maps and directions work on market and stall pages
- [ ] Bad ids render `lost-path`, not a crash
- [ ] Line counts reported before and after for all twelve guest files
- [ ] `layoutCheck()` **zero findings** on all six guest pages **and** all six buyer pages at
      360, 390, 768, 1024, 1440

---

# PART 7 · Verification gate

### Capability proof — fourteen rows, signed out

Method, path, status, response excerpt. Plus the re-checked key diff and, for every field the
public mirror omits, the decision you made.

### Extraction proof

```bash
wc -l src/pages/guest/Market.* src/pages/guest/MarketDetail.* src/pages/guest/Farmers.* \
      src/pages/guest/FarmerDetail.* src/pages/guest/Products.* src/pages/guest/ProductDetail.*
wc -l src/pages/buyer/Products.* src/pages/buyer/ProductDetail.* src/pages/buyer/Farmers.* \
      src/pages/buyer/FarmerDetail.* src/pages/buyer/Markets.* src/pages/buyer/MarketDetail.*
wc -l src/components/catalogue/*
```

Before → after for all twenty-four files, plus the new view files. **Report the net total.**

```bash
grep -rn "audience === " src/components/catalogue | grep -iE "to=|href=|navigate\("
```

Must be empty — link targets come from the route map.

### A1 build · A2 runtime

```bash
npm run build
npm run dev
```

**Private window.** Zero console errors on all six guest pages. Confirm every request went to
`/api/public/...` — paste six URLs. Then **signed in**, confirm the six buyer pages request the
authenticated paths.

### The dual-route walk

For each of the six views, load the guest route and the buyer route and record:

| view | guest URL | renders | buyer URL | renders | content identical? | actions differ correctly? |

**Content identical** is the key column. Any content difference is a Rule 1 violation.

### Buyer regression

Screenshots of all six buyer pages **before and after**, at 390 and 1440. State explicitly that
they are unchanged, or name every difference.

### Guest CTA proof

On a produce page, a stall page and a market page, click each guest CTA and record the resulting
URL. Every one must be `/login?next=<encoded current path>`.

### Read-only pickup windows

Screenshot the pickup windows as a guest and as a buyer. Confirm the guest version is static text
with the same information, and paste the accessibility tree for one to show it is not a disabled
control.

### Filters

Apply all five axes plus sort on `/products`. Copy the URL, open in a fresh tab, confirm an
identical view. Paste both URLs and both result counts. State which axes are server-supported
and which you filtered client-side.

### Maps

For a market page and a stall page: markers rendered, tiles loaded, directions URL pasted,
keyboard access to zoom controls, page scrolls over the map, and what happens with no coordinates.

### Bad ids

`/products/nonsense`, `/farmers/nonsense`, `/markets/nonsense` — all three render `lost-path`
with a working link back. No crash, no blank page.

### B1 · Responsive sweep

At **360, 390, 768, 1024, 1440** on all **twelve** pages (six guest, six buyer):

```js
const { layoutCheck } = await import('/src/dev/layoutCheck.js');
console.table(layoutCheck());
```

**Zero findings, sixty tables.**

### B4 · Keyboard

Tab all six guest pages end to end. The filter panel traps focus and `Esc` returns it. Chips
toggle with Space. Every CTA reachable with a visible ring.

### Minimal seed

```bash
cd backend && npm run seed:minimal
```

All six guest pages show calm empty states. Then `npm run seed`.

### Tests

```bash
node tests/run_all.mjs
```

All suites pass. `tests/01_guest.mjs` and `tests/03_customer.mjs` both exercise these pages —
update selectors to the new markup rather than keeping stale ones, and never weaken an assertion.

---

# PART 8 · Report

```
Stage G3 status: PASS | FAIL

## Capability proof (14 rows, signed out)
| # | capability | path | status | excerpt |

## Public vs authenticated field diff
| resource | fields missing publicly | decision |

## Extraction proof
| file | before | after |
(24 page files + 12 new view files)
Net total: <before> → <after>   (target: roughly a third)

Inline audience ternaries at link sites: <grep output — must be empty>

## Dual-route walk
| view | guest URL | buyer URL | content identical | actions differ correctly |

## Gate results
A1 build / A2 runtime:  <output + 6 public URLs + 6 authed URLs>
Buyer regression:       <12 screenshots, unchanged?>
Guest CTA next param:   <3 URLs>
Read-only windows:      <2 screenshots + a11y tree>
Filters:                <2 URLs, 2 counts, server vs client per axis>
Maps:                   <per page: markers, tiles, directions, keyboard, no-coords>
Bad ids:                <3 results>
B1 layoutCheck:         <60 tables>
B4 keyboard:            <result>
Minimal seed:           <6 pages>
Tests:                  <summary>

## Carried across from the old guest pages
- <what, and why it was better>

## Dropped from the old guest pages
- <what, and why>

## Contracts noted for Stage 4
- /login?next=<path> must redirect there after sign-in

## Found but not fixed
- <file:line>

## NOT verified
- <what and why>
```

Fix and re-run any failing gate. A content difference between guest and buyer, a buyer page that
changed, a missing `next` parameter, or a page wrapper over 40 lines is a **FAIL**.
