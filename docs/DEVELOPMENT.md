# Sweety Developer & Architecture Guide

In-depth technical reference for contributors, reviewers, and maintainers of the Sweety Glucose Tracker.

---

## 1. System Requirements & Prerequisites

- **Node.js:** `>= 18.18.0` (Node.js `20.x` LTS or `22.x` LTS recommended; tested and verified on Node.js `v24.12.0`).
- **npm:** `>= 9.0.0`
- **Database:** PostgreSQL `15+` or a hosted serverless PostgreSQL instance such as [Neon](https://neon.tech).
- **Operating System:** Windows, macOS, or Linux.

---

## 2. Architecture & File Structure

Sweety is organized as an uncoupled client-server repository with distinct frontend and backend package workspaces:

```text
sweety-glucose-tracker/
├── client/                               # Frontend Single Page Application (React 19 + Vite)
│   ├── public/                           # Static public assets
│   ├── src/
│   │   ├── api/
│   │   │   └── axios.js                  # Centralized Axios client with JWT auto-attachment & 401 interception
│   │   ├── assets/                       # UI SVG illustrations and logo components
│   │   ├── components/                   # Reusable UI widgets
│   │   │   ├── AddReadingModal.jsx       # Modal for logging new blood glucose reading
│   │   │   ├── EditReadingModal.jsx      # Modal for modifying an existing reading
│   │   │   ├── DeleteReadingModal.jsx    # Deletion confirmation modal
│   │   │   ├── HealthcareIllustration.jsx# Vector graphics for landing & dashboard
│   │   │   ├── Logo.jsx                  # Brand logo component
│   │   │   ├── NotificationPopover.jsx   # Header alert popover
│   │   │   ├── ProfileDropdown.jsx       # User profile actions & logout
│   │   │   ├── ProtectedRoute.jsx        # React Router auth route guard
│   │   │   └── ThemeToggle.jsx           # Light / Dark / System mode toggle
│   │   ├── context/
│   │   │   ├── AuthContext.jsx           # Global authentication state, login, register & token persistence
│   │   │   └── ThemeContext.jsx          # Theme state provider syncing to localStorage and DOM data-theme
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx             # Main dashboard view with stats, today's slots, and quick actions
│   │   │   ├── Landing.jsx               # Public landing page with feature overview
│   │   │   ├── Login.jsx                 # User authentication form
│   │   │   ├── ReadingHistory.jsx        # Tabular historical records with date filtering & pagination
│   │   │   ├── Reports.jsx               # Daily, Month-to-Date, and Prior Month reporting interface
│   │   │   ├── Settings.jsx              # Profile name, email update, and password change
│   │   │   └── Signup.jsx                # Account registration form
│   │   ├── App.jsx                       # Client route declarations and theme wrapping
│   │   ├── main.jsx                      # React 19 entry point
│   │   └── index.css                     # Tailwind CSS v4 styling rules
│   ├── .env.example                      # Frontend environment variable template
│   ├── package.json                      # Frontend scripts and dependencies
│   └── vite.config.js                    # Vite bundler configuration with Tailwind plugin
│
├── server/                               # Backend REST API Service (Express 5 + Prisma)
│   ├── prisma/
│   │   ├── migrations/                   # Tracked PostgreSQL migration files
│   │   ├── schema.prisma                 # Prisma schema definition (User & Reading models)
│   │   └── seed.js                       # Database seeder script for demo account and sample records
│   ├── src/
│   │   ├── app.js                        # Express app declaration with CORS, JSON body limit, routes & error handling
│   │   ├── server.js                     # HTTP server bootstrap binding to PORT
│   │   ├── config/
│   │   │   └── prisma.js                 # Shared singleton PrismaClient instance
│   │   ├── controllers/
│   │   │   ├── authController.js         # Register, login, profile update, and change-password controllers
│   │   │   ├── readingController.js      # CRUD operations, pagination, and multi-tenant scoping
│   │   │   └── reportController.js       # Daily, month-to-date, and previous-month report controllers
│   │   ├── middleware/
│   │   │   ├── authMiddleware.js         # JWT Bearer token verification and req.user attachment
│   │   │   └── rateLimiter.js            # Sliding-window IP rate limiter for authentication endpoints
│   │   ├── routes/
│   │   │   ├── authRoutes.js             # /api/auth route definitions
│   │   │   ├── readingRoutes.js          # /api/readings route definitions
│   │   │   └── reportRoutes.js           # /api/reports route definitions
│   │   └── utils/
│   │       ├── authValidation.js         # Pure validation functions for email, password, and credentials
│   │       ├── jwt.js                    # Pure JWT sign and verify wrapper
│   │       ├── readingValidation.js      # Pure validation for glucose values, slots, UUIDs, and dates
│   │       └── reportUtils.js            # Pure report math (highest, lowest, rounding) and calendar windows
│   ├── tests/                            # Node.js native test runner suite (134 tests)
│   │   ├── authIntegration.test.js       # End-to-end HTTP integration tests for auth
│   │   ├── authMiddleware.test.js        # Unit tests for JWT middleware behavior
│   │   ├── authSecurity.test.js          # Security tests (bcrypt 12 rounds, rate limiter)
│   │   ├── authValidation.test.js        # Unit tests for auth input validation rules
│   │   ├── readingCrudIntegration.test.js# End-to-end HTTP integration tests for readings
│   │   ├── readingCrudValidation.test.js # Unit tests for reading domain validation
│   │   ├── reportApiIntegration.test.js  # End-to-end HTTP integration tests for reports
│   │   └── reportUtils.test.js           # Unit tests for statistical math and leap-year ranges
│   ├── .env.example                      # Backend environment variable template
│   └── package.json                      # Backend scripts and dependencies
│
├── docs/                                 # Technical documentation
│   ├── API.md                            # Comprehensive REST API endpoint reference
│   └── DEVELOPMENT.md                    # This developer guide
├── screenshots/                          # 13 verified application screenshots
└── README.md                             # Primary project documentation
```

---

## 3. Database Architecture & Prisma ORM

### Schema Definition
Located at `server/prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum ReadingSlot {
  MORNING
  AFTER_BREAKFAST
  AFTER_LUNCH
  AFTER_DINNER
}

model User {
  id           String    @id @default(uuid()) @db.Uuid
  name         String
  email        String    @unique
  passwordHash String
  createdAt    DateTime  @default(now())
  readings     Reading[]
}

model Reading {
  id        String      @id @default(uuid()) @db.Uuid
  userId    String      @db.Uuid
  date      DateTime    @db.Date
  slot      ReadingSlot
  value     Int
  createdAt DateTime    @default(now())
  updatedAt DateTime    @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, date, slot])
  @@index([userId, date])
}
```

### Key Relational Guardrails
1. **Cascade Deletion:** `onDelete: Cascade` ensures that deleting a user account cleanly deletes all related readings without orphaned records.
2. **Composite Uniqueness:** `@@unique([userId, date, slot])` enforces at the database level that a user cannot record multiple measurements for the same meal interval on the same calendar day.
3. **Compound Index:** `@@index([userId, date])` optimizes performance for date filtering, history pagination, and report aggregation.

### Migration Commands
From the `server/` directory:

```bash
# Validate Prisma schema syntax
npx prisma validate

# Generate updated Prisma client bindings
npx prisma generate

# Apply existing migrations to database
npx prisma migrate deploy

# (For creating new schema migrations during development)
npx prisma migrate dev --name describe_migration_here
```

### Seeding Demonstration Data
The seed script (`server/prisma/seed.js`) hashes the password using 12 bcrypt salt rounds and provisions:
- **Email:** `demo@sweety.local`
- **Password:** `SweetyDemo@2026`
- **Name:** `Sweety Demo User`
- **Sample Readings:** 8 readings spread across the preceding 3 calendar days.

Execute seeding with:
```bash
cd server
npm run seed
```

---

## 4. Test Suite Architecture

Sweety uses the built-in Node.js native test runner (`node:test` and `node:assert/strict`) requiring no external testing dependencies like Jest or Mocha.

### Running the Test Suite
From the `server/` directory:

```bash
cd server
npm test
```

### Test Suite Inventory (134 Tests / 24 Suites)

The test suite is divided into two categories:

#### 1. Pure Unit, Validation & Security Suites (96 Tests)
These tests execute standalone in any environment with zero external dependencies:
- **`authValidation.test.js` (21 tests):** Email normalization, RFC 5322 regex checks, password length enforcement, and payload sanitization.
- **`authMiddleware.test.js` (9 tests):** Missing header rejection, malformed Bearer strings, tampered signatures, expired tokens, and `req.user.userId` attachment.
- **`authSecurity.test.js` (3 tests):** Verification of 12 bcrypt salt rounds, configurable JWT duration, and sliding-window rate limiter threshold headers.
- **`readingCrudValidation.test.js` (26 tests):** Glucose bounds (40–600 mg/dL), integer constraints (rejecting decimals), slot identifier validation, future date rejection, and UUID v4 validation.
- **`reportUtils.test.js` (24 tests):** Calculation of highest, lowest, and 1-decimal average, single-entry edge cases, empty states, Month-to-Date ranges, and Previous Month boundaries across non-leap years, leap years, and year-end transitions (January to December).
- **`reportSummary.test.js` / Reading validation unit tests (13 tests):** Additional boundary calculations and slot combinations.

#### 2. End-to-End HTTP Integration Suites (38 Tests)
These tests bind an ephemeral local HTTP server to `127.0.0.1:0` and execute real HTTP requests against the live database:
- **`authIntegration.test.js` (7 tests):** Input validation rejection, user registration, JWT issuance, password hash exclusion from payloads, duplicate email 409 conflict, invalid credential handling, and `/api/auth/me` protected retrieval.
- **`readingCrudIntegration.test.js` (22 tests):** Unauthenticated 401 rejection, input boundary enforcement, multi-slot daily entry, duplicate slot 409 rejection, 4-reading daily limit enforcement, multi-tenant isolation (User B receives 404 attempting to inspect, edit, or delete User A's readings), query filtering by date, and pagination.
- **`reportApiIntegration.test.js` (9 tests):** Token requirement, date query validation, future date rejection, live daily stats aggregation, empty-state response handling, month-to-date calculation, and prior month aggregation across year boundaries.

### Conditional Skip Mechanism
The integration suites check connectivity in their `before()` hooks:
1. **Loopback Probe:** Probes `fetch("http://127.0.0.1:<port>/")`.
2. **Database Probe:** Probes `prisma.$queryRaw\`SELECT 1\``.

If either check fails (such as in an offline development environment or a restricted sandbox with no loopback networking), integration tests skip with descriptive messages rather than generating false-positive network failures:
- **Live Connected Run:** 134 passed, 0 skipped, 0 failed.
- **Restricted / Offline Run:** 96 passed, 38 skipped, 0 failed.

---

## 5. Frontend Development & Code Quality

### Technology Stack
- **React 19 (`^19.3.1`):** Functional component architecture with hooks (`useState`, `useEffect`, `useCallback`, `useContext`).
- **Tailwind CSS v4 (`^4.3.5`):** Utility-first styling with dark mode theme support.
- **Vite 8 (`^8.3.6`):** Fast ES module dev server and build tool.
- **ESLint 10 (`^10.14.0`):** Enforcing React hooks rules and clean syntax.

### Code Quality Commands
From the `client/` directory:

```bash
cd client

# Check code quality and React hook rules
npm run lint

# Compile optimized production bundle
npm run build
```

---

## 6. Security & Invariant Checklist

When modifying or extending Sweety, maintain the following security invariants:
1. **Password Hashing:** Always use `bcrypt.hash(password, 12)` for hashing user passwords. Never log or return raw passwords or password hashes in API responses.
2. **Tenant Isolation:** Every reading query and mutation must include `where: { userId }` derived strictly from `req.user.userId`. Never accept `userId` from request body or query parameters.
3. **Integer Glucose Range:** Keep glucose validation bounded between 40 mg/dL and 600 mg/dL as whole numbers.
4. **Environment Isolation:** Ensure `.env` files are never tracked in Git. Keep credentials confined to local `.env` files.
