# Stage 7 · Stalls, Markets and the map

You are working on **MarketLink**, mid-redesign of the signed-in Customer experience.
Stages 1–6 are done:

- **1** — white-first tokens, buyer shell, primitives `Page` / `PageTitle` / `Section` / `MarketClock`
- **2** — `Scene` + ten full-scene SVGs in `EmptyState` / `ErrorState`
- **3** — backend `clock`, `operatingDayNumbers`, `openToday`, `lowStockCount`, `soldOutCount`
- **4** — every buyer destination is a real page; `/buyer/farmers*` redirects to `/buyer/stalls*`
- **5** — the Today page with the market clock and the stall strip
- **6** — Browse with a dual-container `FilterPanel`; the Produce page; `StockLine`;
  `StallInline` **with the seven day-dots you now reuse**

This stage rebuilds **four pages** — the "where" and "who" half of the market metaphor:

1. `/buyer/stalls` — Stalls index
2. `/buyer/stalls/:id` — **Stall page**, the single strongest expression of the market metaphor
3. `/buyer/markets` — Markets index
4. `/buyer/markets/:id` — Market page

---

# PART 1 · Context

## 1.1 What MarketLink is

Local farmers-market **Farmers** and **Customers**. A Farmer runs a **stall** at a **market** open
on specific days in specific windows. A Customer browses what is available, **reserves** items,
picks a pickup slot, then **collects in person at the stall and pays in cash**.

**No payment gateway. No delivery. Ever.** Nothing on these pages may imply either — and
specifically, the map shows **directions to a pickup point**, never a delivery route.

SRS requirements this stage must satisfy, verbatim in substance:

> Customers can browse nearby farmers markets **by location and day** and view the **list of
> Farmers present at each market**.
>
> Customers can view a Farmer profile including **stall name, location, operating days, and
> current weekly stock**.
>
> Customers can view markets and Farmer stalls on an **embedded map powered by Google Maps API or
> OpenStreetMap, with location markers and directions** to the selected pickup point.

All three are mandatory. The map is not optional.

## 1.2 Stack and rules

React 18.3, Vite 6, react-router-dom 6.28. CSS Modules only. **No new dependencies.**
Breakpoints **480 / 768 / 1024 / 1280** only. Idiqlat headings at **weight 400 only**.
Every value from a `var(--token)`; no raw hex, no raw px beyond `1px` hairlines.

## 1.3 The files

```
src/pages/buyer/Farmers.jsx      + .module.css   STALLS INDEX — rewrite (125 + 121 lines)
src/pages/buyer/FarmerDetail.jsx + .module.css   STALL PAGE  — rewrite (249 + 251 lines)
src/pages/buyer/Markets.jsx      + .module.css   MARKETS     — rewrite (196 + 409 lines)
src/pages/buyer/MarketDetail.jsx + .module.css   MARKET      — rewrite (261 + 141 lines)

src/components/domain/MapView.jsx                exists — Leaflet + OpenStreetMap, no API key
src/components/domain/FarmerCard.jsx             exists — has variant="stall" from Stage 5
src/components/domain/MarketCard.jsx             exists
src/components/domain/StallInline.jsx            exists — Stage 6, holds the day-dots
src/components/layout/MarketClock.jsx            exists — Stage 1
src/components/ui/Stars.jsx  Chip.jsx  SegmentedControl.jsx   exist
src/components/domain/ReviewItem.jsx             exists

src/api/catalog.js   getFarmers getFarmerDetail getFarmerProducts getFarmerReviews
                     getFarmerPickupSlots getMarkets getMarketDetail
                     getMarketFarmers getMarketProducts
src/api/me.js        saved-markets helpers
```

New files you create:

```
src/components/domain/DayDots.jsx      + .module.css   extracted from StallInline, now shared
src/components/domain/PickupWindows.jsx + .module.css  window chips + cutoff sentence
src/components/domain/LocationBlock.jsx + .module.css  map + address + directions
```

## 1.4 `MapView` — the API you already have

```jsx
<MapView
  markers={[{ id, lat, lng, title, subtitle }]}   // invalid coords are filtered out internally
  selectedId={id}
  onSelect={(id) => {}}
  height="260px"
  zoom={15}
  interactive={true}
  showDirectionsLink={true}
  ariaLabel="Map of Riverbend Market"
/>
```

It already: uses free OpenStreetMap tiles with **no API key**, disables `scrollWheelZoom` (so the
page still scrolls over it), honours `prefers-reduced-motion`, labels the zoom controls, exposes a
keyboard-pannable viewport, and handles a tile-load failure with a `tileError` state.

**Do not rewrite it. Do not add a mapping dependency.** If a marker does not appear, the
coordinates are missing from the data — say so rather than patching the component.

## 1.5 Off-limits

Vendor, admin, guest pages and layouts. `backend/**`. `package.json`. Every other buyer page.

---

# PART 2 · Design rules that bind these pages

## 2.1 The accent budget

On each of these four pages the bottom nav is **not** highlighted (none of them is a nav tab
except via Stalls/Markets on desktop), so the body may hold **up to two** beet elements. Spend
them deliberately:

| Page | The beet elements |
|---|---|
| Stalls index | none |
| Stall page | one: the primary action ("See all produce" or "Save this stall") |
| Markets index | none |
| Market page | one: "Save this market" or "Get directions" — pick one, not both |

Everything else is ink and hairline. Map markers are the one exception: a marker pin may use
`--color-beet` because it must be findable on a photographic tile layer, and it is not a control
competing for a press.

## 2.2 Density budget at 390 x 844

**Stall page, first viewport:**

```
1. Top bar
2. ← Back to stalls
3. Stall name (h1) + farmer name
4. Seven day-dots
5. "Open today · 8:00–13:00" or "Not here today · next Saturday"
```

The produce grid starts below the fold. That is correct — the first question is *when can I get
there*, and this answers it without a scroll.

**Market page, first viewport:** back link, market name (h1), `MarketClock`, then the map.

## 2.3 The map is never the first thing

A map above the fold on mobile eats the viewport and answers a question nobody asked yet. On both
detail pages the map sits **after** the identity and schedule blocks. On the Markets **index** the
map is an opt-in view, not the default.

---

# PART 3 · Page A — Stalls index (`/buyer/stalls`)

```
┌──────────────────────────────────────────────────────┐
│  Stalls                              Idiqlat h1      │
│  18 stalls at Riverbend Market                       │
│                                                      │
│  [All] [Open today] [Vegetables] [Fruit] [Bakery] →  │  one chip row
│                                                      │
│  ┌────────────┐ ┌────────────┐                        │
│  │ stall card │ │ stall card │   2 / 3 / 4 columns     │
│  └────────────┘ └────────────┘                        │
└──────────────────────────────────────────────────────┘
```

- `Page width="wide"`, `PageTitle title="Stalls"` with a context line from the count and market.
- One non-wrapping chip row, max seven: `All`, `Open today`, then top categories. Active chip is
  **ink-filled**, never beet.
- Grid of `FarmerCard variant="stall"` — the variant built in Stage 5. Reuse it; do not fork it.
  `grid-template-columns: repeat(var(--cols), minmax(0, 1fr))`, `--cols` 2 / 3 / 4 at
  <768 / 768 / 1024.
- Sort: **open today first**, then `lowStockCount` descending, then alphabetically — the same
  order as the Today strip, so the two never contradict each other. Extract that comparator into
  one shared function and import it in both places.
- Cursor pagination if `getFarmers` supports it; otherwise load all and say so.
- Empty: `<EmptyState scene="market-closed" title="No stalls listed" text="Try another market, or
  check back before market day." actionLabel="Browse markets" actionTo="/buyer/markets" />`

---

# PART 4 · Page B — The Stall page (`/buyer/stalls/:id`)

**This is the page that decides whether the app feels like a market.** Everywhere else could be a
shop. This is a person, at a place, on certain days.

## 4.1 Structure — mobile

```
┌──────────────────────────────────────────────────────┐
│  ← Back to stalls                                    │
│                                                      │
│  ┌──┐                                                │
│  │RG│  56px round avatar, initials on --color-beet-tint
│  └──┘                                                │
│  Riverbend Greens                   Idiqlat h1       │
│  Maria Okonkwo                      --text-body      │
│  ★ 4.8 · 23 reviews                 --text-sm        │
│                                                      │
│  S M T W T F S                      DayDots, 28px    │
│  ● Open today · 8:00–13:00          herb             │
│  Riverbend Market · Bristol         --text-sm        │
│                                                      │
│  Collect from this stall                             │
│  Reserve by Friday 18:00.                            │
│  [Sat 8:00–10:00] [Sat 10:00–12:00] [Sat 12:00–13:00]│
│                                                      │
│  About the stall                                     │
│  Two short paragraphs, max 62ch.                     │
│                                                      │
│  On the table today                     18 items     │
│  [All] [Vegetables] [Fruit] →                        │
│  ┌────────┐ ┌────────┐                               │
│  │produce │ │produce │   2-col grid                  │
│  └────────┘ └────────┘                               │
│                                                      │
│  Where to find it                                    │
│  ┌────────────────────────────────────────────────┐  │
│  │              [ MapView 240px ]                 │  │
│  └────────────────────────────────────────────────┘  │
│  Stall 14, east row, Riverbend Market                │
│  Get directions  →                                   │
│                                                      │
│  Reviews  ★ 4.8 · 23 reviews                         │
│  [review] [review] [review]                          │
│  Show all reviews →                                  │
└──────────────────────────────────────────────────────┘
```

## 4.2 Structure at 1024+

`Page width="detail"` (960px). Two columns, `grid-template-columns: minmax(0, 2fr) minmax(0, 1fr)`,
`gap: var(--space-8)`:

- **Left:** identity block, "On the table today" grid (3 columns inside the left column), reviews
- **Right, sticky** at `top: calc(var(--topbar-h-desk) + var(--space-6))`: day-dots, open state,
  pickup windows, `LocationBlock` with the map, save button

## 4.3 `DayDots` — extract it, do not re-implement it

Stage 6 built the seven day-dots inside `StallInline`. Pull them into
`src/components/domain/DayDots.jsx` and import it in **both** places.

```jsx
/**
 * Seven day markers, Sunday first, filled for days this stall trades.
 * The group carries one accessible label; the individual dots are decorative.
 *
 * @param {number[]} days   from farmer.operatingDayNumbers — ints 0=Sunday..6=Saturday
 * @param {'sm'|'md'} size  sm = 24px (inline), md = 28px (stall page)
 * @param {number}   today  0..6, the current weekday in the market timezone; gets a ring
 */
export function DayDots({ days = [], size = 'sm', today }) {
  const LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const NAMES = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const active = Array.isArray(days) ? days : [];
  const label = active.length
    ? `Trades on ${active.map((d) => NAMES[d]).join(', ')}`
    : 'Trading days not listed';

  return (
    <div className={`${styles.days} ${styles[size]}`} role="img" aria-label={label}>
      {LETTERS.map((letter, i) => (
        <span
          key={i}
          className={[
            active.includes(i) ? styles.on : styles.off,
            i === today ? styles.today : '',
          ].filter(Boolean).join(' ')}
          aria-hidden="true"
        >
          {letter}
        </span>
      ))}
    </div>
  );
}
```

- `.on` — `background: var(--color-ink)`, `color: var(--color-white)`
- `.off` — transparent, `1px solid var(--color-border)`, `color: var(--color-ink-faint)`
- `.today` — adds `outline: 1px solid var(--color-ink-soft); outline-offset: 2px`
- Both sizes are round, `--text-xs`, `--weight-medium`, centred

The `today` ring is a small thing that makes the row feel live rather than static. Derive `today`
from the market's `clock` data, not from the browser's clock.

## 4.4 The open-state line

Directly under the dots, one line:

| State | Text | Colour |
|---|---|---|
| `openToday` and market open | `● Open today · 8:00–13:00` | `--color-success` |
| `openToday`, market not open yet | `● Here today · opens 8:00` | `--color-ink-soft` |
| not `openToday` | `● Not here today · next Saturday` | `--color-ink-faint` |
| no data | `Trading days not listed` | `--color-ink-faint` |

Use the market `clock` (Stage 3) for times, and `operatingDayNumbers` for "next". Never compute
a market's local time in the browser.

## 4.5 `PickupWindows` — new shared component

```jsx
/**
 * Pickup window chips plus the cutoff sentence. Used on the Stall page and at checkout.
 *
 * @param {Array}    windows    [{ id, label, startsAt, endsAt, available, remaining }]
 * @param {string}   cutoffLabel  e.g. "Reserve by Friday 18:00"
 * @param {string}   selectedId
 * @param {Function} onSelect   omit for a read-only display
 */
```

- Cutoff sentence above the chips: `--text-sm`, `--color-ink-soft`.
- Chips wrap here — this is **not** a filter chip row, it is a set of choices, and a hidden
  scroll would conceal options. Wrapping is correct; use `flex-wrap: wrap; gap: var(--space-2)`.
- Unavailable windows: `--color-ink-faint`, `1px dashed var(--color-border)`, `disabled`,
  with `aria-disabled="true"` and the reason in the label ("Sat 8:00–10:00 · full").
- Selected: ink-filled.
- No windows: `No pickup windows open yet for this stall.` and nothing else.
- Read-only mode (no `onSelect`): render as static `<span>`s, not disabled buttons — a disabled
  button is a broken promise; static text is a fact.

## 4.6 "On the table today" — the current weekly stock

The SRS says a stall profile shows **current weekly stock**. This section is that requirement.

- Heading via `<Section title="On the table today" subtitle="18 items">`
- One non-wrapping chip row of this stall's own categories, `All` first
- Grid of `ProductCard variant="grid"`, 2 / 3 columns (3 inside the desktop left column)
- `getFarmerProducts(id, { category, limit: 24 })`, cursor-loaded if supported
- **Sold-out items stay visible**, dimmed, with the `Sold out` badge — a Customer needs to know
  the stall normally carries it. Sort available first, sold out last.
- Empty: `<EmptyState scene="stall-empty" title="Nothing on the table yet" text="This stall has
  not listed stock for the coming market day." />`

## 4.7 `LocationBlock` — new shared component

Used on the Stall page and the Market page.

```jsx
/**
 * Embedded map, address, and a directions link to the pickup point.
 *
 * @param {Array}  markers    passed straight to MapView
 * @param {string} addressLine
 * @param {string} pitchLine  e.g. "Stall 14, east row" — the stall's spot within the market
 * @param {string} directionsUrl
 */
```

- `<MapView markers={markers} height="240px" zoom={16} showDirectionsLink={false} />`
  inside a wrapper with `1px solid var(--color-border)`, `--radius-lg`, `overflow: hidden`.
- Address and pitch lines below, `--text-sm`, `--color-ink`.
- "Get directions" is an `<a>` with `target="_blank" rel="noopener noreferrer"`, an external-link
  icon, and `aria-label="Get directions to <name>, opens in a new tab"`.
- **Build the directions URL from OpenStreetMap**, matching what `MapView` already uses, so the
  project keeps a single map provider and no API key:
  `https://www.openstreetmap.org/directions?to=<lat>%2C<lng>`
- No coordinates: render the address text and **omit the map entirely**. Do not render an empty
  grey box — `layoutCheck()` flags it and it looks broken.
- Wrap the whole block so the map has an explicit aspect or height at every width; never let
  Leaflet size to zero, which produces a blank tile area.

## 4.8 Save this stall

A secondary or primary button wired to `PUT|DELETE /favorites/farmer/:id` via the existing
`FavoritesContext`. Label toggles "Save this stall" / "Saved". Confirm with a toast. This is one
of the Stall page's two permitted beet elements — if you make it beet, the "See all produce"
action must not be.

## 4.9 Reviews

`getFarmerReviews(id, { limit: 3 })`. `Stars` + count in the section heading, three `ReviewItem`s,
a "Show all reviews" link. Include a Farmer's reply when present — the backend supports replies
and showing them is the visible proof of a two-way relationship, which is the SRS's stated goal.

Empty: `<EmptyState scene="first-review" title="No reviews yet" text="Reviews appear after
customers collect their orders." />`

## 4.10 Not found

Bad id renders `<EmptyState scene="lost-path" title="That stall is not at the market"
text="It may have closed, or the link may be old." actionLabel="Back to stalls"
actionTo="/buyer/stalls" />`.

---

# PART 5 · Page C — Markets index (`/buyer/markets`)

```
┌──────────────────────────────────────────────────────┐
│  Markets                             Idiqlat h1      │
│  6 markets near you                                  │
│                                                      │
│  [ List | Map ]                     SegmentedControl │
│  [Any day] [Sun] [Mon] ... [Sat] →  one chip row     │
│                                                      │
│  LIST VIEW                                           │
│  ┌──────────────────────────────────────────────────┐│
│  │ Riverbend Market                                 ││
│  │ ● open now · closes 13:00                        ││
│  │ Bristol · 2.4 km · 18 stalls                     ││
│  │ S M T W T F S                                    ││
│  └──────────────────────────────────────────────────┘│
│  ...                                                  │
│                                                      │
│  MAP VIEW                                            │
│  ┌──────────────────────────────────────────────────┐│
│  │            [ MapView, all markers ]              ││
│  └──────────────────────────────────────────────────┘│
│  Selected market card below the map                  │
└──────────────────────────────────────────────────────┘
```

- `SegmentedControl` toggles List / Map. **List is the default.** Persist the choice in the URL
  (`?view=map`) so it survives a refresh and can be linked.
- Day chips satisfy the SRS's "browse markets by **location and day**". Filter via the existing
  `day` parameter on `getMarkets`.
- `MarketCard` rewritten as a **full-width row card**, not a tile: white,
  `1px solid var(--color-border)`, `--radius-lg`, `--card-padding`. It shows market name (Idiqlat
  `--text-h3`), a one-line open state from `clock`, a meta line (city · distance · stall count),
  and `DayDots`. One card per row under 768; two columns at 768+.
- Map view: one `MapView` at `height="420px"` with every market as a marker, `onSelect` setting
  `selectedId`, and the selected market's card rendered directly below the map. Tapping a marker
  scrolls the card into view.
- Empty: `<EmptyState scene="lost-path" title="No markets found" text="Try a different day." />`

---

# PART 6 · Page D — Market page (`/buyer/markets/:id`)

```
┌──────────────────────────────────────────────────────┐
│  ← Back to markets                                   │
│                                                      │
│  Riverbend Market                    Idiqlat h1      │
│  Riverbend Quay, Bristol BS1 4RN     --text-sm       │
│                                                      │
│  ● open now · closes 13:00            MarketClock     │
│  ▁▁▁▁▁▁▁▁▔▔▔▔▔▔                       progress rule   │
│                                                      │
│  Opening days                                        │
│  S M T W T F S                                       │
│  Saturday 8:00–13:00 · Wednesday 9:00–14:00          │
│                                                      │
│  Where to find it                                    │
│  ┌────────────────────────────────────────────────┐  │
│  │            [ MapView 280px ]                   │  │
│  └────────────────────────────────────────────────┘  │
│  Get directions →           Save this market         │
│                                                      │
│  Stalls at this market                  18 stalls    │
│  ┌────────────┐ ┌────────────┐                        │
│  │ stall card │ │ stall card │                        │
│  └────────────┘ └────────────┘                        │
│                                                      │
│  Fresh at this market                   See all →    │
│  [produce] [produce] [produce] →                     │
└──────────────────────────────────────────────────────┘
```

- `Page width="detail"`. `MarketClock` fed from `market.clock` (Stage 3) — including the progress
  rule when open. This is the second place the clock appears and it must agree exactly with the
  Today page.
- **Opening days** section: `DayDots` from the market's schedule, plus the full schedule as a
  readable line. This is the SRS's "operating days and timings".
- `LocationBlock` with the market's coordinates.
- **Save this market** → `PUT|DELETE /users/me/saved-markets/:marketId`. This satisfies the SRS's
  "save preferred market locations and receive route-friendly pickup details".
- **Stalls at this market** → `getMarketFarmers(id)`, grid of `FarmerCard variant="stall"`,
  same comparator as everywhere else.
- **Fresh at this market** → `getMarketProducts(id, { limit: 12 })` in a `HorizontalRow`,
  See all to `/buyer/products?market=<id>`.
- Market closed today: show the clock's closed state and, if the market has **no stalls listed at
  all**, `<EmptyState scene="market-closed" ... />` in the stalls section.
- Bad id: `lost-path` scene.

---

# PART 7 · Your skills for this stage

### Skill 1 · Extract on the second use, always

`DayDots` was inline in `StallInline`. It now has four call sites. The moment a pattern appears
twice you extract it — not at three, not "later". Two copies of a day-row that disagree about
which day is Sunday is a bug nobody finds until a demo.

### Skill 2 · One comparator, imported everywhere

"Open today first, then scarcest, then alphabetical" appears on the Today strip, the Stalls index
and the Market page. Write it once:

```js
// src/utils/sortStalls.js
export function byOpenThenScarcity(a, b) { /* ... */ }
```

Three pages showing the same stalls in three different orders reads as a bug even when each order
is individually defensible.

### Skill 3 · Never compute market-local time in the browser

The server sends `clock` with `openNow`, labels and progress already computed in the market's
timezone. A `new Date().getDay()` in a component will be wrong for anyone in a different zone, and
it will be wrong locally across a DST change. Use the server's answer.

### Skill 4 · Leaflet needs an explicit height, always

A map inside a zero-height container renders a blank tile area with no error. Set `height` on
`MapView` and give the wrapper a defined box at every breakpoint. When coordinates are missing,
render **no map** rather than an empty one.

### Skill 5 · Choices wrap; filters scroll

A filter chip row scrolls horizontally because there are always more filters than fit and hiding
the overflow is acceptable. A set of **pickup windows** must wrap, because a hidden window is a
choice the Customer never knows exists. Same component shape, opposite overflow rule — decide by
asking whether hiding an option loses information.

### Skill 6 · Static text beats a disabled button

A read-only pickup window list renders `<span>`s. Disabled buttons invite a press and then refuse
it, and screen readers announce them as unavailable controls rather than as information.

### Skill 7 · Open external links honestly

```jsx
<a href={url} target="_blank" rel="noopener noreferrer"
   aria-label="Get directions to Riverbend Market, opens in a new tab">
```

`rel="noopener noreferrer"` is a security requirement, not a style preference, and the SRS lists
"safe to use" as a non-functional requirement.

### Skill 8 · Keep one map provider

`MapView` uses OpenStreetMap tiles with no API key. Build directions URLs against OpenStreetMap
too. Mixing in a Google Maps link means two providers, two attributions and a key to manage, for
no gain — and the SRS explicitly permits either, so pick one and stay there.

---

# PART 8 · Hard rules — never do these

1. **Never rewrite `MapView`** or add a mapping dependency.
2. **Never render a map with no coordinates.** Omit it.
3. **Never render a map without an explicit height.**
4. **Never compute a market's local day or time in the browser.** Use the server `clock`.
5. **Never re-implement `DayDots`.** Extract once, import four times.
6. **Never let three pages sort the same stalls differently.** One comparator.
7. **Never put the map above the fold** on a detail page, or make Map the default on the index.
8. **Never let filter chips wrap. Never make pickup-window chips scroll.**
9. **Never make an active chip beet.** Ink-filled.
10. **Never exceed two beet elements** on a rendered screen; on the Stall and Market pages, one.
11. **Never hide sold-out produce on a stall page.** Dim it and sort it last.
12. **Never use bare `1fr` in a grid.** `minmax(0, 1fr)`.
13. **Never crash on a bad id.** Scene-based not-found.
14. **Never add a dependency. Never touch vendor, admin, guest or the backend.**
15. **Never open an external link without `rel="noopener noreferrer"`.**

---

# PART 9 · Definition of done

- [ ] `DayDots` extracted, used by `StallInline`, Stall page, `MarketCard`, Market page
- [ ] `byOpenThenScarcity` extracted and used by Today strip, Stalls index, Market page
- [ ] `PickupWindows` and `LocationBlock` exist as shared components
- [ ] Stalls index: chip row, 2/3/4 grid, correct sort, `market-closed` empty state
- [ ] Stall page: identity, day-dots with today's ring, open-state line, pickup windows, about,
      "On the table today" with categories, location + map + directions, reviews with replies
- [ ] Stall page two-column with a sticky right rail at 1024+
- [ ] SRS stall fields all present: **stall name, location, operating days, current weekly stock**
- [ ] Markets index: List/Map toggle persisted in the URL, day chips, row cards, marker selection
- [ ] Market page: clock with progress rule, opening days, map, save, stalls grid, produce row
- [ ] Save stall and save market both work and confirm with a toast
- [ ] Directions links are OpenStreetMap, open in a new tab, `rel="noopener noreferrer"`
- [ ] Bad ids on both detail pages show the `lost-path` scene
- [ ] `layoutCheck()` **zero findings** on all four pages at 360, 390, 768, 1024, 1440

---

# PART 10 · Verification gate

### A1 build · A2 runtime

```bash
npm run build
npm run dev
```

Zero errors, zero new warnings, zero console errors on all four pages. Leaflet is noisy when
mis-sized — report any Leaflet warning verbatim. Check Network for duplicate mount requests.

### A3 / A4 / A7

```bash
grep -rnE "#[0-9a-fA-F]{3,8}" src/pages/buyer/Farmers.module.css src/pages/buyer/FarmerDetail.module.css src/pages/buyer/Markets.module.css src/pages/buyer/MarketDetail.module.css src/components/domain/DayDots.module.css src/components/domain/PickupWindows.module.css src/components/domain/LocationBlock.module.css
grep -rnE ":[^;]*[0-9]+px" src/pages/buyer/FarmerDetail.module.css src/pages/buyer/MarketDetail.module.css | grep -v "1px" | grep -v "0px"
grep -rnE "linear-gradient|radial-gradient|backdrop-filter|!important|:global" src/pages/buyer src/components/domain/DayDots.module.css src/components/domain/LocationBlock.module.css
grep -rn "color-primary\|color-beet" src/pages/buyer/Farmers.module.css src/pages/buyer/FarmerDetail.module.css src/pages/buyer/Markets.module.css src/pages/buyer/MarketDetail.module.css
```

Name every beet hit and confirm the per-page count.

### Shared-component proof

```bash
grep -rn "DayDots" src/
grep -rn "byOpenThenScarcity\|sortStalls" src/
```

`DayDots` must appear in at least four call sites and be defined once. The comparator must appear
in three call sites and be defined once.

### Map proof

For the Stall page, the Market page and the Markets map view, report:

- Marker count rendered vs markers passed
- Tiles loaded (screenshot)
- Zoom controls reachable by keyboard with correct labels
- Page scrolls normally over the map (`scrollWheelZoom` off)
- Directions link URL, verbatim, and that it opens a new tab
- What happens with a market that has **no coordinates** — map must be absent, not empty

### Clock agreement

Screenshot the same market's clock line on `/buyer` (Today), on `/buyer/markets` (the card), and
on `/buyer/markets/:id`. **All three must read identically.** Paste all three.

### DayDots accessibility

Read the group's `aria-label` from the accessibility tree on the Stall page and on a `MarketCard`.
Paste both strings. Confirm the individual dots are `aria-hidden` and not announced.

### Sort agreement

List the first five stalls shown on the Today strip, the Stalls index, and the Market page for the
same market. **The order must match.** Paste all three lists.

### B1 responsive sweep

At **360, 390, 768, 1024, 1440** on all four pages:

```js
const { layoutCheck } = await import('/src/dev/layoutCheck.js');
console.table(layoutCheck());
```

**Zero findings, twenty tables.** Maps are a common source of distorted-media findings — the fix
is an explicit height on the wrapper, never a CSS transform.

### B4 keyboard

Tab all four pages end to end. On the Markets map view, markers must be reachable and selectable
by keyboard, or the list view must be reachable as an equivalent — state which. `Esc` behaviour
where applicable. Visible focus ring at every stop.

### Minimal seed

```bash
cd backend && npm run seed:minimal
```

All four pages must render a calm empty state. Specifically: a market with no stalls, a stall with
no products, and a market with no coordinates. Report each. Then `npm run seed`.

### Tests

```bash
node tests/run_all.mjs
```

All suites pass. Add assertions for the `/buyer/farmers/:id` → `/buyer/stalls/:id` redirect if
Stage 4 did not.

---

# PART 11 · Report

```
Stage 7 status: PASS | FAIL

## What I changed
- <file> — <one line>

## Gate results
A1 build / A2 runtime:  <output, incl. Leaflet warnings verbatim>
A3 / A4 / A7:           <output, beet named per page>
Shared components:      <DayDots call sites, comparator call sites>
Map proof:              <per page: markers, tiles, keyboard, scroll, directions URL, no-coords>
Clock agreement:        <3 screenshots, identical?>
DayDots a11y:           <2 aria-label strings>
Sort agreement:         <3 lists of 5>
B1 layoutCheck:         <20 tables>
B4 keyboard:            <result, incl. map marker keyboard access>
Minimal seed:           <3 degraded cases>
Tests:                  <summary>

## SRS coverage
| requirement | where implemented | verified how |
|---|---|---|
| browse markets by location and day | ... | ... |
| list of Farmers present at each market | ... | ... |
| stall name, location, operating days, weekly stock | ... | ... |
| map with markers and directions to pickup point | ... | ... |

## Found but not fixed
- <file:line>

## NOT verified
- <what and why>
```

Fix and re-run any failing gate before reporting. A non-zero `layoutCheck()`, a duplicated
`DayDots`, or three pages sorting stalls differently is a FAIL.
