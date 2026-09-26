# Stage 8 · Basket, checkout, orders — the reservation loop

You are working on **MarketLink**, mid-redesign of the signed-in Customer experience.
Stages 1–7 are done:

- **1** — white-first tokens, buyer shell, `Page` / `PageTitle` / `Section` / `MarketClock`
- **2** — `Scene` + ten full-scene SVGs in `EmptyState` / `ErrorState`
- **3** — backend: market `clock`, farmer day arrays, **grouped `POST /cart/quote`**, **order `pickupCode`**
- **4** — every buyer destination is a real page; `/buyer/cart` redirects to `/buyer/basket`;
  `/buyer/checkout` and `/buyer/orders/:id/confirmed` exist as stubs
- **5** — Today page with the market clock and stall strip; `PickupBanner`
- **6** — Browse + Produce page; `StockLine`; `StallInline`
- **7** — Stalls + Markets + maps; `DayDots`, **`PickupWindows`**, `LocationBlock`

This stage builds the **reservation loop** — the sequence a judge will walk end to end, and the
single most important flow in the application:

1. `/buyer/basket` — Basket, **grouped by stall**
2. `/buyer/checkout` — Review pickup and place the pre-order
3. `/buyer/orders/:id/confirmed` — Confirmation with the collection code
4. `/buyer/orders` — Orders index
5. `/buyer/orders/:id` — **Order page: a timeline plus a collection code**

---

# PART 1 · Context

## 1.1 What MarketLink is, and what this flow is not

A Customer browses what a Farmer has, **reserves** items against real stock, chooses a pickup
window inside that Farmer's operating hours, then **collects in person at the stall and pays
there, in cash**.

**This is the hardest scope rule in the project, and this stage is where it gets broken:**

- **There is no payment gateway. There never will be.** No card fields. No "Pay now". No
  "Proceed to payment". No `paymentMethod` selector. No Stripe, no PayPal, no Apple Pay.
- **There is no delivery.** No delivery address. No shipping option. No courier. No tracking map.
- **Nothing is "purchased".** It is **reserved** and then **collected**.

Total lines must be labelled so nobody thinks money has moved:

| Never write | Write |
|---|---|
| Total · Amount due · Amount charged | **Pay at the stall** |
| Checkout · Place order · Buy now | **Review pickup** · **Place pre-order** |
| Shipping · Delivery | **Collection** · **Pickup** |
| Order placed successfully! | **Reserved. Collect Saturday, 9:00–10:00.** |
| Payment confirmed | — (does not exist) |

SRS requirements this stage must satisfy:

> Customers can add products to a cart and place a pre-order against the Farmer's available stock.
> Customers can select a **pickup date and time slot within the Farmer's available windows**.
> Customers can view order status (**placed, accepted, ready for pickup, completed**) and **cancel
> or modify an order before the Farmer's cutoff time**. Payment functionality will not be included;
> orders are paid for at pickup.
> Customers can view their past orders and **quickly reorder** previously purchased items.
> Customers can **rate and review Farmers and individual products after an order is completed**.

Every one of those is mandatory.

## 1.2 Stack and rules

React 18.3, Vite 6, react-router-dom 6.28. CSS Modules only. **No new dependencies.**
Breakpoints **480 / 768 / 1024 / 1280**. Idiqlat headings at **weight 400 only**.
Every value from a `var(--token)`; no raw hex, no raw px beyond `1px` hairlines.

## 1.3 The files

```
src/pages/buyer/Cart.jsx           + .module.css   BASKET       — rewrite (341 + 432 lines)
src/pages/buyer/Checkout.jsx       + .module.css   CHECKOUT     — build (Stage 4 stub)
src/pages/buyer/OrderConfirmed.jsx + .module.css   CONFIRMED    — rewrite (92 + 159 lines)
src/pages/buyer/Orders.jsx         + .module.css   ORDERS       — rewrite (124 + 109 lines)
src/pages/buyer/OrderDetail.jsx    + .module.css   ORDER        — rewrite (504 + 585 lines)

src/components/domain/PickupWindows.jsx    Stage 7 — reuse, do not fork
src/components/domain/OrderRow.jsx         exists
src/components/ui/QuantityStepper.jsx      exists
src/components/ui/SegmentedControl.jsx     exists
src/components/ui/ConfirmStep.jsx          exists — two-step destructive confirm
src/components/ui/Stars.jsx  Badge.jsx  StatusDot.jsx   exist
src/context/CartContext.jsx                cart state
src/api/orders.js   checkout getOrders getOrder patchOrder cancelOrder
                    getReorderPreview postOrderReview
src/api/cart.js     postCartQuote  (Stage 3)
src/utils/format.js formatPrice, date formatters
```

New files you create:

```
src/components/domain/StallGroup.jsx     + .module.css   one stall's basket panel
src/components/domain/PickupCode.jsx     + .module.css   the code block
src/components/domain/OrderTimeline.jsx  + .module.css   the four-step rail
src/components/domain/OrderSummary.jsx   + .module.css   lines + "Pay at the stall"
src/components/domain/ReviewForm.jsx     + .module.css   post-collection rating
```

## 1.4 Off-limits

Vendor, admin, guest pages and layouts. `backend/**`. `package.json`. Every other buyer page.

---

# PART 2 · Design rules that bind these pages

## 2.1 The accent budget

Each page in this flow has **exactly one** beet element — the forward action:

| Page | The one beet element |
|---|---|
| Basket | **Review pickup** (sticky footer) |
| Checkout | **Place pre-order** (sticky footer) |
| Confirmed | **View order** |
| Orders index | none |
| Order page | **Reorder these items**, or nothing when the order is active |

Cancel is **never** beet. It is `--color-danger` text, promoted to a danger button only inside the
second step of a `ConfirmStep`.

## 2.2 Density budget at 390 x 844

**Basket:** back link, h1 "Basket", one context line, the **first stall group's header plus its
first item**. The sticky footer sits outside the count.

**Order page:** back link, h1 with the order number, status line, then the **collection code
block**. The timeline starts below the fold — the code is what you need while standing at a stall.

## 2.3 Voice

"Reserve by Friday 18:00." · "6 bunches left today." · "Pay at the stall."
"Collect Saturday, 9:00–10:00." · "Cancelled. Nothing was charged."
No exclamation marks. No emoji. No "successfully".

---

# PART 3 · Page A — Basket (`/buyer/basket`), grouped by stall

## 3.1 Why grouped

You collect from each stall separately, each stall has its own pickup windows, and each stall has
its own cutoff. A flat item list hides all three and then surprises the Customer at checkout.
Grouping is not decoration — it is the data model made visible. `POST /cart/quote` returns
`groups` (Stage 3) precisely for this.

## 3.2 Structure

```
┌────────────────────────────────────────────────────────┐
│  ← Keep browsing                                       │
│  Basket                              Idiqlat h1        │
│  5 items from 2 stalls                                 │
│                                                        │
│  ┌── StallGroup ────────────────────────────────────┐  │
│  │ ┌──┐ Riverbend Greens                            │  │
│  │ │RG│ Riverbend Market · Reserve by Friday 18:00  │  │
│  │ └──┘                                             │  │
│  │ ───────────────────────────────────────────────  │  │
│  │ [art] Rainbow chard        £3.20 / bunch         │  │
│  │       6 left today          [− 2 +]      Remove  │  │
│  │ ───────────────────────────────────────────────  │  │
│  │ [art] Cavolo nero          £2.80 / bunch         │  │
│  │       Only a few left       [− 1 +]      Remove  │  │
│  │ ───────────────────────────────────────────────  │  │
│  │ Collect from this stall                          │  │
│  │ [Sat 8:00–10:00] [Sat 10:00–12:00]               │  │
│  │ ───────────────────────────────────────────────  │  │
│  │ Stall subtotal                        £9.20      │  │
│  └──────────────────────────────────────────────────┘  │
│                                                        │
│  ┌── StallGroup: Ash Farm Bakery ───────────────────┐  │
│  │ ...                                              │  │
│  └──────────────────────────────────────────────────┘  │
│                                                        │
│  Pay at the stall                       £16.40         │
│  Two stalls, two collections.                          │
└────────────────────────────────────────────────────────┘
│ ┌── sticky ──────────────────────────────────────────┐ │
│ │ £16.40 · pay at the stall     [ Review pickup ]    │ │
│ └────────────────────────────────────────────────────┘ │
```

At 1024+: `Page width="detail"`, groups in the left column, a **sticky summary card** in a
narrower right column at `top: calc(var(--topbar-h-desk) + var(--space-6))`. The sticky footer
disappears; the action lives in the summary card.

## 3.3 `StallGroup`

```jsx
/**
 * One stall's basket panel: stall header, its items, its pickup windows, its subtotal.
 * Renders the per-stall cutoff because each stall has its own deadline.
 *
 * @param {object}   group        one entry from POST /cart/quote groups[]
 * @param {string}   selectedWindowId
 * @param {Function} onSelectWindow  (windowId) => void
 * @param {Function} onChangeQty     (productId, qty) => void
 * @param {Function} onRemove        (productId) => void
 */
```

- Panel: white, `1px solid var(--color-border)`, `--radius-lg`. **No shadow.**
- Header: 40px avatar, stall name (Idiqlat `--text-h3`) linking to `/buyer/stalls/:id`, then one
  `--text-sm` `--color-ink-soft` line: market name · cutoff label.
- **When past cutoff**, the cutoff text turns `--color-danger` and reads
  `Cutoff passed · Friday 18:00`, and the group is dimmed with its windows disabled.
- Items separated by `1px solid var(--color-hairline-soft)` — the softer internal divider, so the
  panel outline stays the dominant line.
- Each item: 56px square illustration tile, name (links to the produce page), unit price, a
  `StockLine`-style availability note, a `QuantityStepper`, and a **Remove** text button
  (`--color-ink-soft`, `44px` target, `aria-label="Remove Rainbow chard from basket"`).
- `PickupWindows` from Stage 7 — **reuse it, do not fork it.** Interactive here.
- Subtotal row: label `--text-sm` `--color-ink-soft`, amount Inter 600 with `tabular-nums`.

## 3.4 Quantity and stock

- The stepper is capped at the product's available quantity. At the cap, show
  `Only 6 available` in `--color-warning-text` under the stepper.
- Changing a quantity **re-quotes**: call `postCartQuote` debounced 400ms, and show the new
  subtotal. Never recompute prices in the client — the server is the authority, and a client-side
  total that disagrees with checkout destroys trust instantly.
- While re-quoting, keep the old numbers visible and dim them. **Never blank the totals** — a
  flashing zero looks like a bug.
- Quote `issues` (Stage 3) render inline on the offending item, in plain language:
  `Only 2 bunches left.` · `Sold out since you added it.` · `Price changed to £3.40.`
- An item that went out of stock stays visible with its issue and a Remove button. Do not silently
  drop it.

## 3.5 Empty basket

```jsx
<EmptyState
  scene="empty-basket"
  title="Your basket is empty"
  text="Add produce from a stall and reserve it for market day."
  actionLabel="Browse produce"
  actionTo="/buyer/products"
/>
```

No sticky footer, no summary card. That action button is the page's one beet element.

---

# PART 4 · Page B — Checkout (`/buyer/checkout`)

**One page, three blocks, one button.** Not a wizard. The Customer already chose windows in the
basket; this page confirms and commits.

```
┌────────────────────────────────────────────────────────┐
│  ← Back to basket                                      │
│  Review pickup                       Idiqlat h1        │
│  Confirm when you will collect from each stall.         │
│                                                        │
│  1 · Collection                                        │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Riverbend Greens · Riverbend Market              │  │
│  │ Saturday 27 Sep, 8:00–10:00              Change  │  │
│  │ Reserve by Friday 18:00                          │  │
│  └──────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Ash Farm Bakery · Riverbend Market               │  │
│  │ Saturday 27 Sep, 9:00–11:00              Change  │  │
│  └──────────────────────────────────────────────────┘  │
│                                                        │
│  2 · Your details                                      │
│  George Adams · george@example.com · 07700 900123      │
│  Edit in your profile →                                │
│                                                        │
│  3 · What you will pay at the stall                    │
│  Rainbow chard × 2                          £6.40      │
│  Cavolo nero × 1                            £2.80      │
│  Sourdough boule × 1                        £7.20      │
│  ──────────────────────────────────────────────────    │
│  Pay at the stall                          £16.40      │
│  Cash, in person, when you collect.                    │
│                                                        │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Nothing is charged now. Bring cash to the stall. │  │
│  └──────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────┘
│ ┌── sticky ──────────────────────────────────────────┐ │
│ │ £16.40 · pay at the stall     [ Place pre-order ]  │ │
│ └────────────────────────────────────────────────────┘ │
```

- **"Change"** scrolls back to that stall's group in the basket — navigate to
  `/buyer/basket#stall-<id>` and give each `StallGroup` a matching `id`. Do not open a modal.
- **Block 2** is read-only. It links to `/buyer/profile/details`. The SRS requires name, contact
  number, email and address at registration; show what is on file and let them fix it there. Do
  not duplicate an editable form here.
- **Block 3** lists every line, then `Pay at the stall`. The notice box is white with
  `1px solid var(--color-border)`, `--text-sm`, `--color-ink-soft`. Not a coloured banner.
- **Place pre-order** → `POST /orders/checkout` with an **idempotency key**. The API client already
  has `createIdempotencyKey()` — use it, and generate the key **once per checkout attempt**, held in
  a ref, not regenerated on each render. Double-tapping the button must never create two orders.
- While submitting: disable the button, change its label to `Reserving…`, and leave the page
  otherwise interactive so a Customer can still read the summary.
- On success: `navigate(\`/buyer/orders/${order.id}/confirmed\`, { replace: true })`.
  **`replace` matters** — Back from the confirmation must go to Browse, never re-submit a checkout.
- On failure, map the server error to a sentence and keep every entered choice:
  - `422` with details → show each under the relevant stall group
  - stock conflict → `Some items sold out while you were reserving.` + a link back to the basket
  - `PAST_CUTOFF` → `The cutoff for Riverbend Greens has passed.` + a link back
  - network → `Could not reach MarketLink. Your basket is safe.` + Retry
- Empty basket on arrival → redirect to `/buyer/basket` with `replace`.

---

# PART 5 · Page C — Confirmed (`/buyer/orders/:id/confirmed`)

The one screen in the app allowed to feel like a small moment.

```
┌────────────────────────────────────────────────────────┐
│                                                        │
│                  [ Scene: no-orders-yet ]              │
│                                                        │
│  Reserved                            Idiqlat h1        │
│  Collect Saturday 27 Sep, 8:00–10:00 at Riverbend      │
│  Greens.                                               │
│                                                        │
│  ┌──────────────────────────────────────────────────┐  │
│  │              Collection code                     │  │
│  │                K 7 M 2 4 B                       │  │
│  │        Show this at the stall                    │  │
│  └──────────────────────────────────────────────────┘  │
│                                                        │
│  Order MK-2049 · £16.40 to pay at the stall            │
│                                                        │
│  [ View order ]                                        │
│  Back to today                                         │
└────────────────────────────────────────────────────────┘
```

- `Page width="detail"`, centred column, `--container-buyer-read` max width on the text.
- The scene is decorative (`aria-hidden`); the `<h1>` carries the meaning.
- No confetti, no animation, no exclamation mark. The moment is in the restraint.
- **When there are two stalls**, the subtitle lists both collections on separate lines.
- `View order` is the one beet element. `Back to today` is a plain ink link.
- Arriving without a valid order id → redirect to `/buyer/orders` with `replace`.

---

# PART 6 · `PickupCode` — the physical handoff artifact

```jsx
/**
 * The collection code a Customer shows at the stall. Rendered large, tabular and
 * widely tracked because it will be read aloud across a noisy market stall.
 *
 * The server generates it from an alphabet with no I, L, O, 0 or 1 (Stage 3),
 * so there is nothing to misread. Renders nothing when the order has no code
 * (legacy orders predating the field).
 *
 * @param {string} code
 * @param {'lg'|'md'} size
 */
export function PickupCode({ code, size = 'lg' }) {
  if (!code) return null;
  return (
    <div className={`${styles.block} ${styles[size]}`}>
      <span className={styles.label}>Collection code</span>
      <output className={styles.code} aria-label={`Collection code ${code.split('').join(' ')}`}>
        {code}
      </output>
      <span className={styles.hint}>Show this at the stall</span>
    </div>
  );
}
```

- Block: white, `1px solid var(--color-border)`, `--radius-lg`, centred,
  `padding: var(--space-6)`.
- `.code` — Inter 600, `--text-h1`, `font-variant-numeric: tabular-nums`,
  `letter-spacing: 0.24em`, `--color-ink`. **Not beet** — it is information, not an action.
- `.label` and `.hint` — `--text-sm`, `--color-ink-soft`.
- `<output>` is the correct element: it is a live region by default, so a screen reader announces
  the code when it appears.
- The `aria-label` spells the code out with spaces so it is read character by character rather
  than as a nonsense word.
- `return null` on a missing code, so legacy orders degrade silently.

---

# PART 7 · Page D — Orders index (`/buyer/orders`)

```
┌────────────────────────────────────────────────────────┐
│  Orders                              Idiqlat h1        │
│  2 active · 14 collected                               │
│                                                        │
│  [ Active (2) | Past (14) ]          SegmentedControl  │
│                                                        │
│  ┌──────────────────────────────────────────────────┐  │
│  │ ● Ready for pickup      MK-2049                  │  │
│  │ Riverbend Greens · Sat 27 Sep, 8:00–10:00        │  │
│  │ 3 items · £16.40 to pay at the stall             │  │
│  │ K 7 M 2 4 B                                      │  │
│  └──────────────────────────────────────────────────┘  │
│  ...                                                    │
└────────────────────────────────────────────────────────┘
```

- `SegmentedControl` for Active / Past, persisted in the URL (`?tab=past`) so it survives a refresh.
- Status vocabulary must match the SRS exactly: **placed, accepted, ready for pickup, completed**,
  plus cancelled and declined. Map the backend's values to those words and nothing else.
- Status colours: `ready` → `--color-success`; `placed` / `accepted` → `--color-ink-soft`;
  `cancelled` / `declined` → `--color-ink-faint`; `completed` → `--color-ink-soft`.
  Never beet.
- Each row is a full-width white card with a hairline, linking to `/buyer/orders/:id`. Active rows
  show the collection code inline in small tabular type — you often just want the code.
- Empty Active: `<EmptyState scene="no-orders-yet" title="No orders waiting" text="Reserve produce
  from a stall and it will appear here." actionLabel="Browse produce" actionTo="/buyer/products" />`
- Empty Past: same scene, `title="No past orders yet"`, no action.
- Cursor-paginate the Past tab.

---

# PART 8 · Page E — The Order page (`/buyer/orders/:id`)

## 8.1 Structure

```
┌────────────────────────────────────────────────────────┐
│  ← Back to orders                                      │
│  Order MK-2049                       Idiqlat h1        │
│  ● Ready for pickup · reserved Thu 25 Sep              │
│                                                        │
│  ┌── PickupCode ────────────────────────────────────┐  │
│  │              Collection code                     │  │
│  │                K 7 M 2 4 B                       │  │
│  │        Show this at the stall                    │  │
│  └──────────────────────────────────────────────────┘  │
│                                                        │
│  ●  Placed          Thu 25 Sep, 19:42                  │
│  │                                                     │
│  ●  Accepted        Fri 26 Sep, 08:10                  │
│  │                                                     │
│  ●  Ready           Sat 27 Sep, 07:55                  │
│  │                                                     │
│  ○  Collected       —                                  │
│                                                        │
│  Collect from                                          │
│  Riverbend Greens · Stall 14, east row                 │
│  Saturday 27 Sep, 8:00–10:00                           │
│  ┌────────────────────────────────────────────────┐    │
│  │            [ MapView 200px ]                   │    │
│  └────────────────────────────────────────────────┘    │
│  Get directions →                                      │
│                                                        │
│  What you reserved                                     │
│  [art] Rainbow chard × 2          £6.40                │
│  [art] Cavolo nero × 1            £2.80                │
│  ──────────────────────────────────────────────        │
│  Pay at the stall                £9.20                 │
│  Cash, in person, when you collect.                    │
│                                                        │
│  Change this order                                     │
│  You can change or cancel until Friday 18:00.          │
│  Cancel order                                          │
│                                                        │
│  ── once completed ──────────────────────────────      │
│  How was it?                                           │
│  [ReviewForm]                                          │
└────────────────────────────────────────────────────────┘
```

At 1024+: two columns. Left = timeline, items, review. Right sticky = code, collect-from with the
map, actions.

## 8.2 `OrderTimeline`

Four fixed steps — **Placed, Accepted, Ready, Collected** — matching the SRS vocabulary.

- A `2px` vertical rule in `--color-hairline` runs behind the dots. Completed segments turn
  `--color-ink`.
- Reached step: filled `10px` dot in `--color-ink`, label `--color-ink` `--weight-medium`,
  timestamp `--text-sm` `--color-ink-soft`.
- Unreached: hollow dot, `1px solid var(--color-border)`, label `--color-ink-faint`, `—`.
- Current step: the reached dot gets `outline: 2px solid var(--color-hairline); outline-offset: 3px`.
- **Cancelled or declined:** do not show a broken four-step rail. Replace the timeline with a
  single block: `Cancelled Fri 26 Sep, 09:12 · Nothing was charged.` and the reason if the
  backend supplies one.
- Semantics: an `<ol>` with one `<li>` per step, each announcing its state in text — not by colour
  alone. Add a visually hidden "completed" / "not yet" where the dot is the only visual cue.

## 8.3 Modify and cancel — SRS-mandated

> Customers can cancel or modify an order **before the Farmer's cutoff time**.

- Before cutoff: show `You can change or cancel until Friday 18:00.` plus a **Cancel order**
  action and, if `PATCH /orders/:id` supports quantity edits, a **Change quantities** affordance.
  If the backend does not support modification, state that plainly in your report — do not hide
  the requirement.
- After cutoff: `The cutoff has passed. Speak to the stall on market day.` No cancel button.
- Cancel uses the existing **`ConfirmStep`** two-step pattern. Step 2 is the only place
  `--color-danger` becomes a filled button. On success, toast `Cancelled. Nothing was charged.`
  and refresh the order.
- Cancel is **never beet** and never the visually dominant action on the page.

## 8.4 Reorder — SRS-mandated

> Customers can view their past orders and **quickly reorder** previously purchased items.

On a completed or cancelled order: **Reorder these items**, wired to
`GET /orders/:id/reorder-preview`, then add the still-available items to the basket and navigate
to `/buyer/basket`. Report what changed in a toast: `3 items added. 1 is sold out.` Never silently
drop an unavailable item.

On a completed order this is the page's one beet element.

## 8.5 `ReviewForm` — SRS-mandated

> Customers can rate and review Farmers and individual products **after an order is completed**.

- Renders **only** when status is `completed` and the order has not been reviewed.
- A 1–5 star input — **keyboard-operable radios**, not clickable divs. Use a
  `role="radiogroup"` with five real `<input type="radio">` elements, visually replaced by stars,
  reachable by arrow keys.
- One optional comment `<textarea>`, max 500 characters with a live remaining count.
- Per-product rating if `POST /orders/:id/reviews` accepts it; otherwise one rating for the stall.
  State which the backend supports.
- On success, replace the form with `Thank you. Your review is published.` and a link to the stall
  page. Do not leave an empty form behind.
- Already reviewed: show the submitted review read-only with an Edit link
  (`PATCH /reviews/:id` exists).

---

# PART 9 · Your skills for this stage

### Skill 1 · The server owns every number

Quantities, subtotals and totals come from `POST /cart/quote` and from the order document. Never
add prices in the client. A client-side total that disagrees with the server by one penny at
checkout is the most trust-destroying bug this flow can have, and it is guaranteed the moment two
code paths compute the same figure.

### Skill 2 · Dim stale numbers; never blank them

```css
.total[data-stale="true"] { opacity: 0.5; }
```

While re-quoting, the previous total stays readable at half opacity. Replacing it with a spinner
or a zero makes a 300ms round trip feel like a crash.

### Skill 3 · One idempotency key per attempt, held in a ref

```jsx
const idempotencyKeyRef = useRef(null);
const submit = async () => {
  if (!idempotencyKeyRef.current) idempotencyKeyRef.current = createIdempotencyKey();
  await checkout({ ...payload, idempotencyKey: idempotencyKeyRef.current });
};
```

Generated in the component body it changes every render and the guard does nothing. In a ref it
survives re-renders, so a double-tap or a retry-after-timeout reaches the same server-side order.

### Skill 4 · `replace: true` after a mutation that must not repeat

`navigate(confirmedUrl, { replace: true })` removes the checkout page from history. Without it,
Back lands on a checkout whose basket is now empty — or worse, invites a second submit.

### Skill 5 · `<output>` for a value the user needs to read back

`<output>` is an implicit live region, so the collection code is announced when it appears without
you adding `aria-live` and without it being a heading. Spell it out in the `aria-label` — `K 7 M 2
4 B` reads as characters; `K7M24B` may be read as a word.

### Skill 6 · Never signal state by colour alone

A hollow dot versus a filled dot is invisible to a screen reader and to anyone who cannot
distinguish the two greys. Each timeline step carries its state in text — visually hidden is fine.
This is a direct SRS accessibility requirement, not a nice-to-have.

### Skill 7 · A star rating is five radios

```jsx
<fieldset role="radiogroup" aria-label="Rating out of five">
  {[1,2,3,4,5].map((n) => (
    <label key={n}>
      <input type="radio" name="rating" value={n} className={styles.srOnly} />
      <Star aria-hidden="true" />
      <span className={styles.srOnly}>{n} star{n > 1 ? 's' : ''}</span>
    </label>
  ))}
</fieldset>
```

Arrow keys work, Tab works, form submission works, and screen readers announce it — all for free,
because it is a real radio group.

### Skill 8 · Every error keeps the user's work

A 422 at checkout must leave every chosen pickup window selected. Put the error beside the thing
that caused it and change nothing else. A form that clears itself on failure is worse than one
that fails.

### Skill 9 · Say the scope rule in the UI

`Pay at the stall` · `Cash, in person, when you collect.` · `Nothing is charged now.`
These sentences are how a judge sees that you understood the SRS constraint rather than merely
omitting a payment step.

---

# PART 10 · Hard rules — never do these

1. **Never add a payment field, a payment step, or the word "pay" in the present tense.**
   No card inputs, no payment method selector, no "Pay now", no gateway of any kind.
2. **Never add a delivery address, shipping option, courier or tracking.**
3. **Never label a total "Amount due" or "Amount charged".** It is **Pay at the stall**.
4. **Never write "successfully".** State the fact: "Reserved."
5. **Never compute a price or total in the client.**
6. **Never blank a total while re-quoting.** Dim it.
7. **Never generate an idempotency key outside a ref.**
8. **Never navigate to the confirmation without `replace: true`.**
9. **Never make Cancel beet, or the dominant action.** `ConfirmStep`, danger only in step 2.
10. **Never silently drop a sold-out item** from a basket or a reorder. Show it and say why.
11. **Never fork `PickupWindows`.** Reuse the Stage 7 component.
12. **Never render a four-step timeline for a cancelled order.**
13. **Never signal a timeline step by colour or shape alone.**
14. **Never build a star rating from `<div onClick>`.** Five radios.
15. **Never exceed one beet element per page in this flow.**
16. **Never add a dependency. Never touch vendor, admin, guest or the backend.**

---

# PART 11 · Definition of done

- [ ] Basket groups by stall via `quote.groups`, each with its own windows, cutoff and subtotal
- [ ] Past-cutoff groups are dimmed with disabled windows and a danger cutoff line
- [ ] Quantity change re-quotes debounced; totals dim rather than blank; `issues` show inline
- [ ] Empty basket shows the `empty-basket` scene
- [ ] Checkout: three blocks, one page, sticky action, "Change" jumps to the basket anchor
- [ ] Checkout details block is read-only and links to the profile
- [ ] Idempotency key in a ref; double-tap proven not to create two orders
- [ ] Every checkout failure mode maps to a sentence and preserves selections
- [ ] Confirmation uses `replace: true`; Back does not return to checkout
- [ ] `PickupCode` renders as `<output>`, spelled-out `aria-label`, `null` when absent
- [ ] Orders index: Active/Past in the URL, SRS status words, codes inline on active rows
- [ ] Order page: code, four-step timeline, collect-from with map, items, "Pay at the stall"
- [ ] Cancel before cutoff via `ConfirmStep`; after cutoff the message replaces the button
- [ ] Modify supported, or its absence explicitly reported
- [ ] Reorder works and reports what could not be added
- [ ] `ReviewForm` on completed orders, five real radios, arrow-key operable
- [ ] Cancelled orders replace the timeline with a single block
- [ ] `layoutCheck()` **zero findings** on all five pages at 360, 390, 768, 1024, 1440

---

# PART 12 · Verification gate

### A1 build · A2 runtime

```bash
npm run build
npm run dev
```

Zero errors, zero new warnings, zero console errors on all five pages. Check Network for duplicate
requests on mount and for un-debounced quote calls while changing a quantity.

### A3 / A4 / A7

```bash
grep -rnE "#[0-9a-fA-F]{3,8}" src/pages/buyer/Cart.module.css src/pages/buyer/Checkout.module.css src/pages/buyer/OrderConfirmed.module.css src/pages/buyer/Orders.module.css src/pages/buyer/OrderDetail.module.css src/components/domain/StallGroup.module.css src/components/domain/PickupCode.module.css src/components/domain/OrderTimeline.module.css
grep -rnE ":[^;]*[0-9]+px" src/pages/buyer/Cart.module.css src/pages/buyer/OrderDetail.module.css | grep -v "1px" | grep -v "0px"
grep -rnE "linear-gradient|radial-gradient|backdrop-filter|!important|:global" src/pages/buyer src/components/domain/StallGroup.module.css
grep -rn "color-primary\|color-beet" src/pages/buyer/Cart.module.css src/pages/buyer/Checkout.module.css src/pages/buyer/OrderConfirmed.module.css src/pages/buyer/Orders.module.css src/pages/buyer/OrderDetail.module.css
```

Name every beet hit and confirm one per page.

### Scope-rule audit — this is the gate that matters most

```bash
grep -rniE "payment|card number|cvv|stripe|paypal|checkout now|pay now|amount due|amount charged|delivery|shipping|courier|tracking number" src/pages/buyer src/components/domain
```

**Must be empty**, except the literal strings `Pay at the stall`, `pay at the stall` and
`Cash, in person, when you collect.` Paste the output and account for every line.

Then screenshot the basket footer, the checkout summary and the order summary, and confirm each
total is labelled **Pay at the stall**.

### Double-submit proof

On checkout, click **Place pre-order** twice as fast as possible. Then:

```bash
curl -s localhost:4000/api/orders -H "Authorization: Bearer $TOKEN" | head -c 1200
```

**Exactly one new order.** Paste the click description and the order list. Repeat with the
network throttled to Slow 3G so the second click lands while the first is in flight.

### Re-quote behaviour

Change a quantity. Record: was the old total still visible and dimmed, how many `POST /cart/quote`
calls fired (should be one after the 400ms debounce, not one per keypress), and did the new total
match the server response exactly.

### Grouping proof

Add items from **two different stalls**. Screenshot the basket. Confirm two panels, two cutoffs,
two window sets, two subtotals, and one combined "Pay at the stall".

### Cutoff behaviour

Find or create an order/basket group past its cutoff. Confirm: group dimmed, windows disabled,
cutoff line in danger colour, and on the order page the cancel button replaced by the message.
Describe how you produced the past-cutoff state.

### Collection code

Place an order. Paste: the code shown on the confirmation page, the code on the order page, and
the code from `curl GET /api/orders/:id`. **All three identical.** Read the `aria-label` from the
accessibility tree and paste it. Confirm the code contains no `I`, `L`, `O`, `0` or `1`.

### Timeline states

Prove all of: placed-only, accepted, ready, completed, cancelled. Screenshot each. Confirm each
step's state is present in **text**, not only in colour — paste the accessibility tree for one
timeline.

### Review form keyboard test

Tab to the rating. Use **arrow keys** to change it. Tab to the textarea, type, Tab to submit,
press Enter. Confirm the whole flow works without a mouse and report each step.

### Reorder

Reorder a past order containing one sold-out item. Paste the toast text and the resulting basket
contents.

### B1 responsive sweep

At **360, 390, 768, 1024, 1440** on all five pages:

```js
const { layoutCheck } = await import('/src/dev/layoutCheck.js');
console.table(layoutCheck());
```

**Zero findings, twenty-five tables.** Sticky footers on the basket and checkout are the likely
source of overlap findings — the fix is matching page padding computed from the same tokens.

### B3 bottom stack

At 390 on the basket with a sticky footer: confirm the basket pill is **not** rendered, the footer
sits above the bottom nav with no overlap, and the last stall group scrolls fully clear.

### Minimal seed

```bash
cd backend && npm run seed:minimal
```

Empty basket, empty orders, and an order id that does not exist. Report each. Then `npm run seed`.

### Tests

```bash
node tests/run_all.mjs
```

All suites pass. Add assertions for: basket grouping, the collection code appearing on both the
confirmation and the order page, and a cancel before cutoff.

---

# PART 13 · Report

```
Stage 8 status: PASS | FAIL

## What I changed
- <file> — <one line>

## Gate results
A1 build / A2 runtime:   <output>
A3 / A4 / A7:            <output, beet named per page>
Scope-rule audit:        <grep output, every line accounted for>
Double-submit proof:     <clicks, order count, + throttled repeat>
Re-quote behaviour:      <dimming, call count, total match>
Grouping proof:          <screenshot description>
Cutoff behaviour:        <how produced + result>
Collection code:         <3 identical values + aria-label + alphabet check>
Timeline states:         <5 screenshots + one a11y tree>
Review keyboard:         <step by step>
Reorder:                 <toast + basket>
B1 layoutCheck:          <25 tables>
B3 bottom stack:         <result>
Minimal seed:            <3 cases>
Tests:                   <summary>

## Backend capability findings
- Does PATCH /orders/:id support quantity modification?  <yes/no — if no, say so plainly>
- Does POST /orders/:id/reviews accept per-product ratings?  <yes/no>
- Did the basket's chosen pickup window carry through to checkout, or is it re-chosen?  <which>

## SRS coverage
| requirement | where | verified how |
|---|---|---|
| pre-order against available stock | ... | ... |
| pickup date and time slot within Farmer windows | ... | ... |
| status: placed / accepted / ready for pickup / completed | ... | ... |
| cancel or modify before cutoff | ... | ... |
| order history and quick reorder | ... | ... |
| rate and review after completion | ... | ... |
| no payment functionality | ... | scope-rule audit |

## Found but not fixed
- <file:line>

## NOT verified
- <what and why>
```

Fix and re-run any failing gate before reporting. A non-empty scope-rule audit, two orders from a
double-tap, or a non-zero `layoutCheck()` is a FAIL.
