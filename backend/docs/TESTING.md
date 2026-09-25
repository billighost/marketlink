# MarketLink Testing Gates & Quality Assurance Guide

## 1. Overview & Verification Strategy

MarketLink enforces a multi-tier **Testing Gate Model** before any release or deployment. The test suites are written using Node.js native test runner (`node:test`) and strict assertions (`node:assert/strict`) with zero external test runners or mock frameworks.

All tests execute against dedicated test databases (`marketlink_test`) protected by the mandatory Safety Guard (`src/db/safetyGuard.js`).

---

## 2. Testing Gates Summary

| Gate | Focus Area | Command | Acceptance Criteria | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Gate 1** | Route Contract & Manifest Freeze | `node --test tests/routes-manifest.test.js` | 134 registered endpoints exactly match `docs/API.md` (0 drift) | ✅ PASS |
| **Gate 2** | Full Security & IDOR Matrix | `node --test tests/security-full.test.js` | All 35 tests pass; multi-tenancy & IDOR boundaries enforced | ✅ PASS |
| **Gate 3** | End-to-End Scenario Flow | `node --test tests/e2e-flow.test.js` | 19-step complete product lifecycle from minimal seed passes | ✅ PASS |
| **Gate 4** | Data Invariant Verification | `node scripts/verify-data.js` | 0 drift across all 12 platform data integrity rules | ✅ PASS |
| **Gate 5** | Query Profiler & Index Auditor | `node scripts/profile-report.js` | 0 full collection scans (`COLLSCAN`) on critical query paths | ✅ PASS |
| **Gate 6** | Operational Smoke Test | `npm run smoke` / `bash scripts/smoke.sh` | All 39 smoke steps pass against running HTTP server | ✅ PASS |
| **Gate 7** | Full Test Regression Suite | `npm test` | All integration test suites run green | ✅ PASS |
| **Gate 8** | Dependency Security Audit | `npm audit` | 0 high/critical known vulnerabilities | ✅ PASS |

---

## 3. Step-by-Step Gate Instructions

### Gate 1: Route Contract & Manifest Parity
Verifies that all routes registered in the declarative route table (`src/utils/defineRoutes.js`) match `docs/API.md` line for line with no undocumented endpoints, rogue paths, or mismatched methods.
```bash
node --test tests/routes-manifest.test.js
```
*Verification*: All 7 test cases pass; `Manifest route count === Documentation route count === 134`.

---

### Gate 2: Full Security Test Suite
Covers the authoritative security matrix across 7 test suites:
1. **Dynamic IDOR Matrix**: Programmatically executes tenant boundary tests against all routes accepting `:id` parameters.
2. **Account Lockout & Brute-Force**: Verifies 5 failed attempts within 15 minutes trigger `429 TOO_MANY_ATTEMPTS` with countdown remaining.
3. **JWT Tampering**: Validates rejection of `alg: none`, invalid signatures, expired tokens, and malformed authorization headers.
4. **Cookie Security**: Verifies `HttpOnly`, `SameSite=Lax`, and `Path=/api/auth/refresh` on refresh tokens.
5. **Injection Defense**: Verifies immunity to raw Prototype Pollution (`__proto__`, `constructor`), NoSQL operator injection (`$gt`, `$ne`), and ReDoS regex escaping.
6. **Information Disclosure & Headers**: Verifies production stack trace concealment, mandatory `X-Request-Id` response header, and Helmet security headers (`X-Content-Type-Options: nosniff`).
7. **Business Logic & Edge Cases**: Rejects negative, zero, and fractional quantities, verifies idempotency keys, and blocks duplicate review submissions with `409 CONFLICT`.

```bash
node --test tests/security-full.test.js
```
*Verification*: 35/35 security tests pass green.

---

### Gate 3: End-to-End Product Lifecycle Scenario
Validates the complete multi-actor product and order flow from an empty database (minimal seed) through HTTP API only:
1. Admin signs in.
2. Admin creates market venue and product category.
3. New Farmer registers (status: `pending`).
4. Pending farmer product creation rejected with `403 FARMER_NOT_APPROVED`.
5. Admin approves farmer stall.
6. Farmer configures profile, creates products, applies weekly restock template.
7. Customer registers account.
8. Customer browses feed, searches catalog, adds favorites.
9. Customer obtains live quote and checks out with `Idempotency-Key`.
10. Farmer retrieves incoming orders, accepts, and marks ready.
11. Customer receives notification and verifies `ready` status.
12. Farmer marks order `completed` upon customer pickup.
13. Customer submits review with farmer rating and comment.
14. Farmer replies publicly to review.
15. Second customer flags review for moderation.
16. Admin resolves flag by removing review; ratings recompute immediately.
17. Admin inspects dashboard KPIs, report summaries, and exports orders CSV.
18. Admin suspends farmer; products are delisted from catalog immediately.
19. Automated Data Invariant Checker verifies 0 drift across all 12 platform rules.

```bash
node --test tests/e2e-flow.test.js
```
*Verification*: 19/19 scenario steps pass green.

---

### Gate 4: Data Invariant Verification
Audits the entire database against the 12 mathematical invariants:
```bash
# Audit only (read-only verification)
node scripts/verify-data.js

# Audit and automatically repair drift if detected
node scripts/verify-data.js --fix
```
The 12 Invariants:
1. No negative stock levels.
2. Product availability flag matches stock quantity and threshold.
3. Product listed status respects farmer listing, moderation, and archived state.
4. Order totals equal the sum of line items.
5. Order timeline status progression follows strict state transitions.
6. Order number uniqueness and sequence counter bounds (`ML-1001`+).
7. Order referential integrity (customerId and farmerId reference valid records).
8. Farmer review rating average and count match visible reviews.
9. Product review rating average and count match visible reviews.
10. Product completed sales count matches historical order lines.
11. Market `farmerCount` matches active listed farmers; farmer `categorySlugs` match active listed products.
12. Orphan records check (no dangling favorites, notifications, or invalid sessions).

*Verification*: Status `✓ PASS` and Drift Count `0` on all 12 invariants.

---

### Gate 5: Query Profiler & Index Auditor
Inspects database indexes and queries using `explain('executionStats')`:
```bash
node scripts/profile-report.js
```
*Verification*: 0 `COLLSCAN` stages detected; execution times under 25ms.

---

### Gate 6: Operational Smoke Verification
Executes smoke tests against a running backend instance:
```bash
# Windows PowerShell
npm run smoke

# Linux / macOS Bash
bash scripts/smoke.sh
```
*Verification*: All 39 steps complete with status `200`/`201`/`204` and exit code 0.

---

### Gate 7 & Gate 8: Full Regression & Audit
```bash
# Run the complete test suite
npm test

# Run dependency vulnerability audit
npm audit
```
*Verification*: Zero test failures, zero high/critical vulnerabilities.
