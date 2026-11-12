# Sweety — Blood Glucose Tracker

Sweety is a full-stack web application designed for personal blood glucose tracking, monitoring, and reporting. It allows users to record daily blood sugar measurements across four standardized meal intervals, enforces input validation to prevent duplicate or conflicting entries, provides historical trend filtering, and generates automated daily, month-to-date, and previous-month summary statistics.

[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D18.18-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![Express](https://img.shields.io/badge/Express-5-000000?logo=express&logoColor=white)](https://expressjs.com)
[![Prisma](https://img.shields.io/badge/Prisma-5-2D3748?logo=prisma&logoColor=white)](https://www.prisma.io)
[![Tests](https://img.shields.io/badge/Tests-134%20passed-brightgreen)](server/tests)
[![License: ISC](https://img.shields.io/badge/Server%20License-ISC-blue.svg)](server/package.json)

---

## Screenshots

| Landing Page | Populated Dashboard |
|:---:|:---:|
| ![Landing Page](screenshots/01_landing_page.png) | ![Dashboard](screenshots/06_dashboard_populated.png) |
| **Reading History** | **Summary Reports** |
| ![Reading History](screenshots/07_reading_history_table.png) | ![Reports](screenshots/10_reports_month_to_date.png) |

*Additional interface screenshots (modals, validation states, profile settings) are available in the [`screenshots/`](screenshots/) directory.*

---

## Features

- **Authentication & User Management:** User registration and login powered by JSON Web Tokens (JWT), 12-round bcrypt password hashing, account profile updates, and password changes.
- **Reading Management:** Full CRUD operations for blood glucose records with strict authenticated user scoping.
- **Four Daily Measurement Slots:** Predefined intervals for `MORNING` (fasting), `AFTER_BREAKFAST`, `AFTER_LUNCH`, and `AFTER_DINNER`.
- **Validation Guardrails:** Enforces integer readings between 40 and 600 mg/dL, rejects future calendar dates, enforces slot uniqueness (maximum 1 reading per slot per day), and limits daily entries to 4 per user.
- **History & Filtering:** Sortable reading history table with date range filtering (`startDate` to `endDate`), slot filters, and pagination.
- **Automated Summary Reports:** Calculates highest, lowest, and 1-decimal rounded average glucose metrics for Daily, Month-to-Date (MTD), and Previous Full Month intervals (with leap-year and cross-year support).
- **Responsive Interface & Theming:** Modern responsive design with Light, Dark, and System theme preferences persisted in `localStorage`.

---

## Technology Stack

| Layer | Technologies | Key Packages |
|---|---|---|
| **Frontend** | React 19, Vite 8, Tailwind CSS v4 | `react`, `react-router-dom`, `axios`, `lucide-react` |
| **Backend** | Node.js (>= 18.18), Express 5 | `express`, `bcryptjs`, `jsonwebtoken`, `cors`, `dotenv` |
| **Database & ORM** | PostgreSQL 15+ (or Neon Serverless), Prisma 5 | `@prisma/client`, `prisma` |
| **Testing** | Node.js Native Test Runner | `node:test`, `node:assert/strict` (134 tests) |
| **Code Quality** | ESLint 10 | `eslint`, `eslint-plugin-react-hooks` |

---

## Architecture

```text
sweety-glucose-tracker/
├── client/                     # Frontend SPA (React 19, Vite, Tailwind CSS v4)
│   ├── src/
│   │   ├── api/                # Axios instance with auth interceptor
│   │   ├── components/         # Modals, layout controls, theme toggle
│   │   ├── context/            # Auth and Theme React context providers
│   │   └── pages/              # Landing, Dashboard, History, Reports, Settings
│   └── package.json
├── server/                     # Backend REST API (Express 5, Prisma ORM)
│   ├── prisma/                 # Schema, migrations, and seed script
│   ├── src/
│   │   ├── config/             # Prisma client singleton
│   │   ├── controllers/        # Auth, reading, and report controllers
│   │   ├── middleware/         # JWT verification, sliding-window rate limiter
│   │   ├── routes/             # Express route declarations
│   │   └── utils/              # Pure validation, JWT, and report calculations
│   ├── tests/                  # Unit and integration test suites (134 tests)
│   └── package.json
├── docs/                       # Technical documentation (API.md, DEVELOPMENT.md)
├── screenshots/                # Application screenshots (13 images)
└── README.md
```

---

## Getting Started

### Prerequisites

- **Node.js:** `>= 18.18.0` (v20+ or v22+ LTS recommended)
- **npm:** `>= 9.0.0`
- **PostgreSQL:** Local PostgreSQL 15+ instance or a cloud database such as [Neon](https://neon.tech)

### 1. Project Directory

Open a terminal and navigate to the project root directory:

```bash
cd sweety-glucose-tracker
```

### 2. Backend Setup

In your first terminal, navigate to the `server` directory and install dependencies:

```bash
cd server
npm install
```

Create the environment file:

```bash
# macOS / Linux
cp .env.example .env

# Windows PowerShell
Copy-Item .env.example .env
```

Open `server/.env` and configure your `DATABASE_URL` and a secure `JWT_SECRET`. Then initialize the database:

```bash
# Generate Prisma Client
npx prisma generate

# Apply migrations
npx prisma migrate deploy

# (Optional) Seed demo user and sample readings
npm run seed

# Start the backend server
npm run dev
```

The backend server will run at `http://localhost:5000`.

### 3. Frontend Setup

In a second terminal, navigate to the `client` directory and install dependencies:

```bash
cd client
npm install
```

Create the frontend environment file:

```bash
# macOS / Linux
cp .env.example .env

# Windows PowerShell
Copy-Item .env.example .env
```

Start the Vite development server:

```bash
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## Environment Variables

### Backend (`server/.env`)

| Variable | Description | Default / Example |
|---|---|---|
| `PORT` | HTTP server listening port | `5000` |
| `DATABASE_URL` | PostgreSQL connection URL (supports Neon pooler) | `postgresql://USER:PASSWORD@HOST:5432/DB?sslmode=require` |
| `JWT_SECRET` | Secret key for signing JSON Web Tokens | Long cryptographically random string |
| `JWT_EXPIRES_IN` | Token expiration duration (optional) | `1d` |
| `CLIENT_ORIGIN` | Allowed CORS origin for frontend client (optional) | `http://localhost:5173` |

### Frontend (`client/.env`)

| Variable | Description | Default / Example |
|---|---|---|
| `VITE_API_BASE_URL` | Root URL of backend API service | `http://localhost:5000` |

*Note: Environment files containing actual credentials must remain untracked in version control.*

---

## Demo Account

When populated using `npm run seed`, the database contains a pre-configured demonstration account:

| Field | Value |
|---|---|
| **Email** | `demo@sweety.local` |
| **Password** | `SweetyDemo@2026` |
| **Sample Data** | 8 readings across 3 recent calendar days |

> **Notice:** These credentials are for local development and demonstration only. Do not use them in production.

---

## API Overview

The backend exposes a JSON REST API. Protected routes require a Bearer token in the `Authorization` header. Sensitive auth routes are protected by a sliding-window rate limiter (30 attempts per 15 minutes). The request payload limit is `100kb`.

### Authentication Endpoints (`/api/auth`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register a new user account (rate-limited) | No |
| `POST` | `/api/auth/login` | Authenticate user and receive JWT (rate-limited) | No |
| `GET` | `/api/auth/me` | Retrieve profile of authenticated user | Yes |
| `PUT` | `/api/auth/profile` | Update user name and email | Yes |
| `PUT` | `/api/auth/change-password` | Verify current password and set new password | Yes |

### Glucose Readings Endpoints (`/api/readings`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/readings` | List readings (supports `date`, `startDate`, `endDate`, pagination) | Yes |
| `POST` | `/api/readings` | Create a reading (`date`, `slot`, `value`) | Yes |
| `GET` | `/api/readings/:id` | Retrieve a reading by UUID (scoped to user) | Yes |
| `PUT` | `/api/readings/:id` | Update an existing reading | Yes |
| `DELETE` | `/api/readings/:id` | Delete a reading | Yes |

### Reports Endpoints (`/api/reports`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/reports/daily` | Daily stats (`highest`, `lowest`, `average`, `count`) | Yes |
| `GET` | `/api/reports/month-to-date` | Aggregates readings from day 1 to selected date | Yes |
| `GET` | `/api/reports/previous-month` | Full calendar month analytics immediately prior | Yes |

### Health Checks
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/` | API status check | No |
| `GET` | `/api/health/db` | Database connectivity probe (`SELECT 1`) | No |

*Detailed request/response schemas, validation rules, and error payloads are documented in [`docs/API.md`](docs/API.md).*

---

## Testing

The project includes an automated test suite written using the Node.js native test runner (`node:test` and `node:assert/strict`):

```bash
cd server
npm test
```

### Verified Test Results

- **Total Tests:** 134 across 24 suites
- **Passed:** **134**
- **Failed:** **0**
- **Skipped:** **0**

*Note: The 38 integration tests require local loopback networking and an active database connection. In offline or restricted network sandboxes where loopback sockets or outbound database connections are blocked, these integration tests skip automatically with descriptive notices, resulting in 96 passed and 38 skipped.*

For full details on test architecture and test suites, see [`docs/DEVELOPMENT.md`](docs/DEVELOPMENT.md).

---

## Production Build

### Frontend Compilation & Quality Checks

```bash
cd client

# Run ESLint validation
npm run lint

# Build optimized production bundle
npm run build
```

The compiled assets are generated in `client/dist/`.

### Backend Production Startup

```bash
cd server
npm start
```

---

## Important Notice

Sweety is a software demonstration and personal tracking application developed for educational and portfolio purposes. It is **not** a certified medical device and does not provide clinical diagnosis, medical validation, or treatment recommendations. Always consult a qualified healthcare professional for medical guidance.

---

## License

- The backend service is licensed under the [ISC License](server/package.json).
- The client frontend application is marked private (`"private": true` in `client/package.json`).
