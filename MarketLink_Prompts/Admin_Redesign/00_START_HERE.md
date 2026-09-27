# MarketLink — Admin Side Redesign · Prompt Pack

A complete rebuild of the Admin console: a real operations tool, white-first, table-driven,
with four dead modals fixed and every destructive action made safe.

**Read this file yourself. Do not paste it to the AI.**

---

## How to run this pack

Each numbered file is a **complete, standalone prompt** containing the project context, the
design rules, the exact file list, the code patterns and the verification gate.

1. Open a **fresh AI session** per stage.
2. Paste **the whole stage file** as the first message.
3. Check the report against the **Definition of done**.
4. **Commit before the next stage**: `git add -A && git commit -m "admin redesign: stage N"`
5. On `FAIL` or "not verified", paste that back and say *"Fix this and re-run the gate."*

---

## Stage order

| # | File | Builds | Safe to stop after? |
|---|---|---|---|
| 1 | `01_Admin_Shell_And_Primitives.md` | Scoped tokens, sidebar shell, `DataTable`, `AdminPage`, `FilterBar`, `StatTile`, `BulkBar`, `ConfirmDialog` + **the four dead-modal fixes** | yes |
| 2 | `02_Overview_And_Reports.md` | Overview action queue, live metrics, Reports with charts and CSV export | yes |
| 3 | `03_People_And_Moderation.md` | Farmer approvals, customer accounts, moderation queue | yes |
| 4 | `04_Markets_And_Settings.md` | Market CRUD with map picker, categories, announcements, support messages, platform config | yes |
| 5 | `05_Admin_Polish_And_Proof.md` | 13-viewport sweep, a11y, perf, audit trail, final walkthrough | — |

**Stage 1 is the foundation. Do not reorder.** Stages 2–4 are independent slices.

---

## Before stage 1

```bash
cd backend && npm run seed && npm run dev    # terminal 1, port 4000
cd ..     && npm run dev                     # terminal 2, port 3000
```

Sign in as the seeded admin (credentials in `backend/src/db/seed.js`), then go to `/admin`.

---

## What is already broken (stage 1 fixes these)

- **Four modals never open.** `Markets.jsx:339`, `People.jsx:339`, `Settings.jsx:602`,
  `Settings.jsx:658` all pass `isOpen` to `<BottomSheet>`, which reads `open`. Market editing,
  person detail, category editing and announcement editing are all unreachable.
- **`aria-current` is given a function** in `AdminLayout.jsx`. `NavLink` already sets
  `aria-current="page"` itself, so the hand-rolled one is both wrong and redundant.
- **Tan hairlines.** `AdminLayout.module.css` uses `--color-wood-line` directly for every border.
- **`Settings.jsx` is 721 lines** doing four unrelated jobs.

---

## Rules for the whole pack

- **Admin side only.** `src/pages/buyer/`, `src/pages/vendor/`, `src/pages/guest/` are off-limits.
  Shared components may be extended, never changed in a way that alters other roles.
- **No new dependencies.**
- **Never weaken a backend guard to make the UI simpler.** Admin actions are privileged.
- **Every destructive action is reversible or confirmed.** No bare `onClick={deleteThing}`.
- **Evidence, not adjectives.** Every stage ends with real command output.
