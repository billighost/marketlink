# MarketLink — Guest (Public) Side Redesign · Prompt Pack

A rebuild of the unauthenticated public site: the front door, the public catalogue, and every
auth flow. White-first, fast, and roughly **a third of its current size**.

**Read this file yourself. Do not paste it to the AI.**

---

## How to run this pack

Each numbered file is a **complete, standalone prompt** containing the project context, the
design rules, the exact file list, the code patterns and the verification gate.

1. Open a **fresh AI session** per stage.
2. Paste **the whole stage file** as the first message.
3. Check the report against the **Definition of done**.
4. **Commit before the next stage**: `git add -A && git commit -m "guest redesign: stage N"`
5. On `FAIL` or "not verified", paste that back and say *"Fix this and re-run the gate."*

---

## Stage order

| # | File | Builds | Safe to stop after? |
|---|---|---|---|
| 1 | `01_Guest_Shell_And_Sharing.md` | Scoped tokens, `TopBar` rebuild, `Footer`, `GuestBottomNav`, guest primitives, and the **shared-catalogue strategy** | yes |
| 2 | `02_Home_About_Contact.md` | The front door, the story page, the contact form + map | yes |
| 3 | `03_Public_Catalogue.md` | Markets, Market, Stalls, Stall, Produce browse, Produce — six pages, shared with buyer | yes |
| 4 | `04_Auth_Flows.md` | Login, dual-role Register, forgot/reset password, email verification, 401/403/404 | yes |
| 5 | `05_Guest_Polish_And_Proof.md` | 13-viewport sweep, a11y, SEO, perf, full walkthrough | — |

**Stage 1 is the foundation and sets the sharing strategy. Do not reorder.**

---

## Before stage 1

```bash
cd backend && npm run seed && npm run dev    # terminal 1, port 4000
cd ..     && npm run dev                     # terminal 2, port 3000
```

Open `http://localhost:3000` **signed out** (use a private window — the refresh cookie will
sign you back in otherwise).

---

## The problem this pack solves

**The guest side is 20,796 lines of page code and CSS.** For comparison, the entire buyer app
after its redesign is a fraction of that. The worst offenders:

| File | Lines |
|---|---|
| `MarketDetail.module.css` | 1,572 |
| `Market.module.css` | 1,416 |
| `About.module.css` | 1,342 |
| `Farmers.module.css` | 1,339 |
| `ProductDetail.module.css` | 1,298 |
| `Home.module.css` | 1,118 |
| `Contact.module.css` | 1,009 |
| `TopBar.module.css` | 802 |

Almost all of it is a **second implementation of pages the buyer side already has**. A produce
card is a produce card whether you are signed in or not; only the call to action differs.

**Stage 1 establishes the fix: one catalogue, two shells.** Stage 3 executes it. The target is
roughly a third of the current line count, with the public site looking *better*, not worse.

---

## Rules for the whole pack

- **Guest side only.** `src/pages/buyer/`, `src/pages/vendor/`, `src/pages/admin/` are off-limits
  **except** where a stage explicitly extends a shared component for both — and then the buyer
  side must be screenshot-verified as unchanged.
- **No new dependencies.**
- **No payment, no delivery, ever** — including in marketing copy on Home and About.
- **Every public page must work signed out.** Test in a private window, always.
- **Evidence, not adjectives.** Every stage ends with real command output.
