# MarketLink Backend

> Fast, pure JavaScript (ES modules) backend powered by the native MongoDB driver and Express 5.  
> Adheres strictly to raw queries, explicit indexes, zero ODMs/ORMs, and comprehensive security hardening.

---

## 1. Prerequisites

- **Node.js**: `v20 LTS` or newer (tested on `v24.12.0`).
- **npm**: `v10` or newer.
- **MongoDB**: Local Community Server `v6.0+` or MongoDB Atlas cluster.

---

## 2. Starting MongoDB

### Option A: Local MongoDB Community Server

#### Windows (PowerShell as Administrator)
```powershell
# Verify service status
Get-Service MongoDB

# If stopped, start the service
Start-Service MongoDB

# Or run mongod directly if not installed as service
mongod --dbpath "C:\data\db"
```

#### macOS (Homebrew)
```bash
# Start MongoDB service
brew services start mongodb-community

# Or run directly in foreground
mongod --config /usr/local/etc/mongod.conf
```

#### Linux (systemd / Ubuntu / Debian)
```bash
# Start MongoDB service
sudo systemctl start mongod

# Enable on boot and check status
sudo systemctl enable mongod
sudo systemctl status mongod
```

### Option B: MongoDB Atlas (Cloud)
1. Create a free cluster on [cloud.mongodb.com](https://cloud.mongodb.com).
2. Obtain your connection string: `mongodb+srv://<username>:<password>@cluster0.mongodb.net/marketlink?retryWrites=true&w=majority`.
3. Set `MONGODB_URI` in your `.env` file.

---

## 3. Installation & Setup

```bash
# 1. Enter the backend directory
cd backend

# 2. Install dependencies (strictly 10 approved packages)
npm install

# 3. Create .env configuration
cp .env.example .env
```

Review and adjust variables in `.env` if using a custom MongoDB connection or ports.

---

## 4. Database Seeding & Indexes

```bash
# 1. Populate full database with realistic mock data & compute aggregates
npm run seed

# 2. Verify or recreate all database indexes idempotently
npm run indexes
```

> **Note**: `npm run seed` refuses to run if `NODE_ENV=production` unless passed `--force`.

---

## 5. Running the Backend

```bash
# Development mode (with native Node file watcher)
npm run dev

# Production startup
npm start
```

The API will listen on `http://localhost:4000/api`.  
Health check endpoint: `http://localhost:4000/api/health`.

---

## 6. Testing & Quality Assurance Gates

MarketLink implements an 8-gate testing and hardening model:

```bash
# Gate 1: Route manifest parity & contract freeze (134 endpoints)
node --test tests/routes-manifest.test.js

# Gate 2: Full security & IDOR test suite (35 tests covering OWASP API Top 10)
node --test tests/security-full.test.js

# Gate 3: 19-step end-to-end product lifecycle scenario from minimal seed
node --test tests/e2e-flow.test.js

# Gate 4: Data invariant checker (12 platform invariants, assert 0 drift)
node scripts/verify-data.js
# Optionally repair drift automatically:
node scripts/verify-data.js --fix

# Gate 5: Query performance profiler (0 COLLSCANs across critical queries)
node scripts/profile-report.js

# Gate 6: Operational smoke test against running server (39 steps)
npm run smoke                 # Windows PowerShell
bash scripts/smoke.sh         # Linux / macOS Bash

# Gate 7: Complete automated test regression
npm test

# Gate 8: Dependency security vulnerability audit
npm audit
```

For the full test gate specifications, see [docs/TESTING.md](docs/TESTING.md).

---

## 7. Performance & High-Throughput Load Testing

MarketLink provides a standalone HTTP load generator with connection keep-alive pooling and automated query explain analysis:

```bash
# 1. Run all load test scenarios (20 concurrent workers, 10s per scenario)
npm run loadtest

# 2. Run high-concurrency mixed traffic benchmark (50 workers, 30s)
node scripts/loadtest.js --concurrency 50 --duration 30 --scenario mixed

# 3. Seed large volume dataset for stress profiling
npm run seed:large

# 4. Generate query executionStats and index audit report
npm run profile:report
```

For detailed latency budgets, query budgets (3-query quote budget), and profiler results, see [docs/PERFORMANCE.md](docs/PERFORMANCE.md).

---

## 8. Backup & Operational Scripts

```bash
# 1. Export sanitized JSON collections (excluding passwords, tokens, sessions)
npm run export:json

# 2. Re-create all compound, unique, 2dsphere, and text indexes
npm run indexes

# 3. Test storage drivers (Cloudinary, local, memory)
npm run test:storage

# 4. Media upload garbage collection (purges unattached uploads older than 24h)
npm run jobs:media

# 5. One-way migration from local disk to Cloudinary
npm run migrate:uploads
```

For production deployment procedures, health checks, and zero-downtime runbooks, see [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

---

## 9. Demo Credentials

The database seed provides pre-configured credentials for all roles:

| Role | Email | Password | Status / Purpose |
|---|---|---|---|
| **Customer** | `george@example.com` | `market123` | Active customer with pre-orders and favorites |
| **Customer (Inactive)** | `inactive.customer@example.com` | `market123` | Tests 403 `ACCOUNT_INACTIVE` rule |
| **Farmer (Active)** | `riverbend@example.com` | `market123` | Active vendor at Elm Street Market |
| **Farmer (Pending)** | `pending.farmer@example.com` | `market123` | Awaiting admin inspection approval |
| **Farmer (Suspended)** | `suspended.farmer@example.com` | `market123` | Tests 403 `ACCOUNT_SUSPENDED` rule |
| **Admin** | `admin@marketlink.test` | `Admin12345` | System administrator |

---

## 10. Platform Documentation Index

All architectural specifications and operational reports are located in `docs/`:

- [docs/API.md](docs/API.md): Complete OpenAPI-style reference for all 134 registered endpoints with request/response schemas.
- [docs/SECURITY.md](docs/SECURITY.md): Threat model, multi-tenancy boundaries, and OWASP API Top 10 automated test evidence.
- [docs/PERFORMANCE.md](docs/PERFORMANCE.md): Latency profiles, query budgets, profiler findings, and load test analysis.
- [docs/DATABASE.md](docs/DATABASE.md): Collection schemas, 102 managed indexes, and denormalization synchronization matrix.
- [docs/TESTING.md](docs/TESTING.md): Testing Gate quality assurance guide and execution instructions.
- [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md): Production deployment runbook, environment variables, health checks, and backup/restore.

---

## 11. Troubleshooting

### Port 4000 already in use
```powershell
# Windows:
Get-NetTCPConnection -LocalPort 4000
```
Update `PORT` in `.env` to another available port (e.g. `4005`).

### MongoDB connection failure (`ECONNREFUSED` / `ECONNRESET`)
Ensure the MongoDB service is running locally or that your current IP address is whitelisted in MongoDB Atlas Network Access.

### Tests fail with rate limiting (`RATE_LIMITED`)
Ensure `RATE_LIMIT_DISABLED=true` in test executions (already configured by default in `tests/helpers.js`). Dedicated rate limit tests enable limits explicitly.
