# B · Design Direction — the visual bible

> Embedded into every stage prompt. Reproduced here so a human can read the reasoning once.

---

## 1. The one-sentence brief

> **A quiet, white, paper-clean market that knows what day it is.**

Not an e-commerce app with a farm skin. A *market*: a **place** you go, on a **day** it is
open, to a **stall** run by a **person**, to collect **produce** you reserved.

Every screen should answer at least one of those four questions:
**Where? When? Who? What?**

---

## 2. White first — the colour discipline

The single most common way this design fails is death by beige. Guard against it with three
rules, in priority order.

### Rule 1 · White is the page

`background: var(--color-white)` on every buyer page, every card, every panel, every sheet.
`--color-canvas` (`#F5EFE3`) is **demoted**. It survives in exactly three places:

1. Fills inside SVG illustrations and scenes
2. The image-tile placeholder behind a produce illustration
3. The guest footer (not buyer chrome)

It is **never** a page background, never a card background, never a section band.

### Rule 2 · Hairlines are neutral, not tan

This is the highest-leverage change in the entire redesign.

`--color-border` currently resolves to `--color-wood-line: #E3D3B8` — a **tan**. Every card
outline, divider and input border in the app is drawn in beige. At the density of a real UI
that tints the whole screen warm-grey and kills the white.

Replace the *default* hairline with neutral ink at low alpha, and keep the warm line as an
opt-in for genuinely wooden moments (crate slats in scenes, a section rule under a
market-day heading):

```css
/* tokens.css — ADD these, do not delete anything */
--color-hairline:      rgba(46, 43, 38, 0.10);  /* default: cards, dividers, outlines */
--color-hairline-soft: rgba(46, 43, 38, 0.06);  /* internal list dividers */
--color-border-warm:   var(--color-wood-line);  /* opt-in only: market-wood moments */
```

**Scope it to the buyer subtree, do not change it globally.** CSS custom properties cascade,
so redefining `--color-border` on the buyer shell root re-skins every descendant without
touching vendor, admin or guest:

```css
/* BuyerShell.module.css */
.shell {
  --color-border: var(--color-hairline);
  --color-bg-muted: var(--color-white);   /* kills canvas page bands inside buyer */
}
```

That is the whole trick. One declaration, zero risk to the other three roles.

### Rule 3 · The accent budget: two per screen

On any given buyer screen, **at most two elements may be beet** (`#7A2E3B`). In practice:

- the one primary button, and
- the active nav item

That is it. Not section headings, not prices, not icons, not badges, not links in body copy
(those get `--color-ink` with a `text-decoration: underline` and `text-underline-offset:
var(--underline-offset)`).

| Colour | Allowed use | Never |
|---|---|---|
| Beet `#7A2E3B` | Primary button, active nav, focus ring | Headings, prices, decorative fills |
| Carrot `#E07A2C` | Low-stock and sold-out signals **only** | Anything decorative |
| Herb `#5C7048` | "Open now", "Ready for pickup", success **only** | Anything decorative |
| Wood `#B08655` | Scene structures, one optional section rule | Text, borders, icons in chrome |
| Ink `#2E2B26` | All primary text | — |
| Ink-soft `#6B6259` | Secondary text, captions, icon strokes | Essential information alone |

**Everything that is not text or one of two accents is white, or a neutral hairline.**

### Banned outright

No gradients (linear, radial, conic). No shadows on cards — cards are `1px` hairline + white.
Shadows exist only on genuinely floating layers: `--shadow-menu`, `--shadow-modal`. No
glassmorphism, no blur backdrops, no coloured section bands, no dark mode.

---

## 3. Typography

Idiqlat is a serif with **one weight (400)**. That constraint is the elegance — lean into it.

| Role | Font | Token |
|---|---|---|
| Page title (one `<h1>`) | Idiqlat 400 | `--text-h1` |
| Section title | Idiqlat 400 | `--text-h2` |
| Card / sub-section title | Idiqlat 400 | `--text-h3` |
| Everything else | Inter | `--text-body` / `--text-sm` |
| Prices | Inter **600** | `--text-body` or `--text-h3` |
| Labels, nav, buttons | Inter **500** | `--text-sm` |

Rules:

- **Never** apply a weight above 400 to Idiqlat. It will synthesise a fake bold and look cheap.
- Paragraphs are capped at `--measure` (62ch); narrow reading columns at `--measure-narrow` (46ch).
- **Sentence case everywhere.** "Ready for pickup", not "Ready For Pickup". Buttons too.
- Numbers that are compared (prices, quantities, codes) get `font-variant-numeric: tabular-nums`.

---

## 4. Voice

Plain, warm, specific, never salesy. Say the true thing in the fewest words.

| Instead of | Write |
|---|---|
| "Oops! Nothing here!" | "No produce matches that." |
| "Congratulations! Order placed successfully!!" | "Reserved. Collect Saturday, 9:00–10:00." |
| "Add to Cart" | "Add to basket" |
| "Checkout" | "Review pickup" |
| "Buy now" | "Reserve" |
| "Vendor" / "Seller" | "Stall" / the farmer name |
| "Products" (in UI labels) | "Produce" |
| "Shopping cart" | "Basket" |
| "0 results found" | "Nothing on this stall today." |

Never use an exclamation mark. Never use an emoji in the product UI. Never say "just", "simply"
or "easily". Prices always carry their unit: `£3.20 / bunch`.

---

## 5. Pages, not sheets

**The core structural change.** Today twelve buyer destinations are `BottomSheet` overlays
routed through `SheetRoute`. On desktop they collapse into a 448px right drawer. A produce page
in a 448px slot on a 1440px screen is why the app does not feel like a market.

### An overlay is only correct when ALL of these are true

1. It is **transient** — you open it, make one decision, it closes.
2. Losing it costs nothing — no data entered, nothing to come back to.
3. It should **not** be linkable, refreshable or in browser history.
4. The page behind it stays meaningful and you return to exactly where you were.

### The only surviving overlays

| Surface | Form |
|---|---|
| Filter + sort panel (Browse) | sheet under 1024, **inline left rail** at 1024+ |
| Command palette (`Cmd/Ctrl+K`, `/`) | centred dialog |
| Sign-out confirmation | small sheet |
| Toasts | bottom stack |
| Market switcher | dropdown menu |

**Everything else is a page** with a URL, a title, back/forward, refresh, and a shareable link.

---

## 6. The market metaphor — seven concrete devices

Abstract "make it feel like a market" produces nothing. These seven cost little and land hard.

### 1 · The market clock

One quiet line under the greeting, live:

```
Riverbend Market · Saturday 8:00–13:00 · opens in 2 days
Riverbend Market · open now · closes 13:00        ← on market day
```

When open, a **2px hairline progress rule** sits under it showing how far through today's
window we are (herb fill on hairline track). This single element gives the whole app a pulse.

### 2 · Who is at the market today

A horizontal strip of stall cards on the Today page: stall name in Idiqlat, farmer name, an
open/closed `StatusDot`, and an honest stock line ("3 items low"). Sourced from
`GET /markets/:id/farmers`.

### 3 · The stall page is a stall

Header: stall name (Idiqlat `--text-h1`), farmer name, market + location.
Then three things no e-commerce page has:

- **Seven day-dots** — `S M T W T F S`, filled for days this stall trades. Instantly answers
  "when can I get this?"
- **Pickup windows as chips** — "8:00–10:00 · 10:00–12:00"
- **Cutoff honesty** — "Reserve by Friday 18:00"

Then "On the table today" (their produce), then reviews.

### 4 · The produce page is a market tag

Illustration in a 4/3 white tile with a hairline. Name in Idiqlat. Price prominent with its
unit. Stock as a human sentence: "6 bunches left today" — not a progress bar. Then the stall
strip with "See the whole stall", the pickup-window picker inline, "Also on this stall",
"Similar at other stalls", reviews.

### 5 · The basket is grouped by stall

Because in real life you collect from each stall separately. Each group is its own panel:
stall name, its pickup window selector, its own cutoff time, its own subtotal. A single
"Reserve" leads to `/buyer/checkout`.

### 6 · The order page is a timeline plus a code

Not a status badge — a vertical rail with timestamps:

```
●  Placed        Thu 19:42
●  Accepted      Fri 08:10
○  Ready         —
○  Collected     —
```

Above it, the thing you actually hold your phone up for at the stall:

```
┌─────────────────────┐
│   Collection code   │
│      K 7 M 2 4 B    │   ← tabular, large, generous letter-spacing
└─────────────────────┘
```

Below: pickup window, stall, map pin, directions link, and "Cancel" while before cutoff.

### 7 · Empty states are full scenes

See section 8. This is the single most visible upgrade in the redesign.

---

## 7. Page anatomy — the pattern every page follows

```
┌──────────────────────────────────────────────┐
│ TopBar            (sticky, white, hairline)  │
├──────────────────────────────────────────────┤
│                                              │
│  ← Back to stalls        (only on detail)    │  optional, --text-sm, ink-soft
│                                              │
│  Page title              Idiqlat --text-h1   │
│  One muted context line  --text-sm ink-soft  │
│                                              │
│  ─────────────────────── (nothing, whitespace)│
│                                              │
│  Primary content                             │
│                                              │
│  Section title           Idiqlat --text-h2   │
│  Section content                             │
│                                              │
└──────────────────────────────────────────────┘
│ CartBar / BottomNav      (under 1024 only)   │
└──────────────────────────────────────────────┘
```

**Density budget — first viewport at 390x844, every page:**
header + title + one context line + **one** primary element. Nothing else above the fold.
If a third thing wants to be there, it goes below.

**Containers:** add a buyer-scoped token rather than changing the global one.

```css
--container-buyer:        1200px;  /* index and feed pages */
--container-buyer-detail: 960px;   /* produce, stall, order, market */
--container-buyer-read:   720px;   /* help, forms, settings */
```

**Breakpoints — only these four:** 480, 768, 1024, 1280.

| Width | Shell | Grid ceiling |
|---|---|---|
| < 768 | Bottom nav (5), slim top bar | 1 col; 2 for produce grid |
| 768–1023 | Bottom nav, centred column | 2 col; 3 for produce grid |
| 1024+ | Top nav, **no bottom nav** | 3 col; 4 for produce grid |
| 1280+ | Same, `--page-pad: var(--space-8)` | same |

---

## 8. Scene illustrations — the spec

A **new** component, separate from the existing `Illustration` (which stays as the 80x80 icon
set used inside cards). Scenes are full landscape artworks for empty and edge states.

### Geometry

```jsx
<svg viewBox="0 0 640 400" role="img" aria-labelledby={titleId}>
```

16:10. Rendered `width: 100%; height: auto; max-width: var(--scene-max-w)`
(`30rem` mobile, `34rem` at 768+).

### Nine depth layers, back to front

Each is its own `<g>` with a `data-layer` attribute. **Order is the art.**

```
1  sky            page white; birds as two-stroke ticks
2  far-hills      --color-canvas-soft fill, 1.5 stroke @ 0.35 opacity
3  forest-band    --color-herb-bg fill, canopy blobs, 1.5 stroke @ 0.45
4  mid-trees      --color-herb-bg fill, --color-herb stroke @ 0.7, trunks visible
5  ground-plane   white with a single horizon hairline
6  road           two converging edge curves + two wheel-rut curves
7  structures     stalls, fences, poles, carts — --color-wood strokes
8  figures        people, a dog — ink-soft 2px, no faces
9  foreground     grass tufts, crates, a dropped apple — full opacity, 2px
```

### Depth by opacity, never by gradient

This is the technique that makes flat SVG read as deep while obeying the no-gradients rule:

```css
[data-layer="far-hills"]   { opacity: 0.35; }
[data-layer="forest-band"] { opacity: 0.45; }
[data-layer="mid-trees"]   { opacity: 0.70; }
/* ground and nearer: 1 */
```

Stroke width scales with distance too: `1.5` far, `1.75` mid, `2` near.

### Palette per scene

White sky. `--color-canvas-soft` far hills. `--color-herb-bg` foliage fill, `--color-herb`
foliage stroke. `--color-wood` structures. `--color-ink-soft` figures and outlines.

**One saturated accent per scene, maximum** — the awning stripe, or the walker bag, in
`--color-beet` or `--color-carrot`. One. That single spot of colour in an otherwise ink-and-
white drawing is what makes it look designed rather than decorated.

### Richness target

**120–220 elements per scene.** Under 80 and it reads as clip art. Specifically:

- Tree canopies from **3–6 overlapping rounded blobs**, never one circle
- Trunks that **taper** (a `<path>`, not a `<rect>`)
- Fence posts with **perspective spacing** — gaps shrink toward the horizon
- Cart wheels with **spokes**
- Bunting as alternating triangles on a slack catenary curve
- Crates with **slats and end-posts**
- Grass as **3-stroke tufts**, scattered at irregular intervals
- Birds as two short strokes meeting at an angle
- Wheel ruts as two near-parallel curves converging to the vanishing point

### Motion

At most **one** very slow ambient animation (a 12s bird drift, a 9s bunting sway) using
`<animateTransform>` or CSS. Wrapped unconditionally:

```css
@media (prefers-reduced-motion: reduce) {
  .scene * { animation: none !important; }
}
```

### The ten scenes

| `name` | Used on | Content |
|---|---|---|
| `walk-to-market` | Browse: no results | Figure with a tote walking a rutted road toward a striped stall; forest band; fence; dog; birds |
| `empty-basket` | Basket empty | Empty wicker basket on a trestle table, folded cloth, market receding behind |
| `no-orders-yet` | Orders empty | Two figures at a stall, a paper bag changing hands, crates stacked |
| `nothing-saved` | Saved empty | A chalkboard with a heart drawn in chalk, leaning on a crate, pears beside it |
| `market-closed` | Market shut today | Shuttered stall, stacked crates, a closed sign, an empty road, long shadows as hairlines |
| `stall-empty` | Stall has no stock | Bare trestle with cloth, farmer stacking empty crates behind |
| `no-notifications` | Notifications empty | A quiet noticeboard, one blank pinned note, birds on a wire |
| `lost-path` | Buyer 404 | A signpost at a fork, forest either side, a walker reading a map |
| `offline-field` | Network error | A field, a telephone pole with one loose wire, the market small and distant |
| `first-review` | Reviews empty | A handwritten note and a pencil on a crate, five chalk stars above |

Decorative scenes get `aria-hidden="true"`. A scene that carries meaning gets
`role="img"` + `<title>`.

---

## 9. Motion

`--duration-fast: 120ms` and `--duration-base: 200ms`, always `--ease-standard`.

Allowed: opacity and 2–8px transform on enter; `background-color` and `border-color` on hover;
the existing 450ms add-to-basket fly; skeleton shimmer. **Nothing else moves.**

No page transitions, no parallax, no scroll-triggered reveals, no bouncing, no
`transform: scale()` above 1.02.

Every animation sits behind `@media (prefers-reduced-motion: reduce) { animation: none; transition: none; }`.

---

## 10. Loading and error states

**Skeletons must match the final layout exactly** — same grid, same card dimensions, same
number of lines. A generic grey box that reflows into a different shape reads as broken.
Build one skeleton per page shape, not one skeleton for the app.

**Errors get a scene too.** `offline-field` for network, `lost-path` for 404, with one
sentence naming what failed and one button to retry. Never show a raw error code to a
Customer; log it to console instead.

---

## 11. The judging criteria this is aimed at

The SRS says judges will ask you to justify design decisions. Each of these is defensible in
one sentence:

1. **Real URLs for real destinations** — linkable, refreshable, back-button correct, and it
   is how the web works.
2. **The market clock** — the SRS problem statement is "customers rarely know in advance
   which Farmers will be at a market on a given day". The clock answers it on every screen.
3. **Grouped basket** — pickup is per-stall in reality, so the basket models reality.
4. **Collection code** — the SRS ends the loop with in-person pickup and cash; the code is
   the physical handoff artifact.
5. **Two-accent budget** — a measurable, auditable colour rule, not taste.
6. **Hand-drawn scenes** — bespoke SVG, no stock art, no licensing problem (SRS 1.5 flags
   image licensing as a constraint), and it proves the work is ours.
7. **Zero `layoutCheck()` findings at five viewports** — responsiveness proven by a tool,
   not claimed.
8. **Full keyboard operability and `prefers-reduced-motion`** — SRS 1.7 accessibility.
