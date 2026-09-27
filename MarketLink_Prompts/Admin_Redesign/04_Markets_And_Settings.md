# Stage 4 · Markets and Settings — CRUD, master data, announcements, support

You are working on **MarketLink**. Stages 1–3 of the Admin redesign are done: the API contract
was curled end to end, the shell was rewritten, six primitives exist in `src/components/admin/`,
and Overview, Reports, People and Moderation are live and wired.

This stage rebuilds **two pages** and wires **eighteen capabilities** — the largest surface in
the console, and the one where a 721-line file is currently doing four unrelated jobs.

1. `/admin/markets` — market CRUD with a map coordinate picker
2. `/admin/settings` — four tabs: Categories, Announcements, Support messages, Platform

---

# PART 1 · Context

## 1.1 What MarketLink is

Local farmers-market **Farmers** and **Customers**. A Customer reserves produce from a stall and
**collects in person at the market, paying cash**. **No payment gateway. No delivery.**

Markets are the **physical places** the whole product is built around. A market's operating days
and timings drive the Customer market clock, the stall day-dots, the pickup windows and the
order cutoffs. **Getting a market's schedule wrong breaks the Customer app.** Treat this page as
load-bearing, not as a settings form.

## 1.2 The SRS requirements this stage satisfies

> Admin can **add, edit, or remove farmers markets**, including **name, address, operating days,
> timings, and map coordinates** or embedded map links using Google Maps API or OpenStreetMap.
>
> Admin can manage master data such as **product categories** and publish **platform-wide
> notifications or announcements**.

Plus the Contact Us inbox: the guest contact form posts to `POST /api/contact`, and those
messages land in `GET /admin/messages`. An unanswered-messages badge already exists in the
sidebar, so the inbox must actually work.

## 1.3 Stack and rules

React 18.3, Vite 6, react-router-dom 6.28. **CSS Modules only. No new dependencies.**
Breakpoints **480 / 768 / 1024 / 1280**. Idiqlat headings **weight 400 only**.
Every value from a `var(--token)`; no raw hex, no raw px beyond `1px` hairlines.

**Accent budget: two beet elements per screen** — the active sidebar item and one primary action.

## 1.4 The files

```
src/pages/admin/Markets.jsx   + .module.css   532 + 343 lines — REWRITE
src/pages/admin/Settings.jsx  + .module.css   721 + 298 lines — REWRITE AND SPLIT

src/components/admin/*                         Stage 1 primitives
src/components/domain/MapView.jsx              240 lines — Leaflet + OSM, no API key
src/components/ui/FormField.jsx  Toggle.jsx  Tabs.jsx  BottomSheet.jsx
src/api/admin.js                               the verified client
```

`Markets.jsx:339`, `Settings.jsx:602` and `Settings.jsx:658` all had the dead `isOpen` bug.
Stage 1 fixed the prop; you now rebuild around working sheets.

## 1.5 Settings must be split

`Settings.jsx` is **721 lines doing four unrelated jobs**. Split it:

```
src/pages/admin/Settings.jsx                  the tab shell only, ~120 lines
src/pages/admin/settings/CategoriesTab.jsx    + .module.css
src/pages/admin/settings/AnnouncementsTab.jsx + .module.css
src/pages/admin/settings/MessagesTab.jsx      + .module.css
src/pages/admin/settings/PlatformTab.jsx      + .module.css
```

**No tab file over 250 lines.** If one grows past that, it is doing too much — extract a
component. State the final line count of each in your report.

## 1.6 The capability matrix — everything this stage must make work

| # | Capability | Wrapper | Endpoint | Guard |
|---|---|---|---|---|
| 11 | List markets | `getAdminMarkets(query)` | `GET /admin/markets` | — |
| 12 | **Create** market | `createMarket(body)` | `POST /admin/markets` | form validation |
| 13 | **Update** market | `updateMarket(id, patch)` | `PATCH /admin/markets/:id` | form validation |
| 14 | **Delete** market | `deleteMarket(id, force)` | `DELETE /admin/markets/:id` | ConfirmDialog + **typeToConfirm** |
| 23 | List categories | `getAdminCategories()` | `GET /admin/categories` | — |
| 24 | **Create** category | `createAdminCategory(data)` | `POST /admin/categories` | validation |
| 25 | **Update** category | `updateAdminCategory(id, data)` | `PATCH /admin/categories/:id` | validation |
| 26 | **Delete** category | `deleteAdminCategory(id)` | `DELETE /admin/categories/:id` | ConfirmDialog |
| 27 | **Reorder** categories | `reorderAdminCategories(order)` | **verified in Stage 1** | — |
| 28 | List announcements | `getAdminAnnouncements()` | `GET /admin/announcements` | — |
| 29 | **Create** announcement | `createAdminAnnouncement(data)` | `POST /admin/announcements` | validation |
| 30 | **Update** announcement | `updateAdminAnnouncement(id, data)` | `PATCH /admin/announcements/:id` | validation |
| 31 | **Publish** announcement | `publishAdminAnnouncement(id)` | `POST /admin/announcements/:id/publish` | ConfirmDialog |
| 32 | **Delete** announcement | `deleteAdminAnnouncement(id)` | `DELETE /admin/announcements/:id` | ConfirmDialog |
| 33 | List support messages | `getAdminMessages(query)` | `GET /admin/messages` | — |
| 34 | **Handle** a message | `handleAdminMessage(id, reply)` | `POST /admin/messages/:id/handle` | — |
| 35 | Read platform settings | `getPlatformSettings()` | `GET /admin/settings` | — |
| 36 | **Update** platform settings | `updatePlatformSettings(data)` | `PATCH /admin/settings` | ConfirmDialog on risky fields |
| 37 | Email log | *(unwrapped)* | `GET /admin/email-log` | — |

**Before building anything**, curl all eighteen and paste the real request and response shapes.
Specifically resolve:

- **Market create/update body:** exactly which fields, and what shape is `schedule`? An array of
  `{ day, opensAt, closesAt }`? What is `day` — a string name, an integer, which casing?
  **Read `backend/src/db/seed.js` for a real market document** and match it exactly.
- **Market delete:** Stage 1 determined whether the server reads `?force=true` or a body. Use
  whichever is real. What does `force` do — cascade, or refuse when stalls exist?
- **Category reorder:** Stage 1 determined the real path and method. Use it.
- **Platform settings:** what keys exist, and what are their types? Build the form from the
  response, not from imagination.
- **Email log:** what does it return? Decide whether to surface it (see 3.6).

## 1.7 Off-limits

`src/pages/buyer/**`, `src/pages/vendor/**`, `src/pages/guest/**` and their layouts.
`backend/**` — **except** adding the one missing `getEmailLog` wrapper to `src/api/admin.js` if
you surface it. `package.json`. The other four admin pages.

---

# PART 2 · Page A — Markets (`/admin/markets`)

## 2.1 Structure

```
┌──────────────────────────────────────────────────────────────┐
│  Markets                              [ Add market ] ← the   │
│  6 markets · 48 stalls                                 beet  │
│                                                              │
│  🔍 Search name or town      Day ▾    Status ▾      Reset    │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ Market          │ Town     │ Days    │ Stalls │ Actions│  │
│  ├────────────────────────────────────────────────────────┤  │
│  │ Riverbend Market│ Bristol  │ S M T W…│   18   │ Edit ⋯ │  │
│  │ Hollow Lane     │ Bath     │ S M T W…│    9   │ Edit ⋯ │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

`DataTable`. The Days column reuses **`DayDots`** from the buyer redesign
(`src/components/domain/DayDots.jsx`) if it exists — import it, do not rebuild it. If it does
not exist yet, render the day abbreviations as text and say so.

Stalls column links to `/admin/people?tab=farmers&market=<id>` — the filter Stage 3 already
honours.

## 2.2 The market editor sheet

A `BottomSheet` (drawer at 768+) for both create and edit. Sections:

**1 · Identity**
- Name — required, `FormField`
- Description — optional textarea

**2 · Location**
- Address line, town, postcode — all required
- **Latitude and longitude**, numeric — required, and this is where the map comes in

**3 · Map coordinates** — the SRS requires this

```jsx
<MapView
  markers={coords ? [{ id: 'pin', lat: coords.lat, lng: coords.lng, title: name }] : []}
  height="260px"
  zoom={15}
  draggable
  onMove={({ lat, lng }) => setCoords({ lat: round6(lat), lng: round6(lng) })}
  ariaLabel="Market location. Drag the pin to set coordinates."
/>
```

`MapView` already supports `draggable` and `onMove` — **use them, do not rewrite the component
and do not add a mapping dependency.** It uses free OpenStreetMap tiles with no API key.

- Dragging the pin updates the lat/lng fields; typing in the fields moves the pin. Keep the two
  in sync from one piece of state.
- Round to **six decimal places** — that is ~0.1m, far beyond what a market stall needs, and it
  stops floating-point noise in the request body.
- **Keyboard path required:** the map is not operable by everyone, so the lat/lng number inputs
  are the accessible equivalent and must be fully usable alone. Say so in a hint line.
- No coordinates yet: render the map centred on the town if geocoding is available, otherwise on
  a sensible default, with a hint: `Drag the pin, or type coordinates.`

**4 · Operating days and timings** — the SRS requires this, and the Customer app depends on it

- Seven day rows. Each row: a `Toggle` for "trades this day", plus **opens** and **closes** time
  inputs enabled only when the toggle is on.
- Use `<input type="time">` — native, keyboard-accessible, and it gives you `HH:MM` directly.
- **Validate `closesAt > opensAt`** per row, inline, before submit.
- Build the `schedule` array in **exactly the shape the seed data uses**. Paste a seeded market
  document beside your builder function in the report.
- Warn but allow: a market with **no trading days at all** is valid to save but breaks the
  Customer clock. Show `This market will show as closed to customers.`

**5 · Status** — if the API has one (active/inactive). Curl first; omit if it does not.

## 2.3 Create and update

- One form component, two modes. `mode="create"` posts; `mode="edit"` patches.
- **`PATCH` sends only changed fields.** Diff against the loaded record. Sending the whole
  document on every edit risks overwriting a field another admin changed a second ago.
- Field-level `422` details render **under their field**, never as one banner.
- Save is disabled until the form is dirty and valid.
- On success: close the sheet, refetch the list, toast `Market saved.`
- On failure: **sheet stays open**, error shown, every entered value preserved.
- Unsaved changes plus a dismiss attempt prompts once before discarding.

## 2.4 Delete — the dangerous one

A market with stalls attached is not a safe delete. Use `ConfirmDialog` with **`typeToConfirm`**
set to the market name.

The dialog body must state the real consequence, which you determined by curling:

- If the server **refuses** when stalls exist: `This market has 18 stalls. Move or remove them
  first.` and disable confirm.
- If `force` **cascades**: `This will remove the market and detach 18 stalls. This cannot be
  undone.` and require typing the name.

Never offer `force` as a casual checkbox. If the first attempt fails with a conflict, show the
reason and then offer force as an explicit second step.

---

# PART 3 · Page B — Settings (`/admin/settings`)

Tab shell with four tabs, **state in the URL** (`?tab=announcements`). Stage 2's Overview links
to `/admin/settings?tab=messages&status=open` — **that link is live and must work.** Verify it.

## 3.1 Tab 1 — Categories (master data)

The SRS calls this master data, and it is: these categories drive the Customer browse filters.

```
┌────────────────────────────────────────────────────────┐
│  Product categories              [ Add category ]      │
│  Categories customers filter by when browsing produce. │
│                                                        │
│  ┌────────────────────────────────────────────────┐    │
│  │ ⠿  Vegetables        142 products    Edit  ⋯   │    │
│  │ ⠿  Fruit              88 products    Edit  ⋯   │    │
│  │ ⠿  Dairy              41 products    Edit  ⋯   │    │
│  └────────────────────────────────────────────────┘    │
└────────────────────────────────────────────────────────┘
```

**Reordering — keyboard first.** A drag handle alone is inaccessible and fiddly. Give every row
**Move up / Move down** buttons with `aria-label="Move Vegetables up"`, and announce the new
position via a `role="status"` live region. Add pointer drag only if the keyboard path works
first; if you skip drag entirely, that is a defensible choice — say so.

- Reorder calls capability 27 with the full ordered id array, then refetches.
- Order is applied **optimistically** with a rollback on failure, because reorder is cheap and
  reversible — the one place optimism is right in this console.
- Edit opens the sheet whose `open` prop Stage 1 fixed: name, slug, and an icon or image if the
  API supports one. Curl first.
- Delete via `ConfirmDialog`. **Show the product count in the dialog.** If the server refuses to
  delete a category in use, say which products block it.

## 3.2 Tab 2 — Announcements (platform-wide notifications)

These render in the `AnnouncementBar` on guest and buyer pages, so a mistake here is visible to
every user on the platform.

```
┌────────────────────────────────────────────────────────┐
│  Announcements                   [ New announcement ]  │
│  Shown at the top of every page while published.       │
│                                                        │
│  ┌────────────────────────────────────────────────┐    │
│  │ ● Published   Riverbend closed this Saturday   │    │
│  │   Published 2 days ago by A. Admin             │    │
│  │   [ Edit ]  [ Unpublish ]  [ Delete ]          │    │
│  ├────────────────────────────────────────────────┤    │
│  │ ○ Draft       Autumn opening hours             │    │
│  │   [ Edit ]  [ Publish ]  [ Delete ]            │    │
│  └────────────────────────────────────────────────┘    │
└────────────────────────────────────────────────────────┘
```

- The editor sheet has a **live preview rendered exactly as `AnnouncementBar` renders it**.
  Import the real component if you can; otherwise match its markup and classes. An admin
  publishing to every page needs to see what users will see.
- Publish goes through `ConfirmDialog`: `Publish this announcement?` — `It will appear at the
  top of every page for every visitor.`
- **Unpublish:** curl to find out how. Is it `PATCH` with a status field, or does only
  `publish` exist? If there is no unpublish path, say so plainly and offer Delete instead
  rather than shipping a button that silently does nothing.
- Only one published at a time? Curl and find out. If the API allows several, show them all and
  make the ordering visible.
- Character limit matching what `AnnouncementBar` can display on one line at 360px, with a live
  remaining count.

## 3.3 Tab 3 — Support messages

The Contact Us inbox. `POST /api/contact` from the guest page lands here, and the sidebar
`unhandledMessages` badge counts the open ones.

```
┌────────────────────────────────────────────────────────┐
│  Support messages                                      │
│  [ Open (5) | Handled (112) ]                          │
│                                                        │
│  ┌────────────────────────────────────────────────┐    │
│  │ Maria Okonkwo · maria@example.com · 2 days ago │    │
│  │ Subject: Cannot update my stall hours          │    │
│  │ ───────────────────────────────────────────    │    │
│  │ The full message body, not truncated.          │    │
│  │ ───────────────────────────────────────────    │    │
│  │ [ Reply and mark handled ]                     │    │
│  └────────────────────────────────────────────────┘    │
└────────────────────────────────────────────────────────┘
```

- **Cards, not a table** — the job is reading messages.
- **Must honour `?status=open`** from the dashboard link.
- `handleAdminMessage(id, reply)` takes a reply string. Find out by curling whether the reply is
  **emailed** to the sender or only stored. The backend has a mailer
  (`backend/src/utils/mailer.js`). **Tell the admin the truth in the UI**: either
  `This reply will be emailed to maria@example.com.` or `This reply is recorded but not sent.`
  Do not imply an email is sent if it is not.
- After handling: refetch **and** call `refreshOverview()` so the sidebar badge drops without a
  reload.
- Handled tab is read-only and shows the reply, who handled it, and when.
- A `mailto:` link as a secondary path is fine, and honest, if no email is sent server-side.

## 3.4 Tab 4 — Platform settings

Build this form **from the live `GET /admin/settings` response**, not from imagination. Curl it,
paste the keys and types, then render a labelled control per key:

- boolean → `Toggle`
- string → `FormField`
- number → number input with min/max
- enum → `<select>`

Group related keys under `--text-sm` headings. Every field gets a one-line help text saying what
it affects.

- One **Save changes** button — this is the page's one beet element. Disabled until dirty.
- `PATCH` sends **only changed keys**.
- Any field that could break the platform (maintenance mode, registration disabled, cutoff
  defaults) goes through `ConfirmDialog` stating the effect.
- Field-level `422`s under their fields.
- Unknown keys the API returns but you did not anticipate: render them read-only with their raw
  value rather than dropping them, and list them in your report.

## 3.5 Tab 5 — Email log (optional, your call)

`GET /admin/email-log` exists with no client wrapper. Curl it. If it returns useful delivery
history (order confirmations, ready-for-pickup alerts, verification emails), surface it as a
fifth tab: a `DataTable` of to / subject / status / sent at, with a status filter. Add a
`getEmailLog` wrapper to `src/api/admin.js` in the existing style.

This is genuinely useful — "did the customer get the ready-for-pickup email?" is a real support
question. If the response is empty or not useful, skip it and say why.

---

# PART 4 · Your skills for this stage

### Skill 1 · Match the seed document exactly

Open `backend/src/db/seed.js`, find a real market, and build your request body to match it field
for field. Guessing `days: ['Sat']` when the server stores
`schedule: [{ day: 'saturday', opensAt: '08:00', closesAt: '13:00' }]` produces a 422 you will
spend an hour on, or worse, a 200 that silently stores nothing useful.

### Skill 2 · PATCH the diff, not the document

```jsx
const patch = Object.fromEntries(
  Object.entries(form).filter(([k, v]) => !deepEqual(v, original[k]))
);
```

Sending everything on every save overwrites concurrent edits and turns a one-field change into a
full-document race.

### Skill 3 · One state, two controls

The map pin and the lat/lng inputs are two views of one value. Keep `coords` in one place; the
map writes it on drag and reads it for the marker, the inputs do the same. Two sources of truth
here produce a pin that fights the keyboard.

### Skill 4 · Every map needs a keyboard equivalent

Dragging a pin is not operable by everyone. The number inputs are the accessible path and must
work alone. Say so in a hint. This is an SRS accessibility requirement, not a nicety.

### Skill 5 · Keyboard reorder before drag reorder

Move up / move down buttons plus a `role="status"` announcement is the accessible baseline and
takes ten minutes. Drag-and-drop without it is a feature that excludes people. Build the buttons
first; drag is optional polish.

### Skill 6 · Optimism only where rollback is free

Category order: optimistic, because it is cheap and reversible. Market delete: never. The rule
is whether being wrong for 300ms is harmless.

### Skill 7 · Preview what the world will see

An announcement goes on every page for every visitor. Rendering the real `AnnouncementBar` in
the editor costs one import and prevents the mistake that everyone sees.

### Skill 8 · Tell the truth about email

If `handleAdminMessage` only stores the reply, a UI that says "Reply sent" is a lie an operator
will act on. Curl it, find out, and write what is true.

### Skill 9 · A 250-line ceiling is a design signal

`Settings.jsx` reached 721 lines because four features shared a file and nobody noticed. When a
tab file crosses 250, extract the list or the editor into its own component. The ceiling is the
alarm, not the goal.

---

# PART 5 · Hard rules — never do these

1. **Never build a request body you have not matched against a real seeded document.**
2. **Never `PATCH` the whole document.** Send the diff.
3. **Never rewrite `MapView` or add a mapping dependency.**
4. **Never ship a map without a keyboard-operable coordinate input.**
5. **Never ship drag reorder without move up/down buttons.**
6. **Never delete a market without `typeToConfirm`.**
7. **Never offer `force` delete as a casual checkbox.**
8. **Never ship a button whose endpoint you could not find** — say so instead (unpublish).
9. **Never imply an email was sent** unless you confirmed the server sends one.
10. **Never close a sheet or dialog on error.** Preserve the input.
11. **Never drop unknown settings keys.** Render them read-only.
12. **Never let a Settings tab file exceed 250 lines.**
13. **Never skip `refreshOverview()`** after handling a message.
14. **Never use a raw hex or raw px**, a gradient, a card shadow, `!important` or `:global`.
15. **Never add a dependency. Never touch buyer, vendor, guest or the backend.**

---

# PART 6 · Definition of done

- [ ] All 18 capabilities curled with real request/response shapes pasted **before** building
- [ ] A seeded market document pasted beside your `schedule` builder
- [ ] Markets: list with search, day filter, `DayDots`, stall count linking into People
- [ ] Market editor: identity, address, **lat/lng with a draggable map pin**, seven-day schedule
      with per-row time validation, optional status
- [ ] Map pin and number inputs stay in sync; lat/lng usable by keyboard alone
- [ ] Create posts, edit `PATCH`es **only changed fields**; 422s render under their fields
- [ ] Delete uses `typeToConfirm`; the dialog states the real cascade behaviour
- [ ] `Settings.jsx` split into a shell plus four tab files, **none over 250 lines**
- [ ] Tab state in the URL; **`/admin/settings?tab=messages&status=open` from the dashboard works**
- [ ] Categories: CRUD plus reorder with **move up/down buttons** and a live-region announcement
- [ ] Category delete shows the product count and handles in-use refusal
- [ ] Announcements: CRUD, publish through a dialog, **live `AnnouncementBar` preview**,
      unpublish implemented or its absence stated
- [ ] Messages: full bodies, open/handled tabs, reply and mark handled, **honest email wording**
- [ ] Handling a message drops the sidebar badge **without a reload**
- [ ] Platform tab built from the live response; unknown keys rendered read-only
- [ ] Email log surfaced with a wrapper, or skipped with a stated reason
- [ ] All pages: skeletons, empty states, inline errors with Retry
- [ ] `layoutCheck()` **zero findings** on both pages, all four tabs, at 360, 390, 768, 1024, 1440

---

# PART 7 · Verification gate

### Capability proof — all eighteen

Method, path, status, request body sent, response excerpt. For every **write**, read the record
back with a GET and show **before → after**. A 200 that does not change the record is a failure.

Paste specifically:

- a real seeded market document
- the exact `schedule` shape you build
- what `force` does on market delete
- the real reorder path and method
- the full platform settings key list with types
- whether `handleAdminMessage` sends an email
- whether an unpublish path exists
- what `/admin/email-log` returns

### A1 build · A2 runtime

```bash
npm run build
npm run dev
```

Zero errors, zero new warnings, zero console errors on both pages and all four tabs. Report any
Leaflet warning verbatim — a mis-sized map is noisy.

### A3 / A4 / A7 and file sizes

```bash
grep -rnE "#[0-9a-fA-F]{3,8}" src/pages/admin/Markets.module.css src/pages/admin/settings/*.module.css
grep -rnE ":[^;]*[0-9]+px" src/pages/admin/Markets.module.css src/pages/admin/settings/*.module.css | grep -v "1px" | grep -v "0px"
grep -rnE "linear-gradient|radial-gradient|backdrop-filter|!important|:global" src/pages/admin/Markets.module.css src/pages/admin/settings
grep -rn "color-primary\|color-beet" src/pages/admin/Markets.module.css src/pages/admin/settings/*.module.css
wc -l src/pages/admin/Settings.jsx src/pages/admin/settings/*.jsx
git diff package.json
```

Every tab file under 250 lines. Name every beet hit.

### Dashboard deep-link — the Stage 2 promise

From `/admin`, click "Unanswered support messages". Record: the URL, that the Messages tab is
active, that the Open sub-tab is selected, and that the count matches the dashboard. Four checks.

### Market round-trip — the one that proves the schedule

1. **Create** a market with a two-day schedule and a pin dragged to a specific location
2. Paste the **request body** you sent
3. `curl GET /api/markets/<id>` as a **Customer** and paste the response
4. Open `/buyer/markets/<id>` in the Customer app and confirm the **market clock and day-dots
   match what you entered**
5. **Edit** it — change one day's closing time — and paste the `PATCH` body; confirm only that
   field was sent
6. Confirm the Customer app reflects the change
7. **Delete** it and confirm it is gone from both the admin list and the public list

**Step 4 and 6 are the real test.** Admin writing a schedule the Customer app cannot read is the
failure mode this page exists to avoid.

### Map picker

- Drag the pin: do the lat/lng inputs update, rounded to 6dp?
- Type coordinates: does the pin move?
- Keyboard only, no mouse: can you set coordinates? Describe the path.
- Save and reload the editor: does the pin return to the saved position?
- A market with no coordinates: what renders?

### Schedule validation

- `closesAt` before `opensAt`: inline error, save blocked
- All seven days off: saves, with the "shows as closed" warning
- Saved schedule reloads correctly into the editor

### Delete safety

- Delete a market **with stalls**: paste the server response and what the dialog showed
- Delete an **empty** market with `typeToConfirm`: wrong name keeps confirm disabled; correct
  name succeeds
- Backend stopped mid-delete: dialog stays open with a message

### Categories

- Create, edit, delete: before → after for each
- **Reorder by keyboard only.** Record the button presses, the request body, the live-region
  text announced, and the order after a reload
- Delete a category **in use**: what the server said and what the dialog showed
- Confirm the new order appears in the **Customer browse filters**

### Announcements

- Create a draft, preview it, publish it
- **Open the Customer app and confirm it appears in `AnnouncementBar`** — screenshot
- Unpublish or delete it and confirm it disappears from the Customer app
- Character limit enforced with a live count

### Messages

- `?status=open` honoured
- Reply and mark handled: request body, status, record read back
- **Sidebar badge before and after, no reload**
- The email wording matches what the server actually does

### Platform settings

- Paste the full key list with types
- Change one boolean and one string: paste the `PATCH` body and confirm only those two were sent
- Reload and confirm persistence
- A risky field triggers its dialog

### B1 · Responsive sweep

At **360, 390, 768, 1024, 1440** on `/admin/markets` and each of the four settings tabs:

```js
const { layoutCheck } = await import('/src/dev/layoutCheck.js');
console.table(layoutCheck());
```

**Zero findings, twenty-five tables.** The markets table stacks below 768 — screenshot 767/768.
The map must have an explicit height at every width.

### B4 · Keyboard

Both pages end to end. The market editor is completable **without a mouse**, including
coordinates and the schedule. Category reorder works by keyboard. Every sheet traps focus and
returns it. `ConfirmDialog` fully operable.

### Minimal seed

```bash
cd backend && npm run seed:minimal
```

No markets, no categories, no announcements, no messages. Every tab shows a calm empty state.
Then `npm run seed`.

### Tests

```bash
node tests/run_all.mjs
```

All suites pass.

---

# PART 8 · Report

```
Stage A4 status: PASS | FAIL

## Capability proof (18 rows, writes with read-back)
| # | capability | method | path | status | request body | before → after |

## Shapes resolved
- seeded market document:     <paste>
- schedule shape I build:     <paste>
- market delete force:        <behaviour>
- category reorder:           <method + path>
- platform settings keys:     <key: type list>
- handleAdminMessage emails?: <yes/no + evidence>
- unpublish path:             <exists / does not exist>
- /admin/email-log:           <shape; surfaced or skipped + why>

## File sizes
Settings.jsx <n> · CategoriesTab <n> · AnnouncementsTab <n> · MessagesTab <n> · PlatformTab <n>

## Gate results
A1 build / A2 runtime:   <output, Leaflet warnings verbatim>
A3 / A4 / A7:            <output, beet named>
Dashboard deep-link:     <4 checks>
Market round-trip:       <7 steps, incl. Customer app verification>
Map picker:              <5 answers>
Schedule validation:     <3 cases>
Delete safety:           <3 cases>
Categories:              <CRUD + keyboard reorder + in-use delete + customer filters>
Announcements:           <publish + Customer app screenshot + unpublish>
Messages:                <handled + badge before/after + email wording>
Platform settings:       <keys, diff PATCH, persistence, risky-field dialog>
B1 layoutCheck:          <25 tables + 767/768 screenshots>
B4 keyboard:             <result, incl. mouse-free market creation>
Minimal seed:            <all tabs>
Tests:                   <summary>

## Backend gaps found
- <anything the SRS requires that the API cannot do>

## Found but not fixed
- <file:line>

## NOT verified
- <what and why>
```

Fix and re-run any failing gate. A market whose schedule the Customer app cannot read, a
reorder that needs a mouse, or a "reply sent" that sends nothing is a **FAIL**.
