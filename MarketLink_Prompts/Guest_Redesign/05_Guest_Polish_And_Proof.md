# Stage 5 · Guest polish, SEO, performance and full proof

You are working on **MarketLink**. The Guest redesign is built. Stages 1–4 delivered:

- **1** — 27 public capabilities curled signed out, shell rebuilt, `docs/CATALOGUE_SHARING.md`,
  four primitives in `src/components/guest/`
- **2** — Home, About, Contact
- **3** — six catalogue pages extracted into shared views under `src/components/catalogue/`,
  guest and buyer both reduced to thin wrappers
- **4** — Login, dual-role Register, forgot/reset password, email verification, 401/403/404

**This stage writes very little new code.** It finds the seams, adds the one thing a public site
needs that an app does not — **discoverability** — and proves the whole thing works signed out.

If you find yourself designing something new, stop. Record it and move on.

---

# PART 1 · Context

## 1.1 The rules the public site obeys

- **White first.** `--color-canvas` only as the footer, produce image tiles, and one band on Home.
- **Two beet elements per screen.** Auth pages: one, with the header CTA hidden.
- **Idiqlat headings at weight 400.** Inter elsewhere. Sentence case. No exclamation marks.
- **No payment, no delivery, no verification claims** — anywhere, including copy.
- **Everything works signed out.** Private window, always.
- **Breakpoints 480 / 768 / 1024 / 1280.** Every value from a `var(--token)`.

## 1.2 The sixteen public pages

```
/                  Home              /login             Login
/markets           Markets           /register          Register
/markets/:id       Market            /forgot-password   Forgot
/farmers           Stalls            /reset-password    Reset
/farmers/:id       Stall             /verify-email      Verify
/products          Browse            /unauthorized      Unauthorized
/products/:id      Produce           *                  Not found
/about             About
/contact           Contact
```

## 1.3 Off-limits

`src/pages/buyer/**`, `src/pages/vendor/**`, `src/pages/admin/**` — **except** the read-only
cross-role audit in Task 6. `backend/**` — except `docs/`. `package.json`.

**Do not redesign anything.** Four stages of decisions stand.

---

# PART 2 · Your tasks

## Task 1 · The full capability re-proof — 27 rows, signed out, through the UI

Fresh `npm run seed`, both servers running, **private window, no session**. Drive every
capability through the interface and record the result.

| Group | Capabilities |
|---|---|
| Catalogue | public home · markets list · market detail · market stalls · market produce · stalls list · stall detail · stall produce · stall reviews · stall pickup slots · produce list · produce detail · produce reviews · related produce · categories |
| Site | announcements · contact form |
| Auth | login · register customer · register farmer · forgot · reset · verify · resend · refresh · logout · me |

For every write, confirm the effect server-side: a contact message appears in the admin inbox,
a registration appears in `/admin/people`, a reset actually changes the password.

**Any failing row is a blocker.** Fix it here — it is a regression, not a new feature.

## Task 2 · The consistency sweep

Four sessions built sixteen pages. Audit and fix the outliers **toward the majority**:

| Axis | Check |
|---|---|
| Page frame | Same `Page`/`GuestPage` width variant per page type |
| Titles | One `<h1>`, Idiqlat, `--text-h1` (Home uses `--text-display`) |
| Back links | Same position, icon, phrasing |
| Section headings | All `<h2>`, same size and spacing |
| Cards | White, `1px solid var(--color-border)`, `--radius-lg`, no shadow |
| Empty states | Same component, same structure |
| Loading | Layout-matched skeletons everywhere, never a spinner |
| Buttons | Same heights, same sentence case, same disabled treatment |
| Dates and prices | One format, routed through `src/utils/format.js`, `tabular-nums` |
| Vocabulary | **stall** not vendor · **produce** not products · **reserve** not buy · **collect** not deliver |
| Sign-in CTAs | Identical wording and all carry `?next=` |

Produce a table of every inconsistency and its resolution.

## Task 3 · SEO and metadata — the one thing a public site needs

The app currently sets titles via `useDocumentTitle`. A public site needs more, and this is
cheap and visible.

### 3a · Per-page metadata

Without adding a dependency, write a tiny hook:

```jsx
/**
 * Sets document title, meta description and canonical for a public page.
 * Cleans up on unmount so a route change never leaves stale metadata behind.
 */
export function usePageMeta({ title, description, canonical, robots }) { /* ... */ }
```

Apply to all sixteen pages with real, specific values:

| Page | Title | Description |
|---|---|---|
| Home | `MarketLink · Fresh from local farmers` | the SRS one-liner |
| Markets | `Farmers markets near you · MarketLink` | naming days and towns |
| Market | `<Market name> · MarketLink` | address and opening days |
| Stalls | `Market stalls · MarketLink` | |
| Stall | `<Stall name> · MarketLink` | stall, market, what they sell |
| Browse | `Browse produce · MarketLink` | |
| Produce | `<Produce name> · <Stall> · MarketLink` | price, unit, stall |
| Auth pages | plain titles | `robots: 'noindex'` |

**Auth, unauthorized and not-found get `noindex`.** A search engine indexing your password
reset page is noise.

### 3b · `index.html`

Check and fix the base `<title>`, `<meta name="description">`, `theme-color`, and add
Open Graph and Twitter card tags so a shared link renders a card. Use a real image only if one
exists and is small; otherwise omit the image tags rather than pointing at a missing file.

### 3c · `robots.txt` and `sitemap.xml`

Add `public/robots.txt` allowing the public pages and disallowing `/buyer`, `/vendor`, `/admin`
and the auth paths. A static `public/sitemap.xml` listing the stable public routes is enough —
do not build a generator.

### 3d · Structured data — optional, high value

If it is quick: JSON-LD on the Produce page (`Product` with `offers`) and the Market page
(`Place`). This is what makes a listing show richly in search. **Only if the data is real** —
never emit structured data with placeholder values.

## Task 4 · Performance — the landing page is the one that matters

### 4a · Bundle

```bash
npm run build
```

Report every chunk over 150KB un-gzipped. `vite.config.js` already splits `leaflet`, `lucide`,
`vendor`, `admin`, `vendor-pages`, `maps`.

**Leaflet is the big one.** It is only needed on the Market, Stall and Contact pages. Confirm
`MapView` is route-split so a visitor landing on Home does not download it. If it is not,
`React.lazy` it with a `Suspense` fallback that **reserves the map's height** so nothing shifts.

### 4b · Images

```bash
ls -lh public/*.png public/*.jpg src/components/asset/* hero-alt.png 2>/dev/null
```

Every image on a public page: report its size. Anything over ~300KB on the landing page is a
performance failure on its own. Compress, replace, or remove, and say what you did.
Every `<img>` needs explicit `width`/`height` or an `aspect-ratio` so it reserves space, plus
`loading="lazy"` on anything below the fold.

### 4c · Requests

Per page, cache disabled: request count on mount, **any duplicate** (StrictMode double-invoke
means a dependency bug — fix it), any waterfall that could be parallel, time to interactive.

### 4d · Lighthouse

Mobile preset on `/`, `/products`, `/products/:id`, `/markets`.
Report Performance, Accessibility, Best Practices, **SEO**.

**Accessibility must be 100. SEO must be 100.** Both are achievable and both are exactly what a
judge will run. Fix every finding in those two categories; report performance findings with a
judgement on each.

## Task 5 · Accessibility pass

### 5a · Keyboard — all sixteen pages

Tab each end to end: every control reachable, visible focus ring, tab order matches visual
order, no trap outside a modal, drawer and filter panel trap and release correctly, `Esc`
closes and returns focus, **the skip link is the first tab stop and works on every page**.

### 5b · Semantics

```bash
grep -rn "onClick" src/pages/guest src/components/guest src/components/catalogue --include="*.jsx" | grep -iE "<div|<span"
```

Must be empty. Then per page: one `<h1>`, headings descend without skipping, lists are real
lists, forms use `<label>`, icon-only buttons have `aria-label`, decorative SVG is
`aria-hidden`, no information by colour alone, and every external link has
`rel="noopener noreferrer"` plus an "opens in a new tab" label.

### 5c · Contrast

Every text/background pair at AA. The known offenders:

```bash
grep -rn "color-ink-faint" src/pages/guest src/components/guest src/components/catalogue --include="*.module.css"
grep -rn "color: var(--color-carrot)" src/pages/guest src/components/catalogue --include="*.module.css"
```

`--color-ink-faint` is 2.9:1 on white — placeholder and disabled only. `--color-carrot` fails as
text; use `--color-carrot-text`.

### 5d · Reduced motion and zoom

Emulate `prefers-reduced-motion: reduce`: nothing animates — no skeleton shimmer, no drawer
slide, no map zoom animation, no scene drift.

Browser zoom **200% at 1280**: reflows, no horizontal scrollbar, forms still usable.

### 5e · Language and landmarks

`<html lang="en">` present. Each page has `<main>`, and the header/footer are `<header>`/
`<footer>` landmarks. `TopBar` nav has an `aria-label`.

## Task 6 · Dead code and cross-role regression

```bash
grep -rn "placeholders" src/pages/guest src/components/guest src/components/catalogue
grep -rn "console\.log" src/pages/guest src/components/guest src/components/catalogue
grep -rn "TODO\|FIXME\|XXX\|HACK" src/pages/guest src/components/guest src/components/catalogue
grep -rniE "continue as|quick.?switch" src/
wc -l src/pages/guest/*.jsx src/pages/guest/*.css src/components/catalogue/* src/components/guest/*
git diff --stat src/pages/buyer src/pages/vendor src/pages/admin
```

- No guest page wrapper over **40 lines** (Home, About and Contact are real pages and may be
  larger — report them separately).
- Delete any component nothing imports. **List importers before deleting.**
- Cross-role: click through every buyer, vendor and admin page. Unchanged. Stage 3 edited buyer
  page files — screenshot all six buyer catalogue pages and confirm.

**Report the total line reduction across the guest side.** The pack began at **20,796 lines**.

## Task 7 · Documentation

- **`README.md`** — public route map, what each page does, seeded credentials for all three
  roles, and a note that maps use OpenStreetMap with no API key.
- **`docs/DESIGN_SYSTEM.md`** — a "Public site" section: the shell, the four guest primitives,
  the accent budget, and the **catalogue sharing contract** (the `audience` rule and
  `CATALOGUE_ROUTES`), so nobody rebuilds a second guest catalogue.
- **`docs/CATALOGUE_SHARING.md`** — update it to describe what was actually built, not the plan.
- **Human to-do list** — consolidate every TODO left by earlier stages (team names, contact
  details, office coordinates, image licences) into one section of the README so a human can
  clear them in one pass before submission.

**Do not write the project report.** The SRS forbids AI-generated documentation.

---

# PART 3 · Your skills for this stage

### Skill 1 · Test signed out, every time

The refresh cookie will sign you back in and you will validate the authenticated site by
accident. Private window, every check, without exception.

### Skill 2 · SEO is cheap and visible

Per-page titles, descriptions, canonicals, `noindex` on auth, `robots.txt`, a sitemap. An hour
of work, a Lighthouse SEO score of 100, and a judge sees the difference immediately.

### Skill 3 · Route-split the map, not the app

Leaflet plus its CSS is the largest avoidable payload on a landing page that never shows a map.
One `React.lazy` with a height-reserving fallback.

### Skill 4 · Reserve space for every image

`width`/`height` or `aspect-ratio` on every `<img>`. Layout shift is the difference between
"fast" and "cheap", and it is measured by Lighthouse.

### Skill 5 · A duplicate request is a bug, not a dev quirk

StrictMode double-invokes effects to surface it. Fix the dependency array or add the guard.

### Skill 6 · Fix outliers toward the majority

Five pages one way, one page another: the one is wrong, even if nicer. Re-opening four stages of
decisions in the final stage is how a redesign never ships.

### Skill 7 · Consolidate the human to-dos

Team names, addresses, coordinates and image licences are human inputs scattered across stages.
One list in the README turns four separate hunts into one ten-minute pass.

### Skill 8 · The last stage adds nothing

Delete, unify, prove. Record ideas; leave the code.

---

# PART 4 · Hard rules — never do these

1. **Never redesign a page.** Fix defects only.
2. **Never add a feature.** Record ideas.
3. **Never test signed in.**
4. **Never fix an outlier by changing the majority.**
5. **Never emit structured data with placeholder values.**
6. **Never index auth, unauthorized or not-found.**
7. **Never ship an image without reserved dimensions**, or one over ~300KB on a public page.
8. **Never use `--color-ink-faint` for information**, or `--color-carrot` as text.
9. **Never leave an animation without a reduced-motion guard.**
10. **Never leave a clickable `div` or `span`.**
11. **Never edit a buyer, vendor or admin file.** Report regressions.
12. **Never delete a file without listing its importers.**
13. **Never leave stale documentation.**
14. **Never write the project report.**
15. **Never add a dependency.**
16. **Never claim a sweep you did not run.**

---

# PART 5 · Definition of done

- [ ] All **27 capabilities re-proved signed out through the UI**; zero failures
- [ ] Contact, both registrations and a password reset verified **server-side**
- [ ] Consistency table produced; outliers fixed toward the majority
- [ ] `usePageMeta` applied to all sixteen pages with real values; auth pages `noindex`
- [ ] `index.html` metadata, Open Graph and Twitter tags correct
- [ ] `public/robots.txt` and `public/sitemap.xml` present and correct
- [ ] Leaflet route-split; Home does not download it — proven from the Network tab
- [ ] Every public image sized, reserved, and under budget
- [ ] Zero duplicate requests on mount on any page
- [ ] **Lighthouse Accessibility 100 and SEO 100** on Home, Browse, Produce, Markets
- [ ] Keyboard walk passes on all sixteen pages; skip link works on every one
- [ ] Zero clickable `div`s or `span`s; all contrast at AA
- [ ] Reduced motion stops everything; 200% zoom reflows
- [ ] `<html lang>`, landmarks, labelled nav
- [ ] Dead code removed; no guest wrapper over 40 lines
- [ ] Buyer, vendor and admin verified unchanged; six buyer catalogue pages screenshot-checked
- [ ] **Total guest line count reported: 20,796 → ?**
- [ ] README, DESIGN_SYSTEM public section, CATALOGUE_SHARING updated; human to-do consolidated
- [ ] `node tests/run_all.mjs` and `cd backend && npm test` both fully pass

---

# PART 6 · Verification gate

### The capability re-proof

27 rows driven through the UI, signed out, writes verified server-side. **Zero failures.**

### The 13-viewport sweep

Extend the sweep script to the sixteen public pages and run at
`320 · 360 · 390 · 430 · 600 · 768 · 820 · 1024 · 1180 · 1280 · 1440 · 1920 · 844x390`.

```bash
node tests/07_guest_sweep.mjs
```

**208 cells, every one zero.** The three that break public sites: **320** (Register's seven
fields), **844×390 landscape** (auth cards taller than the viewport — they must scroll, with
the submit button reachable), and **1920** (content must stay in its container).

### Build, runtime, design-rule audit

```bash
npm run build
npm run dev   # private window

grep -rnE "#[0-9a-fA-F]{3,8}" src/pages/guest src/components/guest src/components/catalogue --include="*.module.css"
grep -rnE ":[^;]*[0-9]+px" src/pages/guest src/components/guest src/components/catalogue --include="*.module.css" | grep -v "1px" | grep -v "0px"
grep -rnE "linear-gradient|radial-gradient|conic-gradient|backdrop-filter" src/pages/guest src/components/guest src/components/catalogue --include="*.module.css"
grep -rn ":global\|!important" src/pages/guest src/components/guest src/components/catalogue --include="*.module.css"
grep -rn "box-shadow" src/pages/guest src/components/catalogue --include="*.module.css" | grep -vE "shadow-menu|shadow-modal|shadow-control|shadow-none"
grep -rnE "@media[^{]*\(min-width:\s*(?!(480|768|1024|1280)px)" src/pages/guest src/components/catalogue --include="*.module.css"
git diff package.json
```

All empty; `max-height` landscape queries listed separately.

### Copy audit — the scope rule

```bash
grep -rniE "buy now|purchase|checkout|payment|pay online|secure payment|deliver|delivery|shipping|courier|verified farmer|certified|guarantee" src/pages/guest src/components/guest src/components/catalogue
```

Empty except the permitted `pay at the stall` / `pay in cash` / `collect`.

### Accent budget

Each of the sixteen pages at 390 and 1440: count visible beet elements and name them.
**Maximum two; auth pages one.** A 32-row table.

### SEO

For each page: `document.title`, `meta[name=description]`, `link[rel=canonical]`,
`meta[name=robots]`. Sixteen rows. Confirm auth pages are `noindex`.
Paste `robots.txt` and `sitemap.xml`. Paste the Lighthouse SEO score for four pages.

### Performance

- Bundle table; anything over 150KB justified
- **Leaflet not loaded on Home** — paste the Network tab evidence
- Image table: file, size, reserved dimensions, `loading` attribute
- Per-page request counts and duplicates (must be zero)
- Lighthouse: four categories × four pages

### Accessibility

Sixteen-row keyboard table; clickable div/span grep; contrast pairs and ratios;
`ink-faint`/carrot greps accounted for; reduced-motion walkthrough; 200% zoom; `lang` and
landmarks.

### Cross-role

```bash
git diff --stat src/pages/buyer src/pages/vendor src/pages/admin
```

Plus screenshots of the six buyer catalogue pages at 390 and 1440, confirmed unchanged.

### Line reduction

```bash
wc -l src/pages/guest/*.jsx src/pages/guest/*.css src/components/catalogue/* src/components/guest/*
```

**20,796 → ?** Report the total and the per-file table.

### Tests

```bash
node tests/run_all.mjs
cd backend && npm run seed && npm test
```

Both summaries. Everything passes.

---

# PART 7 · Report

```
Stage G5 status: PASS | FAIL

## Capability re-proof (27 rows, signed out, through the UI)
| # | capability | UI path | status | server-side effect verified |

## Consistency table
| axis | inconsistency | pages | resolved to |

## The sweep
<16 x 13 matrix>   Cells: 208   With findings: <n>

## SEO
| page | title | description | canonical | robots |   (16 rows)
robots.txt: <paste>   sitemap.xml: <paste>
Lighthouse SEO: <4 scores>

## Performance
Bundle:              <chunk table>
Leaflet on Home:     <not loaded — evidence>
Images:              <file, size, dimensions, loading>
Requests per page:   <count, duplicates, waterfalls, TTI>
Lighthouse:          <4 categories x 4 pages>

## Accessibility
Keyboard:            <16-row table>
Clickable div/span:  <grep>
Contrast:            <pairs and ratios>
ink-faint / carrot:  <accounted for>
Reduced motion:      <result>
200% zoom:           <result>
lang + landmarks:    <result>

## Design-rule audit
<all greps>

## Copy audit
<grep output>

## Accent budget
<32-row table>

## Line reduction
20,796 → <n>   (<n>% reduction)
<per-file table>

## Cross-role regression
git diff --stat:  <output>
Buyer catalogue screenshots: <unchanged?>

## Documentation
- README public routes + credentials + human to-do:  <yes/no>
- DESIGN_SYSTEM public site section:                 <yes/no>
- CATALOGUE_SHARING updated to what was built:       <yes/no>

## Human to-do (consolidated)
- <team names, contact details, coordinates, image licences, anything else>

## Ideas recorded, not built
- <anything>

## Found but not fixed
- <file:line>

## NOT verified
- <what and why>

## SRS traceability — public and auth
| requirement | route | component | endpoint | how verified |
| register with name, contact number, email, address | | | | |
| farmer registration with stall name, contact person, number, email, address | | | | |
| log in and securely access dashboard | | | | |
| browse markets by location and day | | | | |
| view stall profile: name, location, operating days, weekly stock | | | | |
| map with markers and directions | | | | |
| browse categories with price, category, market, day filters | | | | |
| product details: price, unit, quantity available, farmer | | | | |
| view reviews before ordering | | | | |
| about us | | | | |
| contact us with map | | | | |
| role-based access control | | | | |
```

Fix and re-run any failing gate. A failing capability row, a Lighthouse accessibility or SEO
score under 100, a non-zero sweep cell, or a public page that only works while signed in is a
**FAIL** — report it as one.
