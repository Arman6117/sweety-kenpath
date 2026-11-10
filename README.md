# Sweety – Blood Glucose Tracker

Sweety is a full-stack blood glucose tracking application that helps users record their daily glucose readings and view daily and monthly reports.

Users can securely create an account, manage their glucose readings, and monitor their recorded values through a dashboard and reports.

## Features

### Authentication
- User registration and login.
- Password hashing using bcrypt.
- JWT-based authentication.
- Protected application routes.
- Profile and password management.

### Glucose Reading Management
- Add, view, edit, and delete glucose readings.
- Four daily reading slots:
  - Morning (Fasting)
  - After Breakfast
  - After Lunch
  - After Dinner
- Each reading is associated with its user and date.
- Prevents duplicate readings for the same slot and date.

### Validation
- Glucose value is required.
- Values must be integers between 40 and 600 mg/dL.
- Maximum of four readings per day.
- Future dates are not allowed.
- Duplicate slot entries are prevented.

### Reports
- Daily report for a selected date.
- Month-to-date report.
- Previous-month report.
- Highest, lowest, and average glucose values.
- Total number of readings.
- Empty states when no readings are available.

### Dashboard and Settings
- Dashboard with glucose summaries and visual chart.
- Reading history.
- Profile management.
- Password change functionality.

## Technology Stack

| Layer | Technologies |
|---|---|
| Frontend | React, Vite, Tailwind CSS |
| Backend | Node.js, Express.js |
| Database | PostgreSQL |
| ORM | Prisma |
| Authentication | JWT, bcryptjs |
| HTTP Client | Axios |
| Icons | Lucide React |

## Project Structure

```text
sweety-glucose-tracker/
│
├── client/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
│
├── server/
│   ├── prisma/
│   │   ├── migrations/
│   │   ├── schema.prisma
│   │   └── seed.js
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── routes/
│   │   └── server.js
│   ├── package.json
│   └── .env.example
│
├── .gitignore
└── README.md
```

## Prerequisites

Install the following before running the application:

- Node.js
- npm
- PostgreSQL
- Git

## Installation and Setup

### 1. Clone the repository

```bash
git clone https://github.com/Khushi-Bhaskar/sweety-glucose-tracker.git

cd sweety-glucose-tracker
```

### 2. Set up the PostgreSQL database

Create a PostgreSQL database named:

```sql
CREATE DATABASE sweety_db;
```

### 3. Configure the backend

Navigate to the server folder:

```bash
cd server
npm install
```

Create a `.env` file using `.env.example` as a reference.

Configure the following variables:

```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/sweety_db?schema=public"
JWT_SECRET="your_secure_random_secret"
PORT=5000
```

Replace the database username and password with your local PostgreSQL credentials. Use a strong, private JWT secret.

### 4. Apply database migrations

```bash
npx prisma generate
npx prisma migrate deploy
```

### 5. Insert demo data

```bash
npm run seed
```

The seed script creates a demo user and sample glucose readings.

**Demo account**

- Email: `demo@sweety.local`
- Password: `SweetyDemo@2026`

These credentials are for local demonstration only.

### 6. Start the backend

```bash
npm run dev
```

The backend runs at:

`http://localhost:5000`

API health check:

`http://localhost:5000/`

### 7. Configure the frontend

Open a second terminal and navigate to the client folder:

```bash
cd client
npm install
```

Create a `.env` file using `.env.example` as a reference:

```env
VITE_API_BASE_URL=http://localhost:5000
```

### 8. Start the frontend

```bash
npm run dev
```

Open the local URL displayed by Vite in your browser.

## API Endpoints

All protected endpoints require a JWT bearer token.

### Authentication

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register a user |
| POST | `/api/auth/login` | Log in |
| GET | `/api/auth/me` | Get current user |
| PUT | `/api/auth/profile` | Update profile |
| PUT | `/api/auth/change-password` | Change password |

### Glucose Readings

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/readings` | Get readings |
| GET | `/api/readings/:id` | Get a specific reading |
| POST | `/api/readings` | Add a reading |
| PUT | `/api/readings/:id` | Update a reading |
| DELETE | `/api/readings/:id` | Delete a reading |

### Reports

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/reports/daily?date=YYYY-MM-DD` | Daily report |
| GET | `/api/reports/month-to-date` | Current month up to today |
| GET | `/api/reports/previous-month` | Previous month's report |

## Running Frontend Checks

From the `client` directory:

```bash
npm run lint
npm run build
```

## Database Design

The application uses two main database models:

- **User:** Stores user details and securely hashed passwords.
- **Reading:** Stores glucose values, dates, and reading slots associated with a user.

A unique database constraint prevents a user from recording more than one reading for the same date and slot.

## Assumptions and Notes

- Glucose readings are stored in mg/dL.
- Each user can record a maximum of four readings per day.
- Each of the four reading slots can have only one entry per day.
- Users can access only their own readings.
- Daily reports use a selected date.
- Month-to-date reports cover the first day of the current month through the selected current date.
- Monthly reports cover the entire previous calendar month.
- The application is intended for recording and reviewing glucose measurements. It is not a substitute for professional medical advice or diagnosis.
- The demo account is intended for local testing and demonstration.

## Future Improvements

- Pagination for reading history.
- Additional data visualization and trends.
- Automated frontend and backend testing.
- Optional Docker-based deployment.
- Additional reporting and export capabilities.

## Author

**Khushi Bhaskar**

GitHub: [Khushi-Bhaskar](https://github.com/Khushi-Bhaskar)
