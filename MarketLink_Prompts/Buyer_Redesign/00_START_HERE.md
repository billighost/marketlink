# MarketLink — Customer (Buyer) Side Redesign · Prompt Pack

A complete rebuild of the signed-in Customer experience: sheet-first → page-first,
beige-tinted → white-first, icon doodles → full-scene SVG art.

**Read this file yourself. Do not paste it to the AI.**

---

## How to run this pack

Each numbered file is a **complete, standalone prompt**. It already contains the project
context, the design rules, the exact file list, the code patterns and the verification gate.

1. Open a **fresh AI session** for each stage.
2. Paste **the whole stage file** as the first message. Nothing else is needed.
3. Let it work. When it reports, check the report against the **Definition of done**.
4. **Commit to git before starting the next stage.** `git add -A && git commit -m "buyer redesign: stage N"`
5. If a stage reports `FAIL` or "not verified", paste that line back and say
   *"Fix this and re-run the verification gate."*

Two files are **references**, not prompts. The AI never needs them separately — every stage
already embeds what it needs. They exist so *you* can read the reasoning in one place:

- `A_CONTEXT_PACK.md` — what MarketLink is, the stack, the repo map, the credentials
- `B_DESIGN_DIRECTION.md` — the visual bible: white-first, the market metaphor, the scene spec
- `Z_VERIFICATION_GATE.md` — the reusable proof-of-work gate

---

## Stage order

| # | File | Builds | Touches backend | Safe to stop after? |
|---|---|---|---|---|
| 1 | `01_Foundation_Tokens_And_Shell.md` | White-first token layer, buyer app shell, page primitives | no | yes |
| 2 | `02_Scene_SVG_Illustration_System.md` | `<Scene>` + 10 full-scene SVG artworks + new `EmptyState` | no | yes |
| 3 | `03_Backend_Additive_Changes.md` | Market clock, stall day-array, grouped cart quote, pickup code | **yes** | yes |
| 4 | `04_Routing_Sheets_To_Pages.md` | Sheets → real pages, redirects, `isOpen` bug fix | no | yes |
| 5 | `05_Home_Today_At_The_Market.md` | The Today page: market clock, stall strip, curated feed | no | yes |
| 6 | `06_Browse_And_Produce_Page.md` | Browse with filter rail, full Produce page | no | yes |
| 7 | `07_Stalls_Markets_And_Map.md` | Stalls index, Stall page, Markets index, Market page, maps | no | yes |
| 8 | `08_Basket_Checkout_And_Orders.md` | Grouped basket, checkout, confirmation, orders, order timeline | no | yes |
| 9 | `09_Saved_You_Assistant_Help.md` | Saved, You, Assistant, Notifications, Help, ⌘K palette | no | yes |
| 10 | `10_Polish_A11y_Perf_Final.md` | 13-viewport sweep, a11y, perf, docs, full walkthrough | no | — |

**Stages 1–4 are foundations. Do not reorder them.** Stages 5–9 each rebuild a slice of the
app and can be paused between. Stage 10 is the final proof.

---

## Before stage 1

```bash
# MongoDB must be running
cd backend && npm install && npm run seed && npm run dev   # terminal 1, port 4000
cd ..     && npm install && npm run dev                    # terminal 2, port 3000
```

Sign in as the seeded customer: **george@example.com / market123**

---

## Rules that apply to the whole pack

- **Buyer side only.** `src/pages/vendor/`, `src/pages/admin/`, `src/pages/guest/` are off-limits
  unless a stage names the file explicitly. Shared components may be *extended* but never
  changed in a way that alters how vendor/admin/guest render.
- **Additive backend only.** Never remove or rename an existing field or route.
- **Evidence, not adjectives.** "Should work" is a failure. Every stage ends with real
  command output.
- **The SRS forbids ready-made templates and unmodified AI output.** Everything here is
  bespoke to this codebase — keep it that way, and be able to explain any of it to a judge.
