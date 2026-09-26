# Stage 9 · Saved, You, Assistant, Notifications, Help — and the command palette

You are working on **MarketLink**, mid-redesign of the signed-in Customer experience.
Stages 1–8 are done:

- **1** — white-first tokens, buyer shell, `Page` / `PageTitle` / `Section` / `MarketClock`
- **2** — `Scene` + ten full-scene SVGs in `EmptyState` / `ErrorState`
- **3** — backend `clock`, farmer day arrays, grouped cart quote, order `pickupCode`
- **4** — every destination is a real page; `/buyer/favorites` → `/buyer/saved`,
  `/buyer/reviews` → `/buyer/profile/reviews`, `/buyer/profile/help` → `/buyer/help`
- **5** — Today page · **6** — Browse + Produce · **7** — Stalls + Markets + maps
- **8** — Basket, checkout, confirmation, orders, order timeline, `PickupCode`

This is the last build stage. It finishes the remaining six pages and adds the one new surface
worth having: a **command palette**.

1. `/buyer/saved` — Saved produce, stalls and markets
2. `/buyer/profile` — You, the account hub
3. `/buyer/profile/details` · `/buyer/profile/markets` · `/buyer/profile/notifications` ·
   `/buyer/profile/reviews` — the four account pages
4. `/buyer/notifications` — the notification inbox
5. `/buyer/assistant` — Ask MarketLink
6. `/buyer/help` — How MarketLink works
7. **`Cmd/Ctrl + K`** — the command palette

---

# PART 1 · Context

## 1.1 What MarketLink is

Local farmers-market **Farmers** and **Customers**. A Customer browses what a stall has,
**reserves** it, chooses a pickup window, then **collects in person and pays in cash**.
**No payment gateway. No delivery. Ever.**

SRS requirements this stage must satisfy:

> Customers can mark **Farmers and products as favorites** for quick access and **restock alerts**.
> Customers can **save preferred market locations** and receive route-friendly pickup details.
> An **AI-powered chatbot** should help customers find specific items across markets and Farmers,
> and answer common questions such as **market timings, Farmer availability, pickup windows, and
> product details**.
> Customers should receive e-mail or **in-app alerts** for order confirmations and orders ready
> for pickup.
> Customers can rate and review Farmers and individual products; customers can **view reviews left
> by other customers** before ordering.
> Name, contact number, e-mail ID, and **address** must be supplied during registration.

## 1.2 Stack and rules

React 18.3, Vite 6, react-router-dom 6.28. CSS Modules only. **No new dependencies.**
Breakpoints **480 / 768 / 1024 / 1280**. Idiqlat headings **weight 400 only**.
Every value from a `var(--token)`; no raw hex, no raw px beyond `1px` hairlines.

## 1.3 The files

```
src/pages/buyer/Favorites.jsx            + css   SAVED       — rewrite (125 + 76)
src/pages/buyer/Profile.jsx              + css   YOU         — rewrite (173 + 122)
src/pages/buyer/ProfileDetails.jsx       + css   DETAILS     — rewrite (99 + 28)
src/pages/buyer/SavedMarkets.jsx         + css   MARKETS     — rewrite (126 + 134)
src/pages/buyer/NotificationPrefs.jsx    + css   PREFS       — build (Stage 4 stub)
src/pages/buyer/ProfileNotifications.jsx + css   INBOX       — rewrite (210 + 115)
src/pages/buyer/Reviews.jsx              + css   MY REVIEWS  — rewrite (259 + 792)
src/pages/buyer/Assistant.jsx            + css   ASSISTANT   — rewrite (221 + 290)
src/pages/buyer/Help.jsx                 + css   HELP        — rewrite (70 + 129)

src/components/domain/GlobalSearchModal.jsx      288 lines — REPLACED by the palette
src/components/ui/ListRow.jsx  Tabs.jsx  Toggle.jsx  FormField.jsx  ConfirmStep.jsx   exist
src/components/domain/ProductCard.jsx  FarmerCard.jsx  MarketCard.jsx  ReviewItem.jsx exist
src/components/domain/DayDots.jsx  LocationBlock.jsx                                  Stage 7

src/api/favorites.js     getFavorites getFavoriteIds putFavorite deleteFavorite
src/api/me.js            getMe patchMe changePassword saved-markets home-market
src/api/notifications.js getNotifications markAllRead markRead
src/api/assistant.js     postAssistantMessage
src/api/catalog.js       getSearchSuggestions getSearchHistory recordSearchHistory
src/context/FavoritesContext.jsx  NotificationContext.jsx  ToastContext.jsx  AuthContext.jsx
```

New files you create:

```
src/components/layout/CommandPalette.jsx + .module.css
src/hooks/useHotkey.js
src/components/ui/SectionRows.jsx        + .module.css   grouped settings rows
```

## 1.4 Two things Stage 4 left for you

1. **`Reviews.module.css` is 792 lines** — the largest CSS file in the buyer app, for a page that
   shows a list of reviews. Rebuild it under 200 lines. If you cannot, the page is doing too much.
2. **`/buyer/notifications` and `/buyer/profile/notifications` still share one component.** Stage 4
   pointed them at the inbox and a stub. Split them properly here: the inbox is a list of events,
   the preferences page is a settings form. Two files, two responsibilities.

## 1.5 Off-limits

Vendor, admin, guest pages and layouts. `backend/**`. `package.json`. Every other buyer page.

---

# PART 2 · Design rules that bind these pages

## 2.1 The accent budget — one per page, and several pages get zero

| Page | The beet element |
|---|---|
| Saved | none (empty state's action only) |
| You | none — **Sign out is danger text, not beet** |
| Personal details | **Save changes** |
| Saved markets | none |
| Notification prefs | **Save changes**, or none if toggles autosave |
| My reviews | none |
| Notifications inbox | none — "Mark all read" is an ink text button |
| Assistant | **Send** |
| Help | none |
| Command palette | none — the selected row is ink-filled |

## 2.2 Settings pages are lists of rows, not cards

`You`, notification preferences and saved markets are **grouped row lists**, not grids of cards.
One white panel per group with a hairline border, rows separated by `--color-hairline-soft`, a
small `--text-sm` `--color-ink-soft` group heading above each panel. This is the calmest possible
settings pattern and it is already half-built in `ListRow`.

## 2.3 Voice

"Saved" not "Favourites added". "We will let you know." not "Alert enabled!"
"Nothing saved yet." "Ask about market times, what is in stock, or where a stall is."
No exclamation marks. No emoji.

---

# PART 3 · Page A — Saved (`/buyer/saved`)

```
┌────────────────────────────────────────────────────────┐
│  Saved                               Idiqlat h1        │
│  12 produce · 4 stalls · 2 markets                     │
│                                                        │
│  [ Produce | Stalls | Markets ]              Tabs      │
│                                                        │
│  ┌────────┐ ┌────────┐                                  │
│  │produce │ │produce │   2 / 3 / 4 columns              │
│  └────────┘ └────────┘                                  │
└────────────────────────────────────────────────────────┘
```

- `Tabs` with the count in each label. Persist in the URL (`?tab=stalls`) so a refresh and a
  shared link both work.
- **Produce tab:** `ProductCard variant="grid"`. Sold-out items stay visible, dimmed, with a
  **"Tell me when this is back"** text button — this is the SRS's *restock alerts*, and the saved
  list is where a Customer expects to find them.
- **Stalls tab:** `FarmerCard variant="stall"` with `DayDots`, sorted by the shared
  `byOpenThenScarcity` comparator from Stage 7.
- **Markets tab:** market row cards with `MarketClock` state and `DayDots`, from
  `GET /users/me/saved-markets`. One of them is the home market — badge it `Home market` and let
  the others be set as home via `PUT /users/me/home-market/:marketId`.
- Unsaving anywhere removes the card **optimistically** and shows a toast with an **Undo** that
  re-saves. A saved list that requires a reload to reflect a tap feels broken.
- Empty, per tab: `<EmptyState scene="nothing-saved" title="Nothing saved yet" text="Tap the heart
  on produce, stalls or markets to keep them here." actionLabel="Browse produce"
  actionTo="/buyer/products" />` with the text adjusted per tab.

---

# PART 4 · Page B — You (`/buyer/profile`)

```
┌────────────────────────────────────────────────────────┐
│  ┌──┐                                                  │
│  │GA│  George Adams                    Idiqlat h1      │
│  └──┘  george@example.com                              │
│        Riverbend Market · home market                  │
│                                                        │
│  Account                                               │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Personal details            George Adams      →  │  │
│  │ Saved markets                      2 saved    →  │  │
│  │ Your reviews                    7 reviews     →  │  │
│  │ Notifications                      3 new      →  │  │
│  └──────────────────────────────────────────────────┘  │
│                                                        │
│  Preferences                                           │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Notification preferences                      →  │  │
│  │ Reduced motion                        [ off ]    │  │
│  └──────────────────────────────────────────────────┘  │
│                                                        │
│  Help                                                  │
│  ┌──────────────────────────────────────────────────┐  │
│  │ How MarketLink works                          →  │  │
│  │ About MarketLink                              →  │  │
│  │ Contact us                                    →  │  │
│  └──────────────────────────────────────────────────┘  │
│                                                        │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Sign out                                         │  │
│  └──────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────┘
```

- Avatar 64px, initials on `--color-beet-tint` with `--color-beet` text. A tint background does
  not spend the accent budget.
- Extract the grouped panel into `SectionRows` so the same markup serves You, notification
  preferences and saved markets. `ListRow` already handles icon, label, value, toggle and chevron.
- **Delete the "Dark mode · Light only" row.** A disabled setting that does nothing is clutter; the
  design system is light-only by decision and that is not a preference.
- **Reduced motion** must actually work. Setting it adds `data-reduced-motion="true"` on the buyer
  shell root, and a rule in `base.css` (or the shell module) disables transitions and animations
  under that attribute. A toggle that only shows "Saved" and changes nothing is worse than no
  toggle. Persist it in `localStorage` and apply it on mount.
- Sign out keeps the existing `BottomSheet` confirm — it is a genuinely transient decision, and it
  is one of the five overlays the redesign allows. `--color-danger`, never beet.

---

# PART 5 · Page C — The four account pages

## 5.1 Personal details (`/buyer/profile/details`)

`Page width="read"` (720px). A real form with `FormField`.

- Fields: **name, email, contact number, address** — all four the SRS requires at registration,
  editable here.
- `PATCH /users/me`. 422 details render **under the specific field**, never as one banner.
- Dirty-state handling: the Save button is disabled until something changes; navigating away with
  unsaved changes prompts once. Use a simple `beforeunload` plus an in-app confirm — do not add a
  router-blocking dependency.
- A **Change password** section below, using `POST /users/me/password`. Current, new, confirm.
  Show validation inline.
- **Sign out of all devices** via `DELETE /users/me/sessions`, behind `ConfirmStep`.
- One beet element: **Save changes**.

## 5.2 Saved markets (`/buyer/profile/markets`)

`Page width="read"`. A row list of saved markets, each with `MarketClock` state, `DayDots`, a
`Set as home market` action, and a Remove. Below the list, a small "Add a market" control linking
to `/buyer/markets`.

This page satisfies *"save preferred market locations and receive route-friendly pickup details"* —
so each row also carries a **Get directions** link via the Stage 7 `LocationBlock` pattern
(the link alone, not the map; a list of maps is heavy and slow).

## 5.3 Notification preferences (`/buyer/profile/notifications`)

`Page width="read"`. `SectionRows` with `Toggle`s:

| Group | Rows |
|---|---|
| Orders | Order confirmed · Order accepted · **Ready for pickup** · Order cancelled |
| Stalls | Restock alerts for saved produce · New produce from saved stalls |
| Markets | Market day reminder · Market schedule changes |

- Toggles **autosave** with a 600ms debounce and a per-row `Saved` indicator that fades. No
  page-level Save button — then the page has zero beet elements, which is correct for settings.
- If the backend has no preferences endpoint, persist in `localStorage`, label the section
  honestly, and **say so plainly in your report**. Do not fake a server round trip.

## 5.4 Your reviews (`/buyer/profile/reviews`)

`Page width="read"`. **Rebuild the CSS from scratch — the current module is 792 lines.**

- A list of the Customer's own reviews: produce or stall name, stars, date, comment, and the
  Farmer's reply when there is one.
- Each has Edit (`PATCH /reviews/:id`) and Delete (`DELETE /reviews/:id`, behind `ConfirmStep`).
- A second group above it: **Awaiting your review** — completed orders not yet reviewed, each
  linking to its order page where the Stage 8 `ReviewForm` lives. Do not duplicate the form here.
- Empty: `<EmptyState scene="first-review" title="No reviews yet" text="Reviews appear after you
  collect an order." />`

**Target: `Reviews.module.css` under 200 lines.** State the final count in your report.

---

# PART 6 · Page D — Notifications inbox (`/buyer/notifications`)

`Page width="read"`. A list, not a settings page. This is the SRS's *in-app alerts*.

```
┌────────────────────────────────────────────────────────┐
│  ← Back to today                                       │
│  Notifications                       Idiqlat h1        │
│  3 new                              Mark all read      │
│                                                        │
│  Today                                                 │
│  ┌──────────────────────────────────────────────────┐  │
│  │ ● Ready for pickup                        07:55  │  │
│  │   MK-2049 is packed at Riverbend Greens.         │  │
│  └──────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────┐  │
│  │   Back in stock                           06:12  │  │
│  │   Rainbow chard is available again.              │  │
│  └──────────────────────────────────────────────────┘  │
│                                                        │
│  Earlier                                               │
│  ...                                                    │
└────────────────────────────────────────────────────────┘
```

- Group by **Today / Yesterday / Earlier** using the notification timestamp.
- Unread: a `--color-ink` dot before the title and `--weight-medium` on the title. **Not a tinted
  background row** — a coloured band breaks the white-first rule and reads as an alert.
- Each row links to its target (order, produce, stall) and marks itself read via
  `POST /notifications/:id/read` on activation.
- "Mark all read" is an ink text button with a 44px target, calling
  `POST /notifications/read-all`, updating optimistically.
- Empty: `<EmptyState scene="no-notifications" title="Nothing new" text="Order updates and restock
  alerts will appear here." />`
- The unread count in the bottom nav must update when you mark all read. `NotificationContext`
  already drives it — make sure the mutation refreshes it rather than leaving a stale badge.

---

# PART 7 · Page E — Assistant (`/buyer/assistant`)

The SRS calls this optional. Build it well anyway — it is a visible differentiator and the backend
already has a rule-based intent engine at `POST /assistant/message`.

```
┌────────────────────────────────────────────────────────┐
│  ← Back to today                                       │
│  Ask MarketLink                      Idiqlat h1        │
│  Market times, what is in stock, where a stall is.     │
│                                                        │
│  ┌── conversation ──────────────────────────────────┐  │
│  │                        When is Riverbend open? →  │  │
│  │                                                  │  │
│  │ ← Riverbend Market is open Saturday 8:00–13:00   │  │
│  │   and Wednesday 9:00–14:00. It is open now.      │  │
│  │   [ See the market ]                             │  │
│  │                                                  │  │
│  │                            Who has chard today? →│  │
│  │                                                  │  │
│  │ ← Two stalls have chard today.                   │  │
│  │   [Riverbend Greens] [Hollow Lane Farm]          │  │
│  └──────────────────────────────────────────────────┘  │
│                                                        │
│  Try asking                                            │
│  [What time does the market open?]                     │
│  [Who has eggs this Saturday?]                         │
│  [When can I collect order MK-2049?]                   │
│                                                        │
│  ┌──────────────────────────────────────────┐ [Send]   │
│  │ Ask about the market…                    │          │
│  └──────────────────────────────────────────┘          │
```

- `Page width="read"`. The composer is sticky at the bottom above the bottom nav, with matching
  page padding.
- Customer messages: right-aligned, `background: var(--color-canvas-soft)`, `--radius-lg`,
  max-width 80%. Assistant messages: left-aligned, white with a `1px` hairline. **Neither is beet.**
- When the answer references a market, stall, produce item or order, render **navigation chips**
  under it linking to that page. That is what makes the assistant useful rather than a toy — it
  ends in a destination.
- Suggested prompts render only when the conversation is empty.
- A "typing" state while awaiting the response: three dots, animated, behind
  `prefers-reduced-motion`.
- The conversation is `role="log"` with `aria-live="polite"` so new answers are announced.
- Failure: an assistant bubble reading `I could not reach the market data just now.` plus a Retry.
  Never a raw error.
- **Never claim the assistant can do something it cannot.** The backend is a rule-based intent
  matcher. The subtitle says "Market times, what is in stock, where a stall is" — it sets the
  expectation honestly, which is better than an over-promise a judge will test.

---

# PART 8 · Page F — Help (`/buyer/help`)

`Page width="read"`. Two blocks.

**How MarketLink works** — four numbered steps with a small `Illustration` (the Stage 2 icon set,
not a `Scene`) beside each:

1. **Find a stall.** Browse produce or see who is at the market today.
2. **Reserve what you want.** Add it to your basket against real stock.
3. **Pick a collection window.** Each stall has its own times and cutoff.
4. **Collect and pay at the stall.** Show your collection code. Pay in cash.

Step 4 is where the payment model is explained to a Customer. Make it unmissable.

**Common questions** — an accordion of eight or so, each a real question:
*Do I pay online? · What if I am late? · Can I change my order? · What is a cutoff time? · What is
my collection code? · How do restock alerts work? · What if something is sold out? · How do I
change my home market?*

Build the accordion from `<button aria-expanded aria-controls>` + a region, not a `<details>` with
custom styling — `<details>` is hard to animate consistently and harder to style to this system.
One open at a time is fine; all closed on load.

Zero beet elements on this page.

---

# PART 9 · The command palette

Replace `GlobalSearchModal` (288 lines) with a real palette.

## 9.1 Behaviour

- Opens on **`Cmd+K`** / **`Ctrl+K`**, on **`/`** when focus is not in a text field, and by
  clicking the search control in the top bar.
- Closes on `Esc`, on backdrop click, and on selecting a result.
- Centred dialog, **not** a bottom sheet: `max-width: 34rem`, `top: 12vh`, white,
  `--radius-xl`, `box-shadow: var(--shadow-modal)`. Backdrop `var(--color-overlay)`.
- This is one of the five permitted overlays: transient, nothing lost on dismiss, correctly not
  linkable.

## 9.2 Contents

```
┌──────────────────────────────────────────────────┐
│ 🔍  chard                                        │
├──────────────────────────────────────────────────┤
│  Produce                                         │
│  ▸ Rainbow chard          Riverbend Greens       │
│    Cavolo nero            Hollow Lane Farm       │
│                                                  │
│  Stalls                                          │
│    Riverbend Greens       open today             │
│                                                  │
│  Go to                                           │
│    Basket · Orders · Saved · Ask MarketLink      │
├──────────────────────────────────────────────────┤
│  ↑↓ move   ↵ open   esc close                    │
└──────────────────────────────────────────────────┘
```

- Empty query: recent searches (`GET /search/history`) and the "Go to" shortcuts.
- Typing: `GET /search/suggestions` debounced 200ms, grouped into Produce, Stalls, Markets, plus
  "Go to" always last.
- Selecting a produce/stall/market result navigates to its page and calls
  `POST /search/history`.
- Pressing Enter with no highlighted row runs a full search:
  `/buyer/products?search=<query>`.

## 9.3 Accessibility — get this exactly right

```jsx
<div role="dialog" aria-modal="true" aria-label="Search MarketLink">
  <input
    role="combobox"
    aria-expanded={results.length > 0}
    aria-controls="palette-list"
    aria-activedescendant={activeId}
    autoComplete="off"
  />
  <ul id="palette-list" role="listbox">
    <li id="opt-1" role="option" aria-selected={i === active}>…</li>
  </ul>
</div>
```

- Focus moves to the input on open and **returns to the opener** on close.
- Focus is **trapped** inside the dialog while open — Tab must not escape to the page behind.
- The app root behind gets `inert` (or `aria-hidden` plus a focus trap) so the background is not
  reachable.
- `↑` / `↓` move the highlight and update `aria-activedescendant`. The **input keeps DOM focus
  throughout** — never move focus to the list items. That is what makes a combobox work with a
  screen reader while the user keeps typing.
- Mouse hover also sets the highlight, so keyboard and mouse never disagree.

## 9.4 `useHotkey`

```js
/**
 * Global keyboard shortcut. Ignores presses while the user is typing in a field.
 *
 * @param {string}   combo    'mod+k' or '/'  — 'mod' is Cmd on Mac, Ctrl elsewhere
 * @param {Function} handler
 * @param {boolean}  enabled
 */
export function useHotkey(combo, handler, enabled = true) { /* ... */ }
```

Must ignore the press when `event.target` is an `input`, `textarea`, `select` or anything
`contentEditable` — otherwise typing "/" in the search field opens a second palette. Use
`event.metaKey || event.ctrlKey` for `mod`, and call `preventDefault()` only when you handle it.

## 9.5 Mount and wire

Mount `<CommandPalette />` once in `BuyerLayout`, not per page. Wire the top bar's search control
to open it. Then **delete `GlobalSearchModal.jsx` and its CSS** once nothing imports them.

---

# PART 10 · Your skills for this stage

### Skill 1 · A settings row list is one component

`SectionRows` + `ListRow` serves You, notification preferences and saved markets. Three bespoke
settings layouts is three places for the spacing to drift. Build the group, pass the rows.

### Skill 2 · Optimistic updates with a real undo

```jsx
const unsave = async (id) => {
  const prev = items;
  setItems((xs) => xs.filter((x) => x.id !== id));      // optimistic
  try {
    await deleteFavorite(type, id);
    toast('Removed', { action: { label: 'Undo', onClick: () => resave(id, prev) } });
  } catch {
    setItems(prev);                                      // roll back on failure
    toast('Could not remove that. Try again.');
  }
};
```

Always capture the previous state before mutating so rollback is exact.

### Skill 3 · A toggle must do something

Reduced motion sets an attribute that a real CSS rule reads. Before you ship any toggle, turn it
on and **observe the change**. A setting that only shows "Saved" is a lie in the interface.

### Skill 4 · `aria-activedescendant`, not roving focus

In a combobox the input keeps DOM focus while `aria-activedescendant` names the highlighted
option. Moving real focus into the list breaks typing and makes screen readers announce the wrong
thing. This is the single most-failed detail in a command palette.

### Skill 5 · A hotkey must know when to stay out of the way

Guard on `event.target`. A global `/` shortcut that fires while someone is typing a review is a
bug that feels like a haunting.

### Skill 6 · An answer should end in a destination

Assistant replies carry navigation chips. "Two stalls have chard today" is trivia; the same
sentence with two tappable stall chips is a feature. Wherever you render an answer, ask what the
person does next and put that there.

### Skill 7 · Group a list by time, not by type

Today / Yesterday / Earlier is how people look for a notification. Grouping by category makes
them scan every group. Use the timestamp.

### Skill 8 · When CSS runs long, the markup is wrong

`Reviews.module.css` at 792 lines is not a CSS problem — the page is doing too many things in too
many bespoke layouts. Rebuild the markup with the shared primitives and the CSS collapses by
itself. If you find yourself writing the fourth variant of a card, stop and reuse one.

### Skill 9 · Be honest about what the assistant is

A rule-based intent matcher that answers market times and stock questions is genuinely useful. A
subtitle claiming general intelligence invites a judge to disprove it in one question. Set the
expectation the product can meet.

---

# PART 11 · Hard rules — never do these

1. **Never render a disabled setting** that does nothing. Delete the Dark mode row.
2. **Never ship a toggle that does not change behaviour.** Reduced motion must work.
3. **Never tint a notification row background** to show unread. A dot and a weight.
4. **Never move DOM focus into palette list items.** `aria-activedescendant`.
5. **Never let a global hotkey fire while the user is typing.**
6. **Never leave the background reachable** while the palette is open. `inert` plus a focus trap.
7. **Never fake a server round trip.** If preferences are `localStorage`-only, say so.
8. **Never duplicate the Stage 8 `ReviewForm`** on the reviews page. Link to the order.
9. **Never exceed one beet element per page**, and prefer zero on settings pages.
10. **Never make Sign out beet.**
11. **Never use `<details>`** for the FAQ accordion. Button plus region.
12. **Never claim the assistant can do more than it can.**
13. **Never leave `Reviews.module.css` above 200 lines.**
14. **Never leave `GlobalSearchModal` in the tree** once the palette works.
15. **Never add a dependency. Never touch vendor, admin, guest or the backend.**

---

# PART 12 · Definition of done

- [ ] Saved: three tabs with counts, URL-persisted, optimistic unsave with working Undo
- [ ] Restock alert action on sold-out saved produce
- [ ] Home market badged and settable from the Markets tab
- [ ] You: `SectionRows` groups, no Dark mode row, working reduced-motion toggle, danger sign out
- [ ] Personal details: name, email, contact number, **address**; field-level 422s; password
      change; sign out of all devices
- [ ] Saved markets: clock state, day-dots, set-as-home, directions link, remove
- [ ] Notification preferences: grouped toggles, debounced autosave, per-row Saved indicator
- [ ] Your reviews: own reviews with replies, edit, delete, plus "Awaiting your review"
- [ ] **`Reviews.module.css` under 200 lines** — state the count
- [ ] Notifications inbox: grouped by time, dot + weight for unread, mark-all-read updates the
      bottom-nav badge
- [ ] Assistant: conversation, navigation chips on answers, suggested prompts, typing state,
      `role="log"`, honest subtitle
- [ ] Help: four steps with the payment model explained, FAQ accordion with button + region
- [ ] Command palette: `Cmd/Ctrl+K` and `/`, grouped results, combobox ARIA, focus trap and
      return, background `inert`
- [ ] `GlobalSearchModal.jsx` and its CSS deleted
- [ ] `layoutCheck()` **zero findings** on all nine pages at 360, 390, 768, 1024, 1440

---

# PART 13 · Verification gate

### A1 build · A2 runtime

```bash
npm run build
npm run dev
```

Zero errors, zero new warnings, zero console errors on all nine pages plus the palette.

### A3 / A4 / A7

```bash
grep -rnE "#[0-9a-fA-F]{3,8}" src/pages/buyer/*.module.css src/components/layout/CommandPalette.module.css src/components/ui/SectionRows.module.css
grep -rnE ":[^;]*[0-9]+px" src/pages/buyer/Reviews.module.css src/pages/buyer/Assistant.module.css | grep -v "1px" | grep -v "0px"
grep -rnE "linear-gradient|radial-gradient|backdrop-filter|!important|:global" src/pages/buyer src/components/layout/CommandPalette.module.css
grep -rn "color-primary\|color-beet" src/pages/buyer/Favorites.module.css src/pages/buyer/Profile.module.css src/pages/buyer/ProfileDetails.module.css src/pages/buyer/SavedMarkets.module.css src/pages/buyer/NotificationPrefs.module.css src/pages/buyer/Reviews.module.css src/pages/buyer/ProfileNotifications.module.css src/pages/buyer/Assistant.module.css src/pages/buyer/Help.module.css
```

Name every beet hit per page and confirm the table in Part 2.1.

### CSS line counts

```bash
wc -l src/pages/buyer/Reviews.module.css src/pages/buyer/Assistant.module.css src/pages/buyer/Profile.module.css
```

`Reviews.module.css` **under 200**. Report all three.

### GlobalSearchModal removed

```bash
grep -rn "GlobalSearchModal" src/
ls src/components/domain/GlobalSearchModal.* 2>/dev/null
```

Both empty.

### Palette keyboard test — step by step

Record the result of each:

1. `Cmd/Ctrl+K` from `/buyer` opens it, focus lands in the input
2. `/` from `/buyer` opens it
3. `/` **while typing in the Browse search field** does **not** open it
4. Type "cha", results group into Produce / Stalls / Markets / Go to
5. `↓` `↓` moves the highlight; paste `aria-activedescendant` at each step
6. `Enter` navigates to the highlighted result
7. `Esc` closes and focus returns to the opener
8. `Tab` while open never reaches the page behind
9. Reopen, click the backdrop, it closes
10. Screen reader (or the accessibility tree) announces the highlighted option

### Reduced motion actually works

Turn the toggle on. Then: navigate, add to basket, open the palette. Confirm **no transitions and
no animations** run. Paste the computed `transition-duration` on an element that normally animates.
Reload the page and confirm the setting persisted.

### Optimistic undo

Unsave a produce item. Screenshot the toast. Press Undo. Confirm the card returns and
`GET /favorites` agrees. Then unsave with the **backend stopped** and confirm the card rolls back
and an error toast appears.

### Notification badge

Note the bottom-nav unread count. Press "Mark all read". Confirm the badge clears **without a page
reload**. Paste before and after.

### Assistant

Ask three questions: a market-time question, a stock question, an order question. Paste each
question, each answer, and the navigation chips rendered. Then stop the backend and ask again —
confirm a readable failure message and a working Retry.

### Form validation

On Personal details, submit an invalid email and an empty name. Confirm each 422 detail appears
**under its own field**, not as a banner. Screenshot.

### B1 responsive sweep

At **360, 390, 768, 1024, 1440** on all nine pages, plus the palette open at 390 and 1440:

```js
const { layoutCheck } = await import('/src/dev/layoutCheck.js');
console.table(layoutCheck());
```

**Zero findings.** Forty-seven tables.

### B4 keyboard

Tab every page end to end. The FAQ accordion opens with Enter and Space and announces
`aria-expanded`. The assistant composer submits on Enter. Every toggle is reachable and operable
with Space.

### Minimal seed

```bash
cd backend && npm run seed:minimal
```

Empty saved (all three tabs), empty notifications, empty reviews, an assistant with no data.
Report each. Then `npm run seed`.

### Tests

```bash
node tests/run_all.mjs
```

All suites pass. Add assertions for the palette opening on `Cmd+K` and for the saved tabs
persisting in the URL.

---

# PART 14 · Report

```
Stage 9 status: PASS | FAIL

## What I changed
- <file> — <one line>

## Gate results
A1 build / A2 runtime:  <output>
A3 / A4 / A7:           <beet named per page vs the Part 2.1 table>
CSS line counts:        <3 numbers>
GlobalSearchModal gone: <output>
Palette keyboard:       <10 numbered results + aria-activedescendant values>
Reduced motion:         <computed transition-duration + persistence>
Optimistic undo:        <toast, undo, backend-down rollback>
Notification badge:     <before / after>
Assistant:              <3 Q&A + chips + failure case>
Form validation:        <screenshot description>
B1 layoutCheck:         <47 tables>
B4 keyboard:            <result>
Minimal seed:           <per page>
Tests:                  <summary>

## Backend capability findings
- Is there a notification-preferences endpoint, or is this localStorage?  <which>
- Does the assistant return structured entities for navigation chips, or did you parse them?  <which>

## SRS coverage
| requirement | where | verified how |
|---|---|---|
| favourite Farmers and products + restock alerts | ... | ... |
| save preferred markets + route-friendly pickup details | ... | ... |
| AI assistant: timings, availability, pickup windows, product details | ... | ... |
| in-app alerts for confirmations and ready-for-pickup | ... | ... |
| view reviews left by other customers | ... | ... |
| name, contact number, email, address | ... | ... |

## Found but not fixed
- <file:line>

## NOT verified
- <what and why>
```

Fix and re-run any failing gate before reporting. A non-working reduced-motion toggle, a palette
that moves DOM focus into the list, or `Reviews.module.css` over 200 lines is a FAIL.
