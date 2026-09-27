# Stage 1 · Guest shell, primitives, and the shared-catalogue strategy

You are working on **MarketLink**, an existing React + Vite + Express + MongoDB app. This stage
is the foundation for a rebuild of the **public, unauthenticated site**.

Three jobs, in this order:

1. **Prove the public API.** Every guest capability gets curled **with no token**, because the
   whole site must work signed out and the client silently switches to `/api/public/...` mirrors.
2. **Decide and document the sharing strategy.** The guest side is 20,796 lines, most of it a
   second implementation of buyer pages. Stage 3 executes the fix; this stage designs it.
3. **Rebuild the shell**: `TopBar` (430 + 802 lines), `Footer`, `GuestBottomNav`, plus the
   primitives every public page is assembled from.

**You will not rebuild any page in this stage.**

---

# PART 1 · Project context

## 1.1 What MarketLink is

A platform connecting local farmers-market **Farmers** with **Customers**.
Tagline: *"Farm Fresh Just a Click Away."*

A Farmer runs a **stall** at a **market** open on specific days in specific windows. A Customer
browses what is actually available, **reserves** items, picks a pickup slot, then **collects in
person at the stall and pays there, in cash**.

**Hard scope limits — these bind marketing copy too:**

- **No payment gateway.** Never write "buy", "checkout", "secure payment", "pay online".
- **No delivery.** Never write "delivered to your door", "shipping", "fast delivery".
- **No identity or certification verification.** Never claim farmers are "verified" or "certified".

Getting this wrong on a marketing page is worse than getting it wrong in the app, because the
home page is the first thing a judge reads.

## 1.2 What the guest site is for

Three jobs, in priority order:

1. **Answer "what is this?"** in five seconds, honestly.
2. **Let someone browse the real catalogue without an account** — markets, stalls, produce,
   prices, opening days. This is the strongest possible argument for signing up.
3. **Convert to a registration**, as a Customer or as a Farmer.

Everything on the public site serves one of those three. Anything that serves none comes out.

## 1.3 Stack

- React 18.3, Vite 6, `react-router-dom` 6.28
- **CSS Modules only.** No Tailwind, no UI kit, **no new dependencies**.
- `lucide-react` icons, `leaflet` maps (OpenStreetMap, **no API key**)
- Alias `@` maps to `src`. Port **3000**, proxies `/api` to **4000**.

Fonts: **Idiqlat** serif for headings — **one weight only, 400**. **Inter** for UI and body.

## 1.4 Current guest structure

```
src/layouts/GuestLayout.jsx           52 lines   skip link · AnnouncementBar · TopBar ·
                                                 main · Footer · BackToTop · GuestBottomNav
src/layouts/GuestLayout.module.css    21 lines
src/components/layout/TopBar.jsx     430 lines   YOU REWRITE
src/components/layout/TopBar.module.css  802     YOU REWRITE
src/components/layout/Footer.jsx     102 + 165   YOU REWRITE
src/components/layout/GuestBottomNav.jsx 107 + 133   YOU REVIEW
src/components/layout/AnnouncementBar.jsx            already restyled in the buyer work
```

Routes (`src/routes/AppRoutes.jsx`, guest block):

```
/                  Home           709 jsx + 1118 css
/markets           Market         617 +  1416
/markets/:id       MarketDetail  1062 +  1572
/farmers           Farmers        897 +  1339
/farmers/:id       FarmerDetail   564 +   923
/products          Products       509 +   845
/products/:id      ProductDetail  870 +  1298
/about             About          470 +  1342
/contact           Contact        638 +  1009
/login             Login          324 +   509
/register          Register       853 +   666
/forgot-password   ForgotPassword 113 +   120
/reset-password    ResetPassword  201 +    95
(verify email)     VerifyEmail    238 +   197
/unauthorized      Unauthorized    47 +   104
*                  NotFound        45 +    86
```

**20,796 lines.** That is the problem this pack exists to solve.

## 1.5 `TopBar` today — read it before you touch it

430 lines. Desktop (≥1024): logo, centred nav links, `MarketDropdown`, Saved, Cart, Profile.
Below 1024: logo, compact market selector, cart, profile, hamburger opening a drawer with a
quick search, an icon list, shortcuts and an account CTA.

Two things to notice:

- It wraps `useAuth()` and `useCart()` in **try/catch** blocks returning `{}`. That is defensive
  code around a context that may be absent. Find out whether it actually can be — `GuestLayout`
  sits inside `AuthProvider` and `CartProvider` in `App.jsx`. If the providers are always
  present, **delete the try/catch**; silently swallowing a context error hides real bugs.
- Its local `isOpen` state is the drawer, not the `BottomSheet` prop bug. Do not "fix" it.

## 1.6 Off-limits

- `src/pages/buyer/**`, `src/pages/vendor/**`, `src/pages/admin/**` and their layouts
- `backend/**` — **you change no backend code.** You call it and report.
- `package.json` — no dependencies
- **Do not rebuild a guest page.** Pages are stages 2–4.

---

# PART 2 · Task 1 — the public API contract pass (do this FIRST)

Every guest capability, curled **with no Authorization header**, from a clean seed.

`src/api/catalog.js` prefixes `/public` automatically when there is no access token
(`const p = () => (getAccessToken() ? '' : '/public')`). So a signed-out visitor hits the public
mirror. **Curl the public paths**, not the authenticated ones.

## 2.1 The capability matrix — 27 rows

| # | Capability | Endpoint (signed out) | Used by |
|---|---|---|---|
| 1 | Public home payload | `GET /api/public/home` | Home |
| 2 | List markets | `GET /api/public/markets` | Markets index |
| 3 | Market detail | `GET /api/public/markets/:id` | Market page |
| 4 | Stalls at a market | `GET /api/public/markets/:id/farmers` | Market page |
| 5 | Produce at a market | `GET /api/public/markets/:id/products` | Market page |
| 6 | List stalls | `GET /api/public/farmers` | Stalls index |
| 7 | Stall detail | `GET /api/public/farmers/:id` | Stall page |
| 8 | Stall produce | `GET /api/public/farmers/:id/products` | Stall page |
| 9 | Stall reviews | `GET /api/public/farmers/:id/reviews` | Stall page |
| 10 | Stall pickup slots | `GET /api/public/farmers/:id/pickup-slots` | Stall page |
| 11 | List produce | `GET /api/public/products` | Browse |
| 12 | Produce detail | `GET /api/public/products/:id` | Produce page |
| 13 | Produce reviews | `GET /api/public/products/:id/reviews` | Produce page |
| 14 | Related produce | `GET /api/public/products/:id/related` | Produce page |
| 15 | Categories | `GET /api/categories` | Browse filters |
| 16 | Announcements | `GET /api/announcements` | `AnnouncementBar` |
| 17 | Contact form | `POST /api/contact` | Contact |
| 18 | Login | `POST /api/auth/login` | Login |
| 19 | Register customer | `POST /api/auth/register/customer` | Register |
| 20 | Register farmer | `POST /api/auth/register/farmer` | Register |
| 21 | Forgot password | `POST /api/auth/forgot-password` | Forgot |
| 22 | Reset password | `POST /api/auth/reset-password` | Reset |
| 23 | Verify email | `POST /api/auth/verify-email` | VerifyEmail |
| 24 | Resend verification | `POST /api/auth/resend-verification` | VerifyEmail |
| 25 | Refresh session | `POST /api/auth/refresh` | silent re-auth on load |
| 26 | Logout | `POST /api/auth/logout` | sign out |
| 27 | Current user | `GET /api/auth/me` | after login |

For each: method, path, **status with no token**, and a trimmed response body.

## 2.2 Four questions you must answer

1. **Does the public mirror return the same shape as the authenticated route?** Curl
   `/api/public/products/:id` and `/api/products/:id` (with a customer token) and **diff the
   keys**. If the public one omits fields, Stage 3 needs to know which. This single check
   determines whether the catalogue can be shared.
2. **Does `/api/public/markets/:id` include the `clock` object** the buyer redesign added? The
   public Market page wants the same open/closed line.
3. **Do the public list endpoints paginate the same way** (`meta.nextCursor`, `meta.hasMore`)?
4. **What do the auth endpoints return on the unhappy paths** — wrong password, duplicate email,
   unverified email, expired reset token, already-used verification token? Curl each
   deliberately and record the `error.code` and `error.message`. Stage 4 builds its messaging on
   these, and inventing them produces a form that shows the wrong error.

## 2.3 Rate limits

`backend/src/middleware/rateLimits.js` exists and the auth routes are limited. Find the actual
limits for login, register, forgot-password and contact, and record them. Stage 4 must handle
`429` with an honest message rather than a generic failure.

**Do not start Task 2 until this table is complete.**

---

# PART 3 · Task 2 — the sharing strategy

## 3.1 The problem, stated precisely

The buyer side has Browse, Produce, Stalls, Stall, Markets, Market. The guest side has the same
six pages, written twice, totalling **~11,700 lines**.

The content is identical. A produce page shows the same illustration, name, price, unit, stock
line, stall strip, related rows and reviews whether or not you are signed in. **Only the actions
differ:**

| Element | Signed in | Signed out |
|---|---|---|
| Add to basket | works | `Sign in to reserve` → `/login?next=/products/:id` |
| Favourite | works | `Sign in to save` |
| Pickup window picker | interactive | read-only display |
| Basket pill / count | shown | hidden |
| "Ask MarketLink" | shown | hidden |

That is a handful of conditionals, not a second codebase.

## 3.2 The strategy: one catalogue, two shells

**Write it down in this stage; Stage 3 executes it.**

Extract the six catalogue pages into shared, shell-agnostic components under
`src/components/catalogue/`:

```
src/components/catalogue/
  BrowseView.jsx        + .module.css     the produce grid + filters
  ProduceView.jsx       + .module.css     one produce item
  StallsView.jsx        + .module.css     the stall index
  StallView.jsx         + .module.css     one stall
  MarketsView.jsx       + .module.css     the market index
  MarketView.jsx        + .module.css     one market
```

Each takes an `audience` prop:

```jsx
/**
 * @param {'guest'|'buyer'} audience  chooses actions and link targets, never content
 */
export function ProduceView({ audience = 'guest' }) {}
```

Then each page in `src/pages/guest/` and `src/pages/buyer/` becomes a thin wrapper — a `Page`
frame, a document title, and `<ProduceView audience="guest" />`. Target: **under 40 lines each**.

## 3.3 Two rules that keep this from going wrong

**Rule 1 — `audience` may change actions and links. It may never change content.**

```jsx
/* right — an action differs */
{audience === 'buyer'
  ? <AddToCartButton productId={p.id} />
  : <Button to={`/login?next=/products/${p.id}`}>Sign in to reserve</Button>}

/* wrong — content differs; now you have two products pages again */
{audience === 'buyer' && <p>{p.description}</p>}
```

If you catch yourself hiding information from guests, stop. A public catalogue that hides prices
or stock defeats its own purpose.

**Rule 2 — link targets come from one map, not from scattered ternaries.**

```jsx
// src/components/catalogue/routes.js
export const CATALOGUE_ROUTES = {
  guest: { produce: (id) => `/products/${id}`,      stall: (id) => `/farmers/${id}`,
           market: (id) => `/markets/${id}`,        browse: '/products' },
  buyer: { produce: (id) => `/buyer/products/${id}`, stall: (id) => `/buyer/stalls/${id}`,
           market: (id) => `/buyer/markets/${id}`,   browse: '/buyer/products' },
};
```

One import, one lookup. Forty inline ternaries is how the two sides drift apart again.

## 3.4 What you deliver in this stage

Not the extraction — **the plan**. Write `docs/CATALOGUE_SHARING.md` containing:

- The six view components, their props, and which existing files each replaces
- The complete `audience` difference table (every place behaviour forks)
- The `CATALOGUE_ROUTES` map
- The public-vs-authenticated **field diff** from Task 2 question 1, and how each missing field
  is handled for guests
- The order Stage 3 should extract them in (simplest first: Markets, then Stalls, then Produce)
- A line-count estimate: current vs target

Then **verify the premise** by diffing one guest page against its buyer equivalent
(`src/pages/guest/ProductDetail.jsx` vs `src/pages/buyer/ProductDetail.jsx`) and reporting what
genuinely differs beyond the actions. If the pages turn out to be substantially different in
content, say so — the strategy changes and Stage 3 needs to know.

---

# PART 4 · Task 3 — the design direction

## 4.1 The brief

> **A clean white shopfront. The catalogue is the argument.**

The public site does not need to persuade with adjectives. It needs to show real markets, real
stalls and real prices, and then get out of the way.

## 4.2 White first

`background: var(--color-white)` on the page, header, footer and every card.

**Neutral hairlines.** Scope the token on the layout root, exactly as the buyer and admin shells
do — one declaration, reversible, no other role affected:

```css
/* GuestLayout.module.css */
.layout {
  --color-border:   var(--color-hairline);
  --color-bg-muted: var(--color-white);
}
```

`--color-canvas` survives only as: the footer background, produce image tiles, and a **single**
full-width band on Home (see below). Never as a general section background — the current Home
alternates canvas bands and that is where the beige comes from.

## 4.3 The accent budget — two per screen

The guest site is the one place a slightly larger budget is defensible, because conversion is
the job. But it is still **two**:

| Page | The two |
|---|---|
| Home | hero **Browse the market**, and the header **Sign up** |
| Catalogue pages | one **Sign in to reserve**, plus the header **Sign up** |
| Contact | **Send message**, plus header |
| Auth pages | the form's submit button; header CTA is hidden on auth pages |

Nav links are ink. The active nav link gets a 2px beet underline and that **counts as one** —
so on a page with an active nav link, the body gets one, not two.

## 4.4 Typography and voice

Idiqlat 400 for headings, Inter for everything else. **Sentence case.**

Marketing copy rules:

- **Say what it does, not how it feels.** "See what is on the stalls before you go" beats
  "Experience the freshness of local farming".
- **No exclamation marks. No emoji. No all-caps eyebrows.** The current Home has
  `WEEKEND GATHERINGS` and `THE GROWERS` as uppercase eyebrow labels — drop them or make them
  sentence case `--text-sm` `--color-ink-soft`.
- **Never imply payment or delivery.** Not once, anywhere.
- **Never claim verification.** Not "verified farmers", not "certified organic".

## 4.5 Breakpoints

**480 / 768 / 1024 / 1280** only. Every value from a `var(--token)`; no raw hex, no raw px
beyond `1px` hairlines.

---

# PART 5 · Task 4 — rebuild the shell

## 5.1 `GuestLayout.jsx` + `.module.css`

Add the two-line token scope. Keep: skip link, `AnnouncementBar`, `TopBar`, `main`, `Footer`,
`BackToTop`, `GuestBottomNav`, and the scroll-to-top on route change.

One change: `main` currently has `tabIndex={-1}` and no `key`. Add `key={location.pathname}` so
React remounts it on navigation — that, plus the existing scroll reset, makes the skip link land
correctly on every page.

## 5.2 `TopBar.jsx` + `.module.css` — 430 + 802 lines down to a target of **180 + 260**

**Below 1024px** — one row, 56px:

```
[ Logo ]                          [ 🔍 ]  [ Sign in ]  [ ☰ ]
```

**1024px and up** — one row, 68px:

```
[ Logo ]   [ Markets  Stalls  Produce  About  Contact ]   ——— [ 🔍 ] [ Sign in ] [ Sign up ]
```

Changes from today:

- **Six nav items become five.** Drop "Home" — the logo is the home link, universally. Rename
  "Farmers" to **"Stalls"** and "Products" to **"Produce"**, matching the buyer vocabulary.
- **Remove `MarketDropdown` from the guest bar.** A market selector is a signed-in preference;
  for a guest it is a filter that belongs on the Markets page. This alone removes a large
  amount of the 802 lines.
- **Remove the cart button and count.** A signed-out visitor has no basket. If `useCart()`
  returns a count for a guest, that is a bug — report it.
- **Remove "Saved".** Same reason.
- `Sign in` is a text link; `Sign up` is the one beet button.
- White background, `border-bottom: 1px solid var(--color-border)` **only when scrolled**
  (use a `transparent` border at rest so the box height never changes).
- Active nav link: `--color-ink`, `--weight-medium`, plus a 2px beet rule pinned to the bottom.
- `grid-template-columns: auto 1fr auto`; nav never wraps.

**The drawer** (below 1024) keeps the five nav links, the search field and the account CTAs.
Drop the "shortcuts" section. It must have proper focus management, which it currently lacks:

- focus moves to the close button on open
- focus **trapped** inside while open
- `Esc` closes
- focus **returns to the hamburger** on close
- background `inert`, `document.body` scroll locked

**Delete the try/catch around `useAuth()` and `useCart()`** if the providers are always present
(verify in `App.jsx`). Swallowing a context error hides real bugs. If a provider genuinely can
be absent, keep the guard but add a comment saying when and why.

## 5.3 `Footer.jsx` + `.module.css`

Four columns at 1024+, stacked below. `--color-canvas` background is **allowed here** — it is
the one warm anchor at the foot of the page.

- **Explore** — Markets, Stalls, Produce
- **MarketLink** — About, Contact, How it works
- **Account** — Sign in, Sign up as a customer, Sell at a market
- **A short honest line**: `Reserve online. Collect and pay at the stall.` — this is the product
  in one sentence and it belongs on every page.

Plus the wordmark, a copyright line, and an **OpenStreetMap attribution** if any page on the
site shows a map (it does). Attribution is a licence requirement, not a nicety.

## 5.4 `GuestBottomNav.jsx` — review, do not assume

107 lines. Read it and decide whether the public site needs a bottom nav at all.

A signed-out visitor is browsing, not operating an app. A bottom nav costs 64px of viewport on
every page and duplicates the drawer.

**Recommendation: remove it** and let `TopBar` plus the drawer carry navigation, returning that
height to the catalogue. If you disagree after reading it, keep it and justify the decision in
one paragraph. Either way, state the choice explicitly — this is a real design decision and
a judge may ask about it.

## 5.5 The primitives

Create in `src/components/guest/`:

**`GuestPage.jsx`** — width variants `wide` (1200) / `detail` (960) / `read` (720), the same
shape as the buyer `Page`. Reuse `src/components/layout/Page.jsx` if its widths suit; a second
near-identical component is exactly the duplication this pack is removing. Check first and say
which you chose.

**`Hero.jsx`** — the one large header block, used by Home and About only. Title, lead, up to two
actions, optional image. **No background image with a dark overlay** — the current Home has
`heroOverlay`, which is the pattern that makes every template look the same. White background,
large Idiqlat title, one image beside it at 768+.

**`SectionBand.jsx`** — a full-width section with an optional single `--color-canvas` background.
**At most one banded section per page**, and Home is the only page allowed to use it.

**`AuthCard.jsx`** — the centred card for all six auth pages: `--container-form` (440px), white,
hairline, `--radius-xl`, logo, title, one muted line, a slot, and a footer link slot. Building
this now means Stage 4 writes six pages with almost no CSS.

---

# PART 6 · Your skills for this stage

### Skill 1 · Curl signed out, in a private window

The refresh cookie will sign you back in and you will test the authenticated site by accident.
Every guest check happens with no token. This is the single easiest way to ship a broken public
site that works perfectly on your machine.

### Skill 2 · Diff the public and authenticated shapes before planning to share

The whole sharing strategy rests on the two responses being the same shape. Ten minutes of
`diff <(curl public) <(curl authed)` now saves Stage 3 from discovering it halfway through.

### Skill 3 · Delete defensive code that hides bugs

`try { useAuth() } catch { return {} }` turns a missing-provider crash into a silently
signed-out UI. If the provider is always there, the guard only conceals. Verify, then delete.

### Skill 4 · Remove before you redesign

The 802-line `TopBar` CSS is large partly because the bar does things a guest bar should not:
a market selector, a cart, a saved list. Removing those is most of the reduction, and it makes
the remaining design obvious.

### Skill 5 · One route map, not forty ternaries

`CATALOGUE_ROUTES[audience].produce(id)` is one import. Inline `audience === 'buyer' ? ... : ...`
at every link is how the two sides drift back apart within a month.

### Skill 6 · `audience` changes actions, never content

The moment a guest sees less information than a buyer, the public catalogue stops being an
argument for signing up. Actions fork. Content does not.

### Skill 7 · Hero images with dark overlays are the template tell

A large photo with a translucent scrim and centred white text is the single most templated
pattern on the web. White background, a large serif line, real content beside it — and the page
immediately looks considered.

### Skill 8 · Attribution is a licence, not a footer nicety

OpenStreetMap tiles require attribution. The SRS also flags image licensing as a project
constraint. One line in the footer covers it.

---

# PART 7 · Hard rules — never do these

1. **Never build UI on an endpoint you have not curled signed out.**
2. **Never test the guest site while signed in.** Private window, always.
3. **Never touch `backend/`.** Report; do not fix.
4. **Never rebuild a guest page** in this stage.
5. **Never edit `tokens.css`.** Re-scope on `.layout`.
6. **Never write copy implying payment, delivery, or verification.**
7. **Never use an uppercase eyebrow label, an exclamation mark, or an emoji.**
8. **Never use a hero image with a dark overlay.**
9. **Never use more than one `--color-canvas` band per page**, and only on Home.
10. **Never exceed two beet elements** on a rendered screen.
11. **Never keep a cart, basket count, or saved list in the guest top bar.**
12. **Never leave the drawer without focus management.**
13. **Never use a raw hex or raw px**, a gradient, a card shadow, `!important` or `:global`.
14. **Never add a dependency. Never touch buyer, vendor or admin pages.**
15. **Never report PASS without the 27-row capability table and the sharing plan.**

---

# PART 8 · Definition of done

- [ ] 27-row capability table, all curled **with no token**, statuses and shapes pasted
- [ ] Public vs authenticated **key diff** for at least products, farmers and markets
- [ ] Auth unhappy-path `error.code` / `error.message` recorded for all six failure cases
- [ ] Rate limits for login, register, forgot-password and contact recorded
- [ ] `docs/CATALOGUE_SHARING.md` written: six views, props, `audience` fork table,
      `CATALOGUE_ROUTES`, field-diff handling, extraction order, line-count targets
- [ ] The premise verified by diffing one guest page against its buyer equivalent
- [ ] `GuestLayout` scopes `--color-border` and `--color-bg-muted`; `main` keyed on pathname
- [ ] `TopBar` rebuilt: five nav items, no market dropdown, no cart, no saved,
      border only on scroll, `Sign up` the one beet element
- [ ] `TopBar.jsx` under **200 lines**, `TopBar.module.css` under **300** — state both
- [ ] Drawer: focus in, trapped, `Esc`, focus returns, body locked, background `inert`
- [ ] try/catch around contexts removed, or justified in a comment
- [ ] `Footer` rebuilt with four columns, the product sentence, and OSM attribution
- [ ] `GuestBottomNav` decision made and justified
- [ ] `GuestPage` / `Hero` / `SectionBand` / `AuthCard` exist with both exports and JSDoc
- [ ] `Page.jsx` reuse evaluated rather than duplicated
- [ ] Every existing guest page still loads signed out with no console error
- [ ] Buyer, vendor and admin render exactly as before

---

# PART 9 · Verification gate

### Capability table

27 rows: capability, method, path, **status with no token**, response excerpt.
Plus the three key-diffs, the six auth error codes, and the four rate limits.

### A1 build · A2 runtime

```bash
npm run build      # last 15 lines, zero errors, zero new warnings
npm run dev
```

**In a private window**, load `/`, `/markets`, `/farmers`, `/products`, `/about`, `/contact`,
`/login`, `/register`. Zero console errors. Zero failed requests. Confirm every catalogue
request went to `/api/public/...` — paste three request URLs from the Network tab as proof.

### A3 · Token purity and size

```bash
grep -rnE "#[0-9a-fA-F]{3,8}" src/components/layout/TopBar.module.css src/components/layout/Footer.module.css src/components/guest src/layouts/GuestLayout.module.css
grep -rnE ":[^;]*[0-9]+px" src/components/layout/TopBar.module.css src/components/guest | grep -v "1px" | grep -v "0px"
grep -rnE "linear-gradient|radial-gradient|backdrop-filter|!important|:global" src/components/layout/TopBar.module.css src/components/layout/Footer.module.css src/components/guest
wc -l src/components/layout/TopBar.jsx src/components/layout/TopBar.module.css src/components/layout/Footer.jsx src/components/layout/Footer.module.css
git diff src/styles/tokens.css        # empty
git diff package.json                 # empty
```

Report before and after line counts for `TopBar` and `Footer`.

### A7 · Accent budget

```bash
grep -rn "color-primary\|color-beet" src/components/layout/TopBar.module.css src/components/layout/Footer.module.css src/components/guest
```

Name every hit. At most two visible per screen.

### Copy audit — the scope rule

```bash
grep -rniE "buy now|purchase|checkout|payment|pay online|secure payment|deliver|delivery|shipping|courier|verified farmer|certified" src/components/layout/TopBar.jsx src/components/layout/Footer.jsx src/components/guest
```

Must be empty. Any hit must be removed or explicitly justified.

### Drawer accessibility

At 390px: open the drawer. Record — where focus landed, how many Tab stops before it cycled,
that it did **not** escape, that `Esc` closed it, that focus returned to the hamburger, that
body scroll was locked, that the background was `inert`. Seven answers.

### Guest state proof

In a private window with no session, confirm: no basket count anywhere, no "Saved" link, no
market dropdown, `Sign in` and `Sign up` both present and working. Then sign in and confirm the
top bar still behaves (it is shared with nothing, but a signed-in visitor can still land on `/`).

### B1 · Responsive sweep

At **360, 390, 768, 1024, 1440** on `/`, `/markets`, `/products`, `/login`:

```js
const { layoutCheck } = await import('/src/dev/layoutCheck.js');
console.table(layoutCheck());
```

Findings on the un-rebuilt pages are expected — record them as a **baseline for stages 2–4**,
and fix only horizontal overflow, overlapping fixed elements and sub-44px targets in the shell.

### Cross-role regression

Load `/buyer`, `/vendor`, `/admin`. Confirm unchanged, or name what differs.

### Tests

```bash
node tests/run_all.mjs
```

All suites pass. `tests/01_guest.mjs` exercises the public pages; if the nav rename breaks a
selector, update the test to the new label rather than keeping the old one.

---

# PART 10 · Report

```
Stage G1 status: PASS | FAIL

## Capability table (27 rows, no token)
| # | capability | method | path | status | response excerpt |

## Shape diffs
- products  public vs authed: <missing keys>
- farmers   public vs authed: <missing keys>
- markets   public vs authed: <missing keys; does clock exist?>
- pagination shape on public lists: <same/different>

## Auth error vocabulary
| case | code | message |
| wrong password · duplicate email · unverified email · expired reset · used verify · rate limited |

## Rate limits
| route | limit |

## Sharing strategy
- docs/CATALOGUE_SHARING.md written: <yes/no>
- guest vs buyer ProductDetail diff: <what genuinely differs beyond actions>
- premise holds? <yes/no — if no, what changes for Stage 3>
- line-count target: <current → target>

## What I changed
- <file> — <one line>

## Gate results
A1 build / A2 runtime:  <output + 3 /api/public/ request URLs>
A3 purity + sizes:      <output; TopBar before/after, Footer before/after>
A7 accent budget:       <hits named>
Copy audit:             <grep output>
Drawer a11y:            <7 answers>
Guest state proof:      <no cart / no saved / no dropdown>
B1 layoutCheck:         <baseline>
Cross-role:             <unchanged / differences>
Tests:                  <summary>

## Decisions made
- GuestBottomNav: <kept/removed + one paragraph>
- Page.jsx reuse:  <reused / new GuestPage + why>
- context try/catch: <removed / kept + why>

## Found but not fixed
- <file:line>

## NOT verified
- <what and why>
```

If any gate fails, **fix it and re-run it.** A capability table with blanks, a missing sharing
plan, or a guest page that only works while signed in is a **FAIL**.
