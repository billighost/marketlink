# Stage 3 · People and Moderation — approvals, account control, content removal

You are working on **MarketLink**. Stages 1–2 of the Admin redesign are done: the API contract
was curled end to end, the shell was rewritten, four dead modals were fixed, six primitives
exist in `src/components/admin/`, and Overview + Reports are live.

This stage rebuilds **two pages** and wires **thirteen capabilities** — the ones with real
consequences for real accounts and public content.

1. `/admin/people` — Farmers and Customers: approve, reject, suspend, reinstate, activate, deactivate
2. `/admin/moderation` — the flag queue: resolve, remove a product listing, remove a review

**Every action on these pages changes what a Farmer or Customer can do.** None of them may be a
single unguarded click, and every one must be proven against the live API.

---

# PART 1 · Context

## 1.1 What MarketLink is

Local farmers-market **Farmers** and **Customers**. A Customer reserves produce from a stall and
**collects in person, paying cash**. **No payment gateway. No delivery.**

## 1.2 The SRS requirements this stage satisfies

> Admin can **view, approve, or suspend Farmer registrations before they can list products**.
>
> Admin can **view, activate, or deactivate customer accounts** in case of policy violations.
>
> Admin can **view and remove inappropriate product listings or customer reviews** that violate
> platform guidelines.

The phrase **"before they can list products"** is the whole point of the approvals queue: an
unapproved Farmer must not appear in the public catalogue. The backend enforces this via
`requireApprovedFarmer` middleware. Your UI must make the consequence visible.

## 1.3 Stack and rules

React 18.3, Vite 6, react-router-dom 6.28. **CSS Modules only. No new dependencies.**
Breakpoints **480 / 768 / 1024 / 1280**. Idiqlat headings **weight 400 only**.
Every value from a `var(--token)`; no raw hex, no raw px beyond `1px` hairlines.

**Accent budget: two beet elements per screen** — the active sidebar item and one primary
action. Destructive buttons are **danger, never beet**.

## 1.4 The files

```
src/pages/admin/People.jsx     + .module.css   571 + 358 lines — REWRITE
src/pages/admin/Moderation.jsx + .module.css   234 + 231 lines — REWRITE

src/components/admin/AdminPage.jsx  DataTable.jsx  FilterBar.jsx
src/components/admin/BulkBar.jsx    ConfirmDialog.jsx            Stage 1
src/components/ui/Badge.jsx  StatusDot.jsx  Tabs.jsx  BottomSheet.jsx
src/api/admin.js                    the verified client
```

`People.jsx:339` had the dead `isOpen` bug — Stage 1 fixed the prop. You now rebuild the page
around it properly.

## 1.5 The capability matrix — everything this stage must make work

**Nothing here is optional. A button that renders but does not call the API is not done.**

| # | Capability | Wrapper | Endpoint | Guarded by |
|---|---|---|---|---|
| 2 | List farmers (filter, search, page) | `getAdminFarmers(query)` | `GET /admin/farmers` | — |
| 3 | **Approve** farmer | `approveFarmer(id)` | `POST /admin/farmers/:id/approve` | ConfirmDialog |
| 4 | **Reject** farmer, with reason | `rejectFarmer(id, reason)` | `POST /admin/farmers/:id/reject` | ConfirmDialog + **reason required** |
| 5 | **Suspend** farmer, with reason | `suspendFarmer(id, reason)` | `POST /admin/farmers/:id/suspend` | ConfirmDialog + **reason required** |
| 6 | **Reinstate** farmer | `reinstateFarmer(id)` | `POST /admin/farmers/:id/reinstate` | ConfirmDialog |
| 7 | List customers | `getAdminCustomers(query)` | `GET /admin/customers` | — |
| 8 | **Deactivate** customer, with reason | `deactivateCustomer(id, reason)` | `POST /admin/customers/:id/deactivate` | ConfirmDialog + **reason required** |
| 9 | **Activate** customer | `activateCustomer(id)` | `POST /admin/customers/:id/activate` | ConfirmDialog |
| 10 | Combined people list | *(no wrapper — evaluate)* | `GET /admin/people` | — |
| 15 | Moderation queue | `getModerationFlags(query)` | `GET /admin/moderation` | — |
| 16 | **Resolve** a flag | `resolveModerationFlag(id, {action, note})` | `POST /admin/moderation/:id/resolve` | ConfirmDialog |
| 17 | **Remove** a product listing | `removeProductByAdmin(id, note)` | `POST /admin/products/:id/remove` | ConfirmDialog + **note required** |
| 18 | **Remove** a review | `removeReviewByAdmin(id, note)` | `POST /admin/reviews/:id/remove` | ConfirmDialog + **note required** |

**Before building anything**, curl all thirteen against seeded data and paste the real response
shapes, the exact `status` values a farmer or customer can hold, and the `action` values that
`resolveModerationFlag` accepts. Do not guess a status vocabulary — read it from the data and
from `backend/src/constants.js`.

For capability 10, decide whether `GET /admin/people` gives you anything the two separate lists
do not. If it does not, leave it unwrapped and say so.

## 1.6 Off-limits

`src/pages/buyer/**`, `src/pages/vendor/**`, `src/pages/guest/**` and their layouts.
`backend/**`. `package.json`. The other four admin pages.

---

# PART 2 · Page A — People (`/admin/people`)

## 2.1 Structure

```
┌──────────────────────────────────────────────────────────────┐
│  People                                      Idiqlat h1      │
│  48 farmers · 1,204 customers                                │
│                                                              │
│  [ Farmers (48) | Customers (1,204) ]                Tabs    │
│                                                              │
│  🔍 Search name, stall or email    Status ▾   Market ▾   Reset│
│  12 results                                                  │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ ☐ │ Stall           │ Contact      │ Market   │ Status │  │
│  ├────────────────────────────────────────────────────────┤  │
│  │ ☐ │ Riverbend Greens│ Maria O.     │ Riverbend│ Pending│  │
│  │   │                 │ maria@…      │          │ [Review]│ │
│  │ ☐ │ Ash Farm Bakery │ Tom A.       │ Riverbend│ Approved│ │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
│  ┌── BulkBar when rows are selected ───────────────────────┐  │
│  │ 3 selected      Clear      [ Approve ]  [ Reject ]      │  │
│  └────────────────────────────────────────────────────────┘  │
```

## 2.2 Tabs and URL state

`Tabs` for Farmers / Customers with live counts. **Every piece of state goes in the URL**:

```
/admin/people?tab=farmers&status=pending&market=<id>&q=riverbend&page=2
```

Read it on mount. This matters for a specific reason: **Stage 2's Overview action queue links
to `/admin/people?tab=farmers&status=pending`.** That link is already live and currently does
nothing. This stage makes it work. Verify it explicitly.

## 2.3 The Farmers table

`DataTable` columns:

| key | header | notes |
|---|---|---|
| `stallName` | Stall | Idiqlat `--text-sm`; links to the public stall page in a new tab |
| `contact` | Contact | name over email, two lines, `--text-sm` |
| `market` | Market | `hideBelow: 768` |
| `products` | Listings | numeric, right, `tabular-nums` |
| `joined` | Joined | date, `hideBelow: 1024` |
| `status` | Status | `Badge` |
| `actions` | — | the action set for that status |

**Status vocabulary comes from the API, not from you.** Read the real values and map them:

| status | Badge | Available actions |
|---|---|---|
| pending | carrot-bg / carrot-text, "Pending" | **Approve**, **Reject** |
| approved | herb-bg / herb, "Approved" | **Suspend** |
| suspended | danger-bg / danger, "Suspended" | **Reinstate** |
| rejected | ink-faint, "Rejected" | (none, or Reinstate if the API allows — curl it) |

If the API returns a status you have not mapped, render it verbatim in a neutral badge rather
than crashing or hiding the row.

**Default sort: pending first**, then newest. An approvals queue that buries pending farmers
under approved ones is not a queue.

## 2.4 The person detail sheet

Clicking a row opens a `BottomSheet` (this is the sheet whose `open` prop Stage 1 fixed) — a
drawer at 768+. It is legitimately transient: look, act, dismiss.

Contents for a Farmer:

- Stall name, contact person, phone, email, address — **all four SRS registration fields**
- Market(s), operating days, pickup windows
- Listing count, order count, average rating
- Current status with **who changed it and when**, if the API supplies it
- The reason text from any previous rejection or suspension — an operator needs the history
- The full action set as buttons at the bottom

For a Customer: name, email, contact number, address, joined date, order count, review count,
status, and Activate/Deactivate.

**Everything shown must come from the API response.** If a field is absent, omit the row —
never render `—` for a field the backend simply does not return, and list those gaps in your
report.

## 2.5 The six state-changing actions

Each one goes through `ConfirmDialog`. Never a bare click.

| Action | Dialog title | Body must say | Reason |
|---|---|---|---|
| Approve | `Approve this farmer?` | "They will be able to list products and appear in the public catalogue." | optional |
| Reject | `Reject this registration?` | "They will not be able to list products. They will see your reason." | **required** |
| Suspend | `Suspend this farmer?` | "Their listings will be hidden from the catalogue immediately. Existing orders are not cancelled." | **required** |
| Reinstate | `Reinstate this farmer?` | "Their listings will return to the public catalogue." | optional |
| Deactivate | `Deactivate this account?` | "They will not be able to sign in or place orders." | **required** |
| Activate | `Activate this account?` | "They will be able to sign in and place orders again." | optional |

**The body text must state the real consequence.** Check what the backend actually does —
does suspending hide listings? does it cancel orders? — and write what is true. If you cannot
determine it from the code, say so in the report and write the conservative version.

### The mutation pattern — use this exactly

```jsx
const runAction = async (fn, id, reason, successMsg) => {
  setBusyId(id);
  try {
    await fn(id, reason);
    await refetch();                 // re-read from the server; never patch local state blindly
    refreshOverview();               // the sidebar pendingFarmers badge must update
    toast(successMsg);
    setDialog(null);
  } catch (err) {
    setDialogError(err.message);     // dialog STAYS OPEN, reason text preserved
    console.error('[People] action failed', err);
  } finally {
    setBusyId(null);
  }
};
```

Three things that are not optional:

1. **Refetch after every mutation.** Optimistically flipping a badge and being wrong about it is
   worse than a 200ms wait.
2. **Call `refreshOverview()` from `AdminContext`.** Approving a farmer must decrement the
   sidebar badge and the Overview queue **without a page reload**. Prove it.
3. **On failure the dialog stays open** with the server message and the typed reason intact.

## 2.6 Bulk actions

`BulkBar` appears on selection. Bulk **Approve** and bulk **Reject** for pending farmers only.

- The dialog names the count and **lists the affected stalls** — an operator about to reject 12
  registrations should see which 12.
- Run sequentially, not `Promise.all` — a burst of writes can trip the rate limiter and you
  cannot report partial failure cleanly from a rejected `all`.
- Report the outcome honestly: `10 approved. 2 failed.` and keep the failed ones selected.
- Bulk reject requires one reason applied to all, and says so in the dialog.

## 2.7 States

- **Loading:** `DataTable` skeleton in the real column layout.
- **Empty:** `EmptyState` — "No farmers match these filters" with a Reset action; for a genuinely
  empty platform, "No farmers have registered yet."
- **Error:** inline panel with the server message and a Retry. Never a blank page.
- **Row busy:** the acting row dims and its buttons disable; the rest of the table stays usable.

---

# PART 3 · Page B — Moderation (`/admin/moderation`)

## 3.1 What this page is

A queue of flagged content. Customers flag reviews via `POST /reviews/:id/flag`; the queue is
what an admin works through. Each item ends in one of: **removed**, **kept**, or **dismissed**.

## 3.2 Structure

```
┌──────────────────────────────────────────────────────────────┐
│  Moderation                                  Idiqlat h1      │
│  3 open flags                                                │
│                                                              │
│  [ Open (3) | Resolved (41) ]                        Tabs    │
│  🔍 Search        Type ▾   Reason ▾              Reset       │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ Review · flagged as Offensive · 2 days ago             │  │
│  │ ───────────────────────────────────────────────────    │  │
│  │ "the quoted review text, in full"                      │  │
│  │ by A. Customer · on Riverbend Greens · ★ 1             │  │
│  │ ───────────────────────────────────────────────────    │  │
│  │ Flagged by 2 customers · latest note: "abusive"        │  │
│  │                                                        │  │
│  │ [ Remove review ]  [ Keep it ]  [ View in context → ]  │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

**Cards, not a table.** The whole job is reading the flagged content and judging it, so the
content must be the largest thing on the card. A table row that truncates a review to 40
characters makes the decision impossible.

## 3.3 Each flag card must show

- **Type** (review or product) and the **flag reason**
- **The content itself, in full** — the review text, or the product name, description, price and
  image. This is the evidence.
- **Who created it** and **where it lives** (which stall, which product)
- **How many times it was flagged** and the flagger notes
- **When**, as a relative time with the absolute date in a `title`
- **View in context** — opens the public page in a new tab, `rel="noopener noreferrer"`

Curl `GET /admin/moderation` first and build to the real shape. If the response does not embed
the content, you will need the linked resource — establish that before designing the card, and
report it.

## 3.4 The three decisions

| Button | Calls | Dialog | Note |
|---|---|---|---|
| **Remove review** | `removeReviewByAdmin(id, note)` then `resolveModerationFlag(id, {action:'removed', note})` | "Remove this review?" — "It will no longer be visible on the stall or product page." | **required** |
| **Remove listing** | `removeProductByAdmin(id, note)` then `resolveModerationFlag(id, {action:'removed', note})` | "Remove this listing?" — "It will be withdrawn from the public catalogue. Existing orders are not affected." | **required** |
| **Keep it** | `resolveModerationFlag(id, {action:'kept', note})` | "Keep this content?" — "The flag will be closed and the content stays visible." | optional |

**Critical: find out whether `resolveModerationFlag` already performs the removal.** Curl it
with `action: 'removed'` on a throwaway flag and check whether the product or review is actually
gone. If it does, calling `removeProductByAdmin` as well is a double action and may error.

**Use the real `action` values the endpoint accepts.** Read them from
`backend/src/modules/admin/moderation/moderation.service.js` or `backend/src/constants.js`.
Do not invent `'removed'` / `'kept'` if the server expects something else. Paste what you found.

After every resolve: refetch the queue **and** call `refreshOverview()` so the sidebar
`openFlags` badge and the Overview queue update live.

## 3.5 The resolved tab

Same cards, muted, showing the outcome, the note, who resolved it and when. Read-only.
This is the audit trail, and a judge will ask whether moderation decisions are recorded.

## 3.6 States

Empty open queue: `EmptyState` — "Nothing flagged" / "Flagged reviews and listings appear here."
That is a **good** state; make it look calm and intentional, not like an error.

---

# PART 4 · Your skills for this stage

### Skill 1 · Read the status vocabulary; never invent it

`pending` / `approved` / `suspended` / `rejected` is a guess until you have seen it in a
response and in `backend/src/constants.js`. A UI that filters on `status=pending` when the
server says `awaiting_review` renders an empty table and looks like a data problem.

### Skill 2 · Refetch after a mutation

An optimistic badge flip that disagrees with the server is a lie an operator will act on.
Await the action, refetch the list, then close the dialog.

### Skill 3 · Propagate to the shell

`refreshOverview()` from `AdminContext` is what makes the sidebar badge and the dashboard queue
agree with the table you just changed. Forgetting it leaves "12 pending" next to an empty
pending list, which reads as a broken app.

### Skill 4 · Sequential writes for bulk, always

```jsx
for (const id of ids) {
  try { await action(id, reason); ok.push(id); }
  catch { failed.push(id); }
}
```

`Promise.all` rejects on the first failure and loses the rest of the results, and a burst of
parallel writes can hit the rate limiter. A loop gives you an honest partial-success report.

### Skill 5 · State the real consequence in the dialog

"Are you sure?" tells an operator nothing. "Their listings will be hidden from the catalogue
immediately. Existing orders are not cancelled." lets them decide. Go and find out what the
backend actually does before you write that sentence.

### Skill 6 · Evidence gets the space

Moderation is a reading task. The flagged text is the largest element on the card. Metadata is
small. Any layout where you cannot read the review without clicking has failed at its one job.

### Skill 7 · Check whether resolve already removes

Two endpoints that both mutate the same thing is a classic double-action bug: the second call
404s, the UI shows an error, and the operator thinks it failed when it worked. One curl against
a throwaway record settles it.

### Skill 8 · The resolved tab is the audit trail

Who did what, when, and why. It costs one extra tab and it is the difference between a
moderation tool and a delete button.

---

# PART 5 · Hard rules — never do these

1. **Never ship a state-changing action without `ConfirmDialog`.**
2. **Never make reject, suspend, deactivate, or remove available without a required reason.**
3. **Never use a status or action value you have not seen in a real response.**
4. **Never patch local state instead of refetching** after a mutation.
5. **Never skip `refreshOverview()`** after an action that changes a badge count.
6. **Never close a dialog on error.** Keep it open, show the message, preserve the reason.
7. **Never use `Promise.all` for bulk writes.**
8. **Never truncate the flagged content** on a moderation card.
9. **Never call both `removeXByAdmin` and `resolveModerationFlag`** until you have confirmed the
   server does not already do the removal.
10. **Never make a destructive button beet.** Danger, and only filled in the dialog's second step.
11. **Never render a row you cannot map** — show the raw status in a neutral badge instead.
12. **Never use a raw hex or raw px**, a gradient, a card shadow, `!important` or `:global`.
13. **Never add a dependency. Never touch buyer, vendor, guest or the backend.**

---

# PART 6 · Definition of done

- [ ] All 13 capabilities curled, with real response shapes, status vocabulary and accepted
      `action` values pasted **before** any UI was written
- [ ] Capability 10 (`GET /admin/people`) evaluated; wrapped or explicitly left unwrapped
- [ ] People: tabs with live counts, all state in the URL
- [ ] **`/admin/people?tab=farmers&status=pending` from Stage 2's dashboard now works** — verified
- [ ] Farmers table: pending sorted first, status badges mapped, per-status action sets
- [ ] Person detail sheet opens and shows all four SRS registration fields plus history
- [ ] All six account actions call the API, refetch, and call `refreshOverview()`
- [ ] Reject / suspend / deactivate require a reason; the reason reaches the server
- [ ] Bulk approve and bulk reject run sequentially and report partial failure honestly
- [ ] Moderation: cards with the full flagged content, flag count and flagger notes
- [ ] The three decisions work; the double-removal question resolved and documented
- [ ] Resolved tab shows outcome, note, actor and time
- [ ] Sidebar `pendingFarmers` and `openFlags` badges update **without a page reload** — proven
- [ ] Both pages: skeletons, empty states, inline errors with Retry, per-row busy state
- [ ] `layoutCheck()` **zero findings** on both pages at 360, 390, 768, 1024, 1440

---

# PART 7 · Verification gate

### Capability proof — all thirteen

For each: method, path, status, response excerpt. For the eight **write** capabilities, also
record the **before and after state of the affected record**, read back with a second GET.

```
approve farmer X:  before status=<...>  →  POST 200  →  after status=<...>
```

An action that returns 200 but does not change the record is a failure, and it is invisible
without the read-back.

Also paste:

- the full set of farmer status values observed
- the full set of customer status values observed
- the `action` values `resolveModerationFlag` accepts, and where you found them
- whether `resolveModerationFlag(action='removed')` already removes the content

### A1 build · A2 runtime

```bash
npm run build
npm run dev
```

Zero errors, zero new warnings, zero console errors. No duplicate requests on mount.

### A3 / A4 / A7

```bash
grep -rnE "#[0-9a-fA-F]{3,8}" src/pages/admin/People.module.css src/pages/admin/Moderation.module.css
grep -rnE ":[^;]*[0-9]+px" src/pages/admin/People.module.css src/pages/admin/Moderation.module.css | grep -v "1px" | grep -v "0px"
grep -rnE "linear-gradient|radial-gradient|backdrop-filter|!important|:global" src/pages/admin/People.module.css src/pages/admin/Moderation.module.css
grep -rn "color-primary\|color-beet" src/pages/admin/People.module.css src/pages/admin/Moderation.module.css
```

Name every beet hit; confirm no destructive button is beet.

### Dashboard deep-link — the Stage 2 promise

From `/admin`, click "Farmers awaiting approval". Record: the URL, that the Farmers tab is
active, that the status filter shows Pending, and that the row count matches the dashboard
count. **All four must be true.**

### Badge propagation — prove it live

1. Note the sidebar `People` badge count
2. Approve one pending farmer
3. **Without reloading**, record the new sidebar badge count and the Overview queue count

Repeat for moderation: note `Moderation` badge, resolve one flag, confirm the badge decrements
without a reload. Paste before/after for both.

### The six account actions

A table, one row each: action, target, reason sent, HTTP status, record state read back after,
toast text, sidebar badge before/after.

### Dialog behaviour

- Reject with an **empty reason**: confirm button disabled
- Reject with a reason, backend **stopped**: dialog stays open, shows a message, reason preserved
- `Esc` closes, focus returns to the trigger, focus trapped while open

### Bulk

Select 3 pending farmers, bulk approve. Record the request count (**3 sequential, not 1**), the
result message, and the table state after. Then force one to fail and confirm the partial report
and that the failed row stays selected.

### Moderation decisions

For one review and one product: the buttons pressed, the calls made **in order**, the statuses,
whether the content is actually gone (verify on the public page), and that the flag moved to
Resolved with its note.

### B1 · Responsive sweep

At **360, 390, 768, 1024, 1440** on both pages:

```js
const { layoutCheck } = await import('/src/dev/layoutCheck.js');
console.table(layoutCheck());
```

**Zero findings, ten tables.** The People table must be **stacked cards below 768** — screenshot
at 767 and 768. `BulkBar` must not overlap the last table row at any width.

### B4 · Keyboard

Tab both pages end to end. Row checkboxes toggle with Space. Sortable headers activate with
Enter. The detail sheet traps focus and returns it. `ConfirmDialog` is fully operable and its
confirm button is reachable.

### Minimal seed

```bash
cd backend && npm run seed:minimal
```

No farmers, no customers, no flags. Both pages show calm empty states. Then `npm run seed`.

### Tests

```bash
node tests/run_all.mjs
```

All suites pass.

---

# PART 8 · Report

```
Stage A3 status: PASS | FAIL

## Capability proof (13 rows, writes with read-back)
| # | capability | method | path | status | before → after | wrapper OK |

## Vocabulary found
- farmer statuses:   <list, and where found>
- customer statuses: <list>
- resolve actions:   <list, and where found>
- does resolve(removed) already remove the content?  <yes/no + evidence>

## What I changed
- <file> — <one line>

## Gate results
A1 build / A2 runtime:  <output>
A3 / A4 / A7:           <output, beet named, no destructive beet>
Dashboard deep-link:    <4 checks>
Badge propagation:      <people before/after, moderation before/after, no reload>
Six account actions:    <6-row table>
Dialog behaviour:       <3 results>
Bulk:                   <request count, partial failure report>
Moderation decisions:   <2 walkthroughs, content verified gone>
B1 layoutCheck:         <10 tables + 767/768 screenshots>
B4 keyboard:            <result>
Minimal seed:           <both pages>
Tests:                  <summary>

## Backend gaps found
- Does the farmer response include who changed the status and when?  <yes/no>
- Does it include previous rejection/suspension reasons?             <yes/no>
- Does /admin/moderation embed the flagged content?                  <yes/no>
- Fields shown in the SRS registration set that the API omits:       <list>

## Found but not fixed
- <file:line>

## NOT verified
- <what and why>
```

Fix and re-run any failing gate. An action that returns 200 without changing the record, a badge
that needs a reload, or a destructive button without a reason is a **FAIL**.
