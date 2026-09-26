# MarketLink: Gmail SMTP Integration & Email Verification Architecture

**Date:** September 26, 2026  
**Author:** Senior Backend Engineering Team  
**Status:** Active & Implemented  

---

## 1. Verified Gmail SMTP & Nodemailer Facts (Section 0)

Research confirmed as of September 2026:

| Parameter | Specification | Details & Sources |
| :--- | :--- | :--- |
| **SMTP Host & Ports** | `smtp.gmail.com` <br> Port `587` (STARTTLS, `secure: false`) <br> Port `465` (Implicit TLS, `secure: true`) | Supported via Nodemailer `service: 'gmail'` shortcut or direct host configuration. *(Source: Google Support & Nodemailer Documentation)* |
| **Authentication Requirement** | 2-Step Verification + 16-character App Password (or OAuth2) | Standard Google account passwords and "Less Secure Apps" are permanently disabled. App Passwords must be generated at [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords). *(Source: Google Account Security Guidance)* |
| **Daily Sending Limits** | **500 recipients / rolling 24 hours** for free personal accounts | Google Workspace accounts permit up to 2,000 recipients/day. Gmail evaluates recipients on a rolling 24-hour window, not calendar days. *(Source: Google Workspace Admin & Gmail Sending Limits Help)* |
| **Per-Message Recipient Limits** | Up to 100 recipients per message over SMTP client sessions | Personal accounts using SMTP client sessions are capped at 100 recipients per message. MarketLink enforces single-recipient messages (`to: string`) to guarantee personalization and avoid recipient leaks. *(Source: Google SMTP Relay Limits)* |
| **Concurrency & Pooling** | `maxConnections: 3`, `maxMessages: 100`, `rateLimit: 5` msgs/sec | Nodemailer docs advise `pool: true` with strict concurrency limits. Gmail aggressively rate-limits or rejects multiple concurrent sessions with `432 4.3.2 Concurrent connections limit exceeded`. *(Source: Nodemailer SMTP Pool Guidance)* |

---

## 2. Daily Quota Guard Design

To protect demo accounts and production environments from hitting Google's 500-recipient daily block:
1. **Rolling 24-Hour Tracking:** The mailer queries the `emailLog` collection for successful sends in `[now - 24h, now]`. For high-throughput efficiency, an in-memory counter is updated on each send and reconciled with the database.
2. **Threshold Configuration:** Default threshold is `450` (configurable via `GMAIL_DAILY_LIMIT` in `.env`), reserving a safety margin of 50 messages below Google's 500/day wall.
3. **Priority Tiering:**
   - **Critical Tier (`verify-email`, `password-reset`):** Allowed up to 495 sends before a hard stop, ensuring users waiting on authentication or account recovery are never left stranded.
   - **Non-Critical Tier (`order-placed`, `order-ready`, `restock-alert`, `announcement`, etc.):** When the rolling count reaches `GMAIL_DAILY_LIMIT` (450), non-critical sends are skipped, logged in `emailLog` with status `'skipped_quota'`, and warned in server logs without disrupting API transactions.
4. **Error Mapping:**
   - `534-5.7.9` / `535-5.7.8` (Authentication error / bad credentials): Marked as misconfigured; logs a masked credential warning (`...xxxx`) and suppresses fruitless retries until server reboot.
   - `550-5.4.5` (Daily quota exceeded): Caught and immediately triggers the quota tripwire.
   - `421` / `450` / `ETIMEDOUT` / `ECONNRESET`: Retried once after a 2-second backoff using an alternate connection from the pool.

---

## 3. Email Verification Flow & Role Decisions

### 3.1 Unverified Accounts Policy
- **Customers:** Unverified customers **can browse, search, and place orders**. Locking customers out of ordering harms conversion; instead, a persistent-yet-quiet banner prompts them to verify their email address.
- **Farmers:** An unverified Farmer **cannot be approved by an Administrator**. The Stage 4 admin approval endpoint (`POST /api/admin/farmers/:id/approve`) verifies `user.emailVerified === true`. If unverified, it returns `409 Conflict` with error code `EMAIL_NOT_VERIFIED`. A farmer whose inbox cannot receive mail cannot fulfill order notifications or customer pickups.
- **Transactional Consistency:** Order confirmation and ready-for-pickup emails are dispatched even if an account is not yet verified. Verification serves as an identity and administrative trust signal, not a gate on order receipts.

### 3.2 Verification Protocol
1. **Registration:** `POST /api/auth/register/customer` and `POST /api/auth/register/farmer` generate a cryptographically random 32-byte token. The SHA-256 hash is persisted in `emailVerifications` (`expiresAt`: 24 hours, unique index on `tokenHash`, TTL index on `expiresAt`).
2. **Dispatch:** A branded verification email is dispatched asynchronously with link `${APP_BASE_URL}/verify-email?token=${rawToken}`. Registration responds `201 Created` immediately with `{ emailVerified: false }`.
3. **Verification Endpoint:** `POST /api/auth/verify-email` accepts `{ token }` (or `GET /api/auth/verify-email?token=...`). Atomically finds and marks the token used (`usedAt: now`), setting `users.emailVerified = true` and `users.emailVerifiedAt = now`.
4. **Resend Endpoint:** `POST /api/auth/resend-verification` accepts `{ email }` or Bearer token, rate-limited to 3 requests/hour per account. Invalidates prior unused tokens. If the account is already verified or non-existent, returns a generic success response to prevent account enumeration.

---

## 4. Full Migration Table (Call Sites → Tags → Templates)

| Call Site File | Function / Action | Email Tag | Template Function | Trigger Mechanism |
| :--- | :--- | :--- | :--- | :--- |
| `src/modules/auth/auth.routes.js` | Customer / Farmer Registration | `verify-email` | `verifyEmail(user, link)` | Inline best-effort on register |
| `src/modules/auth/auth.routes.js` | Password Reset Request | `password-reset` | `passwordReset(user, link)` | Inline on forgot-password |
| `src/modules/orders/checkout.service.js` | Order Placed (Customer) | `order-placed` | `orderPlaced(order)` | Fire-and-forget on checkout completion |
| `src/modules/orders/orderStateMachine.js` | Order Accepted | `order-accepted` | `orderAccepted(order)` | Dispatched via `createNotifications` |
| `src/modules/notifications/notify.js` | Order Ready for Pickup | `order-ready` | `orderReady(order)` | Dispatched via `createNotifications` |
| `src/modules/orders/orderStateMachine.js` | Order Completed | `order-completed` | `orderCompleted(order)` | Dispatched via `createNotifications` |
| `src/modules/orders/orderStateMachine.js` | Order Declined | `order-declined` | `orderDeclined(order, reason)` | Dispatched via `createNotifications` |
| `src/modules/orders/orderStateMachine.js` | Order Cancelled | `order-cancelled` | `orderCancelled(order, who)` | Dispatched via `createNotifications` |
| `src/modules/favorites/restock.js` | Product Restock Alert | `restock-alert` | `restockAlert(user, product)` | Dispatched via `createNotifications` |
| `src/modules/farmer/reviews/farmerReviews.service.js` | Farmer Reply to Review | `review-reply` | `reviewReply(user, farmerName, excerpt)` | Dispatched via `createNotifications` |
| `src/modules/admin/people/people.service.js` | Farmer Approved by Admin | `farmer-approved` | `farmerApproved(user)` | Dispatched via `createNotifications` / service |
| `src/modules/admin/people/people.service.js` | Farmer Suspended by Admin | `farmer-suspended` | `farmerSuspended(user, reason)` | Dispatched via `createNotifications` / service |
| `src/modules/admin/settings/announcementsAdmin.service.js` | Broadcast Announcement | `announcement` | `announcement(user, announcement)` | Pooled batched dispatch via `createNotifications` |
| `src/modules/contact/contact.routes.js` | Contact Form Ack | `contact-ack` | `contactAck({ name, email, topic, message })` | Fire-and-forget on contact submit |

---

## 5. Architectural Future-Proofing Note

> [!IMPORTANT]
> **If MarketLink ever needs to send more than ~450 emails/day or wants better deliverability/analytics, switch to a dedicated transactional email provider (Resend, Brevo, etc.) — the `sendMail`/template split in this codebase makes that a swap of `mailer.js` only, not a rewrite.**
