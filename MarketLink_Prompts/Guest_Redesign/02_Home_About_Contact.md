# Stage 2 · Home, About and Contact — the front door

You are working on **MarketLink**. Stage 1 of the Guest redesign is done: 27 public capabilities
were curled signed out, the sharing strategy is written in `docs/CATALOGUE_SHARING.md`, the
shell was rebuilt (`TopBar`, `Footer`, `GuestLayout`), and four primitives exist in
`src/components/guest/`: `GuestPage`, `Hero`, `SectionBand`, `AuthCard`.

This stage rebuilds **three pages** — the ones a judge reads first:

1. `/` — **Home**, currently 709 jsx + **1,118** css
2. `/about` — **About**, currently 470 + **1,342**
3. `/contact` — **Contact**, currently 638 + **1,009**

**4,286 lines for three pages.** The target is roughly a third of that, and the result should
look better.

---

# PART 1 · Context

## 1.1 What MarketLink is — and the copy rules that follow

A Farmer runs a **stall** at a **market** open on specific days. A Customer browses what is
actually available, **reserves** items, picks a pickup slot, then **collects in person at the
stall and pays there, in cash**.

**These bind every word on these three pages:**

- **No payment gateway.** Never "buy", "checkout", "secure payment", "pay online", "cart".
- **No delivery.** Never "delivered", "to your door", "shipping", "fast delivery".
- **No verification.** Never "verified farmers", "certified organic", "quality guaranteed".

The SRS problem statement is the best copy available — use it:

> Customers rarely know in advance which Farmers will be at a market on a given day, what stock
> they have, or at what price. Availability is communicated through chalkboards, printed flyers,
> or word of mouth. Customers often arrive to find popular items already sold out.

**Home exists to answer that paragraph.** Everything else is decoration.

## 1.2 Stack and rules

React 18.3, Vite 6, react-router-dom 6.28. **CSS Modules only. No new dependencies.**
Breakpoints **480 / 768 / 1024 / 1280**. Idiqlat headings **weight 400 only**. Inter elsewhere.
Every value from a `var(--token)`; no raw hex, no raw px beyond `1px` hairlines.

**Accent budget: two beet elements per screen**, and the header `Sign up` is one of them.

## 1.3 The files

```
src/pages/guest/Home.jsx    + .module.css   709 + 1118 — REWRITE
src/pages/guest/About.jsx   + .module.css   470 + 1342 — REWRITE
src/pages/guest/Contact.jsx + .module.css   638 + 1009 — REWRITE

src/components/guest/GuestPage.jsx  Hero.jsx  SectionBand.jsx      Stage 1
src/components/domain/MarketCard.jsx  FarmerCard.jsx  ProductCard.jsx
src/components/domain/MapView.jsx     Leaflet + OSM, no API key
src/components/layout/HorizontalRow.jsx
src/components/ui/FormField.jsx  Button.jsx  EmptyState.jsx
src/api/catalog.js   getPublicHome, getMarkets, getFarmers, getProducts
src/api/contact.js   submitContact
```

## 1.4 The capability matrix — everything this stage must make work

| # | Capability | Wrapper | Endpoint (signed out) | Lands on |
|---|---|---|---|---|
| 1 | Public home payload | `getPublicHome()` | `GET /api/public/home` | Home, all sections |
| 2 | List markets | `getMarkets({limit})` | `GET /api/public/markets` | Home fallback |
| 6 | List stalls | `getFarmers({limit})` | `GET /api/public/farmers` | Home fallback |
| 11 | List produce | `getProducts({limit})` | `GET /api/public/products` | Home fallback |
| 17 | Contact form | `submitContact(payload)` | `POST /api/contact` | Contact |

**Before building**, curl capability 1 and paste the **full shape**. Home must be driven by
`/public/home` in **one request** if it carries markets, stalls and produce. Three separate
list calls where one payload exists is a request waterfall on the most-visited page on the site.

If `/public/home` does **not** carry everything, say exactly what it carries and fetch the rest
**in parallel**, never sequentially.

Also record the **rate limit** on `POST /contact` from Stage 1 — the form must handle `429`.

## 1.5 Off-limits

`src/pages/buyer/**`, `src/pages/vendor/**`, `src/pages/admin/**`. `backend/**`.
`package.json`. The catalogue pages (stage 3) and the auth pages (stage 4).

---

# PART 2 · Design rules for these three pages

## 2.1 The templated-marketing tells, and what to do instead

The current Home has a hero image with a dark overlay (`heroOverlay`) and uppercase eyebrow
labels (`WEEKEND GATHERINGS`, `THE GROWERS`). Both are the most templated patterns on the web.

| Instead of | Do |
|---|---|
| Full-bleed photo + dark scrim + centred white text | White background, large Idiqlat headline, one image **beside** it at 768+ |
| `UPPERCASE EYEBROW` | Sentence case `--text-sm` `--color-ink-soft`, or nothing |
| Alternating tinted section bands | White throughout; **one** `--color-canvas` band on the whole page |
| Three identical feature cards with icons | Real content: real markets, real stalls, real prices |
| "Experience the freshness of local farming" | "See what is on the stalls before you go" |
| Stock photography | The catalogue itself |

**The catalogue is the argument.** A row of three real produce cards with real prices from the
seeded database persuades more than any hero copy, and it proves the product works.

## 2.2 Density

Home's **first viewport at 390×844**: header, headline, one lead line, two actions. That is all.
The first content row starts below the fold and that is correct — a visitor scrolls.

## 2.3 Voice

Plain, specific, honest. No exclamation marks, no emoji, no all-caps. Sentence case everywhere.

---

# PART 3 · Page A — Home (`/`)

## 3.1 Structure

```
┌──────────────────────────────────────────────────────────────┐
│  Know what is on the stalls          Idiqlat --text-display   │
│  before you go.                                               │
│                                                               │
│  Local farmers post what they are bringing to market.         │
│  Reserve what you want and collect it at the stall.           │
│                                                               │
│  [ Browse the market ]   Sign up          ← the ONE beet      │
│                                             (header Sign up   │
│                                              is the other)    │
│                          ┌──────────────────────────────┐     │
│                          │  one image, beside the text  │     │
│                          │  at 768+ · above at mobile   │     │
│                          └──────────────────────────────┘     │
├──────────────────────────────────────────────────────────────┤
│  Markets near you                            See all markets →│
│  [market card] [market card] [market card] →                  │
│                                                               │
│  On the stalls this week                      See all produce→│
│  [produce] [produce] [produce] [produce] →                    │
│                                                               │
│  Meet the growers                             See all stalls →│
│  [stall] [stall] [stall] →                                    │
├──────────────────────────────────────────────────────────────┤
│  ┌── the ONE canvas band ──────────────────────────────────┐  │
│  │  How it works                                           │  │
│  │  1 Find a stall   2 Reserve   3 Collect and pay cash    │  │
│  └────────────────────────────────────────────────────────┘  │
├──────────────────────────────────────────────────────────────┤
│  Sell at a market?                                            │
│  List your weekly stock and take pre-orders.   Sign up →      │
└──────────────────────────────────────────────────────────────┘
```

## 3.2 The hero

- `<h1>` in Idiqlat at `--text-display`, **two lines maximum**, `max-width: 18ch` so it breaks
  where you intend rather than where the viewport decides.
- Lead paragraph `--text-lead`, `--color-ink-soft`, `max-width: var(--measure)`.
- Two actions: **Browse the market** (beet, to `/products`) and **Sign up** (ink text link).
- **One image**, in a `--radius-xl` box with a hairline, `aspect-ratio: 4/3`, `object-fit: cover`,
  beside the text at 768+ and above it below. It must have a real `alt`.
  `hero-alt.png` exists at the repo root and in `src/components/asset/` — **check its file size
  before using it.** If it is over ~300KB, either compress it or drop the image entirely. A
  2.4MB hero on the landing page fails the SRS performance requirement on its own, and no hero
  image is better than a slow one. Report the size you found and what you did.
- **No overlay. No scrim. No text on top of an image.**

## 3.3 The three catalogue rows

Each is a `HorizontalRow` of real cards from the API, with a "See all" link.

- **Markets near you** → `MarketCard`, links to `/markets/:id`, See all → `/markets`
- **On the stalls this week** → `ProductCard`, links to `/products/:id`, See all → `/products`
- **Meet the growers** → `FarmerCard`, links to `/farmers/:id`, See all → `/farmers`

Reuse the existing card components. If a card renders a basket button for a guest, pass a prop
or `audience` so it renders `Sign in to reserve` instead — and note it for Stage 3, which
formalises this.

**Each row renders only when it has items.** An empty `HorizontalRow` with a heading and nothing
under it is worse than no section. On a minimal seed, Home should degrade to the hero, How it
works, and the farmer CTA — and still look intentional.

## 3.4 How it works — the one canvas band

Three numbered steps, `SectionBand` with `--color-canvas`:

1. **Find a stall.** See who is at the market and what they are bringing.
2. **Reserve what you want.** Pick a collection window that suits you.
3. **Collect and pay at the stall.** In person, in cash, on market day.

**Step 3 is the payment model.** It must be unmissable and it must be exactly this honest. A
judge reading only the home page should come away knowing there is no online payment.

A small `Illustration` (the existing 80×80 icon set) beside each step is fine. Do not build new
artwork.

## 3.5 The farmer CTA

One band at the foot: `Sell at a market?` / `List your weekly stock and take pre-orders.` with a
link to `/register?role=farmer`. Stage 4 reads that query parameter to preselect the role — note
the contract explicitly so Stage 4 honours it.

Ink text and a text link, **not** a second beet button.

## 3.6 Data and states

- **One request if possible** (`getPublicHome`). Parallel if not. Never sequential.
- Skeletons matching the real card boxes; never a spinner.
- Error: the hero and How it works still render; the rows show an inline retry. **The home page
  must never be blank**, even with the backend down.
- Minimal seed: degrades as described in 3.3.

---

# PART 4 · Page B — About (`/about`)

The SRS requires: *"Information about the team and the platform should be displayed."*

`GuestPage width="read"` (720px). **No hero image. No cards. Mostly text**, which is why 1,342
lines of CSS is the wrong answer here.

```
┌──────────────────────────────────────────────┐
│  About MarketLink            Idiqlat h1      │
│                                              │
│  Two or three paragraphs: the problem from   │
│  the SRS, and what this does about it.       │
│  max-width: var(--measure)                   │
│                                              │
│  What MarketLink does                        │
│  · Farmers publish weekly stock and prices   │
│  · Customers browse and reserve for pickup   │
│  · Collection and payment happen at the stall│
│                                              │
│  What it does not do                         │
│  · No online payment — you pay at the stall  │
│  · No delivery — collection at the market    │
│                                              │
│  The team                                    │
│  ┌────────┐ ┌────────┐ ┌────────┐            │
│  │ name   │ │ name   │ │ name   │            │
│  │ role   │ │ role   │ │ role   │            │
│  └────────┘ └────────┘ └────────┘            │
│                                              │
│  Built with                                  │
│  React · Node · MongoDB · OpenStreetMap      │
└──────────────────────────────────────────────┘
```

**"What it does not do" is a deliberate section.** Stating the constraints plainly reads as
confidence, prevents every "where do I pay?" support message, and shows a judge you understood
the brief rather than omitting features by accident.

**The team section needs real data you do not have.** Put the names, roles and contact details
in **one exported array at the top of the file** with a clear comment:

```jsx
/** TEAM — fill in real names and roles before submission. Placeholder content must not ship. */
const TEAM = [
  { name: 'TODO', role: 'TODO', focus: 'TODO' },
];
```

List this in your report under a **"Human to-do"** heading. Do not invent people.

Team cards: initials avatar on `--color-beet-tint`, name in Idiqlat `--text-h3`, role in
`--text-sm` ink-soft. White, hairline, no photos.

**Built with** satisfies the SRS requirement to acknowledge tools. Add an `AI_USAGE.md` pointer
if that file exists.

**Zero beet elements** on this page beyond the header.

---

# PART 5 · Page C — Contact (`/contact`)

The SRS requires: *"Display static team contact information with Google Maps showing location."*
We use OpenStreetMap via the existing `MapView` — the SRS permits either.

`GuestPage width="read"`. Two columns at 1024+, stacked below.

```
┌──────────────────────────────────────────────────────────────┐
│  Contact us                          Idiqlat h1              │
│  Questions about a market, a stall, or your account.         │
│                                                              │
│  ┌── form ────────────────┐  ┌── details ─────────────────┐  │
│  │ Name          *        │  │ Email                      │  │
│  │ Email         *        │  │ hello@marketlink.example   │  │
│  │ Subject       *        │  │                            │  │
│  │ Message       *        │  │ Phone                      │  │
│  │ 0 / 1000               │  │ +44 …                      │  │
│  │                        │  │                            │  │
│  │ [ Send message ]  beet │  │ Where we are               │  │
│  └────────────────────────┘  │ ┌────────────────────────┐ │  │
│                              │ │     [ MapView 240px ]  │ │  │
│                              │ └────────────────────────┘ │  │
│                              │ Get directions →           │  │
│                              └────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

## 5.1 The form — make it genuinely work

`POST /api/contact` via `submitContact`. These messages land in the **admin support inbox**
(`GET /admin/messages`) and drive the sidebar `unhandledMessages` badge, so this form is a real
end-to-end path, not a decoration.

**Curl `POST /contact` first** and build to the exact field names it accepts. Guessing `body`
when the server wants `message` produces a 422 that looks like a form bug.

Requirements:

- `FormField` for each input, with a real `<label>` — never a placeholder as the label.
- Client validation on blur: required, email format, message length. Server `422` details render
  **under their own field**.
- `maxLength` on the message with a **live remaining count**.
- Submit disabled until valid; label changes to `Sending…` while in flight.
- **Success replaces the form** with a confirmation: `Thanks. We will reply to you at
  <email>.` plus a link back to `/`. Do not leave an empty form behind.
- **Failure keeps every entered value.** Never clear a form on error.
- **`429` gets its own message**: `Too many messages just now. Try again in a few minutes.`
  You recorded the real limit in Stage 1.
- A **honeypot** field — a visually hidden input real users never fill — and abandon the submit
  if it has content. This is a public unauthenticated POST endpoint; a trivial bot guard is
  proportionate and free.

## 5.2 Contact details and the map

Same pattern as the team: **real details you do not have.** One exported array at the top of the
file, marked TODO, listed in your report under Human to-do. Do not invent an address.

The map uses `MapView` with the office coordinates:

```jsx
<MapView markers={[{ id: 'hq', lat, lng, title: 'MarketLink' }]}
         height="240px" zoom={15} ariaLabel="Map showing the MarketLink office" />
```

- **No coordinates: omit the map entirely.** Never render an empty grey box.
- `Get directions` is an `<a target="_blank" rel="noopener noreferrer">` to OpenStreetMap
  directions, with `aria-label` saying it opens in a new tab.
- The address text is the accessible equivalent of the map and must stand alone.

## 5.3 End-to-end proof

After a successful submit, **sign in as admin and confirm the message appears** at
`/admin/settings?tab=messages`. That round trip is the only proof the form works, and it is
exactly the kind of thing a judge will ask you to demonstrate.

---

# PART 6 · Your skills for this stage

### Skill 1 · Show the catalogue, do not describe it

Three real produce cards with real prices from the seeded database beat any amount of hero copy,
and they double as proof that the backend works. Fetch real data on the landing page.

### Skill 2 · One payload, or parallel — never sequential

```jsx
/* wrong — a waterfall on the most-visited page */
const markets  = await getMarkets();
const products = await getProducts();

/* right */
const [markets, products, farmers] = await Promise.all([...]);
/* better — if /public/home carries all three, one request */
```

### Skill 3 · Check image weight before you ship it

`hero-alt.png` is at the repo root. `ls -lh` it. A multi-megabyte landing-page image fails the
SRS performance requirement by itself, and no image beats a slow one.

### Skill 4 · State the constraints out loud

"No online payment — you pay at the stall" on the About page reads as confidence and prevents a
whole class of support message. Omitting a feature silently reads as an oversight.

### Skill 5 · Real data goes in one marked array

Team names and office addresses are human inputs. One `const TEAM = [...]` at the top of the
file with a TODO comment, surfaced in your report, means a human can fill it in five minutes.
Scattering placeholders through JSX means they ship.

### Skill 6 · A success state replaces the form

Leaving a filled form on screen after a successful send invites a double submit and gives no
confirmation. Replace it with a sentence that names the email you will reply to.

### Skill 7 · A honeypot is three lines

```jsx
<input type="text" name="website" tabIndex={-1} autoComplete="off"
       className={styles.honeypot} aria-hidden="true" />
```

Hidden with `position: absolute; left: -9999px` — **not** `display: none`, which some bots skip.
If it has a value on submit, return silently.

### Skill 8 · Prove the round trip

Submit the form, then look in the admin inbox. A form that POSTs successfully but whose message
never reaches an operator is a form that does not work.

---

# PART 7 · Hard rules — never do these

1. **Never write copy implying payment, delivery, or verification.**
2. **Never use a hero image with a dark overlay or text on top of an image.**
3. **Never use an uppercase eyebrow label, an exclamation mark, or an emoji.**
4. **Never use more than one `--color-canvas` band** on a page, and only on Home.
5. **Never render an empty `HorizontalRow`** — hide the section.
6. **Never fetch sequentially** on Home.
7. **Never ship a landing-page image without checking its file size.**
8. **Never invent team names, an address, or a phone number.** TODO array plus a report entry.
9. **Never clear a form on error.**
10. **Never leave the form on screen after a successful send.**
11. **Never use a placeholder as a label.**
12. **Never render an empty map.** Omit it.
13. **Never exceed two beet elements** per screen; About has zero in its body.
14. **Never use a raw hex or raw px**, a gradient, a card shadow, `!important` or `:global`.
15. **Never add a dependency. Never touch buyer, vendor, admin or the backend.**

---

# PART 8 · Definition of done

- [ ] `/public/home` curled; its full shape pasted; Home driven by **one request** or parallel
- [ ] `POST /contact` curled; the form built to the **real field names**
- [ ] Home: hero with no overlay, two actions, one sized-checked image with real `alt`
- [ ] Three catalogue rows from live public data, each hidden when empty
- [ ] How it works: three steps, one canvas band, **step 3 states cash at the stall**
- [ ] Farmer CTA links to `/register?role=farmer`; the contract noted for Stage 4
- [ ] Home renders with the backend **down**: hero and How it works still visible
- [ ] About: text-led, "What it does not do" section present, team in a marked TODO array
- [ ] Contact: labelled fields, live character count, field-level 422s, honeypot
- [ ] Success replaces the form; failure preserves input; `429` has its own message
- [ ] Map renders with coordinates and is **omitted** without them; directions link correct
- [ ] **End-to-end proof**: a submitted message appears in the admin inbox
- [ ] Line counts: each of the three pages and its CSS reported before and after
- [ ] `layoutCheck()` **zero findings** on all three pages at 360, 390, 768, 1024, 1440

---

# PART 9 · Verification gate

### Capability proof

`GET /public/home` and `POST /contact`: method, path, status, **full shapes**, and the field
mapping you used. Plus the request count on Home (**must be 1, or N parallel — never sequential**;
paste the Network waterfall description).

### A1 build · A2 runtime

```bash
npm run build
npm run dev
```

**Private window.** Zero console errors on all three pages. Confirm every catalogue request went
to `/api/public/...` — paste the URLs.

### A3 / A4 / A7 and sizes

```bash
grep -rnE "#[0-9a-fA-F]{3,8}" src/pages/guest/Home.module.css src/pages/guest/About.module.css src/pages/guest/Contact.module.css
grep -rnE ":[^;]*[0-9]+px" src/pages/guest/Home.module.css src/pages/guest/Contact.module.css | grep -v "1px" | grep -v "0px"
grep -rnE "linear-gradient|radial-gradient|backdrop-filter|!important|:global" src/pages/guest/Home.module.css src/pages/guest/About.module.css src/pages/guest/Contact.module.css
grep -rn "color-primary\|color-beet" src/pages/guest/Home.module.css src/pages/guest/About.module.css src/pages/guest/Contact.module.css
wc -l src/pages/guest/Home.* src/pages/guest/About.* src/pages/guest/Contact.*
```

Report before → after line counts for all six files. Name every beet hit.

### Copy audit — the scope rule

```bash
grep -rniE "buy|purchase|checkout|payment|pay online|secure|deliver|shipping|courier|verified|certified|guarantee" src/pages/guest/Home.jsx src/pages/guest/About.jsx src/pages/guest/Contact.jsx
```

Every hit accounted for. `pay at the stall` and `pay in cash` are the permitted uses.

### Image weight

```bash
ls -lh hero-alt.png src/components/asset/*.png src/components/asset/*.jpg 2>/dev/null
```

Report the size of any image you used and what you did about it.

### Home resilience

- Backend **stopped**: screenshot. Hero and How it works must render; rows show a retry.
- `npm run seed:minimal`: screenshot. Rows hidden, page still intentional.
- Full seed: all three rows populated.

### Contact form — every path

| Case | Expected | Result |
|---|---|---|
| Empty submit | field errors, no request | |
| Invalid email | inline error on blur | |
| Message over limit | blocked, count shows 0 remaining | |
| Valid submit | 201/200, form replaced by confirmation | |
| Backend stopped | error shown, **all values preserved** | |
| Rapid repeat submits | `429` with its own message | |
| Honeypot filled | submit abandoned silently | |

### End-to-end proof

Submit a message with a distinctive subject. Sign in as admin, go to
`/admin/settings?tab=messages`, and **paste the message as it appears there**.

### Map

Coordinates present: map renders with a marker, directions URL pasted, opens in a new tab.
Coordinates absent (temporarily blank them): **no map element rendered at all** — confirm with
`layoutCheck()` showing no distorted-media finding.

### B1 · Responsive sweep

At **360, 390, 768, 1024, 1440** on all three pages:

```js
const { layoutCheck } = await import('/src/dev/layoutCheck.js');
console.table(layoutCheck());
```

**Zero findings, fifteen tables.**

### B2 · Density

Screenshot Home at exactly 390×844. List every element above the fold. Header, headline, lead,
two actions — **and nothing else**.

### B4 · Keyboard

Tab all three pages end to end. The contact form is completable with no mouse. Horizontal rows
are reachable. Every focus stop has a visible ring.

### Tests

```bash
node tests/run_all.mjs
```

All suites pass. `tests/01_guest.mjs` touches these pages — update selectors to new labels
rather than keeping stale ones.

---

# PART 10 · Report

```
Stage G2 status: PASS | FAIL

## Capability proof
| capability | method | path | status | shape | field mapping |
Home request count: <1 / N parallel — waterfall described>

## Line counts
| file | before | after |
(six files)

## Gate results
A1 build / A2 runtime:  <output + /api/public/ URLs>
A3 / A4 / A7:           <output, beet named per page>
Copy audit:             <grep output, every hit accounted for>
Image weight:           <sizes + action taken>
Home resilience:        <backend down / minimal seed / full seed>
Contact form:           <7-row table>
End-to-end proof:       <message as it appears in the admin inbox>
Map:                    <with and without coordinates>
B1 layoutCheck:         <15 tables>
B2 density:             <above-the-fold element list>
B4 keyboard:            <result>
Tests:                  <summary>

## Human to-do (real data required before submission)
- About → TEAM array in src/pages/guest/About.jsx: names, roles
- Contact → CONTACT_DETAILS array in src/pages/guest/Contact.jsx: email, phone, address, lat/lng
- <anything else>

## Contracts noted for later stages
- /register?role=farmer must preselect the farmer role  (Stage 4)
- Guest cards need an `audience` prop for the reserve CTA  (Stage 3)

## Found but not fixed
- <file:line>

## NOT verified
- <what and why>
```

Fix and re-run any failing gate. Copy implying payment or delivery, a contact message that never
reaches the admin inbox, or a blank home page with the backend down is a **FAIL**.
