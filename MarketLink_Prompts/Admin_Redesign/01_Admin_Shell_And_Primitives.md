# Stage 1 · Admin shell, primitives, and the API contract pass

You are working on **MarketLink**, an existing React + Vite + Express + MongoDB app. This stage
is the foundation for a redesign of the **Admin console**.

Two jobs, in this order:

1. **Prove what the backend actually does.** Every admin capability gets curled before any UI is
   built on it. Four admin modals are currently dead and nobody noticed — that is what happens
   without this pass.
2. **Build the shell and the six primitives** every admin page is assembled from.

**You will not rebuild any admin page in this stage.** Pages come in stages 2–4.

---

# PART 1 · Project context

## 1.1 What MarketLink is

A platform connecting local farmers-market **Farmers** with **Customers**. A Farmer runs a
**stall** at a **market** open on specific days. A Customer reserves produce and **collects in
person at the stall, paying cash**. **No payment gateway. No delivery. Ever.**

The **Admin** is the platform operator. From the SRS (1.6, "Admin Features"):

> Admin can securely log in to a **dedicated dashboard separate from the Customer and Farmer
> views**. The dashboard should summarize key platform metrics such as **total Farmers, total
> customers, total markets, and total orders**.
>
> Admin can **view, approve, or suspend Farmer registrations before they can list products**.
> Admin can **view, activate, or deactivate customer accounts** in case of policy violations.
>
> Admin can **add, edit, or remove farmers markets**, including name, address, operating days,
> timings, and map coordinates or embedded map links.
>
> Admin can **view and remove inappropriate product listings or customer reviews**.
>
> Admin can view **platform-wide reports covering total orders, revenue summary across markets,
> and the most active Farmers**.
>
> Admin can manage master data such as **product categories** and publish **platform-wide
> notifications or announcements**.

Every one of those is mandatory and must actually work against the real API.

## 1.2 Stack

- React 18.3, Vite 6, `react-router-dom` 6.28
- **CSS Modules only.** `*.module.css` beside each component. Globals in `src/styles/`.
- **No Tailwind, no UI kit, no new dependencies.**
- `lucide-react` icons, `leaflet` maps (OpenStreetMap, no API key)
- Alias `@` maps to `src`. Frontend port **3000**, proxies `/api` to **4000**.
- Backend: Express 5 + native MongoDB driver, module-per-feature under
  `backend/src/modules/admin/`, routes declared via `defineRoutes` arrays (not `router.get`).

Fonts: **Idiqlat** serif for headings — **one weight only, 400**. **Inter** for UI and body.

## 1.3 Current admin structure

```
src/layouts/AdminLayout.jsx        242 lines   YOU REWRITE
src/layouts/AdminLayout.module.css 320 lines   YOU REWRITE
src/pages/admin/Overview.jsx       188 lines   stage 2
src/pages/admin/Reports.jsx        227 lines   stage 2
src/pages/admin/People.jsx         571 lines   stage 3
src/pages/admin/Moderation.jsx     234 lines   stage 3
src/pages/admin/Markets.jsx        532 lines   stage 4
src/pages/admin/Settings.jsx       721 lines   stage 4  (four unrelated jobs in one file)
src/api/admin.js                   the complete admin client — 30 wrappers
```

`AdminLayout` today: a fixed **248px sidebar** at 1024+, a mobile top bar + right drawer below
1024, six nav items with badge counts, an `AdminContext` exposing
`{ overview, pendingFarmers, openFlags, unhandledMessages, refreshOverview }`, and a 45s poll
via `useVisibleInterval`. **Keep all of that behaviour.** You are changing how it looks and
fixing two defects, not how it works.

## 1.4 Confirmed defects you fix in this stage

| Defect | Location | Effect |
|---|---|---|
| `isOpen` passed to `<BottomSheet>`, which reads `open` | `Markets.jsx:339` | Market create/edit sheet **never opens** |
| same | `People.jsx:339` | Person detail sheet **never opens** |
| same | `Settings.jsx:602` | Category editor **never opens** |
| same | `Settings.jsx:658` | Announcement editor **never opens** |
| A **function** passed to `aria-current` on `NavLink` | `AdminLayout.jsx` | Invalid DOM attribute; `NavLink` already sets `aria-current="page"` itself, so it is wrong **and** redundant |
| `--color-wood-line` used directly for every border | `AdminLayout.module.css` | Tan hairlines tint the console beige |

The same `isOpen` bug exists at ~16 vendor call sites. **Out of scope — record, do not fix.**

## 1.5 Off-limits

- `src/pages/buyer/**`, `src/pages/vendor/**`, `src/pages/guest/**` and their layouts
- `backend/**` — **you change no backend code in this stage.** You only call it and report.
- `package.json` — no dependencies
- `src/components/ui/BottomSheet.jsx` — buyer and vendor depend on it; do not change its props
- **Do not rebuild an admin page.** Pages are stages 2–4.

---

# PART 2 · Design direction for the console

## 2.1 The brief

> **A quiet white operations desk. Dense where it must be, calm everywhere else.**

The Customer app is a market. The admin console is a **desk**: tables, counts, queues, and
actions with consequences. It shares the same tokens and the same restraint, but its density
budget is different — an operator scanning 200 farmers needs rows, not cards.

## 2.2 White first

- `background: var(--color-white)` on the shell, the sidebar, every panel, every table.
- `--color-canvas` never appears as a background in admin.
- **Neutral hairlines.** `AdminLayout.module.css` uses `--color-wood-line` (`#E3D3B8`, a tan)
  for every border. Replace the *default* by re-scoping the token on the layout root — CSS
  custom properties cascade, so one declaration re-skins the whole subtree and touches no other
  role:

```css
/* AdminLayout.module.css */
.layout {
  --color-border:   var(--color-hairline);       /* rgba(46,43,38,0.10) */
  --color-bg-muted: var(--color-white);
}
```

Then replace every literal `var(--color-wood-line)` in that file with `var(--color-border)`.
**Do not edit `tokens.css`.** The hairline tokens already exist from the buyer redesign.

## 2.3 The accent budget — two per screen

At most **two** beet elements on any admin screen:

- the **active sidebar item**, and
- the **one primary action** on the page (e.g. "Add market")

Everything else is ink, hairline and state colour. Specifically:

| Colour | Allowed | Never |
|---|---|---|
| Beet `#7A2E3B` | Active nav, one primary button, focus ring | Headings, table values, decoration |
| Danger `#B3261E` | Destructive confirm button (second step only), error text | Anything routine |
| Carrot text `#9C4E14` | "Pending", "Needs attention" | Decoration |
| Herb `#5C7048` | "Approved", "Active", "Resolved" | Decoration |
| Ink / ink-soft | All text, all icons | — |

**Attention badges** in the sidebar currently fill solid beet. That is a third and fourth beet
element on every screen. Change them: `background: var(--color-carrot-bg)`,
`color: var(--color-carrot-text)`, `1px solid var(--color-carrot-bg)`. They signal *attention*,
not *action*, so they must not compete with the primary button.

## 2.4 Density budget

Admin is denser than buyer, deliberately:

- Table row height **44px** minimum (still a tap target), `--text-sm`
- Page: title + one context line + filter bar + table. Nothing else above the fold.
- At 1024+, content max width **1280px** (raise from the current 1200).

## 2.5 Voice

Operational and exact. "12 farmers awaiting approval." "Suspended by you on 24 Sep."
"This removes the listing from the public catalogue." No exclamation marks, no emoji, no
"successfully". Sentence case everywhere.

---

# PART 3 · Task 1 — the API contract pass (do this FIRST, write no UI)

**This is the most important task in the stage.** Four modals shipped dead because nobody
verified. You will verify all thirty admin capabilities before a single component is written.

## 3.1 Get an admin token

```bash
# credentials are in backend/src/db/seed.js
curl -s -X POST localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"<admin email>","password":"<admin password>"}' | head -c 600
```

Export the access token as `$T`. Then `AUTH="-H \"Authorization: Bearer $T\""`.

## 3.2 Curl every capability

For each row: run it, record **method, path, HTTP status, and a trimmed response body**.
Where a body is required, send a realistic one. Where an action is destructive, run it against a
throwaway record you create first.

| # | Capability | Client wrapper (`src/api/admin.js`) | Endpoint |
|---|---|---|---|
| 1 | Platform overview | `getAdminOverview` | `GET /admin/overview` |
| 2 | List farmers | `getAdminFarmers(query)` | `GET /admin/farmers` |
| 3 | Approve farmer | `approveFarmer(id)` | `POST /admin/farmers/:id/approve` |
| 4 | Reject farmer | `rejectFarmer(id, reason)` | `POST /admin/farmers/:id/reject` |
| 5 | Suspend farmer | `suspendFarmer(id, reason)` | `POST /admin/farmers/:id/suspend` |
| 6 | Reinstate farmer | `reinstateFarmer(id)` | `POST /admin/farmers/:id/reinstate` |
| 7 | List customers | `getAdminCustomers(query)` | `GET /admin/customers` |
| 8 | Deactivate customer | `deactivateCustomer(id, reason)` | `POST /admin/customers/:id/deactivate` |
| 9 | Activate customer | `activateCustomer(id)` | `POST /admin/customers/:id/activate` |
| 10 | Combined people list | **no wrapper exists** | `GET /admin/people` |
| 11 | List markets | `getAdminMarkets(query)` | `GET /admin/markets` |
| 12 | Create market | `createMarket(body)` | `POST /admin/markets` |
| 13 | Update market | `updateMarket(id, patch)` | `PATCH /admin/markets/:id` |
| 14 | Delete market | `deleteMarket(id, force)` | `DELETE /admin/markets/:id` |
| 15 | Moderation queue | `getModerationFlags(query)` | `GET /admin/moderation` |
| 16 | Resolve flag | `resolveModerationFlag(id, {action, note})` | `POST /admin/moderation/:id/resolve` |
| 17 | Remove product | `removeProductByAdmin(id, note)` | `POST /admin/products/:id/remove` |
| 18 | Remove review | `removeReviewByAdmin(id, note)` | `POST /admin/reviews/:id/remove` |
| 19 | Reports summary | `getAdminReportsSummary(range)` | `GET /admin/reports/summary` |
| 20 | Reports history | `getReportsHistory()` | `GET /admin/reports/history` |
| 21 | Export CSV | `exportAdminReport(type, range)` | `GET /admin/reports/export` |
| 22 | Sales CSV | **no wrapper exists** | `GET /admin/reports/sales.csv` |
| 23 | List categories | `getAdminCategories()` | `GET /admin/categories` |
| 24 | Create category | `createAdminCategory(data)` | `POST /admin/categories` |
| 25 | Update category | `updateAdminCategory(id, data)` | `PATCH /admin/categories/:id` |
| 26 | Delete category | `deleteAdminCategory(id)` | `DELETE /admin/categories/:id` |
| 27 | Reorder categories | `reorderAdminCategories(order)` | see **3.3** |
| 28 | List announcements | `getAdminAnnouncements()` | `GET /admin/announcements` |
| 29 | Create announcement | `createAdminAnnouncement(data)` | `POST /admin/announcements` |
| 30 | Update announcement | `updateAdminAnnouncement(id, data)` | `PATCH /admin/announcements/:id` |
| 31 | Publish announcement | `publishAdminAnnouncement(id)` | `POST /admin/announcements/:id/publish` |
| 32 | Delete announcement | `deleteAdminAnnouncement(id)` | `DELETE /admin/announcements/:id` |
| 33 | List messages | `getAdminMessages(query)` | `GET /admin/messages` |
| 34 | Handle message | `handleAdminMessage(id, reply)` | `POST /admin/messages/:id/handle` |
| 35 | Platform settings | `getPlatformSettings()` | `GET /admin/settings` |
| 36 | Update settings | `updatePlatformSettings(data)` | `PATCH /admin/settings` |
| 37 | Email log | **no wrapper exists** | `GET /admin/email-log` |

## 3.3 Four specific mismatches to resolve

The backend route definitions live in arrays passed to `defineRoutes`, so
`grep "router.get"` finds nothing. Read the `routes = [...]` array in each
`backend/src/modules/admin/**/*.routes.js` to get the real `method` and `path`.

Resolve each of these and state the answer:

1. **Category reorder.** The client calls `PUT /admin/categories/order`. The route files
   contain **both** a `/order` path and a `/reorder` path. Which one exists, with which method?
   If the client is calling the wrong one, **fix the client wrapper** (`src/api/admin.js`) —
   that is a one-line change and it is in scope.
2. **`GET /admin/reports/history`.** A `/history` path exists. Confirm its method and shape.
3. **`DELETE /admin/markets/:id`.** The client sends **both** `?force=true` **and** a JSON body.
   Determine which the server reads. Many stacks ignore a DELETE body. Fix the client to send
   only what the server actually reads.
4. **`GET /admin/email-log`.** It exists on the server with no client wrapper. Record its shape;
   stage 4 decides whether to surface it.

## 3.4 Also prove the guards

For three representative endpoints (one read, one write, one destructive), call each:

- with **no token** → expect `401`
- with a **customer** token → expect `403`
- with a **farmer** token → expect `403`

If any admin endpoint answers a non-admin, **stop and report it as a security finding**. Do not
build UI on it and do not try to fix the backend here.

## 3.5 Output

A table with one row per capability: `#, capability, method, path, status, body excerpt,
wrapper correct? (yes/no/fixed)`. Plus a short list of every mismatch you fixed in
`src/api/admin.js`, and the guard results.

**Do not start Task 2 until this table is complete.**

---

# PART 4 · Task 2 — rewrite the shell

## 4.1 `AdminLayout.module.css`

- Add the two-line token scope at the top of `.layout` (see 2.2).
- Replace every `var(--color-wood-line)` with `var(--color-border)`.
- Sidebar: white, `border-right: 1px solid var(--color-border)`, width **264px** (from 248 —
  six labels plus badges are tight), `padding: var(--space-6) var(--space-3)`.
- Active nav item: `background: var(--color-beet-tint)`, `color: var(--color-primary)`, plus a
  `2px` beet rule on the **left edge** (`box-shadow: inset 2px 0 0 var(--color-primary)` — an
  inset shadow, not a border, so the box does not shift by 2px).
- Badges: carrot-bg / carrot-text as in 2.3. `min-width: 20px`, `height: 20px`,
  `font-variant-numeric: tabular-nums`.
- Content: `max-width: 1280px`, `padding: var(--space-6) var(--space-4)`, rising to
  `var(--space-8)` at 1280+.
- Mobile top bar: raise `min-height` from `var(--tap-min)` to **56px** so the brand and the menu
  button are not cramped, `border-bottom: 1px solid var(--color-border)`.
- Remove the beet-tinted custom scrollbar rules on the sidebar; use the project-wide thin
  scrollbar already defined globally.

## 4.2 `AdminLayout.jsx`

Keep `AdminContext`, the 45s `useVisibleInterval` poll, the six nav items, badge counts, the
sign-out handler and the "Customer app" link. Change exactly these:

1. **Delete the `aria-current` prop** from `<NavLink>`. `NavLink` sets it itself. Keep your
   `aria-label` (it carries the badge count, which is genuinely useful).
2. **Fix the mobile drawer.** It currently has `role="dialog" aria-modal="true"` but no focus
   management. Add:
   - focus moves to the drawer close button on open
   - focus **trapped** inside while open (Tab cycles, does not escape)
   - `Esc` closes it
   - focus **returns to the menu button** on close
   - the page behind gets `inert` (or `aria-hidden` plus the trap)
   - `document.body` scroll locked while open
3. **Add a page-level `<h1>` slot.** The layout renders no heading; each page owns its `<h1>`.
   Confirm every admin page has exactly one (stages 2–4 enforce it).
4. Add a **"Signed in as"** line above the sidebar footer: the admin name and email in
   `--text-sm` / `--color-ink-soft`. An operator with three consoles open needs to know which.

## 4.3 Fix the four dead modals

In `Markets.jsx:339`, `People.jsx:339`, `Settings.jsx:602`, `Settings.jsx:658`, change
`isOpen={...}` to `open={...}`.

**That is the only change you make to those four files in this stage.** Do not restyle them, do
not refactor them. Then **open each of the four modals in the browser** and confirm it appears.
Screenshot or describe each.

---

# PART 5 · Task 3 — the six primitives

Every admin page in stages 2–4 is assembled from these. Create each in
`src/components/admin/`.

## 5.1 `AdminPage.jsx` + `.module.css`

```jsx
/**
 * Admin page frame: the single <h1>, one context line, a primary action slot,
 * and the content column. Every admin page renders exactly one of these.
 *
 * @param {string}          title    the h1, sentence case
 * @param {React.ReactNode} context  one muted line, e.g. "12 awaiting approval"
 * @param {React.ReactNode} action   the ONE primary button, right-aligned
 * @param {React.ReactNode} children
 */
export function AdminPage({ title, context, action, children }) {}
```

`.title` is Idiqlat `--text-h1` weight 400. `.context` is `--text-sm` `--color-ink-soft`.
Header row is flex, `space-between`, `align-items: flex-end`, wrapping under 480.

## 5.2 `DataTable.jsx` + `.module.css`

The workhorse. **Build it once, properly.**

```jsx
/**
 * Admin data table. Responsive: a real <table> at 768px and up, stacked cards below.
 *
 * @param {Array}  columns   [{ key, header, width, align, render?, sortable?, hideBelow? }]
 * @param {Array}  rows      data; each needs a stable `id`
 * @param {string} rowKey    defaults to 'id'
 * @param {boolean} loading  renders a skeleton matching the column layout
 * @param {React.ReactNode} empty  what to show when rows is empty
 * @param {object} sort      { key, direction } — controlled
 * @param {Function} onSort  (key) => void
 * @param {Array}  selected  ids, when selection is enabled
 * @param {Function} onSelect  (ids) => void; omit to disable selection
 * @param {Function} onRowClick  optional; makes rows activatable
 */
```

Requirements:

- A real `<table>` with `<thead>`, `<tbody>`, `<th scope="col">`. Not divs with ARIA.
- **Sortable headers are `<button>`s inside the `<th>`**, with
  `aria-sort="ascending|descending|none"` on the `<th>`. Never sort by clicking a bare `<th>`.
- **Below 768px the table becomes stacked cards** — one card per row, each cell as a
  label/value pair using the column `header` as the label. A horizontally scrolling table on a
  phone is unusable. Columns marked `hideBelow: 768` are omitted from the card.
- Row height `min-height: 44px`; cells `--text-sm`; numeric cells `tabular-nums` and
  `text-align: right`.
- Zebra striping is **not** allowed (it breaks white-first). Rows are separated by
  `1px solid var(--color-hairline-soft)`. Hover: `background: var(--color-canvas-soft)`.
- Selection: a real `<input type="checkbox">` per row with an `aria-label` naming the row, plus
  a header checkbox with **indeterminate** state set via a ref
  (`el.indeterminate = some && !all`) — it cannot be set from an attribute.
- `loading` renders skeleton rows **in the same column layout**, not a spinner.
- Sticky `<thead>` at `top: 0` within a scroll container, white background, hairline bottom.

## 5.3 `FilterBar.jsx` + `.module.css`

```jsx
/**
 * Search + filter row above a DataTable. All state is owned by the page and mirrored
 * into the URL, so a filtered admin view is linkable and survives a refresh.
 *
 * @param {string} search · @param {Function} onSearchChange   (debounced by the page, 250ms)
 * @param {Array}  filters  [{ key, label, options:[{value,label}], value }]
 * @param {Function} onFilterChange  (key, value) => void
 * @param {number} resultCount · @param {Function} onReset
 * @param {React.ReactNode} trailing  e.g. an export button
 */
```

Search input `--control-h` with a `Search` icon. Filters are `<select>`s with visible `<label>`s
(admin is a desk — a labelled select beats a chip row here). Result count and Reset on the right.

## 5.4 `StatTile.jsx` + `.module.css`

```jsx
/**
 * One platform metric. Value, label, and an optional delta with direction.
 *
 * @param {string|number} value · @param {string} label
 * @param {string} delta      e.g. "+12 this week"
 * @param {'up'|'down'|'flat'} direction
 * @param {string} to         optional; makes the whole tile a link to the relevant page
 */
```

White, `1px solid var(--color-border)`, `--radius-lg`, `--card-padding`. Value is Inter **600**
at `--text-h2` with `tabular-nums` — **not** beet, not Idiqlat. Label `--text-sm` ink-soft.
Delta `--text-sm`; `up` herb, `down` danger, `flat` ink-soft. **Direction is also stated in the
text**, never by colour alone.

## 5.5 `BulkBar.jsx` + `.module.css`

Appears when `selected.length > 0`. Sticky to the bottom of the content area, white, hairline
top, `--shadow-menu`. Shows `3 selected`, a Clear button, and the bulk actions. Announced with
`role="status"` so a screen reader hears the selection change.

## 5.6 `ConfirmDialog.jsx` + `.module.css`

**Every destructive admin action goes through this.** No bare `onClick={deleteThing}` anywhere
in the console.

```jsx
/**
 * Two-step destructive confirmation.
 *
 * @param {boolean}  open
 * @param {string}   title        "Remove this listing?"
 * @param {string}   body         what will happen, in plain words
 * @param {string}   confirmLabel "Remove listing"
 * @param {boolean}  requireReason  when true, a reason textarea is shown and required
 * @param {string}   typeToConfirm  when set, the operator must type this string exactly
 * @param {Function} onConfirm    (reason) => Promise
 * @param {Function} onClose
 */
```

- A real modal: `role="dialog" aria-modal="true"`, labelled by its title, **focus trapped**,
  focus returns to the trigger, `Esc` closes, backdrop click closes.
- The confirm button is **danger, not beet**, and is `disabled` until the reason (or the typed
  string) is valid.
- `typeToConfirm` is used for the genuinely irreversible: deleting a market that has stalls.
- While the promise is in flight the button reads `Removing…` and is disabled. On failure the
  dialog **stays open** and shows the server message — never close a dialog on an error.

---

# PART 6 · Your skills for this stage

### Skill 1 · Curl before you build

A UI built on an unverified endpoint is a guess. The four dead modals in this codebase are what
that costs. Task 1 exists so that stages 2–4 can move fast on facts.

### Skill 2 · Re-scope a token instead of find-and-replacing a colour

One declaration on `.layout` re-skins every descendant and is reversible by deleting one line.
Never sweep a colour change across twelve files.

### Skill 3 · `inset box-shadow` for an active-edge rule

```css
.navItemActive { box-shadow: inset 2px 0 0 var(--color-primary); }
```

A `border-left` changes the box width and shifts the label 2px when the item becomes active.
An inset shadow paints inside the existing box, so nothing moves.

### Skill 4 · A table is a `<table>`

`<div role="row">` is a table that works for nobody. Real table semantics give you column
headers, row/column announcement, and `aria-sort` for free. Reach for divs only when the data is
genuinely not tabular — and admin data always is.

### Skill 5 · Checkbox `indeterminate` is a property, not an attribute

```jsx
<input type="checkbox" ref={(el) => { if (el) el.indeterminate = some && !all; }} />
```

There is no `indeterminate=""` in HTML. It must be set on the DOM node.

### Skill 6 · Stack tables on phones; never scroll them sideways

Below 768, render each row as a card of label/value pairs. A horizontally scrolling table hides
the columns that matter and fails every touch-target check.

### Skill 7 · A dialog that fails stays open

Closing on error throws away what the operator typed and hides why it failed. Keep it open,
show the server message, leave the reason text intact.

### Skill 8 · Attention is not action

Sidebar badges say "look here"; the primary button says "press me". Give them different colours
or they compete, and the two-accent budget is spent before the page even renders.

---

# PART 7 · Hard rules — never do these

1. **Never build UI on an endpoint you have not curled.**
2. **Never touch `backend/`** in this stage. Report; do not fix.
3. **Never rebuild an admin page.** Only the four one-word `isOpen` fixes.
4. **Never edit `tokens.css`.** Re-scope on `.layout`.
5. **Never fix the `isOpen` bug outside the four admin files.** Record the vendor ones.
6. **Never use a raw hex or raw px** in a `.module.css`. `1px` hairlines only.
7. **Never use a gradient, a card shadow, `backdrop-filter`, `!important` or `:global`.**
8. **Never exceed two beet elements** on a rendered screen. Badges are carrot, not beet.
9. **Never build a table from divs.**
10. **Never ship a destructive action without `ConfirmDialog`.**
11. **Never signal state by colour alone.** Deltas and statuses carry words.
12. **Never add a dependency.**
13. **Never weaken a backend guard**, and if you find one already weak, report it and stop.
14. **Never report PASS without the capability table.**

---

# PART 8 · Definition of done

- [ ] Capability table complete: all 37 rows curled, with status and body excerpt
- [ ] The four mismatches in 3.3 resolved, and any wrong wrapper fixed in `src/api/admin.js`
- [ ] Guard checks done for three endpoints × three identities; any leak reported as a finding
- [ ] `.layout` scopes `--color-border` and `--color-bg-muted`; zero `--color-wood-line` left in
      `AdminLayout.module.css`
- [ ] Sidebar 264px, active item uses an inset rule, badges are carrot not beet
- [ ] `aria-current` prop removed from `NavLink`
- [ ] Mobile drawer: focus moves in, traps, `Esc` closes, focus returns, body scroll locked,
      background `inert`
- [ ] "Signed in as" line present
- [ ] All four dead modals **open** — each verified in the browser
- [ ] Six primitives exist with both exports and JSDoc
- [ ] `DataTable` is a real `<table>` at 768+, stacked cards below, `aria-sort` on sortable
      headers, indeterminate header checkbox working
- [ ] `ConfirmDialog` traps focus, requires a reason where configured, stays open on error
- [ ] Buyer, vendor and guest render exactly as before

---

# PART 9 · Verification gate

### A1 build · A2 runtime

```bash
npm run build      # last 15 lines, zero errors, zero new warnings
npm run dev        # /admin and all six pages: zero console errors
```

Report any React warning verbatim. The `aria-current` fix should remove one.

### A3 · Token purity and forbidden CSS

```bash
grep -rnE "#[0-9a-fA-F]{3,8}" src/layouts/AdminLayout.module.css src/components/admin
grep -rnE ":[^;]*[0-9]+px" src/layouts/AdminLayout.module.css src/components/admin | grep -v "1px" | grep -v "0px"
grep -rn "color-wood-line" src/layouts/AdminLayout.module.css
grep -rnE "linear-gradient|radial-gradient|backdrop-filter|!important|:global" src/layouts/AdminLayout.module.css src/components/admin
git diff src/styles/tokens.css        # must be empty
git diff package.json                 # must be empty
```

### A7 · Accent budget

```bash
grep -rn "color-primary\|color-beet" src/layouts/AdminLayout.module.css src/components/admin
```

Name every hit. Confirm badges are carrot and no screen shows more than two beet elements.

### The four modals

Open each in the browser. Table: file, trigger clicked, sheet appeared (yes/no), screenshot or
description. **All four must be yes.**

### Drawer accessibility

At 390px: open the drawer and record — focus landed where, Tab cycled without escaping (how many
stops), `Esc` closed it, focus returned to the menu button, body scroll was locked, background
was `inert`. Six answers.

### `DataTable` proof

Render it on a scratch route with 25 fake rows and every feature on. Report:

- Semantics: paste the accessibility tree for the header row
- `aria-sort` value before and after clicking a sortable header
- Header checkbox indeterminate with 1 of 25 selected (screenshot or `el.indeterminate` value)
- At 767px it is cards; at 768px it is a table (screenshot both)
- Keyboard: every sort button and checkbox reachable, ring visible
- Loading skeleton matches the column layout

Then delete the scratch route and confirm with `grep`.

### `ConfirmDialog` proof

- Focus trapped (Tab cycles), `Esc` closes, focus returns to trigger
- Confirm disabled until a reason is typed, when `requireReason`
- `typeToConfirm` requires an exact match
- **Force a server error** (stop the backend mid-action): dialog stays open, shows a message,
  reason text preserved

### B1 · Responsive sweep

At **360, 390, 768, 1024, 1440** on all six admin pages:

```js
const { layoutCheck } = await import('/src/dev/layoutCheck.js');
console.table(layoutCheck());
```

Findings on the un-rebuilt pages are expected — record them as a baseline for stages 2–4, and
fix only horizontal overflow, overlapping fixed elements and sub-44px targets.

### Cross-role regression

Load `/buyer`, `/vendor`, `/` and confirm unchanged, or name what differs.

---

# PART 10 · Report format

```
Stage A1 status: PASS | FAIL

## Capability table (37 rows)
| # | capability | method | path | status | body excerpt | wrapper correct? |

## Mismatches resolved
- categories reorder: <which path/method is real; wrapper fixed? >
- reports/history:    <shape>
- markets DELETE:     <query or body; wrapper fixed?>
- email-log:          <shape; left unwrapped>

## Guard checks
| endpoint | no token | customer token | farmer token |

## What I changed
- <file> — <one line>

## Gate results
A1 build / A2 runtime:  <output>
A3 token purity:        <output, incl. wood-line count = 0>
A7 accent budget:       <hits named>
Four modals:            <4-row table, all yes>
Drawer a11y:            <6 answers>
DataTable proof:        <semantics, aria-sort, indeterminate, 767/768, keyboard, skeleton>
ConfirmDialog proof:    <4 results incl. server-error case>
B1 layoutCheck:         <baseline>
Cross-role:             <unchanged / differences>

## Security findings
- <any endpoint answering a non-admin — or "none">

## Found but not fixed
- isOpen bug (vendor, out of scope): <file:line for each>

## NOT verified
- <what and why>
```

If any gate fails, **fix it and re-run it.** A capability table with blanks, or a modal that
still does not open, is a FAIL.
