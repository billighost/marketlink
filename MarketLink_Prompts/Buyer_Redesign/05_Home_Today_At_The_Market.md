# Stage 5 · The Today page — "Today at the market"

You are working on **MarketLink**, an existing React + Vite app, mid-redesign of the signed-in
Customer experience. Stages 1–4 are done:

- **Stage 1** — white-first tokens, buyer app shell, and four primitives:
  `Page`, `PageTitle`, `Section`, `MarketClock` (all in `src/components/layout/`)
- **Stage 2** — `Scene` component + ten full-scene SVG illustrations, wired into `EmptyState`
- **Stage 3** — backend now returns a `clock` object on markets and `/feed/meta`, plus
  `operatingDayNumbers`, `openToday`, `lowStockCount`, `soldOutCount` on farmers
- **Stage 4** — every buyer destination is a real page; no sheet routes remain

This stage rebuilds **one page**: `/buyer` — the Customer landing page. It is the first thing a
judge sees after signing in, so it carries more weight than any other single screen.

---

# PART 1 · Context

## 1.1 What MarketLink is

A platform connecting local farmers-market **Farmers** with **Customers**. A Farmer runs a
**stall** at a **market** open on specific days in specific windows. A Customer browses what is
actually available, **reserves** items, picks a pickup slot, then **collects in person at the
stall and pays in cash**. **No payment gateway. No delivery. Ever.**

The SRS problem statement, verbatim in spirit: *customers rarely know in advance which Farmers
will be at a market on a given day, what stock they have, or at what price.* **This page is the
answer to that sentence.** Judge every decision against it.

## 1.2 Stack and rules

React 18.3, Vite 6, react-router-dom 6.28. **CSS Modules only** — no Tailwind, no UI kit,
**no new dependencies**. Alias `@` maps to `src`. Port 3000, `/api` proxied to 4000.

Fonts: **Idiqlat** serif for headings — **one weight only, 400**. **Inter** for everything else.

Breakpoints: **480 / 768 / 1024 / 1280**. Nothing else.

Every colour, size, radius and duration comes from a `var(--token)`. Zero raw hex, zero raw px
in a `.module.css` (only `1px` hairlines).

## 1.3 The files

```
src/pages/buyer/Home.jsx  + Home.module.css     THE PAGE — full rewrite
src/components/layout/MarketClock.jsx            exists, presentational (Stage 1)
src/components/layout/HorizontalRow.jsx          exists — scroll row with header + arrows
src/components/domain/ProductCard.jsx            exists
src/components/domain/FarmerCard.jsx             exists — you extend it
src/components/ui/Skeleton.jsx                   exists — you add a Home skeleton
src/hooks/useFeed.js                             exists — cursor feed loader
src/api/catalog.js                               getFeed, getFeedMeta
src/api/me.js                                    getHomeSummary
src/utils/greeting.js                            getGreeting(name)
```

New files you create:

```
src/components/domain/StallStrip.jsx   + .module.css    "who is at the market today"
src/components/domain/PickupBanner.jsx + .module.css    the active-order strip
src/components/layout/HomeSkeleton.jsx + .module.css    layout-matched loading state
```

## 1.4 Off-limits

Vendor, admin and guest pages and layouts. `backend/**`. `package.json`. Any other buyer page —
this stage is `/buyer` and the three new components only.

---

# PART 2 · Design rules that bind this page

## 2.1 White first

White is the page. `--color-canvas` never appears as a background here. Card and divider
hairlines resolve to `--color-hairline` (`rgba(46,43,38,0.10)`) via the buyer shell override
from Stage 1 — you do not set border colours manually, you use `var(--color-border)`.

## 2.2 The accent budget — two beet elements, and this page already spends one

The bottom nav's active "Today" item is beet. The basket pill, when visible, is beet. So on
mobile with items in the basket, **the page body gets zero beet**.

Concretely, on this page: **nothing is beet.** Not the "See all" links, not the search field
focus, not the pickup banner, not a section heading. Use `--color-ink` and hairlines. The one
exception is the focus ring, which is always `--color-focus` and does not count.

## 2.3 The density budget at 390 x 844

In the **first viewport**, exactly this and nothing more:

```
1. Top bar                       (56px)
2. Greeting h1                   Idiqlat --text-h1
3. MarketClock                   one line + progress rule
4. Search field                  44px
5. First row header + the first card and a half peeking
```

If a sixth thing wants to be there, it goes below the fold. The current page also renders a
pickup banner above the feed — that is a **conditional** sixth element, so when it shows, the
search field moves below it and the first row falls out of the first viewport. That is correct:
an active pickup is the most important thing on the screen when it exists.

## 2.4 Voice

Plain and specific. No exclamation marks, no emoji. "Produce" not "products". "Stall" not
"vendor". "Basket" not "cart".

---

# PART 3 · The page, top to bottom

```
┌─────────────────────────────────────────────────────────┐
│  Good morning, George                    Idiqlat h1     │
│  Riverbend Market · open now · closes 13:00             │
│  ▁▁▁▁▁▁▁▁▁▁▁▁▁▁▔▔▔▔▔▔  2px herb progress rule           │
│                                                         │
│  🔍  Search produce, stalls, markets                    │
│                                                         │
│  ── if an order is active ───────────────────────────    │
│  Ready for pickup · MK-2049                             │
│  Packed and waiting at Riverbend Greens.  View order →  │
│  ──────────────────────────────────────────────────      │
│                                                         │
│  At the market today                        See all →   │
│  [stall] [stall] [stall] [stall] →                      │
│                                                         │
│  Fresh this morning                         See all →   │
│  [produce] [produce] [produce] →                        │
│                                                         │
│  ... more feed sections, endless ...                    │
│                                                         │
│  Not sure what to cook? Ask MarketLink.                 │
└─────────────────────────────────────────────────────────┘
```

## Block 1 · Greeting and clock

- `<h1>` from `getGreeting(name)` — "Good morning, George". Idiqlat, `--text-h1`,
  `--weight-head`, `--tracking-head`.
- Name from `feedMeta?.greetingName || user?.firstName || user?.name?.split(' ')[0] || 'there'`.
- Directly beneath: `<MarketClock>` fed from `feedMeta.clock` (Stage 3):

```jsx
<MarketClock
  marketName={feedMeta?.homeMarket?.name || 'Your market'}
  openNow={feedMeta?.clock?.openNow}
  windowLabel={feedMeta?.clock?.windowLabel}
  nextOpenLabel={feedMeta?.clock?.nextOpenLabel}
  closesAtLabel={feedMeta?.clock?.closesAtLabel}
  progress={feedMeta?.clock?.todayProgress ?? 0}
/>
```

- While `feedMeta` is loading, render a **skeleton line of the same height** — never collapse the
  space and then push the page down when data lands.
- If `clock` is missing or all-null (a market with no schedule), `MarketClock` must render the
  market name alone and nothing else. Test this with `npm run seed:minimal`.

**Do not use `PageTitle` here.** This page's head is a greeting plus a live clock, not a title
plus a context line. Use a bespoke `<header>`. It is the one page that earns an exception, and
your report should say so.

## Block 2 · Search field

Full width, `--control-h` tall, `1px solid var(--color-border)`, `--radius-md`, white
background, a `Search` icon at 18px inside on the left in `--color-ink-soft`.

Placeholder: `Search produce, stalls, markets`.

Submitting navigates to `/buyer/products?search=<encoded>`, or to `/buyer/products` when empty.
Focus state: `outline: var(--focus-ring); outline-offset: var(--focus-offset)`. **No beet fill.**

`type="search"`, `aria-label="Search produce, stalls and markets"`, inside a
`<form role="search">`.

## Block 3 · Pickup banner — conditional

Extract the current inline banner in `Home.jsx` into
`src/components/domain/PickupBanner.jsx`.

Data: `homeSummary?.readyForPickup || homeSummary?.nextPickup` from `getHomeSummary()`.

```
┌──────────────────────────────────────────────────────┐
│ ● Ready for pickup    MK-2049                        │
│   Packed and waiting at Riverbend Greens.            │
│                                     View order  →    │
└──────────────────────────────────────────────────────┘
```

- White background, `1px solid var(--color-border)`, `--radius-lg`. **No tint, no shadow.**
- Status word: `--color-success` (herb) when `status === 'ready'`, otherwise
  `--color-ink-soft`. Herb is a state signal and does not spend the beet budget.
- A `StatusDot` before it.
- Order number in `--text-sm`, `tabular-nums`, `--color-ink-soft`.
- One sentence of body text, `--text-body`, `--color-ink`.
- "View order" is a text link with an arrow, `--color-ink`, underline on hover, `44px` min
  height, navigating to `/buyer/orders/${id}`.
- Renders nothing when there is no active order. Do not render an empty shell.

## Block 4 · "At the market today" — the stall strip

**This is the device that makes the page feel like a market.** New component
`src/components/domain/StallStrip.jsx`.

Data: `getMarketFarmers(selectedMarketId, {}, signal)` from `src/api/catalog.js`, which now
returns `openToday`, `lowStockCount` and `soldOutCount` per farmer (Stage 3).

Render inside a `<HorizontalRow title="At the market today" seeAllLabel="See all"
onSeeAll={() => navigate('/buyer/stalls')}>`, one `FarmerCard` per stall.

Extend `FarmerCard` with a `variant="stall"` that shows:

```
┌────────────────────────┐
│  ┌──┐                  │   40px round avatar: initials on --color-beet-tint
│  │RG│                  │
│  └──┘                  │
│  Riverbend Greens      │   Idiqlat --text-h3, 2 lines reserved
│  Maria Okonkwo         │   --text-sm ink-soft
│  ● Open today          │   herb dot + herb text, or ink-faint "Not here today"
│  3 items low           │   --text-sm carrot-text, only when lowStockCount > 0
└────────────────────────┘
```

- Card: white, `1px solid var(--color-border)`, `--radius-lg`, `--card-padding`.
- Width `var(--card-w-farmer)`, `flex-shrink: 0`.
- **Reserve two lines for the stall name** with a fixed `min-height` so cards in a row stay even
  — `layoutCheck()` flags uneven cards inside `[data-check-even]`, and `HorizontalRow` already
  sets that attribute on its track.
- The whole card links to `/buyer/stalls/${farmer.id}`. There is no secondary button inside it,
  so a full-card stretched link is safe here — unlike `ProductCard`, which has an add button.
- Order the stalls: **open today first**, then by `lowStockCount` descending (scarcity is
  interesting), then alphabetically. Do this in the component, not the server.
- Empty: if the market has no stalls, render `<EmptyState scene="market-closed" title="No stalls
  listed for this market" text="Try another market, or check back before market day." />`.

## Block 5 · The curated feed

Keep the existing `useFeed()` hook and its `IntersectionObserver` endless loading — it works.
Changes:

1. Each section is a `<HorizontalRow>` as now. Titles come from the server; do not override them.
2. **Insert the stall strip as the first row**, before the server sections.
3. The assistant callout after the third section stays, restyled: one line of `--text-body`
   `--color-ink-soft`, with "Ask MarketLink" as an underlined `--color-ink` link to
   `/buyer/assistant`. **Not a button. Not beet.**
4. Section gap is `var(--section-gap)`; `Page` already provides it via `gap`.

## Block 6 · Loading and empty

### `HomeSkeleton`

New file. **It must match the real layout exactly** — same heights, same card widths, same
number of rows. A generic grey box that reflows into a different shape reads as broken.

```
skeleton h1 line      height: --text-h1 line box, width 60%
skeleton clock line   height: --text-sm line box, width 40%
skeleton search       height: --control-h, full width, --radius-md
skeleton row header   height: --text-h2 line box, width 35%
skeleton cards x3     width: --card-w-product, aspect 4/3 + 2 text lines
```

Use the existing `Skeleton` / `SkeletonCard` primitives. Shimmer must sit behind
`prefers-reduced-motion`.

### Empty feed

When `!loading && sections.length === 0`:

```jsx
<EmptyState
  scene="market-closed"
  title="Nothing on the stalls yet"
  text="Farmers are still setting up for the next market day."
  actionLabel="Browse markets"
  actionTo="/buyer/markets"
/>
```

That action button is the **one** beet element permitted on an empty Today page.

## Block 7 · Desktop layout at 1024+

The page stays a **single column**, max `--container-buyer`, centred. Do not add a sidebar and do
not add a right rail. `HorizontalRow` already reveals its chevron buttons at 1024+.

At 1280+, `Page` widens its gutter to `var(--space-8)`. Nothing else changes.

The greeting grows via the fluid `--text-h1` clamp. Do not add a desktop-specific type size.

---

# PART 4 · Your skills for this stage

### Skill 1 · Reserve space before data arrives

Every element whose content comes from a fetch needs its height reserved, or the page jumps when
data lands. A `min-height` on the clock line, a fixed `aspect-ratio` on card tiles, a
`min-height` on two-line titles. Cumulative layout shift is the difference between "fast" and
"cheap" and a judge will feel it without being able to name it.

### Skill 2 · Match the skeleton to the layout, not to the concept

```css
/* wrong — a grey box that becomes a different shape */
.skeleton { height: 200px; }

/* right — the exact box the real content will occupy */
.skeletonCard { width: var(--card-w-product); aspect-ratio: 4 / 3; }
```

### Skill 3 · `flex-shrink: 0` on every horizontal-scroll child

Inside an `overflow-x: auto` flex row, children default to shrinking, so ten cards squeeze into
the viewport instead of scrolling. `flex-shrink: 0` plus an explicit width is what makes a scroll
row scroll. `layoutCheck()` reports squeezed media when you forget.

### Skill 4 · Reserve title lines with `min-height`, not `-webkit-line-clamp` alone

Clamping stops overflow but does not stop a one-line card sitting shorter than a two-line
neighbour. Use both:

```css
.name {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  min-height: calc(var(--text-h3) * var(--lh-h3) * 2);
}
```

### Skill 5 · Sort in the component when the order is a view decision

"Open today first, then scarcest" is a presentation choice about this one strip, not a property
of the data. Putting it in the component keeps the endpoint reusable and the decision visible
where someone will look for it.

### Skill 6 · A conditional block returns `null`, never an empty shell

```jsx
if (!pickup) return null;
```

Not a div with nothing in it. An empty bordered box is worse than no box, and it breaks the
density budget invisibly.

### Skill 7 · Herb and carrot are state, beet is action

`open now` in herb, `3 items low` in carrot-text — neither spends the beet budget, because they
report a fact rather than offering an action. Beet means "press me". Keeping that distinction
sharp is what makes a two-accent rule survive contact with a real page.

### Skill 8 · Test with the minimal seed before claiming done

```bash
cd backend && npm run seed:minimal
```

A market with no schedule, no stalls and no products. Every block on this page must degrade to
something calm. Then `npm run seed` to restore.

---

# PART 5 · Hard rules — never do these

1. **Never put a beet element in the page body.** The nav and basket pill already spend the budget.
2. **Never use `--color-canvas` as a background** on this page.
3. **Never exceed five elements in the first 390x844 viewport** (six when a pickup is active).
4. **Never render a second `<h1>`.** Section titles are `<h2>` via `HorizontalRow`.
5. **Never put a weight above 400 on an Idiqlat element.**
6. **Never add a gradient, a card shadow, `backdrop-filter`, `!important` or `:global`.**
7. **Never write a raw hex or raw px** in the CSS module. `1px` hairlines only.
8. **Never use a breakpoint other than 480, 768, 1024, 1280.**
9. **Never add a sidebar or right rail** to this page. Single column at every width.
10. **Never break the existing `useFeed` cursor loading.** Extend it; do not rewrite it.
11. **Never fetch inside a component that already has the data via props.** `StallStrip` fetches
    its own stalls; `PickupBanner` receives its order as a prop.
12. **Never edit another buyer page.** This stage is `/buyer` plus three new components.
13. **Never add a dependency.**
14. **Never claim done without running the minimal seed.**

---

# PART 6 · Definition of done

- [ ] `Home.jsx` rewritten; greeting + `MarketClock` + search + optional pickup banner + feed
- [ ] `MarketClock` shows the real open/closed state, with the progress rule when open
- [ ] Clock degrades to the market name alone when the schedule is missing
- [ ] `StallStrip` exists, sorted open-first then scarcest, links to `/buyer/stalls/:id`
- [ ] `FarmerCard` has a `variant="stall"`; existing variants unchanged
- [ ] `PickupBanner` extracted, returns `null` with no active order
- [ ] `HomeSkeleton` matches the real layout box for box
- [ ] Empty feed shows the `market-closed` scene with one action
- [ ] Zero beet elements in the page body
- [ ] Five elements or fewer in the first viewport at 390x844
- [ ] Single column at 1024 and 1440
- [ ] `layoutCheck()` returns **zero findings** at 360, 390, 768, 1024, 1440
- [ ] Minimal seed produces a calm page, no crash, no infinite spinner

---

# PART 7 · Verification gate

### A1 · Build · A2 · Runtime

```bash
npm run build      # last 15 lines, zero errors, zero new warnings
npm run dev        # /buyer — zero console errors, zero failed requests
```

Check the Network tab: `/api/feed/meta`, `/api/home/summary`, `/api/feed`,
`/api/markets/:id/farmers`. **No duplicate requests on mount** — React StrictMode
double-invokes effects in dev, so two identical GETs means a missing guard or an unstable
dependency. Fix it, do not explain it.

### A3 · Token purity · A4 · Forbidden CSS

```bash
grep -rnE "#[0-9a-fA-F]{3,8}" src/pages/buyer/Home.module.css src/components/domain/StallStrip.module.css src/components/domain/PickupBanner.module.css src/components/layout/HomeSkeleton.module.css
grep -rnE ":[^;]*[0-9]+px" src/pages/buyer/Home.module.css | grep -v "1px" | grep -v "0px"
grep -rnE "linear-gradient|radial-gradient|backdrop-filter|!important" src/pages/buyer src/components/domain/StallStrip.module.css
grep -rn ":global" src/pages/buyer/Home.module.css
```

All four empty (bar justified hairlines).

### A7 · Accent budget

```bash
grep -rn "color-primary\|color-beet" src/pages/buyer/Home.module.css src/components/domain/StallStrip.module.css src/components/domain/PickupBanner.module.css
```

Only `--color-beet-tint` (a near-white avatar background) may appear. Name every hit.

### B1 · Responsive sweep

At **360, 390, 768, 1024, 1440** on `/buyer`:

```js
const { layoutCheck } = await import('/src/dev/layoutCheck.js');
console.table(layoutCheck());
```

**Zero findings at all five.** Paste each. Uneven-card findings mean your `min-height` reserve is
missing; squeezed-media findings mean a missing `flex-shrink: 0`.

### B2 · Density

Screenshot `/buyer` at exactly 390 x 844 in both states — with and without an active pickup.
List every element visible above the fold and confirm the count.

### B3 · Bottom stack

At 390 with 3 items in the basket, scroll to the end of the feed. Bottom nav at 0, basket pill
fully above, a toast fully above that, and the last feed card scrollable fully clear.

### B4 · Keyboard

Tab from the top of `/buyer` to the bottom. Every stop reachable with a visible ring. The search
field submits on Enter. Horizontal rows are reachable and scrollable by keyboard (they have
`tabIndex={0}` and `role="region"` already).

### Clock states — prove all three

1. **Open now** — progress rule visible, `aria-valuenow` correct
2. **Closed, opens later this week** — `nextOpenLabel` shown, no progress rule
3. **No schedule** — market name only, nothing else

If the seeded market is not currently open, prove state 1 by temporarily passing hard-coded props
to `MarketClock`, screenshotting, then reverting. Say that you did so.

### Minimal seed

```bash
cd backend && npm run seed:minimal
```

Load `/buyer`. Report what each block rendered. Nothing may crash or spin forever.
Then `npm run seed`.

### Tests

```bash
node tests/run_all.mjs
```

Full summary. All suites pass.

---

# PART 8 · Report

```
Stage 5 status: PASS | FAIL

## What I changed
- <file> — <one line>

## Gate results
A1 build:            <output>
A2 runtime + network:<output, incl. duplicate-request check>
A3 token purity:     <output>
A4 forbidden CSS:    <output>
A7 accent budget:    <hits + names>
B1 layoutCheck:      <5 tables>
B2 density:          <element list per state>
B3 bottom stack:     <result>
B4 keyboard:         <result>
Clock states:        <all three, how proven>
Minimal seed:        <block-by-block>
Tests:               <summary>

## The PageTitle exception
<why /buyer uses a bespoke header instead of PageTitle>

## Found but not fixed
- <file:line>

## NOT verified
- <what and why>
```

Fix and re-run any failing gate before reporting. A non-zero `layoutCheck()` is a FAIL.
