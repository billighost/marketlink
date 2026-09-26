# Stage 6 · Browse and the Produce page

You are working on **MarketLink**, mid-redesign of the signed-in Customer experience.
Stages 1–5 are done:

- **1** — white-first tokens, buyer shell, primitives `Page` / `PageTitle` / `Section` / `MarketClock`
- **2** — `Scene` + ten full-scene SVGs, wired into `EmptyState` and `ErrorState`
- **3** — backend `clock`, `operatingDayNumbers`, `openToday`, `lowStockCount`, grouped cart quote, `pickupCode`
- **4** — every buyer destination is a real page; no sheet routes; `useOpenSheet` is a plain navigate
- **5** — the Today page rebuilt with the market clock and the stall strip

This stage rebuilds **two pages**:

1. `/buyer/products` — **Browse**, the produce catalogue with filters
2. `/buyer/products/:id` — **Produce**, which until Stage 4 was a 448px drawer and is now a
   full page that has never been designed as one

---

# PART 1 · Context

## 1.1 What MarketLink is

Local farmers-market **Farmers** and **Customers**. A Farmer runs a **stall** at a **market**
open on specific days in specific windows. A Customer browses what is available, **reserves**
items, picks a pickup slot, then **collects in person at the stall and pays in cash**.

**No payment gateway. No delivery. Ever.** The produce page never shows a "Buy now", a price
labelled as charged, or a delivery option. It shows "Add to basket" and, eventually, a reservation.

SRS requirements this stage must satisfy:

> Customers can browse product categories (vegetables, fruits, dairy, baked goods, and so on)
> with filters for **price, category, market, and day**.
> Customers can view product details including **price, unit, quantity available, and Farmer**.

Those four filter axes and those four detail fields are **mandatory**, not suggestions.

## 1.2 Stack and rules

React 18.3, Vite 6, react-router-dom 6.28. **CSS Modules only. No new dependencies.**
Alias `@` maps to `src`. Breakpoints **480 / 768 / 1024 / 1280** only.
Idiqlat headings at **weight 400 only**; Inter for everything else.
Every value from a `var(--token)`; no raw hex, no raw px beyond `1px` hairlines.

## 1.3 The files

```
src/pages/buyer/Products.jsx      + .module.css   BROWSE — full rewrite (437 + 348 lines today)
src/pages/buyer/ProductDetail.jsx + .module.css   PRODUCE — full rewrite (258 + 345 lines today)
src/components/domain/ProductCard.jsx             exists — you fix its stretched link
src/components/domain/AddToCartButton.jsx         exists — keep its fly animation
src/components/ui/Chip.jsx  Toggle.jsx  Stars.jsx  QuantityStepper.jsx   exist
src/components/domain/ReviewItem.jsx              exists
src/components/ui/BottomSheet.jsx                 exists — the filter sheet under 1024
src/hooks/useDebouncedValue.js                    exists — 250ms
src/api/catalog.js    getProducts getCategories getMarkets getFarmers
                      getProductDetail getProductReviews getRelatedProducts
                      getFarmerProducts getSearchSuggestions getSearchHistory
```

New files you create:

```
src/components/domain/FilterPanel.jsx  + .module.css   one filter UI, two containers
src/components/domain/StockLine.jsx    + .module.css   the honest availability sentence
src/components/domain/StallInline.jsx  + .module.css   the stall strip on a produce page
src/components/layout/GridSkeleton.jsx + .module.css   layout-matched grid loading
```

## 1.4 Known bug already fixed in Stage 4

`Products.jsx` passed `isOpen` to `BottomSheet`, which reads `open`. Stage 4 fixed that one line.
Do not reintroduce it — and note that ~20 vendor/admin call sites still have it. **Out of scope.**

## 1.5 Off-limits

Vendor, admin, guest. `backend/**`. `package.json`. Every other buyer page.

---

# PART 2 · Design rules that bind these pages

## 2.1 The accent budget

**Browse:** the bottom nav's active "Browse" item is beet; the basket pill is beet when the
basket has items. So the Browse body gets **zero beet** — except the "Apply" button inside the
filter sheet, which is the one beet element **while the sheet is open** (the nav is occluded then).
An active category chip is **ink-filled**, not beet: `background: var(--color-ink)`,
`color: var(--color-white)`.

**Produce:** the sticky "Add to basket" bar holds the **one** beet button. Everything else on the
page is ink and hairline.

## 2.2 Density budget at 390 x 844

**Browse, first viewport:**

```
1. Top bar                          56px
2. Sticky search + Filters button   44px
3. One category chip row            44px, horizontal scroll, never wraps
4. Result count line                "42 items"
5. First two product cards          2-column grid
```

**Produce, first viewport:**

```
1. Top bar
2. Back link                        "Back to browse"
3. 4/3 illustration tile
4. Name (h1) + price / unit
5. Stock line
```

The sticky add bar sits at the bottom, outside the flow count.

## 2.3 Chip row rules — these are hard constraints

- **Exactly one chip row per screen. Chips never wrap.** Horizontal bleed-to-edge scroll with a
  hidden scrollbar.
- At most **seven** visible: `All` + five top categories + `More` (which opens the filter panel).
- Every chip is at least `44px` tall.
- Inactive: transparent background, `1px solid var(--color-border)`.
  Active: `background: var(--color-ink)`, `color: var(--color-white)`, no border.

## 2.4 Voice

"42 items", not "42 products found". "Nothing matches that." "6 bunches left today."
"Reserve by Friday 18:00." No exclamation marks. No emoji.

---

# PART 3 · Page A — Browse (`/buyer/products`)

## 3.1 Structure

```
┌──────────────────────────────────────────────────────────────┐
│ ┌─ sticky ─────────────────────────────────────────────────┐ │
│ │ 🔍 Search produce                            Filters (2) │ │
│ │ [All] [Vegetables] [Fruit] [Dairy] [Bakery] [Eggs] [More]│ │
│ └──────────────────────────────────────────────────────────┘ │
│  42 items                                          Reset     │
│                                                              │
│  ┌────────┐ ┌────────┐      ← 2 cols <768, 3 at 768, 4 at 1024│
│  │produce │ │produce │                                        │
│  └────────┘ └────────┘                                        │
│  ...                                                          │
│  [skeleton tail while loading more]                           │
└──────────────────────────────────────────────────────────────┘
```

At **1024+**, the filter panel becomes a **persistent left rail** and the page becomes two
columns:

```
┌──────────────────────────────────────────────────────────────┐
│  Browse produce                          Idiqlat h1          │
│  42 items at Riverbend Market                                │
│                                                              │
│  ┌── rail 272px ──┐  ┌── grid ──────────────────────────────┐│
│  │ Availability   │  │ [card] [card] [card] [card]          ││
│  │ ☐ In stock only│  │ [card] [card] [card] [card]          ││
│  │                │  │                                      ││
│  │ Sort           │  │                                      ││
│  │ ○ Featured     │  │                                      ││
│  │ ○ Price low    │  │                                      ││
│  │                │  │                                      ││
│  │ Category       │  │                                      ││
│  │ Market         │  │                                      ││
│  │ Market day     │  │                                      ││
│  │ Price range    │  │                                      ││
│  │                │  │                                      ││
│  │ Reset          │  │                                      ││
│  └────────────────┘  └──────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────┘
```

Grid: `grid-template-columns: repeat(var(--cols), minmax(0, 1fr))` with `--cols` set to 2, then 3
at 768, then 4 at 1024 (inside the rail layout). `gap: var(--space-4)`.
`minmax(0, 1fr)` not `1fr` — plain `1fr` lets a long product name blow the column out.

## 3.2 `FilterPanel` — one component, two containers

The single most valuable thing you build in this stage. **Write the filter UI once.** Under 1024
it renders inside a `BottomSheet`; at 1024+ it renders inside an `<aside>`. Same component, same
props, same state.

```jsx
/**
 * The complete produce filter UI. Container-agnostic: rendered inside a BottomSheet
 * below 1024px and inside a persistent <aside> rail at 1024px and up.
 *
 * All state is owned by the parent page so the URL stays the single source of truth.
 *
 * @param {object}   value     { inStockOnly, sort, category, marketId, day, maxPriceCents }
 * @param {Function} onChange  (patch) => void — merges into value
 * @param {Function} onReset
 * @param {Array}    categories
 * @param {Array}    markets
 * @param {'sheet'|'rail'} layout
 */
export function FilterPanel({ value, onChange, onReset, categories, markets, layout = 'rail' }) {}
```

Groups, in this order. All five SRS axes must be present:

| Group | Control | Maps to query param |
|---|---|---|
| Availability | `Toggle` — "In stock only" | `includeSoldOut` (inverted) |
| Sort | Chips: Featured · Price low to high · Price high to low · Newest · Most popular | `sort` |
| Category | Chips, all categories from `getCategories()` | `category` |
| Market | Chips, all markets from `getMarkets()` | `market` |
| Market day | Chips: Any · Sun … Sat | `day` |
| Price | Two-ended range, or a set of chips (Under 2 · 2–5 · 5–10 · Over 10) | `maxPriceCents` |

Prefer **chips over dropdowns** — a chip shows its state without being opened, and every chip is
already a 44px target. For price, chips are simpler and more robust than a dual-thumb slider;
use chips unless you can make a slider fully keyboard-operable.

- `layout="rail"`: groups stacked, `gap: var(--space-6)`, each group heading `--text-sm`
  `--weight-medium` `--color-ink`, a `1px solid var(--color-border)` hairline between groups.
  Sticky at `top: calc(var(--topbar-h-desk) + var(--space-6))`, `max-height` with
  `overflow-y: auto`.
- `layout="sheet"`: same groups, plus a sticky footer holding a full-width beet
  **"Show 42 items"** button that closes the sheet. The count is live.

## 3.3 State and URL

Keep the existing pattern — it is sound:

- Search debounced 250ms via `useDebouncedValue`
- Every filter mirrored into the URL with `setSearchParams(params, { replace: true })`
- Cursor pagination with `IntersectionObserver` and a skeleton tail
- `inFlightRef` guard against double fetches

Add: `day` and `maxPriceCents` to both the URL sync and the `getProducts` query.
If the backend does not support `day` or a price ceiling on `GET /products`, **filter client-side
over the loaded page and say so explicitly in your report** — do not silently drop an SRS
requirement, and do not go add a backend route (that was Stage 3).

## 3.4 The active-filter summary

Under the sticky header:

```
42 items                                                  Reset
```

- Count: `--text-sm`, `--color-ink-soft`, `tabular-nums`
- When filters are active, also render removable chips for each, each with an `×` and a
  `44px` hit area and `aria-label="Remove <filter> filter"`
- "Reset" is a text link, `--color-ink`, underline on hover, only rendered when something is active

## 3.5 Loading, empty, error

- **First load:** `GridSkeleton` — the exact grid with the exact card boxes, 8 of them.
- **Loading more:** four skeleton cards appended to the real grid. Never replace the grid.
- **Empty:** `<EmptyState scene="walk-to-market" title="Nothing matches that" text="Try fewer
  filters, or a different word." actionLabel="Clear filters" onAction={handleReset} />`
- **Error:** `<ErrorState scene="offline-field" ... />` with a Retry that refetches. Never show a
  raw error code — log it to console instead.

## 3.6 Fix `ProductCard`'s stretched link

`ProductCard` currently renders a full-card `.stretchedLink` **and** contains an
`AddToCartButton`. The design system lists that as a prohibited pattern, because the link overlays
the button's hit area at some sizes.

Fix: bound the link to the image tile plus the title block only. Either

- move the `<Link>` to wrap just the tile and the `<h3>`, or
- keep the overlay but constrain it: `position: absolute; inset: 0 0 var(--footer-h) 0` where
  `--footer-h` is the price/button row height, set locally on the card.

Then prove it: at 360, 390 and 768, click the add button on a card — the basket count must
increment and the route must **not** change. Do it for all three widths.

---

# PART 4 · Page B — Produce (`/buyer/products/:id`)

Until Stage 4 this was a 448px drawer. It has never been designed as a page. This is the screen
where a judge decides whether the app is considered.

## 4.1 Structure — mobile

```
┌──────────────────────────────────────────┐
│  ← Back to browse                        │
│                                          │
│  ┌────────────────────────────────────┐  │
│  │                                    │  │  4/3 tile, white,
│  │        [illustration]              │  │  1px hairline, --radius-lg
│  │                                    │  │  Illustration size="xl"
│  └────────────────────────────────────┘  │
│                                          │
│  Rainbow chard               Idiqlat h1  │
│  £3.20 / bunch            Inter 600      │
│  ● 6 bunches left today                  │
│                                          │
│  ┌────────────────────────────────────┐  │
│  │ ┌──┐ Riverbend Greens              │  │  StallInline
│  │ │RG│ Maria Okonkwo · ★ 4.8 (23)    │  │
│  │ └──┘ S M T W T F S                 │  │  day-dots
│  │      See the whole stall        →   │  │
│  └────────────────────────────────────┘  │
│                                          │
│  About this produce                      │
│  Two short paragraphs, max 62ch.         │
│                                          │
│  Collect it                              │
│  Reserve by Friday 18:00.                │
│  [Sat 8:00–10:00] [Sat 10:00–12:00]      │
│                                          │
│  Also on this stall           See all →  │
│  [card] [card] [card] →                  │
│                                          │
│  Similar at other stalls      See all →  │
│  [card] [card] [card] →                  │
│                                          │
│  Reviews  ★ 4.8 · 23 reviews             │
│  [review] [review] [review]              │
│  Show all reviews →                      │
└──────────────────────────────────────────┘
│ ┌── sticky ──────────────────────────┐   │
│ │ £3.20 / bunch    [− 2 +]  Add      │   │  the ONE beet button
│ └────────────────────────────────────┘   │
```

## 4.2 Structure at 768+

Two columns, `grid-template-columns: minmax(0, 1fr) minmax(0, 1fr)`, `gap: var(--space-8)`:

- **Left, sticky** at `top: calc(var(--topbar-h-desk) + var(--space-6))`: the illustration tile
- **Right:** name, price, stock line, `StallInline`, description, pickup windows, and the add
  control **inline** (not sticky — there is room)

Below both, full width: "Also on this stall", "Similar at other stalls", Reviews.

`Page width="detail"` (960px).

## 4.3 `StockLine` — the honest availability sentence

New component. Do **not** draw a progress bar — a bar implies a scale the Customer cannot read,
and it is decoration. A sentence is honest and shorter.

| `availability` | Output | Colour |
|---|---|---|
| `out` | `Sold out today` | `--color-danger` |
| `low` | `6 bunches left today` (or `Only a few left today` with no count) | `--color-warning-text` |
| `in` + count | `24 bunches available` | `--color-ink-soft` |
| `in`, no count | `Available today` | `--color-ink-soft` |

Preceded by a `StatusDot` in the matching colour. `--text-sm`. Pluralise the unit correctly —
"1 bunch", "6 bunches". Write a small helper; do not append "s" blindly.

When sold out: the add button is disabled, and a secondary text button appears —
**"Tell me when this is back"** — which calls `PUT /favorites/product/:id` (the backend already
drives restock alerts from favourites). Confirm with a toast: "We will let you know."

## 4.4 `StallInline` — the stall strip

New component. The bridge from produce to the person who grew it, and one of the seven market
devices.

```
┌──────────────────────────────────────────┐
│ ┌──┐  Riverbend Greens                   │  Idiqlat --text-h3
│ │RG│  Maria Okonkwo · ★ 4.8 (23)         │  --text-sm ink-soft
│ └──┘  S M T W T F S                      │  seven day-dots
│       Riverbend Market                   │  --text-sm ink-soft
│       See the whole stall             →  │  ink link, underline on hover
└──────────────────────────────────────────┘
```

White, `1px solid var(--color-border)`, `--radius-lg`, `--card-padding`.

**The seven day-dots** — build them here, they are reused on the Stall page in Stage 7:

- Seven items, Sunday first, labels `S M T W T F S`
- Filled when the index is in `farmer.operatingDayNumbers` (from Stage 3):
  `background: var(--color-ink)`, `color: var(--color-white)`
- Empty otherwise: `background: transparent`, `1px solid var(--color-border)`,
  `color: var(--color-ink-faint)`
- Each is `24px` round with `--text-xs` — **decorative**, so the group needs one accessible
  label and the dots themselves are `aria-hidden`:

```jsx
<div className={styles.days} role="img" aria-label={`Trades on ${dayNames.join(', ')}`}>
  {['S','M','T','W','T','F','S'].map((d, i) => (
    <span key={i} className={active.includes(i) ? styles.dayOn : styles.dayOff} aria-hidden="true">{d}</span>
  ))}
</div>
```

That is the correct pattern for any small visual data display: one label on the group, children
hidden. Do not put `aria-label` on seven separate spans.

## 4.5 Pickup windows

From `getFarmerPickupSlots(farmerId)`. Render as chips under a `Collect it` section heading, with
the cutoff sentence above them: `Reserve by Friday 18:00.`

Selecting a window here is a **preference**, not a commitment — it is confirmed at checkout.
Persist the choice in component state and pass it to `AddToCartButton` if the cart context
accepts it; otherwise let checkout ask again and say so in your report.

If there are no windows: `No pickup windows open yet for this stall.` in `--color-ink-soft`, and
the add button stays enabled (they can still reserve; the window is chosen at checkout).

## 4.6 Related rows and reviews

- `Also on this stall` — `getFarmerProducts(farmerId, { limit: 8 })`, `HorizontalRow`,
  See all to `/buyer/products?farmer=<id>`
- `Similar at other stalls` — `getRelatedProducts(id)`, `HorizontalRow`
- `Reviews` — `getProductReviews(id, { limit: 3 })`, `Stars` + count in the section heading,
  three `ReviewItem`s, then a "Show all reviews" link. Empty:
  `<EmptyState scene="first-review" title="No reviews yet" text="Be the first after you collect." />`

Hide a row entirely when it has no items. **Never render an empty `HorizontalRow`** — a section
heading with nothing under it is worse than no section.

## 4.7 The sticky add bar

Under 768 only. Fixed above the bottom stack:

```css
bottom: calc(var(--bottom-nav-height) + env(safe-area-inset-bottom, 0px));
```

White, `border-top: 1px solid var(--color-border)`, `--z-sticky`. Holds price, a
`QuantityStepper`, and the beet **Add to basket** button. Extend the page's
`padding-bottom` to match, or the reviews section hides behind it.

**The basket pill must not render on this page** — two fixed bars stacked is the exact collision
`layoutCheck()` catches. Suppress it via the existing `isCartVisible` logic in `BuyerLayout`,
adding `/buyer/products/` to its exclusions, and say you did.

## 4.8 Not found

A bad id must render `<EmptyState scene="lost-path" title="That produce is not on a stall"
text="It may have sold out, or the listing was removed." actionLabel="Back to browse"
actionTo="/buyer/products" />` — **not** a blank page and not a crash.

---

# PART 5 · Your skills for this stage

### Skill 1 · One filter component, two containers

The container is a prop, not a fork. Duplicating the filter UI for sheet and rail guarantees they
drift within two commits. If a group needs to look different in the rail, that is a CSS variant
on one component — never a second component.

### Skill 2 · `minmax(0, 1fr)`, always

```css
grid-template-columns: repeat(4, minmax(0, 1fr));
```

Plain `1fr` means `minmax(auto, 1fr)`, and `auto` floors at the content's min-content width — so
one long unbroken product name pushes the whole grid past the viewport. This is the single most
common cause of a horizontal-overflow finding.

### Skill 3 · Bound a stretched link, never overlay a button

```css
.cardLink { position: absolute; inset: 0 0 var(--card-footer-h) 0; z-index: 1; }
.addButton { position: relative; z-index: 2; }
```

Then **click the button at three widths** and confirm the route does not change. A stretched link
that steals a button is invisible in code review and obvious to a user.

### Skill 4 · A sentence beats a bar

`6 bunches left today` tells the Customer what to do. A 60%-full bar tells them nothing without a
scale, costs an element, and adds a colour. Prefer the sentence every time.

### Skill 5 · One label on the group, children `aria-hidden`

Seven day-dots read aloud as "S M T W T F S" — useless. One
`role="img" aria-label="Trades on Tuesday, Saturday"` on the wrapper is the whole fix. Apply the
same pattern to star ratings and any small visual data display.

### Skill 6 · Sticky needs matching padding, every time

Any bar fixed to an edge must have a matching `padding-bottom` on the scroll container, or the
last element becomes unreachable. Compute it from the same tokens, never a guessed number.

### Skill 7 · Hide empty sections; do not render empty shells

```jsx
{related.length > 0 && <Section title="Similar at other stalls">...</Section>}
```

### Skill 8 · Pluralise properly

```js
const plural = (n, unit) => `${n} ${n === 1 ? unit : unit + (unit.endsWith('h') ? 'es' : 's')}`;
```

Handle "bunch → bunches", "box → boxes", "punnet → punnets". A judge will notice
"1 bunchs".

---

# PART 6 · Hard rules — never do these

1. **Never let chips wrap.** One row, horizontal scroll, max seven.
2. **Never build the filter UI twice.** One component, `layout` prop.
3. **Never use bare `1fr` in a grid.** `minmax(0, 1fr)`.
4. **Never leave a stretched link over the add button.** Bound it and click-test it.
5. **Never draw a stock progress bar.** A sentence.
6. **Never render an empty `HorizontalRow` or `Section`.**
7. **Never show the basket pill and the sticky add bar at once.**
8. **Never make an active chip beet.** Ink-filled.
9. **Never exceed one beet element per rendered screen** (the add button, or the sheet's Apply).
10. **Never silently drop the `day` or `price` filter.** Implement it, client-side if necessary,
    and report which.
11. **Never show a raw error code** to a Customer. Console-log it; show a sentence.
12. **Never crash on a bad product id.** Scene-based not-found.
13. **Never add a dependency. Never touch vendor, admin, guest or the backend.**
14. **Never fix the `isOpen` bug outside these two pages.**

---

# PART 7 · Definition of done

- [ ] Browse: sticky search + Filters button + one non-wrapping chip row + count + grid
- [ ] Grid 2 / 3 / 4 columns at <768 / 768 / 1024, all `minmax(0, 1fr)`
- [ ] `FilterPanel` is one component; sheet under 1024, rail at 1024+
- [ ] All five SRS filter axes present: category, market, **day**, **price**, availability + sort
- [ ] Every filter mirrored in the URL; a pasted filtered URL reproduces the view exactly
- [ ] Removable active-filter chips with 44px targets
- [ ] `GridSkeleton` matches the real grid box for box
- [ ] Empty uses `walk-to-market`; error uses `offline-field` with a working Retry
- [ ] `ProductCard` link bounded; add button click-tested at 360, 390, 768
- [ ] Produce page: one column mobile, two columns 768+ with a sticky illustration
- [ ] All four SRS detail fields present: **price, unit, quantity available, Farmer**
- [ ] `StockLine` covers out / low / in-with-count / in-without-count, correctly pluralised
- [ ] Sold out shows "Tell me when this is back", wired to favourites, confirmed by toast
- [ ] `StallInline` with seven day-dots, one group `aria-label`, children `aria-hidden`
- [ ] Pickup windows with the cutoff sentence; graceful when there are none
- [ ] Related rows and reviews hidden when empty; reviews empty uses `first-review`
- [ ] Sticky add bar under 768 with matching page padding; basket pill suppressed
- [ ] Bad product id renders the `lost-path` scene
- [ ] `layoutCheck()` zero findings on both pages at 360, 390, 768, 1024, 1440

---

# PART 8 · Verification gate

### A1 build · A2 runtime

```bash
npm run build
npm run dev
```

Zero errors, zero new warnings. Zero console errors on both pages. Check Network for duplicate
requests on mount — StrictMode double-invokes effects, so two identical GETs is a bug in your
dependency array, not a framework quirk.

### A3 token purity · A4 forbidden CSS · A7 accent budget

```bash
grep -rnE "#[0-9a-fA-F]{3,8}" src/pages/buyer/Products.module.css src/pages/buyer/ProductDetail.module.css src/components/domain/FilterPanel.module.css src/components/domain/StockLine.module.css src/components/domain/StallInline.module.css
grep -rnE ":[^;]*[0-9]+px" src/pages/buyer/Products.module.css src/pages/buyer/ProductDetail.module.css | grep -v "1px" | grep -v "0px"
grep -rnE "linear-gradient|radial-gradient|backdrop-filter|!important|:global" src/pages/buyer/Products.module.css src/pages/buyer/ProductDetail.module.css src/components/domain/FilterPanel.module.css
grep -rn "color-primary\|color-beet" src/pages/buyer/Products.module.css src/pages/buyer/ProductDetail.module.css src/components/domain/FilterPanel.module.css
```

All clean; name every beet hit and confirm the one-per-screen rule.

### URL round-trip

Apply search + category + market + day + price + sort + in-stock. Copy the URL. Open it in a
**fresh tab**. The view must be identical — every chip active, same result count. Paste both URLs
and both counts.

### Filter parity

Open the filter **sheet** at 390 and the filter **rail** at 1440. Confirm the same groups, same
options, same current state. Screenshot both.

### Add-button click test

At **360, 390 and 768**, click the add button on a product card in the grid. Record: basket count
before, after, and the URL before and after. **The URL must not change.** Three rows.

### Stock line states

Prove all four — `out`, `low` with a count, `low` without a count, `in`. Use seeded data where it
exists; otherwise pass props directly, screenshot, revert, and say you did.

### Day-dots

Screenshot a stall trading on two days and one trading on five. Read the group's `aria-label`
from the accessibility tree and paste it.

### Sticky bar collision

At 390 on a produce page **with 3 items in the basket**: confirm the basket pill is **not**
rendered, the add bar sits above the bottom nav with no overlap, and the last review is
scrollable fully clear of both.

### B1 responsive sweep

At **360, 390, 768, 1024, 1440** on `/buyer/products` and `/buyer/products/:id`:

```js
const { layoutCheck } = await import('/src/dev/layoutCheck.js');
console.table(layoutCheck());
```

**Zero findings, ten tables.** Overflow findings mean a bare `1fr`; squeezed-media findings mean a
missing `flex-shrink: 0`; overlap findings mean the sticky-bar padding.

### B4 keyboard

Tab both pages end to end. The filter sheet traps focus, `Esc` closes it and returns focus to the
Filters button. Every chip is reachable and togglable with Space/Enter. The quantity stepper works
by keyboard.

### Minimal seed

```bash
cd backend && npm run seed:minimal
```

Browse with no products shows `walk-to-market`. A produce page for a nonexistent id shows
`lost-path`. Then `npm run seed`.

### Tests

```bash
node tests/run_all.mjs
```

All suites pass.

---

# PART 9 · Report

```
Stage 6 status: PASS | FAIL

## What I changed
- <file> — <one line>

## Gate results
A1 build / A2 runtime:  <output, incl. duplicate-request check>
A3 / A4 / A7:           <output, beet elements named>
URL round-trip:         <both URLs, both counts>
Filter parity:          <two screenshots>
Add-button click test:  <3 rows: width, count before/after, URL before/after>
Stock line states:      <4 states, how proven>
Day-dots:               <2 screenshots + aria-label text>
Sticky collision:       <result>
B1 layoutCheck:         <10 tables>
B4 keyboard:            <result>
Minimal seed:           <result>
Tests:                  <summary>

## Filters: server or client
| axis | server-supported | implemented where |
|------|------------------|-------------------|
| category / market / sort / availability | yes | server |
| day   | ? | ? |
| price | ? | ? |

## Pickup-window preference
<did the cart context accept a chosen window, or is it deferred to checkout?>

## Found but not fixed
- <file:line>

## NOT verified
- <what and why>
```

Fix and re-run any failing gate before reporting. A non-zero `layoutCheck()`, or a missing `day`
or `price` filter, is a FAIL.
