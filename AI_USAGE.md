# AI Usage Acknowledgement

In compliance with project specifications regarding the acknowledgement of artificial intelligence tools, this document factually details the AI tools used during the design and development of MarketLink, the specific scopes where they were employed, and the components developed or substantially modified by human direction and manual engineering.

---

## 1. AI Tools Employed

1. **Large Language Model Coding Assistants (Claude / Anthropic, Gemini / Google)**:
   - **Purpose**: Assisted in pair-programming, codebase refactoring, code drafting, test suite generation, and CSS consistency audits.
   - **Scope**:
     - Drafting component boilerplate and CSS module structure across the 10 redesign stages.
     - Formulating vector math and path coordinates for bespoke SVG illustrations (`Scene` system).
     - Identifying CSS selector regressions, contrast discrepancies against WCAG 2.1 AA tokens, and unused code.
     - Writing automated end-to-end and integration verification scripts (`tests/01_guest.mjs`, `tests/02_auth.mjs`, `tests/03_customer.mjs`, `tests/04_layout.mjs`).

2. **Midjourney / Image Generation Tools**:
   - **Purpose**: Generating initial reference artwork and photographic assets for local farm stalls and produce items.
   - **Scope**: Staged seed imagery located under `backend/uploads/` and `src/asset/`.

---

## 2. Hand-Authored and Human-Engineered Components

The following critical system components and architectural layers were explicitly designed, configured, and iteratively tuned by hand:

1. **Domain Logic & Business Rules**:
   - Cash-only, in-person pickup collection workflow (no payment gateway, no delivery integration).
   - Multi-vendor pickup slot scheduling algorithm with per-stall cutoff enforcement (`backend/src/utils/slots.js`).
   - Grouped cart quotation and order state machine (`backend/src/modules/cart/cart.service.js`, `backend/src/modules/orders/orderStateMachine.js`).
   - 4-letter unambiguous human-readable collection code generator (`backend/src/utils/pickupCode.js`).

2. **Design System & CSS Token Architecture**:
   - Token specification (`src/styles/tokens.css`, `base.css`) enforcing strict 480/768/1024/1280 breakpoints.
   - White-first surface contrast and two-beet-accent visual budget rule.
   - Accessibility compliance ensuring WCAG 2.1 AA color contrast across all interactive states.

3. **Database Schema & Indexing**:
   - Native MongoDB schema definitions, collections, geospatial indexes, and compound indexes (`backend/src/db/indexes.js`, `collections.js`).
   - Idempotent seed data generators for local markets, farm stalls, and seasonal produce catalogs (`backend/src/db/seed.js`).

4. **Integration & Manual Validation**:
   - Verification across 13 distinct responsive viewports and landscape mobile constraints.
   - Keyboard navigation audit, focus trapping, and screen reader semantic structure.
