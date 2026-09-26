# Z · Verification Gate

> Embedded at the end of every stage prompt. Reproduced here so a human can read it once.

---

**A stage is not finished until every box below is proven by running something.**

"Should work", "looks correct", "I have implemented it" are **failures**. Show output or write
"not verified".

---

## Gate A — every stage

### A1 · It builds

```bash
npm run build
```

Paste the last 15 lines. **Zero errors. Zero new warnings.** If a warning existed before your
change, say so explicitly.

### A2 · It runs clean

```bash
npm run dev
```

Open the pages you touched. Open DevTools Console and Network.

- **Zero console errors.** Zero React warnings (key warnings, `act` warnings, invalid-prop
  warnings, `useEffect` dependency warnings).
- **Zero failed network requests** except ones you triggered on purpose.
- **No duplicate requests on mount.** React StrictMode double-invokes effects in dev — if you
  see two identical GETs, your effect is missing a guard or a stable dependency. Fix it.

### A3 · Token purity

```bash
# raw hex outside tokens.css — must be empty
grep -rnE "#[0-9a-fA-F]{3,8}" src --include="*.module.css"

# raw px outside tokens.css — only 1px hairlines are allowed
grep -rnE ":[^;]*[0-9]+px" src --include="*.module.css" | grep -v "1px" | grep -v "0px"
```

Paste both outputs. Every hit must be either removed or justified in one line.

### A4 · No forbidden CSS

```bash
grep -rnE "linear-gradient|radial-gradient|conic-gradient|backdrop-filter|!important" src --include="*.module.css"
grep -rn ":global" src --include="*.module.css"
```

Must be empty. Box-shadow is allowed **only** as `var(--shadow-menu)` or `var(--shadow-modal)`:

```bash
grep -rn "box-shadow" src --include="*.module.css" | grep -v "shadow-menu" | grep -v "shadow-modal" | grep -v "shadow-control" | grep -v "shadow-none"
```

### A5 · No dead data

```bash
grep -rn "placeholders" src
```

Must be empty. Any page importing `src/data/placeholders.js` is a bug.

### A6 · No new dependencies

```bash
git diff package.json
```

Must be empty.

### A7 · The accent budget

For each buyer page you touched, count the elements that render in
`--color-primary` / `--color-beet` / `--color-beet-dark`.

```bash
grep -rn "color-primary\|color-beet" src/pages/buyer src/components --include="*.module.css"
```

**At most two beet elements visible per screen.** Report the count per page and name them.
`--color-beet-tint` (a near-white background) does not count.

---

## Gate B — every stage that touches layout or adds a page

### B1 · Responsive sweep

For **every page you touched**, at **five viewports** — 360, 390, 768, 1024, 1440:

```js
// paste in the DevTools console on each page, at each width
const { layoutCheck } = await import('/src/dev/layoutCheck.js');
console.table(layoutCheck());
```

**Target: zero findings.** Paste the result for each page/width pair. Every finding must be
fixed, not explained away. The checks are: horizontal overflow, overlapping interactive or
fixed elements, sub-44px touch targets, clipped or squeezed text, uneven cards inside
`[data-check-even]`, distorted media inside `[data-aspect]`.

### B2 · Density budget at 390x844

Screenshot or describe the **first viewport** of each page you touched. It must contain:
header, one `<h1>`, one muted context line, one primary element. **Nothing more.**
If a fourth thing is visible, move it down.

### B3 · Bottom stack does not collide

At 390 wide, with **3 items in the basket**, on a page that scrolls to the end:

- `BottomNav` sits at bottom 0
- `CartBar` sits fully above it, no overlap
- A toast appears fully above `CartBar`, no overlap
- The **last in-flow element** on the page can be scrolled fully clear of all of them

### B4 · Keyboard walk

Tab from the top of each page you touched to the bottom.

- Every interactive element is reachable
- Focus ring is **visible** on every stop
- Tab order matches visual order
- `Esc` closes any open overlay and returns focus to what opened it
- No focus trap outside a modal; a modal **does** trap focus

---

## Gate C — every stage that touches the backend

### C1 · Automated tests from a clean database

```bash
cd backend && npm run seed && npm test
```

Paste real pass/fail counts and duration. **All 61 pre-existing tests must still pass.**
Never delete, skip or weaken a test to make it green.

### C2 · New tests written

For every endpoint or field you added: happy path, 422 validation, 401 no token, 403 wrong
role, 404 not found, and empty-list edge case. Ownership rules proven — a Customer can never
read another Customer order.

### C3 · Manual call per endpoint

`curl` each new or changed endpoint as the seeded Customer. Record method, path, status, and a
trimmed response body.

### C4 · No collection scans

```js
db.collection('x').find(query).explain('executionStats')
```

Confirm no `COLLSCAN`, `totalDocsExamined` close to `nReturned`, projections present.
Reads under 50ms, feeds and search under 80ms, writes under 100ms.

### C5 · Contract is additive

```bash
cd backend && npm run routes
```

Diff against the previous inventory. **No route removed, no route renamed, no response field
removed or retyped.** Paste the diff.

### C6 · Docs match reality

`backend/docs/API.md` updated for every changed endpoint, with an example response.
`DATABASE.md` updated for every new field.

---

## Gate D — the end-to-end walk (stages 4 and up)

Backend and frontend both running. Signed in as `george@example.com / market123`.
Walk the full loop in the browser and record the outcome of each step:

1. Land on `/buyer` — market clock shows correct open/closed state
2. Browse produce, apply a filter, clear it
3. Open a produce page **by clicking**, then **by pasting its URL into a new tab** — both work
4. Add to basket, see the count update
5. Open the basket, change a quantity, remove an item
6. Go to checkout, pick a pickup window, place the pre-order
7. Land on the confirmation page, note the collection code
8. Open Orders, open the order, see the timeline and the same code
9. Cancel the order (before cutoff)
10. Favourite a produce item and a stall, find both under Saved
11. Ask the assistant a question, get an answer
12. Open Notifications, mark all read
13. **Press Back from every page** and land somewhere sensible
14. **Refresh every page** and get the same page, not a redirect to `/buyer`

Then repeat steps 1–8 at **1440px wide** and confirm the desktop shell (top nav, no bottom nav).

---

## Gate E — the empty-database walk (stages 5 and up)

```bash
cd backend && npm run seed:minimal
```

Visit every buyer page. **Every one must show its scene-based empty state** — never a blank
screen, never a spinner that never resolves, never a crash. List page-by-page what appeared.

Then `npm run seed` again to restore.

---

## The report format

End your work with exactly this shape:

```
Stage N status: PASS | FAIL

## What I changed
- file path — one line on what and why
  (every file, none omitted)

## Gate A
A1 build: <output>
A2 console: <output>
A3 token purity: <output>
A4 forbidden CSS: <output>
A5 placeholders: <output>
A6 dependencies: <output>
A7 accent budget: <page: count, which two>

## Gate B  (if applicable)
B1 layoutCheck: <table per page per viewport>
B2 density: <per page>
B3 bottom stack: <result>
B4 keyboard: <result>

## Gate C  (if applicable)
C1 backend tests: <output>
C2 new tests: <list>
C3 curl: <table>
C4 explain: <table>
C5 route diff: <output>
C6 docs: <files updated>

## Gate D / E  (if applicable)
<step-by-step results>

## NOT verified
- <anything you could not prove, and why>

## What I would test next
- <one or two items>
```

If any gate fails: **fix it and re-run the gate.** Do not hand back a failing stage with a
list of excuses. If you genuinely cannot fix something, say exactly what you tried and what
blocked you.
