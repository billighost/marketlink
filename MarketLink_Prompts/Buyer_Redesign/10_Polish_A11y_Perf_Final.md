# Stage 10 · Polish, accessibility, performance, final proof

You are working on **MarketLink**. The Customer-side redesign is built. Stages 1–9 delivered:

- **1** — white-first tokens, buyer shell, `Page` / `PageTitle` / `Section` / `MarketClock`
- **2** — `Scene` + ten full-scene SVGs in `EmptyState` / `ErrorState`
- **3** — backend `clock`, farmer day arrays, grouped cart quote, order `pickupCode`
- **4** — every destination a real page, seven redirects, no sheet routes
- **5** — Today · **6** — Browse + Produce · **7** — Stalls + Markets + maps
- **8** — Basket, checkout, confirmation, orders, order timeline
- **9** — Saved, You, account pages, notifications, assistant, help, command palette

**This stage writes very little new code.** It finds and fixes the seams between nine stages
built in nine separate sessions, then proves the whole thing works. Your default action here is
to **delete, unify and verify** — not to add.

If you find yourself designing something new, stop. That is a sign you have drifted.

---

# PART 1 · Context

## 1.1 What MarketLink is

Local farmers-market **Farmers** and **Customers**. A Customer browses what a stall has,
**reserves** it, picks a pickup window, then **collects in person and pays in cash**.
**No payment gateway. No delivery. Ever.**

## 1.2 The rules the whole app obeys

- **White first.** White is the page. `--color-canvas` appears only inside SVG fills, produce
  image tiles and the guest footer. Hairlines are neutral ink at 10%, scoped on the buyer shell.
- **Two beet elements maximum per rendered screen** (usually the primary button and the active
  nav item). Carrot = stock signals only. Herb = open/ready/success only.
- **Idiqlat headings at weight 400 only.** Inter for everything else. Sentence case throughout.
- **No gradients, no card shadows, no blur, no dark mode.** Hairlines and whitespace.
- **Breakpoints 480 / 768 / 1024 / 1280.** Nothing else.
- **Every value from a `var(--token)`.** No raw hex, no raw px beyond `1px` hairlines.
- **Minimum 44 x 44 touch targets.** Visible focus everywhere. `prefers-reduced-motion` honoured.

## 1.3 The nineteen buyer pages

```
/buyer                          Today
/buyer/products                 Browse
/buyer/products/:id             Produce
/buyer/stalls                   Stalls
/buyer/stalls/:id               Stall
/buyer/markets                  Markets
/buyer/markets/:id              Market
/buyer/basket                   Basket
/buyer/checkout                 Review pickup
/buyer/orders                   Orders
/buyer/orders/:id               Order
/buyer/orders/:id/confirmed     Confirmed
/buyer/saved                    Saved
/buyer/profile                  You
/buyer/profile/details          Personal details
/buyer/profile/markets          Saved markets
/buyer/profile/notifications    Notification preferences
/buyer/profile/reviews          Your reviews
/buyer/notifications            Notifications
/buyer/assistant                Ask MarketLink
/buyer/help                     How MarketLink works
/buyer/<anything else>          Buyer 404
```

## 1.4 Off-limits

Vendor, admin, guest pages and layouts — **except** the read-only audit in Task 8, which changes
nothing. `backend/**` — except `docs/`. `package.json`.

**Do not redesign anything.** If a page looks wrong, fix the specific defect; do not rework the
layout. Nine stages of decisions are not up for revision in the final stage.

---

# PART 2 · Your tasks

## Task 1 · The consistency sweep

Nine sessions built nineteen pages. They will disagree. Find every disagreement and pick one
answer.

Open all nineteen pages side by side (or screenshot each at 390 and 1440) and audit:

| Axis | What to check |
|---|---|
| Page title | Every page has exactly **one** `<h1>`, Idiqlat, `--text-h1` |
| Back link | Same position, same icon, same phrasing pattern: "Back to <thing>" |
| Section headings | All `<h2>` via `Section`, same size, same spacing above and below |
| Vertical rhythm | Same `--section-gap` between blocks on every page |
| Page width | `wide` for indexes, `detail` for details, `read` for settings and reading |
| Card style | White, `1px solid var(--color-border)`, `--radius-lg`, `--card-padding`, no shadow |
| Empty states | Same `EmptyState`, same scene sizing, same title/text/action structure |
| Loading | Every page has a **layout-matched** skeleton, not a spinner |
| Buttons | Same heights, same label case, same disabled treatment |
| Dates | One format everywhere. Pick it and route every date through `src/utils/format.js` |
| Prices | Always `formatPrice`, always `tabular-nums`, always with the unit |
| Status words | **placed · accepted · ready for pickup · completed · cancelled** and no synonyms |
| Nouns | **produce · stall · market · basket · collect · reserve** — no "product", "vendor", "cart", "buy" |

Produce a table of every inconsistency found and how you resolved it. **Fix the outliers to match
the majority**, not to match your taste.

## Task 2 · The 13-viewport responsive sweep

The design system names thirteen test viewports. Run **all nineteen pages** at **all thirteen**.

```
320 · 360 · 390 · 430 · 600 · 768 · 820 · 1024 · 1180 · 1280 · 1440 · 1920 · 844x390 (landscape)
```

At each:

```js
const { layoutCheck } = await import('/src/dev/layoutCheck.js');
console.table(layoutCheck());
```

**Target: zero findings, everywhere.** That is 247 checks. Automate it:

Write `tests/05_sweep.mjs` using the existing Playwright harness (`tests/helpers.mjs` gives you
`createTestContext(viewport)` and `loginAsCustomer(page)`). Loop viewports × pages, inject
`layoutCheck`, collect findings, print a matrix, and exit non-zero if any cell is non-empty.

```js
import { createTestContext, loginAsCustomer, BASE_URL } from './helpers.mjs';

const VIEWPORTS = [
  { w: 320, h: 640 }, { w: 360, h: 740 }, { w: 390, h: 844 }, { w: 430, h: 932 },
  { w: 600, h: 900 }, { w: 768, h: 1024 }, { w: 820, h: 1180 }, { w: 1024, h: 768 },
  { w: 1180, h: 820 }, { w: 1280, h: 800 }, { w: 1440, h: 900 }, { w: 1920, h: 1080 },
  { w: 844, h: 390 },
];
const PAGES = ['/buyer', '/buyer/products', /* ...all nineteen... */];
```

The three viewports most likely to break things:

- **320** — the narrowest. Long produce names, price + unit + stepper on one row, chip rows.
- **844 x 390 landscape** — only 390px tall. Sticky top bar + sticky footer + bottom nav can eat
  the entire viewport. Check that content is still reachable.
- **1920** — content must stay in its container and not stretch into a 1900px-wide line of text.

**Landscape phone deserves special attention.** With `--topbar-h` 56, `--bottom-nav-height` 64
and a sticky footer at 56, that is 176px of chrome in a 390px viewport. Consider hiding the
bottom nav under `@media (max-height: 480px)` and confirm nothing becomes unreachable.

## Task 3 · The accessibility pass

The SRS lists accessibility as a non-functional requirement: *"clear and legible fonts,
user-interface elements, and navigation elements."*

### 3a · Keyboard — all nineteen pages

Tab from the top of each page to the bottom. Record per page:

- Every interactive element reachable
- **Visible** focus ring at every stop (`--focus-ring`, `--focus-offset`)
- Tab order matches visual order
- No keyboard trap outside a modal; the palette and sheets **do** trap and release correctly
- `Esc` closes every overlay and returns focus to its opener
- Skip link is the first tab stop and works

### 3b · Semantics

```bash
grep -rn "onClick" src/pages/buyer src/components --include="*.jsx" | grep -i "div\|span"
```

Every clickable `div` or `span` is a bug. It must be a `<button>` or an `<a>`. Fix each, or
justify it with a full `role` + `tabIndex` + key handler set.

Then check per page:

- One `<h1>`; headings descend without skipping a level
- Lists are `<ul>` / `<ol>` with `<li>`
- Forms use `<label>` tied to inputs, `<fieldset>` + `<legend>` for groups
- Icon-only buttons have `aria-label`
- Decorative SVGs are `aria-hidden="true"`; meaningful ones have `role="img"` + a label
- No information conveyed by colour alone

### 3c · Contrast

Every text/background pair must meet **WCAG 2.1 AA**: 4.5:1 for body, 3:1 for large text and
for UI component boundaries. Check with DevTools. The likely failures:

- `--color-ink-faint` (`#9A9088`) on white is **2.9:1** — it fails as body text. It is only
  legal for placeholder and disabled text, never for information. Grep for it and audit every use.
- `--color-carrot` (`#E07A2C`) fails as text on white. Stock warnings must use
  `--color-carrot-text` (`#9C4E14`).

```bash
grep -rn "color-ink-faint" src/pages/buyer src/components --include="*.module.css"
grep -rn "color: var(--color-carrot)" src --include="*.module.css"
```

Audit every hit.

### 3d · Reduced motion

DevTools → Rendering → *Emulate CSS prefers-reduced-motion: reduce*. Walk the whole app.
**Nothing may animate**: no scene drift, no skeleton shimmer, no sheet slide, no add-to-basket
fly, no map zoom animation, no typing dots.

```bash
grep -rn "prefers-reduced-motion" src --include="*.module.css" | wc -l
grep -rln "animation\|transition" src --include="*.module.css" | wc -l
```

Every file with an animation or transition needs a reduced-motion guard. Compare the counts and
close the gap.

### 3e · Zoom

Set browser zoom to **200%** at 1280px wide. Content must reflow, not clip. No horizontal
scrollbar. This is WCAG 1.4.4 and it catches fixed-width containers that `layoutCheck()` misses.

## Task 4 · The performance pass

The SRS requires *"minimal load time and smooth page redirection, even when browsing large
product catalogues."*

### 4a · Bundle

```bash
npm run build
```

Report every chunk over 150KB un-gzipped. `vite.config.js` already splits `leaflet`, `lucide`,
`vendor`, `admin`, `vendor-pages` and `maps`.

**Ten inline SVG scenes are now in the main bundle.** If `scenes.jsx` is heavy, lazy-load it:

```jsx
const SceneLazy = React.lazy(() => import('./Scene'));
```

with a `<Suspense fallback={<div style={{ minHeight: 240 }} />}>` that reserves the height so
nothing shifts. Only do this if the measurement justifies it — report the numbers either way.

Also route-split the heaviest buyer pages with `React.lazy` if any single page chunk is large.
Measure first.

### 4b · Requests

On each page, with the Network tab open and the cache disabled, record:

- Number of requests on mount
- **Any duplicate request** — StrictMode double-invokes effects in dev, so two identical GETs
  means an unstable dependency or a missing guard. Fix, do not excuse.
- **Any waterfall** that could be parallel — two independent `useQuery` calls should fire
  together, not one after the other
- Time to the page being interactive

### 4c · Lighthouse

Run Lighthouse (mobile preset) on `/buyer`, `/buyer/products` and `/buyer/products/:id`.
Report Performance, Accessibility, Best Practices and SEO. **Accessibility must be 100.** Fix
every accessibility finding; report performance findings with a judgement on each.

### 4d · Large catalogue

```bash
cd backend && npm run seed:large
```

Then browse. Scroll `/buyer/products` through several cursor pages. Record: scroll smoothness,
memory growth, whether the endless list keeps every DOM node (hundreds of cards will slow it).
If it degrades badly, cap the retained pages or note it precisely. Then `npm run seed`.

## Task 5 · The dead-code pass

Nine stages leave residue.

```bash
# components nothing imports
for f in $(find src/components -name "*.jsx" -not -name "*.test.*"); do
  n=$(basename "$f" .jsx)
  c=$(grep -rl "$n" src --include="*.jsx" | grep -v "$f" | wc -l)
  [ "$c" -eq 0 ] && echo "UNUSED: $f"
done

grep -rn "placeholders" src                       # must be empty
grep -rn "SheetRoute\|GlobalSearchModal" src      # must be empty
grep -rn "console\.log" src                       # remove, or justify each
grep -rn "TODO\|FIXME\|XXX\|HACK" src             # resolve or record
grep -rn "inSheet\|background:" src/pages/buyer src/layouts   # must be empty
```

Delete genuinely unused files. **Do not delete anything vendor, admin or guest imports** — check
before every deletion and list what you removed.

Also check for CSS modules whose component is gone, and for classes defined but never used.

## Task 6 · Documentation

### `docs/DESIGN_SYSTEM.md`

Bring it to reality. It was partly reconciled in Stage 1; finish it.

- **Section 18** currently documents "Sheet-First Navigation". **That architecture no longer
  exists.** Replace it with "Page-First Navigation": the four-part test for when an overlay is
  legitimate, the five surviving overlays, and the route map.
- Add a section for the **Scene** system: the 640x400 canvas, the horizon at 252, the nine
  layers, the opacity ramp, the one-accent rule, and the ten scene names with where each is used.
- Add the **two-accent budget** as a numbered rule with the per-page table.
- Document every component added across stages 1–9 with its props.
- Fix any remaining container values that disagree with `tokens.css`.

### `README.md`

- Update the project structure to match reality
- Add the buyer route map
- Document the seeded credentials for all three roles
- Note that maps use OpenStreetMap with **no API key required**

### `backend/docs/API.md`

Already updated in Stage 3. Verify it still matches by re-running a `curl` against three
endpoints and diffing against the documented examples.

### `AI_USAGE.md` — create it

The SRS requires acknowledging AI tools used, and forbids AI-generated documentation submitted as
your own. Create a factual file listing: which AI tools were used, for what, and what was written
or substantially modified by hand. **Write facts only. Do not write the project report** — the
SRS explicitly forbids that, and a judge may ask you to justify any line of the codebase.

## Task 7 · The full end-to-end walkthrough

Backend and frontend running, fresh `npm run seed`, signed in as `george@example.com / market123`.

Walk the **entire SRS Customer feature list** and record the result of each step:

1. Sign out, sign in again — session restored, redirected to `/buyer`
2. Refresh — still signed in (silent token refresh)
3. Today page: market clock correct, stall strip populated
4. Browse: search, category, market, **day**, **price**, in-stock, sort — each changes results
5. Copy the filtered URL, open in a new tab — identical view
6. Open a produce page: price, **unit**, **quantity available**, **Farmer** all visible
7. Open its stall: **stall name, location, operating days, current weekly stock**
8. Open its market: map with markers, directions link works
9. Save a produce item, a stall, a market — all three appear under Saved
10. Add produce from **two stalls** to the basket
11. Basket shows two groups, two cutoffs, two window sets
12. Change a quantity — total re-quotes correctly
13. Checkout: choose windows, place the pre-order
14. Confirmation: collection code shown
15. Order page: same code, timeline, map, **"Pay at the stall"**
16. Cancel before cutoff — succeeds, status updates
17. Reorder a past order — items added, unavailable ones reported
18. Review a completed order — stars by keyboard, comment, submit
19. Read other customers' reviews on a produce page and a stall page
20. Notifications: list, mark all read, badge clears
21. Assistant: market time, stock, order question — all answered with navigation chips
22. Personal details: edit name, contact number, **address** — saves
23. Notification preferences: toggle — persists across reload
24. Help: four steps, FAQ opens
25. `Cmd/Ctrl+K`: search, navigate
26. **Back button** from every page — always sensible
27. **Refresh** on every page — same page, never a redirect to `/buyer`
28. Buyer 404 on a nonsense URL

Then repeat 3–18 at **1440px wide**, confirming the desktop shell.

Then repeat the whole walk with **the backend stopped** at step 4, confirming every page shows a
readable error with a working Retry and none shows a raw error code.

## Task 8 · Cross-role regression (read-only)

Load and click through **every** vendor, admin and guest page. They must be **unchanged** by nine
stages of buyer work.

```bash
git diff --stat src/pages/vendor src/pages/admin src/pages/guest src/layouts/VendorLayout.jsx src/layouts/AdminLayout.jsx src/layouts/GuestLayout.jsx
```

Ideally empty. If a shared component changed (`Button`, `Card`, `EmptyState`, `BottomSheet`,
`ListRow`), screenshot the affected vendor/admin screens and confirm they still render correctly.
`EmptyState` changed in Stage 2 — check every vendor and admin empty state specifically.

**Change nothing here.** Report findings only. A cross-role regression is a separate fix.

---

# PART 3 · Your skills for this stage

### Skill 1 · Fix outliers toward the majority

When four pages format a date one way and one does it differently, the one is wrong — even if it
is the nicer format. Consistency is worth more than any individual choice, and "improving" the
majority in the final stage re-opens nine stages of decisions.

### Skill 2 · Automate a sweep you will run more than twice

247 manual checks will not get done honestly. A Playwright loop over viewports × pages runs in
two minutes and can run again after every fix. Write the script before doing the sweep by hand.

### Skill 3 · `--color-ink-faint` is not a text colour

`#9A9088` on white is 2.9:1. It fails AA for body text. It exists for placeholder and disabled
text, where WCAG exempts it. Every other use is a contrast bug, and a judge running Lighthouse
will find it in ten seconds.

### Skill 4 · Landscape phone is a height problem, not a width problem

At 844x390 you have 390px of height. Sticky top bar, sticky footer and bottom nav can consume
180 of it. `@media (max-height: 480px)` is the tool — collapse the bottom nav, reduce the top
bar, and confirm the primary action is still reachable.

### Skill 5 · A duplicate request is always a bug

StrictMode double-invokes effects to surface exactly this. The answer is a stable dependency
array, a `useRef` guard or a properly keyed `useQuery` — never "it only happens in dev".

### Skill 6 · Delete carefully, check every importer

```bash
grep -rl "ComponentName" src --include="*.jsx"
```

Before deleting anything, list its importers. A component used only by admin looks unused when
you are grepping the buyer folder.

### Skill 7 · Stale documentation is worse than none

`DESIGN_SYSTEM.md` section 18 documents an architecture you removed in Stage 4. Someone will read
it and build a sheet route. Delete the section and replace it — do not append a note saying it is
out of date.

### Skill 8 · Test the unhappy path deliberately

Stop the backend. Use an expired token. Request a nonexistent id. Fill a field with 5000
characters. Nine stages of building tests the happy path constantly and the failure path never.
Most of what a judge finds in five minutes lives here.

### Skill 9 · The last stage adds nothing

Every hour here should be spent deleting, unifying or proving. If you are designing, you have
drifted — note the idea in the report and leave the code alone.

---

# PART 4 · Hard rules — never do these

1. **Never redesign a page.** Fix defects. Nine stages of decisions stand.
2. **Never add a feature.** Record ideas in the report.
3. **Never fix an outlier by changing the majority.**
4. **Never use `--color-ink-faint` for information.** Placeholder and disabled only.
5. **Never use `--color-carrot` as text.** `--color-carrot-text`.
6. **Never leave an animation without a reduced-motion guard.**
7. **Never leave a clickable `div` or `span`.**
8. **Never delete a file without listing its importers first.**
9. **Never edit a vendor, admin or guest file.** Report regressions; do not fix them here.
10. **Never leave stale documentation.** Replace it.
11. **Never write the project report.** The SRS forbids AI-generated documentation. `AI_USAGE.md`
    is a factual tool list, nothing more.
12. **Never add a dependency.**
13. **Never claim a sweep you did not run.** 247 cells means 247 cells, or say how many you ran.

---

# PART 5 · Definition of done

- [ ] Consistency table produced; every outlier fixed toward the majority
- [ ] `tests/05_sweep.mjs` exists and runs 19 pages × 13 viewports
- [ ] **Zero `layoutCheck()` findings** across all 247 cells
- [ ] Landscape 844x390 handled; nothing unreachable
- [ ] 200% zoom at 1280 reflows with no horizontal scrollbar
- [ ] Keyboard walk passes on all 19 pages; skip link works; all overlays trap and release
- [ ] Zero clickable `div`s or `span`s
- [ ] Every contrast pair meets AA; `--color-ink-faint` audited; carrot-as-text eliminated
- [ ] Reduced motion stops **everything**
- [ ] **Lighthouse Accessibility 100** on Today, Browse and Produce
- [ ] Bundle reported; anything over 150KB justified or split
- [ ] Zero duplicate requests on mount on every page
- [ ] Large-seed catalogue browsing measured
- [ ] Dead code removed; all greps clean
- [ ] `DESIGN_SYSTEM.md` section 18 rewritten as page-first; Scene system documented;
      accent budget documented; all components documented
- [ ] `README.md` current; `AI_USAGE.md` created (facts only)
- [ ] 28-step walkthrough passes at 390 and at 1440
- [ ] Backend-down walk: every page readable, every retry works, no raw error codes
- [ ] Vendor, admin and guest verified unchanged
- [ ] `node tests/run_all.mjs` and `cd backend && npm test` both fully pass

---

# PART 6 · Verification gate

### Build and bundle

```bash
npm run build
```

Last 20 lines plus a table of every chunk with its size. Flag anything over 150KB.

### The sweep

```bash
node tests/05_sweep.mjs
```

Paste the full matrix: 19 pages × 13 viewports. **Every cell zero.** If you could not automate
it, say so and paste however many manual runs you did, honestly.

### Accessibility

- Keyboard walk: a table, one row per page, with the result of each of the six checks in Task 3a
- `grep` for clickable divs/spans: output, must be empty
- Contrast: a table of every text/background pair you checked, with its ratio
- `--color-ink-faint` and carrot-as-text greps: output with every hit accounted for
- Reduced motion: the two grep counts, and a walkthrough result
- 200% zoom at 1280: result per page group
- Lighthouse: four scores × three pages, plus every accessibility finding and its fix

### Performance

- Per page: request count on mount, duplicates (must be zero), waterfalls, time to interactive
- `seed:large` browsing: scroll smoothness, memory growth, DOM node count after five pages

### Dead code

Paste every grep from Task 5. All must be empty except justified `console.log`s (there should be
none — `vite.config.js` drops them in production, but they are still noise in dev).
List every file deleted with its importer count at time of deletion.

### The walkthrough

All 28 steps at 390, then steps 3–18 at 1440, then the backend-down walk. A table: step, result,
notes.

### Cross-role

```bash
git diff --stat src/pages/vendor src/pages/admin src/pages/guest src/layouts/VendorLayout.jsx src/layouts/AdminLayout.jsx src/layouts/GuestLayout.jsx
```

Plus a screenshot check of every vendor and admin **empty state** (Stage 2 changed `EmptyState`).

### Tests

```bash
node tests/run_all.mjs
cd backend && npm run seed && npm test
```

Both full summaries. Everything passes.

### The design-rule audit

```bash
grep -rnE "#[0-9a-fA-F]{3,8}" src --include="*.module.css"
grep -rnE ":[^;]*[0-9]+px" src --include="*.module.css" | grep -v "1px" | grep -v "0px" | grep -v tokens.css
grep -rnE "linear-gradient|radial-gradient|conic-gradient|backdrop-filter" src --include="*.module.css"
grep -rn ":global" src --include="*.module.css"
grep -rn "!important" src --include="*.module.css"
grep -rn "box-shadow" src --include="*.module.css" | grep -v "shadow-menu" | grep -v "shadow-modal" | grep -v "shadow-control" | grep -v "shadow-none"
grep -rnE "@media[^{]*\(m(in|ax)-width:\s*(?!(479|480|767|768|1023|1024|1279|1280)px)" src --include="*.module.css"
git diff package.json
```

All empty (the last one catches non-standard breakpoints; `max-height` queries for landscape are
exempt — list them separately).

### Accent budget — the final count

For **each of the nineteen pages**, at 390 and at 1440, count the visible beet elements and name
them. **Maximum two.** A table with 38 rows.

### The scope-rule audit

```bash
grep -rniE "payment|card number|cvv|stripe|paypal|pay now|amount due|amount charged|delivery|shipping|courier|tracking number" src/pages/buyer src/components
```

Empty except `Pay at the stall` / `pay at the stall` / `Cash, in person, when you collect.`

---

# PART 7 · Report

```
Stage 10 status: PASS | FAIL

## Consistency table
| axis | inconsistency found | pages affected | resolved to |
|---|---|---|---|

## The sweep
<19 x 13 matrix>
Total cells: 247   Cells with findings: <n>

## Accessibility
Keyboard walk:        <19-row table>
Clickable div/span:   <grep output>
Contrast:             <table of pairs and ratios>
ink-faint / carrot:   <grep output, every hit accounted for>
Reduced motion:       <grep counts + walkthrough result>
200% zoom:            <result>
Lighthouse:           <4 scores x 3 pages + findings and fixes>

## Performance
Bundle:               <chunk table, anything > 150KB justified>
Requests per page:    <table: page, count, duplicates, waterfalls, TTI>
Large seed:           <scroll, memory, DOM nodes>

## Dead code
<all greps>
Files deleted:        <name, importer count at deletion>

## Walkthrough
<28 steps at 390>
<steps 3-18 at 1440>
<backend-down walk>

## Cross-role regression
git diff --stat:      <output>
Vendor/admin empty states: <screenshot check>

## Tests
Frontend:             <run_all.mjs summary>
Backend:              <npm test summary>

## Design-rule audit
<all eight greps>

## Accent budget
<38-row table: page, width, count, elements named>

## Scope-rule audit
<grep output>

## Documentation
- DESIGN_SYSTEM.md section 18 rewritten:  <yes/no>
- Scene system documented:                 <yes/no>
- Accent budget documented:                <yes/no>
- README.md current:                       <yes/no>
- AI_USAGE.md created:                     <yes/no>

## Ideas recorded, not built
- <anything you wanted to add>

## Found but not fixed
- <file:line, with why — including cross-role regressions>

## NOT verified
- <what and why>

## SRS traceability
| requirement | route | component | how verified |
|---|---|---|---|
<every Customer requirement from SRS 1.6, no gaps>
```

Fix and re-run any failing gate before reporting. A non-zero sweep cell, a Lighthouse
accessibility score under 100, a page with three beet elements, or a non-empty scope-rule audit
is a **FAIL** — report it as one rather than claiming PASS.

---

# PART 8 · What "done" means

When this stage passes, the Customer side of MarketLink is:

- **Page-first** — 19 real URLs, all linkable, refreshable, back-button correct
- **White** — one neutral hairline system, canvas demoted to illustrations, two accents per screen
- **Illustrated** — ten bespoke full-scene SVGs, no stock art, no licensing question
- **Honest about its model** — reserve, collect, pay cash at the stall, said in the interface
- **Accessible** — keyboard complete, AA contrast, reduced-motion safe, Lighthouse 100
- **Responsive** — zero findings across 247 viewport-page checks
- **Provable** — every claim in this report backed by pasted output

That is the whole deliverable.
