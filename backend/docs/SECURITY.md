# MarketLink Security Architecture & Hardening Guide (Stage 5)

This document provides technical reference notes, threat mitigations, and compliance evidence for the MarketLink backend platform across the **OWASP API Security Top 10** and defense-in-depth security standards.

Automated verification is implemented in `tests/security-full.test.js`, running against the native MongoDB engine and Express 5 HTTP pipeline.

---

## 1. Threat Model & Security Architecture

MarketLink operates a multi-tenant pre-order marketplace connecting three primary personas:
- **Customers**: Pre-order produce for weekend pickup, manage favorites, receive notifications, and submit verified reviews.
- **Farmers**: Manage stall inventory, operating days, pickup time windows, order fulfillments, and public review replies.
- **Administrators**: Review stall applications, moderate flagged content, configure taxonomy, manage markets, and inspect financial metrics.

### Core Security Tenets
1. **Zero-Trust Multi-Tenancy**: Data scoping is strictly enforced at the database query level using authenticated identity tokens (`req.user.id`).
2. **Server-Authoritative Business Logic**: The server re-fetches and calculates all prices, inventory, and totals from catalog sources; client prices are completely ignored.
3. **No Dynamic Execution**: MongoDB native driver only—no Mongoose hooks, no ORM query generation, no `$where` JavaScript evaluation.
4. **Declarative Surface Exposure**: All 134 endpoints are registered in a declarative table (`src/utils/defineRoutes.js`) with explicit RBAC, rate-limiting, and validation schemas.

---

## 2. OWASP API Security Verification Matrix

### 2.1 Broken Object-Level Authorization (IDOR)
* **Risk**: Malicious users modifying resource IDs in URLs (`:id`) to read, tamper with, or delete data belonging to other tenants.
* **Mitigation**:
  - All resource queries scope on the caller's tenant identifier (`{ _id: toObjectId(id), customerId: req.user.id }` or `{ _id: toObjectId(id), farmerId: req.farmer._id }`).
  - Inexistent or unowned resources always return `404 NOT_FOUND` (never `403 FORBIDDEN` for IDOR attempts) to prevent ID enumeration and existence oracle attacks.
  - Role-based route guards (`requireRole`) intercept cross-persona access with `403 FORBIDDEN`.
* **Automated Proof**: `tests/security-full.test.js` (`T5.SEC.001` - `T5.SEC.010`) dynamically introspects all `:id` routes from `getRouteManifest()` and asserts strict isolation.

### 2.2 Broken Authentication & Account Lockout
* **Risk**: Credential stuffing, brute-force attacks, token tampering, and stolen sessions.
* **Mitigation**:
  - **Access Tokens**: Short-lived (15-minute) HS256 JWT tokens containing `sub` (userId) and `role`. Verified using constant-time crypto comparison. Unsigned tokens (`alg: 'none'`), altered signatures, and expired tokens are rejected with `401 UNAUTHENTICATED` or `TOKEN_EXPIRED`.
  - **Refresh Tokens**: High-entropy 48-byte cryptographically secure random tokens (`generateRandomToken`). Hashed with SHA-256 before database persistence. Stored in `httpOnly`, `SameSite: Lax` cookies. Rotated upon every refresh.
  - **Theft Detection & Invalidation**: If an already-rotated refresh token is presented, the system evicts all active sessions for that user immediately (`REFRESH_REUSE_DETECTED`).
  - **Account Lockout**: After 5 consecutive failed logins for an email within 15 minutes, the account is locked for 15 minutes, returning `429 TOO_MANY_ATTEMPTS`. Password comparison uses dummy bcrypt hashes on non-existent accounts to equalize response timing and eliminate user enumeration.
* **Automated Proof**: `T5.SEC.011` - `T5.SEC.015`.

### 2.3 Excessive Data Exposure & Response Sanitization
* **Risk**: Internal system state, database keys, or credential hashes leaking in API payloads.
* **Mitigation**:
  - Native MongoDB queries utilize explicit projections (`projection: { passwordHash: 0, tokenHash: 0 }`).
  - DTO transformation mappers (`toApi`, `toProductCard`, `toOrderSummary`) project internal `_id` to string `id` and strip private metadata.
  - Financial amounts are strictly serialized as integer cents; dates are serialized as ISO 8601 UTC strings.
* **Automated Proof**: `tests/routes-manifest.test.js` (`T5.005` - `T5.007`).

### 2.4 Mass Assignment & Parameter Tampering
* **Risk**: Attackers appending privileged fields (`role: 'admin'`, `status: 'active'`, `ratingSum: 9999`) to registration or update payloads.
* **Mitigation**:
  - `rejectUnknownFields` is enforced on every write route. Unknown or disallowed properties trigger `422 VALIDATION_FAILED`.
  - Sensitive lifecycle fields (`status`, `listingEnabled`, `ratingAvg`, `salesCount`) cannot be modified via consumer update routes; they are mutated strictly via administrative or state-machine actions.
* **Automated Proof**: `T5.SEC.016` - `T5.SEC.019`.

### 2.5 Rate Limiting & Resource Consumption
* **Risk**: Denial of Service (DoS), brute-force password cracking, and scraping.
* **Mitigation**:
  - Tiered rate limiters implemented via `express-rate-limit`:
    - **Global**: 1,000 requests per 15 minutes.
    - **Auth (Login/Register)**: 20 attempts per 15 minutes.
    - **Checkout**: 15 requests per 15 minutes.
    - **Uploads**: 30 uploads per 15 minutes.
    - **Reports/Exports**: 10 CSV streaming requests per 15 minutes.
    - **Assistant/AI**: 30 messages per 15 minutes.
* **Automated Proof**: `T5.SEC.026` & `tests/security3.test.js`.

### 2.6 Injection & Payload Sanitization
* **Risk**: NoSQL operator injection (`$ne`, `$gt`, `$where`), prototype pollution, ReDoS regex bombs, and CSV formula injection.
* **Mitigation**:
  - **NoSQL Operators**: `sanitize` middleware recursively inspects `req.body`, `req.query`, and `req.params`, immediately rejecting keys starting with `$` or containing `.`.
  - **Prototype Pollution**: Keys matching `__proto__`, `constructor`, or `prototype` are rejected with `400 Bad Request`.
  - **Nesting Depth**: Payloads exceeding 10 levels of object nesting are blocked.
  - **Null Bytes**: String inputs containing `\0` are rejected.
  - **ReDoS Defense**: All user-supplied search strings in regex queries are escaped using prefix escaping (`escapeForPrefix`) or text indices.
  - **CSV Formula Injection**: CSV exports escape leading formula characters (`=`, `+`, `-`, `@`) with prepended single quotes.
* **Automated Proof**: `T5.SEC.020` - `T5.SEC.025`.

### 2.7 Security Misconfiguration
* **Risk**: Missing security headers, technology fingerprinting, debug stack trace leakage, and loose CORS.
* **Mitigation**:
  - **Helmet**: Enforces `Content-Security-Policy`, `X-Content-Type-Options: nosniff`, and `X-Frame-Options: SAMEORIGIN`.
  - **Information Disclosure**: `app.disable('x-powered-by')` removes server headers.
  - **Error Concealment**: Centralized error middleware formats all errors as JSON with generic messages; stack traces are suppressed in all environments.
  - **Strict CORS**: Origin allow-list (`env.CORS_ORIGINS`) with credential support; wildcard origins (`*`) are disallowed when credentials are true.
  - **Correlation ID**: Every incoming request is stamped with an `X-Request-Id` UUID, returned in response headers and tied to all log lines.
* **Automated Proof**: `T5.SEC.027` - `T5.SEC.030`.

### 2.8 Business Logic Abuse
* **Risk**: Replaying checkouts, ordering negative quantities, tampering with pricing, or submitting fake reviews.
* **Mitigation**:
  - **Price Integrity**: All line totals and order totals are computed server-side from active catalog documents.
  - **Inventory Locking**: Checkout decrements stock atomically using `{ quantityAvailable: { $gte: qty } }`.
  - **Idempotency**: Checkouts require an `Idempotency-Key` header with replay detection.
  - **Review Gating**: Reviews require a verified, completed order owned by the reviewer (`reviewed: false`). Duplicate reviews return `409 ALREADY_REVIEWED`.
* **Automated Proof**: `T5.SEC.031` - `T5.SEC.035`.

---

## 3. Operational Security Checklist

- [x] All 134 API routes documented in `docs/API.md` and verified with automated drift testing.
- [x] Zero usage of `Mongoose` or ORMs; all queries use native MongoDB driver with projection and indexed filters.
- [x] Database outage mapped cleanly to `503 SERVICE_UNAVAILABLE`.
- [x] Database credentials and secrets excluded from version control (`.env.example` reference provided).
- [x] Sensitive parameters (`password`, `token`, `secret`) redacted in request logging.
- [x] Database export script (`npm run export:json`) strips all password hashes, token hashes, and active sessions.
- [x] `npm audit` reviewed with zero critical/high vulnerabilities in production dependencies.
