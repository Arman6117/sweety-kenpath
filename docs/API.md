# Sweety API Reference

Complete technical specification for the Sweety Glucose Tracker REST API.

All endpoints communicate via JSON (`Content-Type: application/json`). Protected routes require a Bearer token in the HTTP `Authorization` header.

```http
Authorization: Bearer <jwt_token>
```

---

## Global Policies

### Request Size Limit
The Express application enforces a strict `100kb` request payload body limit (`express.json({ limit: "100kb" })`). Larger payloads receive `HTTP 413 Payload Too Large`.

### Rate Limiting
Sensitive authentication routes (`/api/auth/register` and `/api/auth/login`) are protected by a sliding-window rate limiter:
- **Window:** 15 minutes (`900,000 ms`)
- **Quota:** 30 attempts per client IP
- **Response on Exceeded (HTTP 429):**
  ```json
  {
    "success": false,
    "message": "Too many authentication attempts. Please try again later."
  }
  ```
- **Standard Headers:**
  - `RateLimit-Limit`: Maximum requests permitted per window (30).
  - `RateLimit-Remaining`: Remaining requests in current window.
  - `RateLimit-Reset`: Seconds remaining until window reset.
  - `Retry-After`: Included when status is 429, indicating seconds to wait.

### CORS Origin Whitelisting
The server permits requests from `http://localhost:5173`, `http://127.0.0.1:5173`, and any origin specified in `CLIENT_ORIGIN`. Unauthorized origins receive `HTTP 403 Forbidden`.

---

## 1. Health Endpoints

### Root Service Check
- **Method:** `GET`
- **Path:** `/`
- **Auth:** None
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Sweety Glucose Tracker API is running!"
  }
  ```

### Database Probe
- **Method:** `GET`
- **Path:** `/api/health/db`
- **Auth:** None
- **Description:** Executes `SELECT 1` through Prisma against the active PostgreSQL database.
- **Success Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Database connected successfully!"
  }
  ```
- **Error Response (500 Internal Server Error):**
  ```json
  {
    "success": false,
    "message": "Database connection failed"
  }
  ```

---

## 2. Authentication Endpoints (`/api/auth`)

### Register Account
- **Method:** `POST`
- **Path:** `/api/auth/register`
- **Auth:** None (Rate Limited)
- **Request Body:**
  ```json
  {
    "name": "Jane Doe",
    "email": "jane@example.com",
    "password": "Password123!"
  }
  ```
- **Validation Rules:**
  - `name`: Required non-empty string, trimmed, max 100 characters.
  - `email`: Required, valid email format (RFC 5322 regex conformance), converted to lowercase.
  - `password`: Required string, minimum 8 characters.
- **Success Response (201 Created):**
  ```json
  {
    "success": true,
    "message": "Account created successfully.",
    "token": "eyJhbGciOiJIUzI1NiIsIn...",
    "user": {
      "id": "11111111-2222-3333-4444-555555555555",
      "name": "Jane Doe",
      "email": "jane@example.com",
      "createdAt": "2026-11-12T00:00:00.000Z"
    }
  }
  ```
- **Conflict Response (409 Conflict):**
  ```json
  {
    "success": false,
    "message": "A user with this email already exists."
  }
  ```

### Login
- **Method:** `POST`
- **Path:** `/api/auth/login`
- **Auth:** None (Rate Limited)
- **Request Body:**
  ```json
  {
    "email": "jane@example.com",
    "password": "Password123!"
  }
  ```
- **Success Response (200 OK):**
  ```json
  {
    "success": true,
    "token": "eyJhbGciOiJIUzI1NiIsIn...",
    "user": {
      "id": "11111111-2222-3333-4444-555555555555",
      "name": "Jane Doe",
      "email": "jane@example.com",
      "createdAt": "2026-11-12T00:00:00.000Z"
    }
  }
  ```
- **Invalid Credentials Response (401 Unauthorized):**
  ```json
  {
    "success": false,
    "message": "Invalid email or password."
  }
  ```

### Get Current User Profile
- **Method:** `GET`
- **Path:** `/api/auth/me`
- **Auth:** Bearer Token
- **Success Response (200 OK):**
  ```json
  {
    "success": true,
    "user": {
      "id": "11111111-2222-3333-4444-555555555555",
      "name": "Jane Doe",
      "email": "jane@example.com",
      "createdAt": "2026-11-12T00:00:00.000Z"
    }
  }
  ```

### Update User Profile
- **Method:** `PUT`
- **Path:** `/api/auth/profile`
- **Auth:** Bearer Token
- **Request Body:**
  ```json
  {
    "name": "Jane Smith",
    "email": "janesmith@example.com"
  }
  ```
- **Success Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Profile updated successfully.",
    "user": {
      "id": "11111111-2222-3333-4444-555555555555",
      "name": "Jane Smith",
      "email": "janesmith@example.com"
    }
  }
  ```

### Change Password
- **Method:** `PUT`
- **Path:** `/api/auth/change-password`
- **Auth:** Bearer Token
- **Request Body:**
  ```json
  {
    "currentPassword": "Password123!",
    "newPassword": "NewStrongPassword456!"
  }
  ```
- **Validation Rules:**
  - Verifies current password against stored bcrypt hash (12 salt rounds).
  - New password must be at least 8 characters and differ from current password.
- **Success Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Password changed successfully."
  }
  ```

---

## 3. Glucose Readings Endpoints (`/api/readings`)

All reading endpoints require `Authorization: Bearer <token>`. Readings are strictly scoped to the authenticated user ID (`where: { userId }`).

### Measurement Slots
| Slot Identifier | Clinical Meal Timing |
|---|---|
| `MORNING` | Fasting / Upon waking |
| `AFTER_BREAKFAST` | Postprandial breakfast measurement |
| `AFTER_LUNCH` | Postprandial lunch measurement |
| `AFTER_DINNER` | Postprandial dinner measurement |

### List Readings
- **Method:** `GET`
- **Path:** `/api/readings`
- **Query Parameters:**
  - `date` (optional): Filter by exact calendar date (`YYYY-MM-DD`).
  - `startDate` (optional): Filter range start (`YYYY-MM-DD`).
  - `endDate` (optional): Filter range end (`YYYY-MM-DD`).
  - `page` (optional): Page number (e.g. `1`).
  - `limit` (optional): Readings per page (max 100, default 50).
- **Sorting:** `date` descending, then `slot` ascending.
- **Success Response (200 OK):**
  ```json
  {
    "success": true,
    "count": 2,
    "total": 2,
    "readings": [
      {
        "id": "c1a2b3c4-d5e6-7f8a-9b0c-1d2e3f4a5b6c",
        "userId": "11111111-2222-3333-4444-555555555555",
        "date": "2026-11-10T00:00:00.000Z",
        "slot": "AFTER_BREAKFAST",
        "value": 142,
        "createdAt": "2026-11-10T09:30:00.000Z",
        "updatedAt": "2026-11-10T09:30:00.000Z"
      },
      {
        "id": "a0b1c2d3-e4f5-6789-0abc-def123456789",
        "userId": "11111111-2222-3333-4444-555555555555",
        "date": "2026-11-10T00:00:00.000Z",
        "slot": "MORNING",
        "value": 98,
        "createdAt": "2026-11-10T07:15:00.000Z",
        "updatedAt": "2026-11-10T07:15:00.000Z"
      }
    ]
  }
  ```

### Create Reading
- **Method:** `POST`
- **Path:** `/api/readings`
- **Request Body:**
  ```json
  {
    "date": "2026-11-10",
    "slot": "MORNING",
    "value": 98
  }
  ```
- **Validation Rules:**
  - `date`: Valid ISO calendar date (`YYYY-MM-DD`). Future calendar dates are rejected.
  - `slot`: Must be one of `MORNING`, `AFTER_BREAKFAST`, `AFTER_LUNCH`, `AFTER_DINNER`.
  - `value`: Integer strictly between `40` and `600` mg/dL (decimals rejected).
  - **Slot Uniqueness:** Enforces one reading per slot per day. Duplicate returns `HTTP 409 Conflict`.
  - **Daily Limit:** Maximum 4 readings per calendar date per user. Fifth attempt returns `HTTP 400 Bad Request`.
- **Success Response (201 Created):**
  ```json
  {
    "success": true,
    "message": "Glucose reading added successfully.",
    "reading": {
      "id": "a0b1c2d3-e4f5-6789-0abc-def123456789",
      "userId": "11111111-2222-3333-4444-555555555555",
      "date": "2026-11-10T00:00:00.000Z",
      "slot": "MORNING",
      "value": 98,
      "createdAt": "2026-11-10T07:15:00.000Z",
      "updatedAt": "2026-11-10T07:15:00.000Z"
    }
  }
  ```

### Get Reading by ID
- **Method:** `GET`
- **Path:** `/api/readings/:id`
- **Success Response (200 OK):** Returns single reading object.
- **Tenant Isolation (404 Not Found):** If the requested ID belongs to another user or does not exist, the API returns a generic `404 Not Found` to prevent account enumeration.

### Update Reading
- **Method:** `PUT`
- **Path:** `/api/readings/:id`
- **Request Body:**
  ```json
  {
    "date": "2026-11-10",
    "slot": "MORNING",
    "value": 102
  }
  ```
- **Validation Rules:** Validates bounds and slot uniqueness (excluding current reading ID). Prevents changing record ownership.
- **Success Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Reading updated successfully.",
    "reading": {
      "id": "a0b1c2d3-e4f5-6789-0abc-def123456789",
      "userId": "11111111-2222-3333-4444-555555555555",
      "date": "2026-11-10T00:00:00.000Z",
      "slot": "MORNING",
      "value": 102,
      "updatedAt": "2026-11-10T07:45:00.000Z"
    }
  }
  ```

### Delete Reading
- **Method:** `DELETE`
- **Path:** `/api/readings/:id`
- **Success Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Reading deleted successfully."
  }
  ```

---

## 4. Reports Endpoints (`/api/reports`)

All report endpoints require `Authorization: Bearer <token>`.

### Daily Report
- **Method:** `GET`
- **Path:** `/api/reports/daily?date=YYYY-MM-DD`
- **Query Parameters:** `date` (required, `YYYY-MM-DD`). Cannot be a future date.
- **Success Response (200 OK):**
  ```json
  {
    "success": true,
    "report": {
      "type": "daily",
      "date": "2026-11-10",
      "readings": [
        { "id": "...", "slot": "MORNING", "value": 98 },
        { "id": "...", "slot": "AFTER_BREAKFAST", "value": 142 },
        { "id": "...", "slot": "AFTER_LUNCH", "value": 135 },
        { "id": "...", "slot": "AFTER_DINNER", "value": 118 }
      ],
      "summary": {
        "highest": 142,
        "lowest": 98,
        "average": 123.3,
        "count": 4
      }
    }
  }
  ```
- **Empty State Response (200 OK):**
  When no readings exist on the requested date:
  ```json
  {
    "success": true,
    "report": {
      "type": "daily",
      "date": "2026-11-10",
      "readings": [],
      "summary": {
        "highest": null,
        "lowest": null,
        "average": null,
        "count": 0
      }
    }
  }
  ```

### Month-to-Date (MTD) Report
- **Method:** `GET`
- **Path:** `/api/reports/month-to-date?date=YYYY-MM-DD`
- **Query Parameters:** `date` (optional, defaults to current date in IST).
- **Calculation Window:** Aggregates records from day 1 of the selected month through the specified date (inclusive).
- **Success Response (200 OK):**
  ```json
  {
    "success": true,
    "report": {
      "type": "month-to-date",
      "startDate": "2026-11-01",
      "endDate": "2026-11-10",
      "readings": [...],
      "summary": {
        "highest": 155,
        "lowest": 88,
        "average": 121.4,
        "count": 32
      }
    }
  }
  ```

### Previous Full Month Report
- **Method:** `GET`
- **Path:** `/api/reports/previous-month?date=YYYY-MM-DD`
- **Query Parameters:** `date` (optional, defaults to current date in IST).
- **Calculation Window:** Computes the entire calendar month immediately prior to the reference date. Handles month lengths (28, 29, 30, 31 days) and transitions year boundaries (e.g. querying in January calculates December 1–31 of the previous year).
- **Success Response (200 OK):**
  ```json
  {
    "success": true,
    "report": {
      "type": "previous-month",
      "startDate": "2026-10-01",
      "endDate": "2026-10-31",
      "readings": [...],
      "summary": {
        "highest": 168,
        "lowest": 85,
        "average": 124.8,
        "count": 112
      }
    }
  }
  ```
