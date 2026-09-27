# Stage 5 · Admin polish and full capability proof

You are working on **MarketLink**. The Admin console redesign is built. Stages 1–4 delivered:

- **1** — API contract pass (37 capabilities curled), shell rewrite, four dead modals fixed,
  six primitives in `src/components/admin/`
- **2** — Overview action queue and live metrics; Reports with charts and working CSV export
- **3** — People (approve / reject / suspend / reinstate / activate / deactivate) and Moderation
- **4** — Markets CRUD with a map pin; Settings split into four tabs

**This stage writes very little new code.** It finds the seams between four stages built in four
sessions, proves every one of the 37 capabilities still works end to end, and hardens what is
genuinely weak.

If you find yourself designing something new, stop. Note it in the report and leave the code.

---

# PART 1 · Context

## 1.1 The rules the console obeys

- **White first.** White is the page. No `--color-canvas` backgrounds. Neutral hairlines via the
  `--color-border` scope on `.layout`.
- **Two beet elements per screen** — active nav plus one primary action. Attention badges are
  carrot. Destructive buttons are danger.
- **Idiqlat headings at weight 400 only.** Inter for everything else. Sentence case.
- **No gradients, no card shadows, no blur, no dark mode.**
- **Breakpoints 480 / 768 / 1024 / 1280.** Every value from a `var(--token)`.
- **44 × 44 minimum targets**, visible focus everywhere, `prefers-reduced-motion` honoured.
- **Every destructive action goes through `ConfirmDialog`**, with a reason where it matters.

## 1.2 The six pages

```
/admin              Overview      action queue, four SRS metrics, recent activity
/admin/people       People        farmers + customers, six account actions, bulk
/admin/markets      Markets       CRUD, map pin, seven-day schedule
/admin/moderation   Moderation    flag queue, remove product, remove review
/admin/reports      Reports       three SRS reports, CSV export, history
/admin/settings     Settings      categories · announcements · messages · platform [· email log]
```

## 1.3 Off-limits

`src/pages/buyer/**`, `src/pages/vendor/**`, `src/pages/guest/**` — **except** the read-only
cross-role audit in Task 7, which changes nothing. `backend/**` — except `docs/`.
`package.json`.

**Do not redesign anything.** Fix defects. Four stages of decisions are not up for revision.

---

# PART 2 · Your tasks

## Task 1 · The full capability re-proof — 37 rows

**The most important task in the stage.** Four stages curled their own slice. Nothing has
verified the whole surface *after* everything was built. Regressions hide exactly here.

Fresh `npm run seed`, both servers running, signed in as admin **in the browser** (not curl).
For every capability, drive it **through the UI** and record the result:

| # | Capability | Page | UI path | Result |
|---|---|---|---|---|
| 1 | Platform overview | `/admin` | page load | |
| 2 | List farmers | `/admin/people` | Farmers tab | |
| 3 | Approve farmer | `/admin/people` | row → Approve → confirm | |
| 4 | Reject farmer | `/admin/people` | row → Reject → reason → confirm | |
| 5 | Suspend farmer | `/admin/people` | row → Suspend → reason → confirm | |
| 6 | Reinstate farmer | `/admin/people` | row → Reinstate → confirm | |
| 7 | List customers | `/admin/people` | Customers tab | |
| 8 | Deactivate customer | `/admin/people` | row → Deactivate → reason | |
| 9 | Activate customer | `/admin/people` | row → Activate | |
| 10 | Combined people list | — | wrapped or explicitly skipped | |
| 11 | List markets | `/admin/markets` | page load | |
| 12 | Create market | `/admin/markets` | Add market → save | |
| 13 | Update market | `/admin/markets` | Edit → change → save | |
| 14 | Delete market | `/admin/markets` | ⋯ → Delete → type name | |
| 15 | Moderation queue | `/admin/moderation` | Open tab | |
| 16 | Resolve flag | `/admin/moderation` | Keep it → confirm | |
| 17 | Remove product | `/admin/moderation` | Remove listing → note | |
| 18 | Remove review | `/admin/moderation` | Remove review → note | |
| 19 | Reports summary | `/admin/reports` | each of 4 ranges | |
| 20 | Report history | `/admin/reports` | Previous exports | |
| 21 | CSV export | `/admin/reports` | Export → each type | |
| 22 | Sales CSV | `/admin/reports` | Export menu | |
| 23–27 | Categories: list, create, update, delete, reorder | `/admin/settings?tab=categories` | | |
| 28–32 | Announcements: list, create, update, publish, delete | `?tab=announcements` | | |
| 33–34 | Messages: list, handle | `?tab=messages` | | |
| 35–36 | Settings: read, update | `?tab=platform` | | |
| 37 | Email log | `?tab=email` or skipped | | |

For every **write**, record **before → after** read back from the server, not from the screen.

**Any row that fails is a blocker.** Fix it in this stage — it is a regression, not a new feature.

## Task 2 · The consistency sweep

Four sessions built six pages. They will disagree. Audit and fix the outliers **toward the
majority**:

| Axis | Check |
|---|---|
| Page frame | Every page uses `AdminPage` with exactly one `<h1>` |
| Context line | One muted line, same phrasing pattern |
| Primary action | Same position (top right), same style, exactly one per page |
| Tables | All use `DataTable`; same row height, same hover, same empty state |
| Filters | All use `FilterBar`; same search placeholder pattern, same Reset |
| URL state | Every tab, filter, search and page number is in the URL on every page |
| Dialogs | All destructive actions use `ConfirmDialog`; same title/body voice |
| Toasts | Same wording pattern: `Market saved.` `12 approved. 2 failed.` |
| Dates | One format everywhere, routed through `src/utils/format.js` |
| Money | Always `formatPrice`, always `tabular-nums`, always labelled **Collected** |
| Status badges | Same colour mapping across People, Moderation, Markets, Announcements |
| Sentence case | Every heading, label and button |

Produce a table of every inconsistency and how you resolved it.

## Task 3 · The 13-viewport responsive sweep

All six pages (plus all four settings tabs = **nine views**) at **thirteen** viewports:

```
320 · 360 · 390 · 430 · 600 · 768 · 820 · 1024 · 1180 · 1280 · 1440 · 1920 · 844x390
```

Automate it. Extend the buyer sweep if `tests/05_sweep.mjs` exists, or write
`tests/06_admin_sweep.mjs` using `tests/helpers.mjs`:

```js
import { createTestContext, BASE_URL } from './helpers.mjs';
// add a loginAsAdmin(page) helper alongside loginAsCustomer
const VIEWS = ['/admin', '/admin/people', '/admin/markets', '/admin/moderation',
               '/admin/reports', '/admin/settings?tab=categories',
               '/admin/settings?tab=announcements', '/admin/settings?tab=messages',
               '/admin/settings?tab=platform'];
```

**Target: zero findings across all 117 cells.**

The three that break admin consoles:

- **320px** — a six-column table has nowhere to go. It must be stacked cards.
- **844×390 landscape** — 390px of height with a 56px top bar. Sheets and dialogs must still be
  scrollable and their action buttons reachable. Check every sheet and dialog at this size.
- **1920** — content must stay in its 1280px column and not stretch.

## Task 4 · The accessibility pass

### 4a · Keyboard — all nine views

Tab each end to end. Record: every control reachable, visible focus ring, tab order matches
visual order, no trap outside a modal, every sheet and dialog traps and releases correctly,
`Esc` closes and returns focus, the sidebar and mobile drawer both fully operable.

**Then do one complete admin task with no mouse at all:** approve a farmer, create a market with
coordinates and a schedule, and reorder a category. Describe the key path for each.

### 4b · Semantics

```bash
grep -rn "onClick" src/pages/admin src/components/admin --include="*.jsx" | grep -iE "<div|<span"
```

Must be empty. Then per view: one `<h1>`, headings descend, tables are real `<table>`s with
`<th scope>`, `aria-sort` on sortable headers, forms use `<label>`, icon-only buttons have
`aria-label`, status is never colour-only.

### 4c · Contrast

Every text/background pair at **AA** (4.5:1 body, 3:1 large and UI boundaries). The likely
failures:

```bash
grep -rn "color-ink-faint" src/pages/admin src/components/admin --include="*.module.css"
grep -rn "color: var(--color-carrot)" src/pages/admin src/components/admin --include="*.module.css"
```

`--color-ink-faint` (`#9A9088`) is **2.9:1** on white — placeholder and disabled text only,
never information. `--color-carrot` fails as text; warnings use `--color-carrot-text`.

### 4d · Reduced motion and zoom

DevTools → Rendering → *Emulate prefers-reduced-motion: reduce*. Nothing animates: no sheet
slide, no skeleton shimmer, no map zoom animation, no toast slide.

Browser zoom **200% at 1280**: content reflows, no horizontal scrollbar, tables still usable.

## Task 5 · Destructive-action audit

Grep every mutation call site and confirm each is guarded:

```bash
grep -rn "approveFarmer\|rejectFarmer\|suspendFarmer\|reinstateFarmer\|deactivateCustomer\|activateCustomer\|deleteMarket\|removeProductByAdmin\|removeReviewByAdmin\|resolveModerationFlag\|deleteAdminCategory\|deleteAdminAnnouncement\|publishAdminAnnouncement\|updatePlatformSettings" src/pages/admin
```

For each hit, a row: call site, guarded by `ConfirmDialog`? reason required? consequence stated
in the body? refetch after? `refreshOverview()` after where a badge changes?

**Any unguarded destructive call is a blocker.**

## Task 6 · Error and offline behaviour

With the **backend stopped**, load all nine views and attempt one action on each. Every one must
show a readable inline error with a working Retry. None may show a blank page, a spinner that
never resolves, a raw error code, or an unhandled promise rejection in the console.

Then with the backend running, force these and record the result:

- **401** — let the access token expire (or clear it) and act: silent refresh, or a clean
  redirect to `/login`. Not a silent failure.
- **403** — sign in as a **customer** and navigate to `/admin`: the Unauthorized page, not a
  crash and not a partial render of admin chrome.
- **404** — act on a deleted record: readable message, list refetches.
- **409 / conflict** — delete a market with stalls: the real server message, surfaced.
- **429** — fire a bulk action large enough to trip the limiter, if reachable: honest partial
  report.
- **422** — submit an invalid market: field-level errors under their fields.

## Task 7 · Dead code and cross-role regression

```bash
grep -rn "isOpen=" src/pages/admin                 # must be empty
grep -rn "placeholders" src/pages/admin            # must be empty
grep -rn "console\.log" src/pages/admin src/components/admin
grep -rn "TODO\|FIXME\|XXX\|HACK" src/pages/admin src/components/admin
wc -l src/pages/admin/*.jsx src/pages/admin/settings/*.jsx
git diff --stat src/pages/buyer src/pages/vendor src/pages/guest src/layouts/BuyerLayout.jsx src/layouts/VendorLayout.jsx src/layouts/GuestLayout.jsx
```

No admin page file over **400 lines**; no settings tab over **250**. Any over: extract, do not
argue.

Cross-role: load and click through every buyer, vendor and guest page. They must be unchanged.
Shared components you touched (`BottomSheet`, `Badge`, `FormField`, `Toggle`, `Tabs`) need a
screenshot check on vendor and buyer. **Change nothing — report only.**

Also list the ~16 vendor `isOpen` sites still outstanding, as a known follow-up.

## Task 8 · Documentation

- **`docs/DESIGN_SYSTEM.md`** — add an "Admin console" section: the shell, the six primitives
  with props, the accent budget for admin, the table stacking rule, and the destructive-action
  contract.
- **`README.md`** — admin route map, seeded admin credentials, what each page does.
- **`backend/docs/API.md`** — verify the admin sections match reality by re-curling three
  endpoints and diffing against the documented examples. Fix the doc if it drifted.
- **`docs/ADMIN_RUNBOOK.md`** — new, short, factual: how to approve a farmer, how to add a
  market, how to publish an announcement, how to export a report. A judge may ask an operator
  question, and this is also demo-video material.

---

# PART 3 · Your skills for this stage

### Skill 1 · Re-prove through the UI, not through curl

Stage 1 proved the API. This stage proves **the app**. A capability can pass curl and still be
unreachable because a button was never wired, a filter never read its URL param, or a dialog
never closed. Drive it with a mouse and keyboard.

### Skill 2 · Read state back from the server

The screen shows what your code believes. A second GET shows what happened. Every write in the
re-proof gets a read-back.

### Skill 3 · Fix outliers toward the majority

When five pages format dates one way and one differs, the one is wrong — even if it is nicer.
Consistency beats any individual choice, and re-opening four stages of decisions in the final
stage is how a redesign never ships.

### Skill 4 · Landscape phone is a height problem

At 844×390 a sheet with a sticky footer can leave its confirm button off-screen. The fix is
`max-height: 100dvh` with an internal scroll region and the footer pinned inside it, plus
`@media (max-height: 480px)` adjustments. Check every sheet and dialog at this size specifically.

### Skill 5 · Test the unhappy path deliberately

Four stages tested the happy path constantly and the failure path never. Stop the backend.
Expire a token. Sign in as the wrong role. Most of what a judge finds in five minutes lives here.

### Skill 6 · An unguarded destructive call is a blocker, not a nit

The grep in Task 5 is not a style check. A `deleteMarket` wired directly to `onClick` will
eventually delete a market during a demo.

### Skill 7 · The last stage adds nothing

Delete, unify, prove. If you are designing, you have drifted — record the idea and move on.

---

# PART 4 · Hard rules — never do these

1. **Never redesign a page.** Fix defects only.
2. **Never add a feature.** Record ideas in the report.
3. **Never fix an outlier by changing the majority.**
4. **Never leave a destructive call unguarded.**
5. **Never use `--color-ink-faint` for information**, or `--color-carrot` as text.
6. **Never leave an animation without a reduced-motion guard.**
7. **Never leave a clickable `div` or `span`.**
8. **Never edit a buyer, vendor or guest file.** Report regressions; do not fix them here.
9. **Never leave an admin page over 400 lines or a settings tab over 250.**
10. **Never leave stale documentation.** Replace it.
11. **Never write the project report.** The SRS forbids AI-generated documentation; the runbook
    is a factual procedure list, nothing more.
12. **Never add a dependency.**
13. **Never claim a sweep you did not run.** 117 cells means 117, or say how many you ran.
14. **Never report PASS with a failing capability row.**

---

# PART 5 · Definition of done

- [ ] All **37 capabilities re-proved through the UI**, writes with server read-back; zero failures
- [ ] Consistency table produced; every outlier fixed toward the majority
- [ ] `tests/06_admin_sweep.mjs` runs 9 views × 13 viewports; **zero findings across 117 cells**
- [ ] 844×390 landscape: every sheet and dialog scrollable with its action reachable
- [ ] 200% zoom at 1280 reflows with no horizontal scrollbar
- [ ] Keyboard walk passes on all nine views; three full tasks completed with no mouse
- [ ] Zero clickable `div`s or `span`s; every table a real `<table>` with `aria-sort`
- [ ] Every contrast pair meets AA; `ink-faint` and carrot-as-text audited
- [ ] Reduced motion stops everything
- [ ] Destructive-action audit: every mutation guarded, reasoned, consequence stated, refetched
- [ ] Backend-down walk: nine views readable with working Retry
- [ ] 401 / 403 / 404 / 409 / 422 all handled and proven
- [ ] Dead-code greps clean; no page over 400 lines, no tab over 250
- [ ] Buyer, vendor and guest verified unchanged
- [ ] `DESIGN_SYSTEM.md` admin section, `README.md`, `API.md` verified, `ADMIN_RUNBOOK.md` written
- [ ] `node tests/run_all.mjs` and `cd backend && npm test` both fully pass

---

# PART 6 · Verification gate

### The capability re-proof

The full 37-row table, driven through the UI, writes with before → after read-back.
**Zero failures.** Any failure fixed in this stage and re-run.

### Build, runtime, design-rule audit

```bash
npm run build
npm run dev

grep -rnE "#[0-9a-fA-F]{3,8}" src/pages/admin src/components/admin --include="*.module.css"
grep -rnE ":[^;]*[0-9]+px" src/pages/admin src/components/admin --include="*.module.css" | grep -v "1px" | grep -v "0px"
grep -rnE "linear-gradient|radial-gradient|conic-gradient|backdrop-filter" src/pages/admin src/components/admin --include="*.module.css"
grep -rn ":global\|!important" src/pages/admin src/components/admin --include="*.module.css"
grep -rn "box-shadow" src/pages/admin src/components/admin --include="*.module.css" | grep -vE "shadow-menu|shadow-modal|shadow-control|shadow-none"
grep -rnE "@media[^{]*\(min-width:\s*(?!(480|768|1024|1280)px)" src/pages/admin src/components/admin --include="*.module.css"
git diff package.json
```

All empty. `max-height` queries for landscape are exempt — list them separately.

### Accent budget — the final count

Each of the nine views at 390 and 1440: count visible beet elements and name them.
**Maximum two.** An 18-row table.

### The sweep

```bash
node tests/06_admin_sweep.mjs
```

Full 9 × 13 matrix. Every cell zero.

### Accessibility

- Keyboard walk: nine-row table, six checks each
- Three mouse-free tasks: the key path for each
- Clickable div/span grep: empty
- Contrast: table of pairs and ratios
- `ink-faint` / carrot greps: every hit accounted for
- Reduced motion: walkthrough result
- 200% zoom: per view

### Destructive-action audit

The Task 5 table: call site, dialog, reason, consequence stated, refetch, `refreshOverview()`.
Every row must be yes where applicable.

### Error handling

- Backend-down: nine views, result each
- 401 / 403 / 404 / 409 / 422: five results

### Dead code and cross-role

All greps, `wc -l` output, `git diff --stat` for the other three roles, plus a screenshot check
of shared components on vendor and buyer.

### Tests

```bash
node tests/run_all.mjs
cd backend && npm run seed && npm test
```

Both full summaries. Everything passes.

---

# PART 7 · Report

```
Stage A5 status: PASS | FAIL

## Capability re-proof (37 rows through the UI)
| # | capability | UI path | status | before → after | result |

## Consistency table
| axis | inconsistency | pages | resolved to |

## The sweep
<9 x 13 matrix>   Cells: 117   With findings: <n>

## Accessibility
Keyboard walk:      <9-row table>
Mouse-free tasks:   <3 key paths>
Clickable div/span: <grep>
Contrast:           <pairs and ratios>
ink-faint / carrot: <accounted for>
Reduced motion:     <result>
200% zoom:          <result>

## Destructive-action audit
| call site | ConfirmDialog | reason required | consequence stated | refetch | refreshOverview |

## Error handling
Backend down:       <9 views>
401 / 403 / 404 / 409 / 422:  <5 results>

## Design-rule audit
<all greps>

## Accent budget
<18-row table>

## Dead code and sizes
<greps + wc -l; no page > 400, no tab > 250>

## Cross-role regression
git diff --stat:    <output>
Shared components on vendor/buyer: <screenshot check>
Outstanding vendor isOpen sites:   <file:line list>

## Documentation
- DESIGN_SYSTEM.md admin section:  <yes/no>
- README.md admin routes + creds:  <yes/no>
- API.md verified against reality: <3 endpoints diffed>
- ADMIN_RUNBOOK.md:                <yes/no>

## Ideas recorded, not built
- <anything you wanted to add>

## Found but not fixed
- <file:line, with why>

## NOT verified
- <what and why>

## SRS traceability — Admin Features
| requirement | route | component | endpoint | how verified |
| dedicated dashboard separate from customer/farmer | | | | |
| total farmers / customers / markets / orders | | | | |
| view, approve, suspend farmer registrations | | | | |
| view, activate, deactivate customer accounts | | | | |
| add, edit, remove markets incl. days, timings, coordinates | | | | |
| view and remove inappropriate listings or reviews | | | | |
| reports: total orders, revenue by market, most active farmers | | | | |
| manage categories | | | | |
| publish platform-wide announcements | | | | |
```

Fix and re-run any failing gate. A failing capability row, an unguarded destructive call, a
non-zero sweep cell, or a page over 400 lines is a **FAIL** — report it as one.
