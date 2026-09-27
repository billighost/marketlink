# Stage 4 · Auth flows — sign in, dual-role register, password reset, email verification

You are working on **MarketLink**. Stages 1–3 of the Guest redesign are done: the public API was
curled signed out, the shell was rebuilt, Home/About/Contact are live, and the six catalogue
pages were extracted into shared views under `src/components/catalogue/`.

This stage rebuilds **seven pages** — every path into and out of an account:

| Route | File | Lines today |
|---|---|---|
| `/login` | `Login.jsx` | 324 + 509 |
| `/register` | `Register.jsx` | 853 + 666 |
| `/forgot-password` | `ForgotPassword.jsx` | 113 + 120 |
| `/reset-password` | `ResetPassword.jsx` | 201 + 95 |
| (verify) | `VerifyEmail.jsx` | 238 + 197 |
| `/unauthorized` | `Unauthorized.jsx` | 47 + 104 |
| `*` | `NotFound.jsx` | 45 + 86 |

**3,598 lines.** `AuthCard` from Stage 1 carries the frame, so most of that CSS should not exist.

These pages are where a judge will try to break the app: wrong password, duplicate email, expired
token, rate limit. **Every failure path must be handled, and every message must be honest.**

---

# PART 1 · Context

## 1.1 What MarketLink is

A Farmer runs a **stall** at a **market**. A Customer **reserves** produce and **collects in
person, paying cash at the stall**. **No payment gateway. No delivery.**

Two roles register through this site: **Customers** and **Farmers**. A Farmer must be **approved
by an admin before they can list products** — that is an SRS requirement, and the registration
flow must say so at the point of signup, not spring it afterwards.

## 1.2 The SRS requirements this stage satisfies

> Customers must be able to register, log in, and securely access their dashboard.
> **Name, contact number, e-mail ID, and address** must be supplied during registration.
>
> At the time of registration, Farmers must provide **stall/business name, contact person,
> contact number, e-mail ID, and address**.
>
> Admin can view, approve, or suspend Farmer registrations **before they can list products**.
>
> Users can access only those features relevant to their role.

Both field sets are mandatory. Neither may be trimmed for tidiness.

## 1.3 Stack and rules

React 18.3, Vite 6, react-router-dom 6.28. **CSS Modules only. No new dependencies.**
Breakpoints **480 / 768 / 1024 / 1280**. Idiqlat headings **weight 400 only**.
Every value from a `var(--token)`; no raw hex, no raw px beyond `1px` hairlines.

**Accent budget: one beet element per auth page** — the submit button. The header `Sign up`
CTA is **hidden on auth pages**; a Sign up button on the Sign up page is noise.

## 1.4 The capability matrix

| # | Capability | Wrapper (`src/api/auth.js`) | Endpoint |
|---|---|---|---|
| 18 | Sign in | `login({email, password})` | `POST /auth/login` |
| 19 | Register customer | `registerCustomer(payload)` | `POST /auth/register/customer` |
| 20 | Register farmer | `registerFarmer(payload)` | `POST /auth/register/farmer` |
| 21 | Forgot password | `forgotPassword(email)` | `POST /auth/forgot-password` |
| 22 | Reset password | `resetPassword({token, newPassword, confirmPassword})` | `POST /auth/reset-password` |
| 23 | Verify email | `verifyEmail(token)` | `POST /auth/verify-email` |
| 24 | Resend verification | `resendVerification(email)` | `POST /auth/resend-verification` |
| 25 | Refresh session | `refresh()` | `POST /auth/refresh` |
| 26 | Sign out | `logout()` | `POST /auth/logout` |
| 27 | Current user | `getMe(signal)` | `GET /auth/me` |

## 1.5 Curl the unhappy paths FIRST — this is the stage's foundation

Stage 1 recorded these. **Re-curl and confirm**, because your messaging is built on them.
For each, record the HTTP status, `error.code` and `error.message`:

| Case | How to produce it |
|---|---|
| Wrong password | valid email, bad password |
| Unknown email | email not in the database |
| **Duplicate email on register** | register the seeded customer email again |
| **Unverified email on login** | register fresh, then try to sign in |
| Suspended / deactivated account | use an admin-suspended account |
| Missing required field | omit `address` from a register payload |
| Invalid email format | `not-an-email` |
| Weak password | `123` |
| **Expired or invalid reset token** | a made-up token |
| **Already-used verification token** | verify twice |
| **Rate limited** | hammer login past the limit |

Also record the **actual rate limits** from `backend/src/middleware/rateLimits.js` for login,
register, forgot-password and resend-verification.

**Do not invent an error message.** A form that shows "Invalid credentials" when the server said
"Please verify your email first" sends the user down the wrong path entirely.

## 1.6 Two contracts from earlier stages you must honour

1. **`/login?next=<path>`** — Stage 3 sets this on every guest "Sign in to reserve" CTA. After a
   successful sign-in you **must** redirect there, not to a generic dashboard. Validate it: only
   accept same-origin paths beginning with a single `/`, never a full URL. An unvalidated `next`
   is an open-redirect vulnerability.
2. **`/register?role=farmer`** — Stage 2's Home farmer CTA sets this. The register page must
   preselect the Farmer role from it.

## 1.7 Off-limits

`src/pages/buyer/**`, `src/pages/vendor/**`, `src/pages/admin/**`, `src/components/catalogue/**`.
`backend/**`. `package.json`.

---

# PART 2 · Shared rules for all seven pages

## 2.1 The frame

Every one uses `AuthCard` from Stage 1: centred, `--container-form` (440px), white, hairline,
`--radius-xl`, logo, Idiqlat title, one muted line, the form, a footer link.

Register is wider (`--container-narrow`, 840px) at 768+ because it has two columns of fields.

**If a page needs more than ~60 lines of its own CSS, `AuthCard` is not doing enough.** Push the
shared parts into it. Report each page's final CSS line count.

## 2.2 Form rules — all of them, everywhere

- **A real `<label>` for every input.** Never a placeholder as the label.
- `autoComplete` on every field: `email`, `current-password`, `new-password`, `name`, `tel`,
  `street-address`, `organization`. Browsers and password managers depend on these, and
  getting them right is free.
- `type="email"`, `type="tel"`, `inputMode` where it helps a phone keyboard.
- **Validate on blur, not on every keystroke.** Errors that appear while you are still typing
  the third character are hostile.
- **Server `422` details render under their own field.** Only a truly page-level error
  (rate limit, network) becomes a banner.
- Submit disabled until valid; label changes to `Signing in…` / `Creating account…` in flight.
- **Never clear a form on failure.** Passwords may be cleared; nothing else.
- Password fields get a **show/hide toggle** — a 44px button with
  `aria-label="Show password"` / `"Hide password"` and `aria-pressed`.
- The error region is `role="alert"` so it is announced; field errors use `aria-describedby`
  and `aria-invalid`.

## 2.3 Never leak account existence

On **forgot password**, the response must be identical whether or not the email exists:
`If that email is registered, we have sent a reset link.`

If the backend distinguishes them, **the UI must not** — show the same message either way and
note the backend behaviour in your report. Telling an attacker which emails are registered is a
real vulnerability and an easy one for a judge to test.

Login is different: "wrong email or password" as a single combined message is standard and
correct. Do not say which was wrong.

## 2.4 Voice

`Welcome back.` · `Create your account.` · `Check your email.` · `That link has expired.`
No exclamation marks. No emoji. No "Oops".

---

# PART 3 · Page A — Login (`/login`)

```
┌────────────────────────────────────┐
│           [ MarketLink ]           │
│                                    │
│  Welcome back        Idiqlat h1    │
│  Sign in to reserve at the market. │
│                                    │
│  Email                             │
│  [                              ]  │
│  Password                          │
│  [                      ] [ 👁 ]   │
│                Forgot password?    │
│                                    │
│  [        Sign in        ]  beet   │
│                                    │
│  ─────────────────────────────     │
│  New here?  Create an account      │
└────────────────────────────────────┘
```

## 3.1 Behaviour

- On success: `AuthContext` stores the token, then redirect — **`next` if present and valid**,
  otherwise by role: customer → `/buyer`, farmer → `/vendor`, admin → `/admin`.
- Validate `next`:

```jsx
const safeNext = (raw) => {
  if (!raw) return null;
  if (!raw.startsWith('/') || raw.startsWith('//')) return null;  // no protocol-relative
  return raw;
};
```

  `//evil.com` starts with `/` and is a full URL to another origin. That check is the whole fix.
- **Unverified email**: the server has a distinct error for this. Do **not** show "wrong
  password". Show `Verify your email to sign in.` plus a **Resend verification email** button
  wired to `resendVerification(email)`, using the email already typed.
- **Suspended or deactivated**: show the server's message. Do not offer a retry that cannot work.
- **429**: `Too many attempts. Try again in a few minutes.` — with the real window if the
  response carries one.
- **Network down**: `Cannot reach MarketLink. Check your connection.` with a Retry.

## 3.2 Remove the role quick-switch buttons

`README.md` describes "Continue as Customer / Farmer / Admin" preview buttons on the login
screen. If they are still present, **delete them.** They bypass authentication, they will be on
screen during a demo, and a judge will press one. Confirm with a grep that nothing remains.

---

# PART 4 · Page B — Register (`/register`)

The biggest page here (853 + 666), and the one with the most required fields.

## 4.1 Role selection first

```
┌──────────────────────────────────────────────┐
│  Create your account          Idiqlat h1     │
│                                              │
│  ┌──────────────────┐ ┌──────────────────┐   │
│  │ ● I am shopping  │ │ ○ I sell at a    │   │
│  │   Reserve produce│ │   market         │   │
│  │   and collect it │ │   List stock and │   │
│  │   at the stall.  │ │   take pre-orders│   │
│  └──────────────────┘ └──────────────────┘   │
└──────────────────────────────────────────────┘
```

- Two **real radio inputs** in a `role="radiogroup"` with a `<legend>`, visually styled as cards.
  Arrow keys must move between them. Not two `<div onClick>`.
- **Preselect from `?role=farmer`** — the Stage 2 contract.
- Mirror the choice into the URL as the user changes it, so a refresh keeps it.

## 4.2 The two field sets — both complete, per the SRS

**Customer** — `POST /auth/register/customer`

| Field | Required | autoComplete |
|---|---|---|
| Full name | yes | `name` |
| Email | yes | `email` |
| Contact number | yes | `tel` |
| Address | yes | `street-address` |
| Password | yes | `new-password` |
| Confirm password | yes | `new-password` |

**Farmer** — `POST /auth/register/farmer`

| Field | Required | autoComplete |
|---|---|---|
| Stall / business name | yes | `organization` |
| Contact person | yes | `name` |
| Email | yes | `email` |
| Contact number | yes | `tel` |
| Address | yes | `street-address` |
| Password | yes | `new-password` |
| Confirm password | yes | `new-password` |

**Curl both endpoints first and match the exact field names.** Sending `fullName` when the
server wants `name` produces a 422 that looks like a form bug. Paste both request shapes.

Two columns at 768+, one below. Grouped under `--text-sm` headings: *About you* / *Your stall*,
then *Security*.

## 4.3 The farmer approval notice — do not bury this

Directly above the Farmer submit button, in a hairline panel:

> **Stalls are reviewed before they go live.** You can set up your stall straight away. An
> administrator approves it before your produce appears to customers.

This is the SRS's "approve before they can list products", and telling someone after they sign
up is how you get a support message. Say it at the point of decision.

## 4.4 Password rules, shown before they are broken

List the requirements **under the password field as static text**, and tick them live as they
are met. Read the real rules from the backend validation schema — do not invent them.

A **strength meter is not required** and usually misleads. A checklist of the actual rules is
honest and more useful.

## 4.5 After registration

The backend sends a verification email (there is a real Gmail SMTP mailer). Curl the response
and find out what it returns — a session, or nothing?

- **If it returns a session**: redirect to the role dashboard, and show a persistent
  `VerifyEmailBanner` (that component already exists) until verified.
- **If it does not**: replace the form with `Check your email.` naming the address, plus a
  **Resend** button and a link to `/login`.

**Do not guess.** State which the server does and build accordingly.

Duplicate email: a field-level error on the email field — `An account with this email already
exists.` plus a link to `/login?next=...` carrying the address through.

---

# PART 5 · Pages C–E — Password reset and verification

## 5.1 Forgot password (`/forgot-password`)

One email field, one button. On submit, **always** show the same neutral confirmation
(see 2.3), replacing the form. Include a **Resend** affordance with a 60-second cooldown that
disables the button and shows the remaining seconds.

## 5.2 Reset password (`/reset-password`)

Token from the query string.

- **No token**: an error card and a link back to `/forgot-password`. Do not render the form.
- New password + confirm, with the same live rule checklist as Register.
- Mismatch validates on blur.
- **Expired or invalid token**: the server's distinct error →
  `That reset link has expired. Request a new one.` plus a link to `/forgot-password`.
  **Not** a generic failure.
- Success: confirmation card and a link to `/login`. If the server signs the user in, honour
  that and redirect to the dashboard instead — curl and find out which.

## 5.3 Verify email (`VerifyEmail.jsx`)

Token from the query string, submitted to `POST /auth/verify-email` on mount.

Four states, and all four must be built:

1. **Verifying** — a spinner and `Verifying your email…`
2. **Success** — `Your email is verified.` plus a link onward (dashboard if signed in,
   otherwise `/login`)
3. **Expired or invalid** — `That link has expired.` plus an email field and **Resend**
4. **Already verified** — the server has a distinct response for this; treat it as success,
   not as an error. Verifying twice by clicking the email link again is normal behaviour.

Guard against React StrictMode double-invoking the effect and consuming the token twice — use a
`useRef` latch so the POST fires once.

Check whether this page has a route in `AppRoutes.jsx`. If it does not, add one at
`/verify-email` and say so.

---

# PART 6 · Pages F–G — Unauthorized and Not found

## 6.1 Unauthorized (`/unauthorized`)

Shown when a signed-in user hits a route for another role. `ProtectedRoute` redirects here.

- Title: `That area is not for your account.`
- One line naming the user's actual role and where they can go.
- One button to **their** dashboard, one text link to sign out.
- No scene illustration is required, but if `EmptyState` with a scene is already available, use
  it for consistency with the rest of the site.

## 6.2 Not found (`*`)

- Title: `That page is not on the map.`
- One line: `The link may be old, or the page may have moved.`
- Links to `/`, `/markets`, `/products`.
- If a search component is easily reusable, offer it. Do not build a new one.

Both pages are small. Their CSS should be near zero given `AuthCard` and `EmptyState`.

---

# PART 7 · Your skills for this stage

### Skill 1 · Build messaging from real error codes

Curl every failure first, then write the copy. A form that says "Invalid credentials" when the
server said "verify your email" sends a user into a loop they cannot escape.

### Skill 2 · Validate `next` or you have an open redirect

```jsx
if (!raw.startsWith('/') || raw.startsWith('//')) return null;
```

`//evil.com` passes a naive `startsWith('/')` check and is a full URL to another origin. Two
conditions, and a real vulnerability closed.

### Skill 3 · Never leak which emails are registered

Forgot-password returns the same message either way. This is a five-minute change and a
standard thing to be tested on.

### Skill 4 · `autoComplete` is not optional

`new-password`, `current-password`, `street-address`, `tel`. Password managers and mobile
autofill depend on them, and a seven-field registration form without autofill is a form people
abandon.

### Skill 5 · A radio group is real radios

`role="radiogroup"` with real `<input type="radio">` gives arrow-key navigation, form
submission and screen-reader announcement for free. Two styled `<div onClick>` gives none of it.

### Skill 6 · Say the consequence before the decision

The farmer approval notice goes **above** the submit button, not on the page after. That is the
difference between an informed choice and a surprise.

### Skill 7 · Latch one-shot effects

```jsx
const fired = useRef(false);
useEffect(() => { if (fired.current) return; fired.current = true; verify(token); }, [token]);
```

StrictMode double-invokes effects in dev. Without the latch, the verification token is consumed
twice and the second call reports "already used" — a bug that only appears in development and
confuses everyone.

### Skill 8 · Delete the preview buttons

Auth bypass buttons on the login screen will be visible during the demo. Whatever they were for,
they are now a liability.

---

# PART 8 · Hard rules — never do these

1. **Never invent an error message.** Curl the failure, use the server's meaning.
2. **Never reveal whether an email is registered** on forgot-password.
3. **Never redirect to an unvalidated `next`.**
4. **Never use a placeholder as a label.**
5. **Never omit `autoComplete`.**
6. **Never validate on keystroke.** Blur.
7. **Never clear a form on error** (passwords excepted).
8. **Never show a generic error for a specific, recoverable case** — unverified email, expired
   token, rate limit each get their own message and their own recovery action.
9. **Never trim an SRS-required field.** Both sets, complete.
10. **Never bury the farmer approval notice.**
11. **Never build a role selector from `<div onClick>`.**
12. **Never leave the login preview / quick-switch buttons in place.**
13. **Never fire a one-shot verification effect without a ref latch.**
14. **Never exceed one beet element per auth page**, and hide the header CTA on these pages.
15. **Never use a raw hex or raw px**, a gradient, a card shadow, `!important` or `:global`.
16. **Never add a dependency. Never touch buyer, vendor, admin, catalogue or the backend.**

---

# PART 9 · Definition of done

- [ ] All eleven failure cases curled; status, `error.code` and `error.message` recorded
- [ ] Real rate limits recorded for login, register, forgot, resend
- [ ] Both register request shapes curled and matched exactly
- [ ] All seven pages use `AuthCard`; each page's own CSS **under 60 lines** — report each
- [ ] Login: `next` honoured and **validated**; role-based fallback; unverified-email path with
      working Resend; suspended message; 429 message; network message
- [ ] Login preview / quick-switch buttons **removed** — grep clean
- [ ] Register: real radio group, `?role=farmer` preselected, choice mirrored in the URL
- [ ] Both SRS field sets complete, with `autoComplete` on every field
- [ ] Farmer approval notice above the submit button
- [ ] Live password rule checklist built from the **real** backend rules
- [ ] Post-registration behaviour matches what the server actually returns
- [ ] Duplicate email is a field-level error with a link to sign in
- [ ] Forgot: neutral message either way, Resend with a 60s cooldown
- [ ] Reset: no-token card, mismatch validation, **distinct expired-token message**
- [ ] Verify: all four states, ref-latched, route exists
- [ ] Unauthorized names the role and links to the right dashboard
- [ ] Not found links onward
- [ ] `layoutCheck()` **zero findings** on all seven pages at 360, 390, 768, 1024, 1440

---

# PART 10 · Verification gate

### Failure-path table — the foundation

Eleven rows: case, how produced, HTTP status, `error.code`, `error.message`, **and the exact UI
copy you show for it**. Plus the four rate limits.

### Register shapes

Both endpoints: the request body you send, the 201 response, and the field mapping.

### A1 build · A2 runtime

```bash
npm run build
npm run dev
```

**Private window.** Zero console errors on all seven pages.

### A3 / A4 / A7 and sizes

```bash
grep -rnE "#[0-9a-fA-F]{3,8}" src/pages/guest/Login.module.css src/pages/guest/Register.module.css src/pages/guest/ForgotPassword.module.css src/pages/guest/ResetPassword.module.css src/pages/guest/VerifyEmail.module.css src/pages/guest/Unauthorized.module.css src/pages/guest/NotFound.module.css
grep -rnE "linear-gradient|radial-gradient|backdrop-filter|!important|:global" src/pages/guest/*.module.css
grep -rn "color-primary\|color-beet" src/pages/guest/Login.module.css src/pages/guest/Register.module.css
wc -l src/pages/guest/Login.* src/pages/guest/Register.* src/pages/guest/ForgotPassword.* src/pages/guest/ResetPassword.* src/pages/guest/VerifyEmail.* src/pages/guest/Unauthorized.* src/pages/guest/NotFound.*
```

Before → after for all fourteen files. One beet element per page.

### Preview buttons gone

```bash
grep -rniE "continue as|quick.?switch|preview.?(customer|farmer|admin)" src/pages/guest/Login.jsx src/
```

Must be empty.

### The `next` contract

| `next` value | Expected | Result |
|---|---|---|
| `/products/abc` | redirect there after sign-in | |
| *(absent)* | role dashboard | |
| `//evil.com` | **rejected**, role dashboard | |
| `https://evil.com` | **rejected**, role dashboard | |
| `/buyer/basket` | redirect there | |

### The `role=farmer` contract

Open `/register?role=farmer` from Home's farmer CTA. Confirm the Farmer card is preselected and
the farmer field set is shown. Then switch roles and confirm the URL updates and a refresh keeps
the choice.

### Every login failure path

| Case | UI shown | Recovery offered | Result |
|---|---|---|---|
| wrong password · unknown email · unverified email · suspended · 429 · network down |

Unverified: click **Resend verification** and confirm the request fires and a confirmation shows.

### Registration round trip — both roles

**Customer:** register a fresh account. Paste the request body and response. Then sign in with
it. Then confirm the account appears in `/admin/people` → Customers.

**Farmer:** register a fresh stall. Paste request and response. Confirm it appears in
`/admin/people` → Farmers with status **pending**. Then sign in as that farmer and confirm the
app reflects that they cannot list products yet.

**That admin cross-check is the proof the whole flow works end to end.**

### Password reset round trip

1. Request a reset for a seeded account; paste the response
2. Get the token — from the email, the server log, or the database; say which
3. Open `/reset-password?token=…`, set a new password, paste the response
4. **Sign in with the new password**
5. Reuse the same token: confirm the **expired/used** message, not a generic error
6. Open `/reset-password` with no token: confirm the error card, no form

### Email verification

All four states, each with a screenshot or description: verifying, success, expired, already
verified. Plus: confirm the POST fires **once** in dev (StrictMode) — paste the request count.

### Forgot-password leak check

Submit a **registered** email and an **unregistered** one. Paste both UI messages. **They must be
identical.** Also paste both server responses and note whether the backend distinguishes them.

### Form accessibility

For Login and Register: every input has a `<label>` (paste the accessibility tree for one form),
`aria-invalid` and `aria-describedby` wire up on error, the error region is `role="alert"`, the
password toggle has `aria-pressed`, and the role selector is arrow-key navigable.

### B1 · Responsive sweep

At **360, 390, 768, 1024, 1440** on all seven pages:

```js
const { layoutCheck } = await import('/src/dev/layoutCheck.js');
console.table(layoutCheck());
```

**Zero findings, thirty-five tables.** Register at 360 with seven fields is the likely failure.

### B4 · Keyboard

Complete a **full registration with no mouse**, both roles. Describe the key path. Every form
submits on Enter. Password toggles reachable.

### Tests

```bash
node tests/run_all.mjs
```

All suites pass. `tests/02_auth.mjs` covers these — update selectors, never weaken assertions.

---

# PART 11 · Report

```
Stage G4 status: PASS | FAIL

## Failure-path table (11 rows)
| case | status | error.code | error.message | UI copy shown |

## Rate limits
| route | limit |

## Register shapes
| role | request body | response |

## Line counts
| file | before | after |   (14 files)

## Gate results
A1 build / A2 runtime:  <output>
A3 / A4 / A7 + sizes:   <output, one beet per page>
Preview buttons gone:   <grep>
next contract:          <5-row table>
role=farmer contract:   <result>
Login failure paths:    <6-row table>
Customer round trip:    <request, response, sign-in, admin cross-check>
Farmer round trip:      <request, response, pending in admin, cannot list>
Password reset:         <6 steps, incl. token reuse>
Email verification:     <4 states + POST fires once>
Forgot leak check:      <both messages identical? backend behaviour>
Form a11y:              <accessibility tree + 5 checks>
B1 layoutCheck:         <35 tables>
B4 keyboard:            <mouse-free registration, both roles>
Tests:                  <summary>

## Backend findings
- Does registration return a session?              <yes/no>
- Does reset-password sign the user in?            <yes/no>
- Does forgot-password distinguish unknown emails? <yes/no — UI hides it either way>
- Real password rules:                             <list, and where found>
- Is there a /verify-email route in AppRoutes?     <existed / added>

## Found but not fixed
- <file:line>

## NOT verified
- <what and why>
```

Fix and re-run any failing gate. An unvalidated `next`, a forgot-password that leaks account
existence, a generic error where the server gave a specific one, or a surviving preview button
is a **FAIL**.
