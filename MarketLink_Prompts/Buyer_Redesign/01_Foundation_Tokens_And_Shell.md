# Stage 1 · Foundation — white-first tokens, buyer shell, page primitives

You are working on **MarketLink**, an existing React + Vite app. This stage is the foundation
for a full redesign of the signed-in Customer (buyer) experience. **You will not rebuild any
page in this stage.** You will build the token layer, the app shell and the four layout
primitives that the next nine stages assemble pages out of.

Read this entire prompt before writing code. Then plan, then build, then prove it.

---

# PART 1 · Project context

## 1.1 What MarketLink is

A platform connecting local farmers-market **Farmers** with **Customers**.
Tagline: *"Farm Fresh Just a Click Away."*

The real-world loop: a Farmer runs a **stall** at a **market** open on specific days in
specific time windows. The Farmer publishes weekly stock. A Customer browses what is actually
available, **reserves** items, picks a pickup slot, then **collects in person at the stall and
pays there in cash**.

**Hard scope limits — never build these, in any stage:**

- **No payment gateway.** Payment is in person. No card fields, no "Pay now".
- **No delivery.** Pickup at the market only.
- **No identity or certification verification.**

## 1.2 Stack

- React 18.3, Vite 6, `react-router-dom` 6.28
- **CSS Modules only.** `*.module.css` beside each component.
  Globals: `src/styles/tokens.css`, `base.css`, `utils.css`, entered via `index.css`.
- **No Tailwind, no SCSS, no UI kit, no new dependencies.**
- `lucide-react` icons, `leaflet` maps
- Alias `@` maps to `src`
- Frontend port **3000**, proxies `/api` to backend on **4000**

**Fonts:** `Idiqlat` serif for headings — **it has exactly one weight, 400**. `Inter` for all
UI and body text (400/500/600/700).

## 1.3 Files that matter to this stage

```
src/styles/tokens.css                        the only place raw values live
src/layouts/BuyerLayout.jsx  + .module.css   the buyer app frame  (YOU REWRITE)
src/components/layout/BuyerTopBar.jsx + css  top bar             (YOU REWRITE)
src/components/layout/BottomNav.jsx   + css  mobile bottom nav   (YOU EDIT)
src/components/layout/CartBar.jsx     + css  floating basket pill (YOU EDIT)
src/components/layout/MarketDropdown.jsx     market switcher      (leave logic, restyle)
src/components/layout/AnnouncementBar.jsx    site announcements   (YOU EDIT)
src/components/layout/PageHeader.jsx  + css  old page header      (leave — other roles use it)
docs/DESIGN_SYSTEM.md                        design doc           (YOU UPDATE section 3 and 7)
```

## 1.4 Current state of the shell (read these files first)

`BuyerLayout.jsx` renders: skip link, `AnnouncementBar`, `BuyerTopBar`, `<main><Outlet/></main>`,
`CartBar`, `BottomNav`. It computes `isSheetOpen` from the pathname and hides chrome when a
bottom sheet is open. It also preserves per-tab scroll positions in a ref.

`BuyerTopBar.jsx` is responsive: under 1024 it shows only the market dropdown; at 1024+ it adds
brand logo, four nav links, a cart button and an avatar.

`BottomNav.jsx` has five items: Market, Browse, Cart, Orders, You. The Cart item navigates with
a `background` location state so the cart opens as an overlay sheet.

**Run the app and look at all of this before you change anything.**

## 1.5 Off-limits

- `src/pages/vendor/**`, `src/pages/admin/**`, `src/pages/guest/**`
- `src/layouts/VendorLayout.jsx`, `AdminLayout.jsx`, `GuestLayout.jsx`
- `src/components/layout/TopBar.jsx` (guest top bar — different component)
- `backend/**` — this stage touches no backend code
- `package.json` — **add no dependencies**
- **Do not rebuild any page in `src/pages/buyer/`.** Pages come in stages 5 to 9.
  Pages will look slightly different after your shell change. That is expected and correct.
- **Do not change any route path in this stage.** Routing is stage 4. `BottomNav` keeps
  navigating to `/buyer/cart` with its existing sheet behaviour — you only change its *labels*.

---

# PART 2 · The design direction

## 2.1 The brief

> **A quiet, white, paper-clean market that knows what day it is.**

Not an e-commerce app with a farm skin. A *market*: a **place** you go, on a **day** it is
open, to a **stall** run by a **person**, to collect **produce** you reserved.

## 2.2 White first — the colour discipline

The redesign fails one way above all others: **death by beige.** Three rules stop it.

### Rule 1 · White is the page

`background: var(--color-white)` on every buyer page, card, panel and sheet.
`--color-canvas` (`#F5EFE3`) is **demoted** and survives in only three places: fills inside SVG
illustrations, the image tile behind a produce illustration, and the guest footer.
It is **never** a page background, card background or section band inside the buyer app.

### Rule 2 · Hairlines are neutral, not tan

**This is the highest-leverage change in the whole redesign. Do not skip it.**

`--color-border` currently resolves to `--color-wood-line: #E3D3B8` — a **tan**. Every card
outline, divider and input border in the app draws in beige. At real UI density that tints the
entire screen warm-grey and destroys the white.

Fix: add a neutral hairline, and keep the warm line as an opt-in for genuinely wooden moments.

### Rule 3 · The accent budget — two per screen

At most **two** elements on any buyer screen may be beet (`#7A2E3B`): the one primary button,
and the active nav item. That is all.

| Colour | Allowed use | Never |
|---|---|---|
| Beet `#7A2E3B` | Primary button, active nav, focus ring | Headings, prices, decoration |
| Carrot `#E07A2C` | Low-stock and sold-out signals only | Anything decorative |
| Herb `#5C7048` | "Open now", "Ready", success only | Anything decorative |
| Wood `#B08655` | Scene structures, one optional section rule | Text, chrome borders |
| Ink `#2E2B26` | All primary text | — |
| Ink-soft `#6B6259` | Secondary text, captions, icon strokes | Essential info alone |

### Banned outright

No gradients of any kind. No `box-shadow` on cards — cards are `1px` hairline on white.
Shadows only on floating layers (`--shadow-menu`, `--shadow-modal`). No blur, no
glassmorphism, no coloured section bands, no dark mode.

## 2.3 Typography

| Role | Font | Token |
|---|---|---|
| Page title (one `<h1>` per page) | Idiqlat 400 | `--text-h1` |
| Section title | Idiqlat 400 | `--text-h2` |
| Card / sub-section title | Idiqlat 400 | `--text-h3` |
| Everything else | Inter | `--text-body` / `--text-sm` |
| Prices | Inter 600 + `tabular-nums` | `--text-body` |
| Labels, nav, buttons | Inter 500 | `--text-sm` |

**Never** apply a weight above 400 to Idiqlat — the browser will synthesise a fake bold and it
looks cheap. **Sentence case everywhere**, buttons included.

## 2.4 Voice

Plain, warm, specific, never salesy. No exclamation marks. No emoji. Never "just", "simply",
"easily". "Basket" not "cart". "Produce" not "products". "Stall" not "vendor".

## 2.5 Breakpoints — only these four

**480 / 768 / 1024 / 1280.** Nothing else.

| Width | Buyer shell |
|---|---|
| < 768 | Bottom nav (5 items), slim top bar with market pill |
| 768–1023 | Bottom nav, centred content column |
| 1024+ | Top nav with links, **bottom nav `display: none`** |
| 1280+ | Same, `--page-pad: var(--space-8)` |

---

# PART 3 · Your tasks

Work in this order. Each task ends with the app still running.

## Task 1 · Add tokens (do not delete or retype anything existing)

Open `src/styles/tokens.css`. **Append** a clearly commented block at the end of `:root`.
Changing an existing value is out of scope except where this task says so.

```css
  /* ---------- Buyer redesign: neutral hairlines ---------- */
  /* --color-border resolved to --color-wood-line (#E3D3B8), a TAN. At UI density that
     tinted every card and divider beige. These give a neutral hairline instead. The buyer
     shell re-scopes --color-border to --color-hairline; other roles are untouched. */
  --color-hairline:       rgba(46, 43, 38, 0.10);  /* default card/divider/outline */
  --color-hairline-soft:  rgba(46, 43, 38, 0.06);  /* internal list dividers */
  --color-border-warm:    var(--color-wood-line);  /* opt-in: market-wood moments only */

  /* ---------- Buyer redesign: content widths ---------- */
  --container-buyer:        1200px;  /* index and feed pages */
  --container-buyer-detail: 960px;   /* produce, stall, order, market detail */
  --container-buyer-read:   720px;   /* help, forms, settings */

  /* ---------- Buyer redesign: scene illustrations ---------- */
  --scene-max-w:    30rem;   /* 480px — mobile */
  --scene-max-w-lg: 34rem;   /* 544px — 768px and up */

  /* ---------- Buyer redesign: shell geometry ---------- */
  --topbar-h:       56px;    /* buyer top bar, under 1024 */
  --topbar-h-desk:  68px;    /* buyer top bar, 1024 and up */
  --rail-w:         272px;   /* desktop filter rail (stage 6) */
```

**Verify nothing broke:** `npm run dev`, then load `/vendor`, `/admin` and `/` (guest).
They must look **exactly** as before — you only added tokens, you changed none.

## Task 2 · Rewrite the buyer shell

### 2a · `src/layouts/BuyerLayout.module.css`

Add the scoped token override at the top of `.appShell`. This is the mechanism that re-skins
the entire buyer subtree without touching the other three roles — CSS custom properties
cascade, so redefining them here applies to every descendant and nowhere else:

```css
.appShell {
  /* Buyer-scoped token overrides. Descendants of this element resolve these names
     to the neutral values; vendor, admin and guest keep the warm originals. */
  --color-border:    var(--color-hairline);
  --color-bg-muted:  var(--color-white);

  --stack-nav:  var(--bottom-nav-height);
  --stack-cart: 0px;
  --stack-bottom: calc(var(--stack-nav) + var(--stack-cart) + env(safe-area-inset-bottom, 0px));

  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  background-color: var(--color-white);
  color: var(--color-ink);
  -webkit-tap-highlight-color: transparent;
  overscroll-behavior-y: none;
  position: relative;
}
```

Keep the existing `[data-cart-visible="true"]`, `@media (min-width: 1024px) { --stack-nav: 0px }`,
`.skipLink` and `.main` rules exactly as they are.

### 2b · `src/layouts/BuyerLayout.jsx`

Keep all existing logic — `isSheetPath`, `isSheetOpen`, `isCartVisible`, the scroll-position
ref effect. Do not touch routing. Two changes only:

1. `AnnouncementBar` renders **below** the top bar, not above it, so the top bar is the first
   thing in the document and stays sticky at `top: 0`.
2. Nothing else.

### 2c · `src/components/layout/BuyerTopBar.jsx` + `.module.css`

Rewrite the markup and styles. Keep every hook call and handler that is already there
(`useAuth`, `useCart`, the markets `useQuery`, the scroll listener, `handleOpenCart`).

**Under 1024px** — one row, height `var(--topbar-h)`:

```
[ MarketDropdown (grows, truncates) ]          [ 🔍 ]  [ 🧺 n ]
```

- Background `var(--color-white)`. `position: sticky; top: 0; z-index: var(--z-sticky)`.
- **No bottom border at rest.** Add `border-bottom: 1px solid var(--color-border)` only when
  the existing `scrolled` state is true. This is what makes it feel calm.
- Search button is a placeholder that navigates to `/buyer/products` for now (stage 9 wires the
  command palette to it). Give it `aria-label="Search the market"`.
- Basket button uses the existing `handleOpenCart`. Keep `data-cart-target-desktop`.
- No logo, no avatar under 1024 — those live in the bottom nav.

**1024px and up** — one row, height `var(--topbar-h-desk)`:

```
[ Logo ]   [ Today  Browse  Stalls  Markets  Orders ]   ——— [ Market ▾ ] [ 🔍 ] [ 🧺 n ] [ AB ]
```

- Nav links: labels **Today, Browse, Stalls, Markets, Orders**. Keep the `to` values pointing
  at the paths that exist **today** — `/buyer`, `/buyer/products`, `/buyer/farmers`,
  `/buyer/markets`, `/buyer/orders`. Stage 4 changes the paths; you only change labels.
- Links: Inter 500, `--text-sm`, `--color-ink`, `min-height: var(--tap-min)`, horizontal
  padding `var(--space-3)`, `white-space: nowrap`. Hover: `background: var(--color-canvas-soft)`,
  `border-radius: var(--radius-md)`.
- **Active link is the ONE beet element in the top bar**: `color: var(--color-primary)` plus a
  `2px` beet rule pinned to the bottom of the link box. Nothing else in the bar is beet — the
  basket button is ink with a hairline border, the avatar is `--color-beet-tint` background
  with ink text.
- Logo uses the existing `MarketLinkLogo` component, `size="sm"`.
- Use `grid-template-columns: auto 1fr auto` so the nav sits left-of-centre and the action
  group pins right. Never let nav links wrap.

**Both:** every interactive element is at least `44x44`. Icon-only buttons get `aria-label`.

### 2d · `src/components/layout/BottomNav.jsx` + `.module.css`

**Labels only** — five items, in this order:

| id | label | icon | path (unchanged) |
|---|---|---|---|
| `today` | Today | `Sun` | `/buyer` |
| `browse` | Browse | `Search` | `/buyer/products` |
| `basket` | Basket | `ShoppingBasket` | `/buyer/cart` |
| `orders` | Orders | `Receipt` | `/buyer/orders` |
| `you` | You | `User` | `/buyer/profile` |

Rename the `market` id to `today` and the `cart` id to `basket`, and update every place those
ids are compared inside the file. **Keep the existing click behaviour exactly**, including the
basket item opening a sheet with `background` state and the scroll-to-top / refresh-feed logic.

Styling: white background, `border-top: 1px solid var(--color-border)`, no shadow. Active item
is beet icon + beet label + the existing `2px` beet bar above. Inactive is `--color-ink-soft`.
The active item is the **second permitted beet element** on a mobile screen — so a mobile page
with a primary button already has its two; everything else must be ink.

### 2e · `src/components/layout/CartBar.jsx` + `.module.css`

Keep all logic. Restyle to a centred pill:

- `background: var(--color-primary)`, `color: var(--color-on-primary)`,
  `border-radius: var(--radius-full)`, `box-shadow: var(--shadow-menu)`
- `min-height: var(--cart-bar-height)`, `max-width: 22rem`, `margin-inline: auto`
- `position: fixed; left: var(--space-4); right: var(--space-4)`,
  `bottom: calc(var(--bottom-nav-height) + var(--stack-gap) + env(safe-area-inset-bottom, 0px))`
- `z-index: calc(var(--z-sticky) + 1)`
- Text: `View basket · 3 items · £12.40`, Inter 500, `--text-sm`, `tabular-nums` on the numbers
- At 1024+: `display: none` — the desktop basket lives in the top bar

Note this pill counts as a beet element. On a page where the basket pill is visible, the page
body gets **at most one** other beet element.

### 2f · `src/components/layout/AnnouncementBar.jsx` + `.module.css`

Keep the fetch logic. Restyle: white background, `border-bottom: 1px solid var(--color-border)`,
`--text-sm`, `--color-ink-soft`, one line, `text-overflow: ellipsis`, dismiss button `44x44`
with `aria-label="Dismiss announcement"`. **Remove any tinted or coloured background.**

## Task 3 · Build the four page primitives

Every page in stages 5 to 9 is assembled from these. Get them right and the rest is fast.
Create each as a new file pair in `src/components/layout/`.

### 3a · `Page.jsx` + `Page.module.css`

```jsx
import React from 'react';
import styles from './Page.module.css';

/**
 * Buyer page container. Owns the content width, the page gutter and the vertical rhythm.
 * Every buyer page is wrapped in exactly one of these.
 *
 * @param {'wide'|'detail'|'read'} width  wide = index/feed (1200px), detail = 960px, read = 720px
 */
export function Page({ width = 'wide', children, className = '', ...rest }) {
  return (
    <div className={`${styles.page} ${styles[width]} ${className}`} {...rest}>
      {children}
    </div>
  );
}

export default Page;
```

```css
.page {
  width: 100%;
  margin-inline: auto;
  padding-inline: var(--page-pad);
  padding-block: var(--space-6) var(--space-12);
  display: flex;
  flex-direction: column;
  gap: var(--section-gap);
  background-color: var(--color-white);
}

.wide   { max-width: var(--container-buyer); }
.detail { max-width: var(--container-buyer-detail); }
.read   { max-width: var(--container-buyer-read); }

@media (min-width: 768px) {
  .page { padding-block: var(--space-8) var(--space-16); }
}

@media (min-width: 1280px) {
  .page { padding-inline: var(--space-8); }
}
```

### 3b · `PageTitle.jsx` + `PageTitle.module.css`

The header block at the top of every page. Renders, in order: an optional back link, the one
`<h1>`, one optional muted context line, and an optional action slot on the right.

```jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import styles from './PageTitle.module.css';

/**
 * The single <h1> block for a buyer page.
 * Density rule: title + at most ONE muted context line. Never two lines of context.
 *
 * @param {string}          title    the h1 text, sentence case
 * @param {React.ReactNode} context  one short muted line under the title
 * @param {string}          backTo   route to return to; renders a back link when present
 * @param {string}          backLabel  e.g. "Back to stalls"
 * @param {React.ReactNode} actions  right-aligned controls, desktop only
 */
export function PageTitle({ title, context, backTo, backLabel = 'Back', actions, className = '' }) {
  return (
    <header className={`${styles.header} ${className}`}>
      {backTo && (
        <Link to={backTo} className={styles.back}>
          <ArrowLeft size={16} strokeWidth={1.75} aria-hidden="true" />
          <span>{backLabel}</span>
        </Link>
      )}
      <div className={styles.row}>
        <div className={styles.titleGroup}>
          <h1 className={styles.title}>{title}</h1>
          {context && <p className={styles.context}>{context}</p>}
        </div>
        {actions && <div className={styles.actions}>{actions}</div>}
      </div>
    </header>
  );
}

export default PageTitle;
```

CSS requirements:

- `.back` — `--text-sm`, `--color-ink-soft`, inline-flex, `gap: var(--space-2)`,
  `min-height: var(--tap-min)`, no underline at rest, underline on hover. Hover colour `--color-ink`.
- `.row` — flex, `justify-content: space-between`, `align-items: flex-end`, `gap: var(--space-4)`
- `.title` — `font-family: var(--font-head)`, `font-size: var(--text-h1)`,
  `font-weight: var(--weight-head)`, `line-height: var(--lh-h1)`,
  `letter-spacing: var(--tracking-head)`, `color: var(--color-ink)`
- `.context` — `--text-sm`, `--color-ink-soft`, `margin-top: var(--space-1)`, `max-width: var(--measure)`
- `.actions` — `display: none` under 768, `display: flex` at 768+, `gap: var(--space-2)`

### 3c · `Section.jsx` + `Section.module.css`

```jsx
import React from 'react';
import styles from './Section.module.css';

/**
 * A titled block inside a buyer page. Renders an h2 with an optional right-side action.
 * Use for every "Also on this stall", "Reviews", "On the table today" group.
 *
 * @param {string}          title     h2 text, sentence case
 * @param {string}          subtitle  one muted line under the h2
 * @param {React.ReactNode} action    right-aligned link or button, e.g. "See all"
 */
export function Section({ title, subtitle, action, children, className = '', ...rest }) {
  return (
    <section className={`${styles.section} ${className}`} {...rest}>
      {(title || action) && (
        <div className={styles.head}>
          <div className={styles.headText}>
            {title && <h2 className={styles.title}>{title}</h2>}
            {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
          </div>
          {action && <div className={styles.action}>{action}</div>}
        </div>
      )}
      {children}
    </section>
  );
}

export default Section;
```

CSS: `.section` is `display: flex; flex-direction: column; gap: var(--space-5)`.
`.title` is Idiqlat at `--text-h2`, weight `--weight-head`. `.subtitle` is `--text-sm` ink-soft.
`.action` holds a text button: Inter 500, `--text-sm`, `--color-ink`, `min-height: var(--tap-min)`,
underline on hover. **Not beet.**

### 3d · `MarketClock.jsx` + `MarketClock.module.css`

The device that makes the whole app feel like a place with a schedule. Build it **presentational
only** — it takes props, fetches nothing. Stage 5 wires real data in.

```jsx
import React from 'react';
import styles from './MarketClock.module.css';

/**
 * The market-day clock. One quiet line, plus a hairline progress rule while the market is open.
 *
 * Closed:  "Riverbend Market · Saturday 8:00–13:00 · opens in 2 days"
 * Open:    "Riverbend Market · open now · closes 13:00"   + progress rule
 *
 * @param {string}  marketName
 * @param {boolean} openNow
 * @param {string}  windowLabel   e.g. "Saturday 8:00–13:00"
 * @param {string}  nextOpenLabel e.g. "opens in 2 days"
 * @param {string}  closesAtLabel e.g. "13:00"
 * @param {number}  progress      0 to 1, how far through today's window. Only used when openNow.
 */
export function MarketClock({
  marketName,
  openNow = false,
  windowLabel,
  nextOpenLabel,
  closesAtLabel,
  progress = 0,
}) {
  const pct = Math.max(0, Math.min(1, progress)) * 100;

  return (
    <div className={styles.clock}>
      <p className={styles.line}>
        <span className={styles.market}>{marketName}</span>
        <span className={styles.sep} aria-hidden="true">·</span>
        {openNow ? (
          <>
            <span className={styles.open}>open now</span>
            <span className={styles.sep} aria-hidden="true">·</span>
            <span className={styles.muted}>closes {closesAtLabel}</span>
          </>
        ) : (
          <>
            <span className={styles.muted}>{windowLabel}</span>
            {nextOpenLabel && (
              <>
                <span className={styles.sep} aria-hidden="true">·</span>
                <span className={styles.muted}>{nextOpenLabel}</span>
              </>
            )}
          </>
        )}
      </p>

      {openNow && (
        <div
          className={styles.track}
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(pct)}
          aria-label={`Market day progress, closes ${closesAtLabel}`}
        >
          <div className={styles.fill} style={{ width: `${pct}%` }} />
        </div>
      )}
    </div>
  );
}

export default MarketClock;
```

CSS requirements:

- `.line` — `--text-sm`, `--color-ink-soft`, flex with `gap: var(--space-2)`, `flex-wrap: wrap`
- `.market` — `color: var(--color-ink)`, `font-weight: var(--weight-medium)`
- `.open` — `color: var(--color-success)`, `font-weight: var(--weight-medium)`
  (herb is allowed here — it is a state signal, not decoration, and it does not spend the
  beet budget)
- `.sep` — `color: var(--color-ink-faint)`
- `.track` — `height: 2px`, `background: var(--color-hairline)`, `border-radius: var(--radius-full)`,
  `margin-top: var(--space-2)`, `max-width: 14rem`
- `.fill` — `height: 100%`, `background: var(--color-success)`, `border-radius: inherit`,
  `transition: width var(--duration-base) var(--ease-standard)`

## Task 4 · Reconcile the design doc

`docs/DESIGN_SYSTEM.md` currently **contradicts** `tokens.css`. Section 19 claims
`--container-max: 1120px`, `--container-narrow: 720px`, `--container-tablet: 40rem`; the real
tokens are `1400px`, `840px`, `48rem`. Stale docs are worse than no docs.

1. Fix every container value in sections 7 and 19 to match `tokens.css` as it actually is.
2. Add a subsection **"20. Buyer redesign additions"** documenting: the three new hairline
   tokens and why, the buyer-scoped override technique, the three `--container-buyer-*` widths,
   the scene tokens, the shell geometry tokens, and the two-accent budget rule.
3. Add the four new primitives (`Page`, `PageTitle`, `Section`, `MarketClock`) to section 9 with
   their props.

Do not rewrite the rest of the document.

---

# PART 4 · Your skills for this stage

Techniques you should actively use. Each is a concrete thing to type, not a principle.

### Skill 1 · Scope tokens by redefining them on a wrapper

CSS custom properties cascade. Redefining a token on an element re-resolves every `var()` in
its whole subtree — and nowhere else. This is how you change `--color-border` for the buyer app
without touching three other roles. It is one declaration, zero risk, and it is **reversible by
deleting one line**. Prefer this over find-and-replacing colour values across files.

### Skill 2 · Sticky chrome always needs matching body padding

Anything `position: fixed` or `sticky` at an edge must have a matching computed padding on the
scroll container, or the last item on the page becomes unreachable. The existing
`--stack-bottom` calc chain already does this — **keep it intact.** When you add height to the
top bar, the sticky `top: 0` handles it; when you add height to bottom chrome, you must extend
`--stack-bottom`.

### Skill 3 · Reveal borders on scroll, not at rest

A sticky bar with a permanent bottom border always looks heavy. Bind the border to the existing
`scrolled` boolean:

```css
.header { border-bottom: 1px solid transparent; }
.headerScrolled { border-bottom-color: var(--color-border); }
```

Use `transparent` rather than `border-bottom: none` so the box height never changes and content
does not jump by 1px when you scroll.

### Skill 4 · `grid-template-columns: auto 1fr auto` for a three-zone bar

Logo left, nav in the flexible middle, actions pinned right. No magic margins, no
`justify-content` fights, and it never wraps if you add `white-space: nowrap` to the nav.

### Skill 5 · Pad the hit area, not the icon

A 20px icon needs a 44px target. Do not scale the icon — wrap it and pad the wrapper:

```css
.iconButton {
  min-width: var(--tap-min);
  min-height: var(--tap-min);
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
```

### Skill 6 · `tabular-nums` on anything that changes in place

A basket count or a price that re-renders with proportional digits jitters horizontally. Add
`font-variant-numeric: tabular-nums` to every element holding a number that updates.

### Skill 7 · Verify by comparison, not by inspection

After each task, load `/vendor`, `/admin` and `/` and confirm they are **pixel-identical** to
before. If any of them changed, you scoped something too broadly — find it and scope it tighter.

---

# PART 5 · Hard rules — never do these

1. **Never delete or change an existing token value** except the container numbers in
   `DESIGN_SYSTEM.md` (a doc, not a token). Tokens are additive in this stage.
2. **Never change `--color-border` in `tokens.css` itself.** Override it on the buyer shell.
3. **Never touch a file under `src/pages/`.** Zero page files in this stage.
4. **Never change a route, a path constant, or `AppRoutes.jsx`.** That is stage 4.
5. **Never add a dependency.** Not one.
6. **Never write a raw hex colour or a raw px value** in a `.module.css`. Only `1px` hairlines.
7. **Never use a gradient, a card shadow, `backdrop-filter`, `!important` or `:global`.**
8. **Never put a weight above 400 on an Idiqlat heading.**
9. **Never exceed two beet elements** on a single rendered screen.
10. **Never use a breakpoint other than 480, 768, 1024, 1280.**
11. **Never leave an icon-only button without `aria-label`.**
12. **Never "improve" something this prompt did not ask for.** If you spot a bug outside scope,
    write it in the report under "Found but not fixed" and leave the code alone.
13. **Never report PASS without pasting real command output.**

---

# PART 6 · Definition of done

- [ ] `tokens.css` has the four new comment-headed blocks; **no existing value changed**
- [ ] `/vendor`, `/admin` and `/` (guest) render identically to before
- [ ] `BuyerLayout.module.css` scopes `--color-border` and `--color-bg-muted` on `.appShell`
- [ ] No beige hairlines anywhere in the buyer app — inspect a card border in DevTools and
      confirm it computes to `rgba(46, 43, 38, 0.1)`
- [ ] Buyer top bar: correct under 1024 and at 1024+, border appears only on scroll, nav never
      wraps, exactly one beet element
- [ ] Bottom nav labels read Today / Browse / Basket / Orders / You; behaviour unchanged
- [ ] Basket pill is a centred beet capsule, hidden at 1024+
- [ ] Announcement bar is white with a hairline, no tint
- [ ] `Page`, `PageTitle`, `Section`, `MarketClock` all exist with both exports and JSDoc
- [ ] `MarketClock` renders correctly in **both** states — prove it by temporarily hard-coding
      each prop set into any buyer page, screenshotting, then reverting
- [ ] `docs/DESIGN_SYSTEM.md` containers match `tokens.css`; section 20 added; primitives documented
- [ ] Every existing buyer page still loads without a console error

---

# PART 7 · Verification gate

**Not finished until each item below is proven by running something.** "Should work" is a
failure. Show output, or write "not verified".

### A1 · Build

```bash
npm run build
```

Paste the last 15 lines. Zero errors, zero new warnings.

### A2 · Runtime

```bash
npm run dev
```

Load `/buyer`, `/buyer/products`, `/buyer/orders`, `/buyer/profile`, plus `/vendor`, `/admin`, `/`.
Report console errors (must be zero) and failed requests (must be zero).

### A3 · Token purity

```bash
grep -rnE "#[0-9a-fA-F]{3,8}" src --include="*.module.css"
grep -rnE ":[^;]*[0-9]+px" src --include="*.module.css" | grep -v "1px" | grep -v "0px"
```

Paste both. Justify or remove every hit in a file you touched.

### A4 · Forbidden CSS

```bash
grep -rnE "linear-gradient|radial-gradient|conic-gradient|backdrop-filter|!important" src --include="*.module.css"
grep -rn ":global" src --include="*.module.css"
grep -rn "box-shadow" src --include="*.module.css" | grep -v "shadow-menu" | grep -v "shadow-modal" | grep -v "shadow-control" | grep -v "shadow-none"
```

All three must be empty for files you touched.

### A5 · No new dependencies

```bash
git diff package.json
```

Must be empty.

### A6 · Tokens are additive

```bash
git diff src/styles/tokens.css
```

Paste it. Every line must be an **addition**. Any modified or deleted line is a failure.

### A7 · Accent budget

```bash
grep -rn "color-primary\|color-beet" src/components/layout --include="*.module.css"
```

List every hit and name the element. Confirm no rendered buyer screen shows more than two.

### B1 · Responsive sweep

At **360, 390, 768, 1024, 1440**, on `/buyer`, `/buyer/products`, `/buyer/orders`, `/buyer/profile`:

```js
const { layoutCheck } = await import('/src/dev/layoutCheck.js');
console.table(layoutCheck());
```

**Target: zero findings.** Paste each result. Fix every finding — do not explain it away.

### B3 · Bottom stack

At 390 wide with 3 items in the basket, scroll to the end of `/buyer/products`. Confirm:
bottom nav at bottom 0, basket pill fully above it, a toast fully above that, and the last
product card scrollable fully clear of all three.

### B4 · Keyboard walk

Tab through the top bar and bottom nav at 390 and at 1440. Every stop reachable, focus ring
visible, tab order matches visual order.

### Cross-role regression

Screenshot `/vendor`, `/admin` and `/` before and after. State explicitly that they are
unchanged, or name what differs.

---

# PART 8 · Report format

```
Stage 1 status: PASS | FAIL

## What I changed
- <file> — <one line: what and why>
  (every file, none omitted)

## Gate results
A1 build:            <output>
A2 runtime console:  <output>
A3 token purity:     <output>
A4 forbidden CSS:    <output>
A5 dependencies:     <output>
A6 tokens additive:  <git diff>
A7 accent budget:    <element list>
B1 layoutCheck:      <table per page per viewport>
B3 bottom stack:     <result>
B4 keyboard:         <result>
Cross-role:          <unchanged / what differs>

## MarketClock proof
<screenshot or description of both open and closed states>

## Found but not fixed
- <out-of-scope bugs you noticed, with file:line>

## NOT verified
- <anything you could not prove, and why>

## What I would test next
- <one or two items>
```

If any gate fails, **fix it and re-run that gate** before reporting. Do not hand back a failing
stage with excuses.
