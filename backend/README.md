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

## 6. Running Tests & Smoke Verification

```bash
# Run all automated tests (node:test against marketlink_test database)
npm test

# Run manual smoke test against a running local server
# Windows (PowerShell):
npm run smoke

# Linux / macOS:
bash scripts/smoke.sh
```

---

## 7. Demo Credentials

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

## 8. Directory Layout

```
backend/
├─ package.json                   # ES module scripts & dependencies
├─ .env.example                   # Environment variable template
├─ .env                           # Local environment configuration
├─ .gitignore
├─ README.md                      # Developer runbook and operational guide
├─ docs/
│  ├─ DATABASE.md                 # Schema specs, indexes, and denormalization notes
│  └─ API.md                      # Endpoint reference with request/response examples
├─ scripts/
│  ├─ smoke.sh                    # Bash curl smoke test script
│  └─ smoke.ps1                   # Windows PowerShell smoke test script
├─ src/
│  ├─ server.js                   # MongoDB connection, listener, graceful shutdown
│  ├─ app.js                      # Express app pipeline, security middleware, routing
│  ├─ constants.js                # Single source of truth for enums and roles
│  ├─ config/
│  │  └─ env.js                   # Environment validation with fail-fast errors
│  ├─ db/
│  │  ├─ client.js                # MongoClient singleton & connection pooling
│  │  ├─ collections.js           # Collection schemas & $jsonSchema validators
│  │  ├─ indexes.js               # ensureIndexes() for all 16 collections
│  │  └─ seed.js                  # Database seed script with aggregate sync
│  ├─ middleware/
│  │  ├─ requestLogger.js         # Request logger with Server-Timing & slow warnings
│  │  ├─ sanitize.js              # NoSQL injection protection (blocks $ and .)
│  │  ├─ rateLimits.js            # express-rate-limit definitions
│  │  ├─ auth.js                  # requireAuth, requireRole, optionalAuth
│  │  ├─ notFound.js              # Standardized 404 JSON response
│  │  └─ errorHandler.js          # Central error formatter without stack leaks
│  ├─ modules/
│  │  ├─ health/                  # /health and /ready routes
│  │  ├─ auth/                    # Registration, login, refresh rotation, recovery
│  │  ├─ users/                   # Profile management and session revocation
│  │  └─ contact/                 # Guest inquiry submission
│  └─ utils/
│     ├─ validate.js              # Hand-written input validation helpers
│     ├─ tokens.js                # JWT signing & SHA-256 hashing
│     ├─ errors.js                # AppError class and static factories
│     ├─ ids.js                   # toObjectId and toApi transformation
│     ├─ mailer.js                # Development console email stub
│     └─ time.js                  # Dynamic date helpers relative to now
└─ tests/
   ├─ helpers.js                  # Test server harness on ephemeral port
   ├─ health.test.js              # Health, ready, and 404 tests
   ├─ auth.test.js                # Auth, registration, rotation, and recovery tests
   ├─ users.test.js               # Profile and password update tests
   ├─ contact.test.js             # Contact form and rate limit tests
   ├─ security.test.js            # RBAC guards, NoSQL injection, and header tests
   ├─ db.test.js                  # Schema, index, and explain() query plan checks
   └─ perf.test.js                # Latency SLA benchmarks against performance budget
```

---

## 9. Troubleshooting

### Port 4000 already in use
```bash
# Check what is listening on port 4000
# Windows:
Get-NetTCPConnection -LocalPort 4000
# Linux / macOS:
lsof -i :4000
```
Update `PORT` in `.env` to another available port (e.g. `4005`).

### MongoDB connection failure (`ECONNREFUSED`)
Ensure the MongoDB service is running (see Section 2). If using MongoDB Atlas, check your IP access list in Atlas Network Access.

### Tests fail with rate limiting (`RATE_LIMITED`)
Ensure `RATE_LIMIT_DISABLED=true` in test executions (already configured by default in `tests/helpers.js`). Dedicated rate limit tests will pass `x-enable-rate-limit: true` explicitly.
