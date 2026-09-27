# Stage 2 · Admin Overview and Reports — every metric live, every export real

You are working on **MarketLink**. Stage 1 of the Admin redesign is done: the API contract was
curled end to end, the shell was rewritten with neutral hairlines and a working mobile drawer,
four dead modals were fixed, and six primitives now exist in `src/components/admin/`:
`AdminPage`, `DataTable`, `FilterBar`, `StatTile`, `BulkBar`, `ConfirmDialog`.

This stage rebuilds **two pages** and wires **five capabilities**:

1. `/admin` — **Overview**: the dashboard the SRS requires, plus an action queue
2. `/admin/reports` — **Reports**: platform-wide analytics and working CSV export

---

# PART 1 · Context

## 1.1 What MarketLink is

Local farmers-market **Farmers** and **Customers**. A Customer reserves produce from a stall and
**collects in person, paying cash at the stall**. **No payment gateway. No delivery.**

This matters for Reports: **revenue is money that changed hands at a stall**, recorded when an
order is marked `completed`. It is never "processed", "settled" or "paid out". Label it
accordingly.

## 1.2 The SRS requirements this stage satisfies

> Admin can securely log in to a dedicated dashboard. The dashboard should summarize key
> platform metrics such as **total Farmers, total customers, total markets, and total orders**.

> Admin can view **platform-wide reports covering total orders, revenue summary across markets,
> and the most active Farmers**.

All seven of those figures are mandatory and must come from the live API. A hard-coded number,
a placeholder, or a metric quietly dropped because the endpoint did not return it is a failure.

## 1.3 Stack and rules

React 18.3, Vite 6, react-router-dom 6.28. **CSS Modules only. No new dependencies.**
Breakpoints **480 / 768 / 1024 / 1280**. Idiqlat headings **weight 400 only**.
Every value from a `var(--token)`; no raw hex, no raw px beyond `1px` hairlines.

**Accent budget: two beet elements per screen** — the active sidebar item and the one primary
action. Stat values are Inter 600 ink, never beet.

## 1.4 The files

```
src/pages/admin/Overview.jsx   + .module.css   188 + 221 lines — REWRITE
src/pages/admin/Reports.jsx    + .module.css   227 + 178 lines — REWRITE

src/components/admin/AdminPage.jsx  DataTable.jsx  FilterBar.jsx
src/components/admin/StatTile.jsx   ConfirmDialog.jsx           Stage 1
src/components/domain/BarChart.jsx  251 lines — exists, reuse
src/layouts/AdminLayout.jsx         AdminContext + 45s poll
src/api/admin.js                    the verified client
src/utils/format.js                 formatPrice, date formatters
```

## 1.5 The capability matrix — everything this stage must make work

**Nothing here is optional. A capability that renders but does not call the API is not done.**

| # | Capability | Wrapper | Endpoint | Where it lands |
|---|---|---|---|---|
| 1 | Platform overview metrics | `getAdminOverview()` | `GET /admin/overview` | Overview stat row |
| 19 | Reports summary by range | `getAdminReportsSummary(range)` | `GET /admin/reports/summary` | Reports page |
| 20 | Report history | `getReportsHistory()` | `GET /admin/reports/history` | Reports page |
| 21 | CSV export | `exportAdminReport(type, range)` | `GET /admin/reports/export` | Export button |
| 22 | Sales CSV | *(no wrapper — add one)* | `GET /admin/reports/sales.csv` | Export menu |

Plus the **action queue**, which reads counts already on `AdminContext`
(`pendingFarmers`, `openFlags`, `unhandledMessages`) and deep-links into stages 3 and 4.

**Before you build anything**, re-curl capabilities 1, 19, 20, 21 and 22 and paste the real
response shapes. Stage 1 recorded them; confirm they have not drifted and that you are reading
the actual field names, not names you assumed.

## 1.6 Off-limits

`src/pages/buyer/**`, `src/pages/vendor/**`, `src/pages/guest/**` and their layouts.
`backend/**` — **except** adding the one missing client wrapper for `sales.csv` in
`src/api/admin.js`, which is frontend. `package.json`. The other four admin pages.

---

# PART 2 · Page A — Overview (`/admin`)

## 2.1 What an operations dashboard is for

Not "here are some numbers". It answers, in order:

1. **Is anything waiting for me?** (the action queue)
2. **Is the platform healthy?** (the metrics)
3. **What just happened?** (recent activity)

Build it in that order, top to bottom. A pending-farmer count buried under four charts is a
dashboard that does not work.

## 2.2 Structure

```
┌──────────────────────────────────────────────────────────────┐
│  Overview                                    Idiqlat h1      │
│  Thursday 26 September · updated 2 minutes ago               │
│                                                              │
│  Needs your attention                                        │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ 12  Farmers awaiting approval            Review     →  │  │
│  │  3  Flagged items in moderation          Review     →  │  │
│  │  5  Unanswered support messages          Review     →  │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  Platform                                                    │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐                  │
│  │   48   │ │  1,204 │ │    6   │ │  3,891 │                  │
│  │ Farmers│ │Customers│ │ Markets│ │ Orders │                  │
│  │+3 wk   │ │+87 wk  │ │        │ │+142 wk │                  │
│  └────────┘ └────────┘ └────────┘ └────────┘                  │
│                                                              │
│  Recent activity                          See reports  →     │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ table of the latest events                             │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

## 2.3 The action queue

**The most important block on the page.** Three rows, each rendered **only when its count is
greater than zero**.

| Count from `AdminContext` | Label | Links to |
|---|---|---|
| `pendingFarmers` | `Farmers awaiting approval` | `/admin/people?tab=farmers&status=pending` |
| `openFlags` | `Flagged items in moderation` | `/admin/moderation?status=open` |
| `unhandledMessages` | `Unanswered support messages` | `/admin/settings?tab=messages&status=open` |

- The links carry **query parameters that pre-filter the destination page.** Stages 3 and 4 must
  read them. This is what makes a dashboard useful rather than decorative — say so in your
  report so those stages honour it.
- Count is Inter 600, `--text-h3`, `tabular-nums`, `--color-carrot-text`. **Not beet.**
- Row is `min-height: 56px`, white, separated by `1px solid var(--color-hairline-soft)`.
- **When all three are zero**, replace the whole panel with one quiet line:
  `Nothing needs attention right now.` in `--color-ink-soft`. Never render an empty panel.
- The panel is a `<ul>` of `<li>`s, each containing one `<Link>`. Not a table — three rows of
  calls to action are a list.

## 2.4 The platform metrics

Four `StatTile`s from `getAdminOverview()`. The SRS names exactly these four; render all four
even when one is zero.

- Map the real response field names — **do not guess**. Paste the response in your report and
  show the mapping.
- If the endpoint returns a week-over-week delta, pass it to `delta` and `direction`. If it does
  not, **omit the delta entirely** rather than computing a fake one client-side. Say which in
  your report.
- Each tile links to its page: Farmers and Customers to `/admin/people`, Markets to
  `/admin/markets`, Orders to `/admin/reports`.
- Grid: 1 column under 480, 2 at 480, 4 at 1024. `minmax(0, 1fr)`.
- Numbers use `Intl.NumberFormat` for thousands separators and `tabular-nums`.

## 2.5 Recent activity

A `DataTable` of the most recent platform events, if `getAdminOverview()` returns them.

- Columns: when, what, who, and a link to the subject.
- **If the endpoint returns no activity feed, do not invent one.** Render the section only when
  the data exists, and record its absence in your report as a backend gap for a later stage.
  Fabricating an activity feed from other calls is worse than omitting it.
- Cap at 10 rows with a "See reports" action in the section header.

## 2.6 Live updating

`AdminLayout` already polls `getAdminOverview()` every 45 seconds via `useVisibleInterval` and
exposes it on `AdminContext`. **Consume the context — do not fetch again on the page.** Two
polls of the same endpoint is the exact duplicate-request bug the gate checks for.

Show the freshness honestly: `updated 2 minutes ago` in the page context line, derived from when
the context last succeeded. Add a manual **Refresh** control that calls `refreshOverview()` and
shows a spinner state on itself only.

## 2.7 States

- **Loading:** stat tiles and the queue render as skeletons **in their final boxes**.
- **Error:** the page still renders its frame with an inline error panel and a Retry that calls
  `refreshOverview()`. Never a blank screen.
- **Empty:** a brand-new platform with all zeros must look calm and correct, not broken.
  Test it with `npm run seed:minimal`.

---

# PART 3 · Page B — Reports (`/admin/reports`)

## 3.1 Structure

```
┌──────────────────────────────────────────────────────────────┐
│  Reports                          [ Export ▾ ]  ← the one    │
│  Platform activity for the last 30 days              beet    │
│                                                              │
│  [ 7 days | 30 days | 90 days | 12 months ]   SegmentedControl│
│                                                              │
│  ┌────────┐ ┌────────┐ ┌────────┐                             │
│  │ 3,891  │ │ £48,210│ │  2,104 │                             │
│  │ Orders │ │Collected│ │Completed│                            │
│  └────────┘ └────────┘ └────────┘                             │
│                                                              │
│  Orders over time                                            │
│  ┌────────────────────────────────────────────────────────┐  │
│  │                  [ BarChart ]                          │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  Revenue by market                                           │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ DataTable: market · orders · collected · avg order     │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  Most active farmers                                         │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ DataTable: stall · market · orders · collected         │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  Previous exports                                            │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ DataTable from getReportsHistory()                     │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

The three sections in the middle are the SRS's three required reports:
**total orders**, **revenue summary across markets**, **most active Farmers**.

## 3.2 Range control

`SegmentedControl` with `7d`, `30d`, `90d`, `12m`. Pass the value straight to
`getAdminReportsSummary(range)`.

**Mirror it in the URL** (`?range=90d`) so a report view is linkable and survives a refresh.
Read the URL on mount. An admin sending a colleague a link to "last 90 days" is a normal thing
to want.

Use only range values the endpoint actually accepts — confirm by curling each one and pasting
the four results. If the server rejects `12m`, drop that option rather than shipping a segment
that errors.

## 3.3 Charts

`src/components/domain/BarChart.jsx` already exists (251 lines). **Reuse it.** Do not write a
second chart component and do not add a charting library.

- Chart colour: **one** series in `--color-ink` at a reduced opacity, or `--color-wood`. Not
  beet — that budget belongs to the Export button.
- Every chart needs an accessible equivalent. Give the `<svg>` `role="img"` and a summary
  `aria-label`, **and** render the same figures as a visually-hidden `<table>` or offer a
  "View as table" toggle. A chart that only exists as pixels fails the SRS accessibility
  requirement outright.
- Axis labels and gridlines in `--color-hairline`. No gradients on bars.
- If the summary response has no time series, render the tables only and record the gap.

## 3.4 The two breakdown tables

Both are `DataTable`s with sortable columns and right-aligned `tabular-nums` numerics.

**Revenue by market** — market name (links to `/admin/markets`), orders, collected, average
order value. Sum row at the bottom in `--weight-semibold` with a `2px` top rule.

**Most active farmers** — stall name (links to the person in `/admin/people`), market, orders,
collected. Default sort: orders descending.

Label money **"Collected"**, never "Revenue processed" or "Paid". A one-line note under the
first money column: `Collected at the stall, in cash, when the order was completed.` That
sentence is how a judge sees you understood the model.

## 3.5 Export — make it actually download

This is where exports usually ship broken. `exportAdminReport` already returns a **blob**
(`responseType: 'blob'`, `Accept: text/csv`), and `apiFetch` handles that path.

An `Export` menu with the available types. Also **add the missing wrapper** for
`GET /admin/reports/sales.csv` to `src/api/admin.js`, matching the existing style.

```jsx
const handleExport = async (type) => {
  setExporting(type);
  try {
    const blob = await exportAdminReport(type, range);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `marketlink-${type}-${range}-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);          // never skip this — it leaks the blob otherwise
    toast('Export downloaded.');
  } catch (err) {
    toast('Export failed. Try a shorter range.');
    console.error('[Reports] export failed', err);
  } finally {
    setExporting(null);
  }
};
```

- While exporting, the menu item shows `Preparing…` and is disabled.
- **Verify the downloaded file**: open it and confirm it has a header row and real rows matching
  the on-screen figures. Paste the first three lines into your report. An export that downloads
  a zero-byte file or an HTML error page is the classic failure here.
- After a successful export, refresh `getReportsHistory()` so **Previous exports** updates.

## 3.6 Previous exports

`DataTable` from `getReportsHistory()`: type, range, generated at, generated by, and a
re-download link if the response provides one.

Curl it first and build to the real shape. If it returns an empty array on a fresh seed, that is
the empty state — `No exports yet.` — not a bug.

---

# PART 4 · Your skills for this stage

### Skill 1 · Consume the context; do not re-fetch

`AdminLayout` polls `/admin/overview` every 45s and puts it on `AdminContext`. A page-level
`useQuery` on the same endpoint doubles the request rate and the two copies drift out of sync.
Read the context.

### Skill 2 · Map response fields from a real response, never from memory

Paste the actual JSON, then write the mapping next to it. `totalFarmers` vs `farmers` vs
`counts.farmers` is a five-minute bug that renders "undefined" in front of a judge.

### Skill 3 · Omit a metric rather than fake it

If the API returns no week-over-week delta, show no delta. A client-computed number that looks
authoritative and is not is worse than a blank.

### Skill 4 · Deep-link the queue

`/admin/people?tab=farmers&status=pending` turns a dashboard from a report into a workflow. It
costs one query string and it is the difference between a dashboard an operator uses and one
they glance at.

### Skill 5 · Always `revokeObjectURL`

Every `createObjectURL` holds the blob in memory until revoked. An admin exporting ten reports
in a session leaks ten files. One line, always paired.

### Skill 6 · Open the CSV you just downloaded

The export path has four places to fail silently: wrong `Accept`, server returning JSON, empty
result set, or the anchor never clicking. The only proof is opening the file. Paste its first
lines.

### Skill 7 · A chart needs a table behind it

`role="img"` plus a real summary label, plus the same numbers available as text. This is an SRS
accessibility requirement and it is also just better — operators copy numbers out of tables.

### Skill 8 · Numbers get `tabular-nums` and locale formatting

`Intl.NumberFormat` for counts, `formatPrice` for money, `tabular-nums` on both. A column of
figures that jitters as it re-renders reads as unreliable.

---

# PART 5 · Hard rules — never do these

1. **Never render a metric that is not from the live API.** No placeholders, no hard-coded numbers.
2. **Never fabricate a metric the endpoint does not return.** Omit it and report the gap.
3. **Never re-fetch `/admin/overview`** on the Overview page. Use `AdminContext`.
4. **Never render an empty action-queue panel.** One quiet line instead.
5. **Never label money as processed, charged, settled or paid out.** It is **collected**, in cash.
6. **Never make a chart the only representation of its data.**
7. **Never add a charting library.** `BarChart` exists.
8. **Never skip `URL.revokeObjectURL`.**
9. **Never claim the export works without opening the file.**
10. **Never make a stat value or a chart bar beet.** The budget is the nav plus Export.
11. **Never ship a range option the endpoint rejects.**
12. **Never use a raw hex or raw px**, a gradient, a card shadow, `!important` or `:global`.
13. **Never add a dependency. Never touch buyer, vendor, guest or the backend.**

---

# PART 6 · Definition of done

- [ ] Capabilities 1, 19, 20, 21, 22 re-curled and their real shapes pasted before building
- [ ] Overview: action queue with three conditional rows and **working deep links with filters**
- [ ] All-zero state shows one quiet line, not an empty panel
- [ ] All four SRS metrics rendered from live data, with the field mapping shown
- [ ] Stat tiles link to their pages; numbers locale-formatted and `tabular-nums`
- [ ] Recent activity rendered **only if** the API supplies it; absence reported as a gap
- [ ] No second poll of `/admin/overview`; manual Refresh calls `refreshOverview()`
- [ ] "updated N minutes ago" is real, derived from the last successful fetch
- [ ] Reports: range control mirrored in the URL; **all four ranges curled and confirmed**
- [ ] The three SRS reports present: total orders, revenue by market, most active farmers
- [ ] `BarChart` reused; chart has `role="img"`, a summary label, and a text equivalent
- [ ] Sum row on revenue by market; money labelled **Collected** with the cash note
- [ ] Export downloads a **real CSV** — first three lines pasted
- [ ] `sales.csv` wrapper added to `src/api/admin.js`
- [ ] `revokeObjectURL` called; export history refreshes after a successful export
- [ ] Both pages: loading skeletons in final boxes, inline error with Retry, calm empty state
- [ ] `layoutCheck()` **zero findings** on both pages at 360, 390, 768, 1024, 1440

---

# PART 7 · Verification gate

### Capability re-curl

Table: capability, method, path, status, **full response shape**, and the field mapping you used.
Five rows, plus one row per range value on `/admin/reports/summary`.

### A1 build · A2 runtime

```bash
npm run build
npm run dev
```

Zero errors, zero new warnings, zero console errors on both pages.

**Network check on `/admin`:** count requests to `/api/admin/overview` in 60 seconds.
**Expected: one on mount plus one per 45s poll. Not two per cycle.** Paste the count.

### A3 / A4 / A7

```bash
grep -rnE "#[0-9a-fA-F]{3,8}" src/pages/admin/Overview.module.css src/pages/admin/Reports.module.css
grep -rnE ":[^;]*[0-9]+px" src/pages/admin/Overview.module.css src/pages/admin/Reports.module.css | grep -v "1px" | grep -v "0px"
grep -rnE "linear-gradient|radial-gradient|backdrop-filter|!important|:global" src/pages/admin/Overview.module.css src/pages/admin/Reports.module.css
grep -rn "color-primary\|color-beet" src/pages/admin/Overview.module.css src/pages/admin/Reports.module.css
git diff package.json
```

Name every beet hit. Overview should have **zero** in the page body; Reports exactly one (Export).

### Deep-link proof

Click each of the three action-queue rows. Record the resulting URL and confirm the query
parameters are present. (The destination pages do not honour them until stages 3–4 — note that
explicitly; the links must still be correct now.)

### Metric fidelity

Paste the raw `/admin/overview` JSON next to a screenshot of the stat row. Every displayed
number must be traceable to a field. Any metric you omitted: name it and say why.

### Export proof — the one that usually fails

For **each** export type:

1. Click Export
2. Paste the **filename** of the downloaded file
3. Paste its **first three lines**
4. Confirm the totals in the CSV match the totals on screen
5. Confirm **Previous exports** gained a row

Then force a failure (stop the backend) and confirm a readable toast, no crash, and the menu
item recovers from its `Preparing…` state.

### Chart accessibility

Paste the chart's `role` and `aria-label` from the accessibility tree, and show the text
equivalent (hidden table or toggle).

### Range control

Change range to each of the four values. Record: the URL, the request fired, the status, and
that the tiles, chart and both tables all updated. Then reload on `?range=90d` and confirm the
control restores.

### B1 · Responsive sweep

At **360, 390, 768, 1024, 1440** on `/admin` and `/admin/reports`:

```js
const { layoutCheck } = await import('/src/dev/layoutCheck.js');
console.table(layoutCheck());
```

**Zero findings, ten tables.** The two breakdown tables must be **stacked cards below 768** —
screenshot one at 767 and 768.

### B4 · Keyboard

Tab both pages end to end. The range control is arrow-key operable. The Export menu opens with
Enter, is arrow-navigable, closes on `Esc`, and returns focus. Every sortable table header is a
reachable button.

### Minimal seed

```bash
cd backend && npm run seed:minimal
```

A platform with no farmers, no orders, no markets. Both pages must render calm zeros — no
crash, no `NaN`, no "undefined", no division-by-zero in an average. Screenshot both.
Then `npm run seed`.

### Tests

```bash
node tests/run_all.mjs
```

All suites pass.

---

# PART 8 · Report

```
Stage A2 status: PASS | FAIL

## Capability re-curl
| # | capability | method | path | status | response shape | field mapping used |
| ranges | 7d / 30d / 90d / 12m | status each |

## What I changed
- <file> — <one line>

## Gate results
A1 build / A2 runtime:   <output>
Overview poll count/60s: <number — must be ~2>
A3 / A4 / A7:            <output, beet named per page>
Deep links:              <3 URLs with params>
Metric fidelity:         <raw JSON + mapping + omitted metrics>
Export proof:            <per type: filename, first 3 lines, totals match, history updated>
Export failure case:     <result>
Chart a11y:              <role, aria-label, text equivalent>
Range control:           <4 rows + reload restore>
B1 layoutCheck:          <10 tables + 767/768 screenshots>
B4 keyboard:             <result>
Minimal seed:            <both pages, zeros handled>
Tests:                   <summary>

## Backend gaps found
- Does /admin/overview return a delta?            <yes/no — omitted if no>
- Does /admin/overview return an activity feed?   <yes/no — section omitted if no>
- Does /admin/reports/summary return a time series? <yes/no>
- Which ranges does the endpoint accept?          <list>

## Found but not fixed
- <file:line>

## NOT verified
- <what and why>
```

Fix and re-run any failing gate. An export you did not open, a fabricated metric, or a double
poll of `/admin/overview` is a **FAIL**.
