# Stabilization & Hardening Changelog

## Summary

This document records changes made to debug, stabilize, and harden the Job Portal MERN application for production readiness.

---

## 1. Debugging & Stabilization

### 1.1 Health Endpoint 500 Fix

**Problem:** `GET /api/health` returned 500 with error:
```
Cannot set property query of [object Object] which has only a getter
```

**Root cause:** `express-mongo-sanitize` is incompatible with Express 5. In Express 5, `req.query` is read-only; the middleware attempted to reassign it.

**Solution:** Removed `express-mongo-sanitize`. The existing `sanitizeInput` middleware already performs NoSQL injection prevention (strips `$` and `.` from keys in `req.body`, `req.query`, `req.params`). No functional loss.

### 1.2 Test Environment Isolation

- **Backend:** Tests require `app` only; `server.js` (which connects to DB) is never executed. `jest.setup.js` sets env vars before tests run.
- **No DB connection during tests:** Health check and other API tests run against the Express app in isolation.

### 1.3 Frontend Test Accessibility Fix

**Problem:** `SaveJobButton` test failed: "Unable to find an accessible element with the role 'button' and name `/save job/i`". The button's accessible name was "Save" (from text), not "Save job".

**Solution:** Added `aria-label={isSaved ? 'Remove from saved' : 'Save job'}` to the button. This improves screen reader support and allows the test to query by the intended accessible name.

---

## 2. App & Server Separation

- **app.js:** Pure Express application setup. No DB connection. Exportable for testing.
- **server.js:** Connects to MongoDB, starts HTTP server, handles graceful shutdown (SIGTERM, SIGINT).
- **Graceful shutdown:** Prevents double shutdown, closes HTTP server before disconnecting MongoDB.

---

## 3. Backend Hardening

### 3.1 Middleware (Verified)

| Middleware | Purpose |
|------------|---------|
| `requestId` | UUID per request; `X-Request-Id` header for tracing |
| `cors` | Whitelist `CLIENT_URL` |
| `helmet` | Secure HTTP headers |
| `compression` | gzip responses |
| `hpp` | HTTP parameter pollution protection |
| `morgan` | Request logging |
| `cookieParser` | Parse cookies |
| `sanitizeInput` | NoSQL injection prevention ($ and . in keys) |
| Rate limit (auth) | 15 req/15min for login/register (prod) |
| Rate limit (API) | 200 req/15min (prod) |

### 3.2 Centralized Error Handling

- Standard payload: `{ success: false, message, requestId?, fields? }`
- `requestId` included in error responses for debugging
- Handles: ValidationError, CastError, JWT errors, MulterError, ApiError

### 3.3 API Versioning

- **`/api/health`** – Liveness probe (no version)
- **`/api/v1/*`** – All versioned routes (auth, jobs, applications, users, companies, admin, job-alerts, notifications)

### 3.4 Frontend API Client

- `baseURL` updated from `/api` to `/api/v1`

---

## 4. File Changes

### Backend

- `app.js` – Removed express-mongo-sanitize; added requestId; updated auth rate limit paths
- `server.js` – Improved graceful shutdown
- `routes/index.js` – Health + v1 router
- `routes/v1/index.js` – New; all v1 routes
- `middlewares/requestId.js` – New; UUID per request
- `middlewares/errorHandler.js` – requestId in responses; standardized payload
- `package.json` – Removed express-mongo-sanitize

### Frontend

- `api/apiClient.js` – baseURL `/api/v1`
- `components/SaveJobButton.jsx` – Added aria-label
- `components/__tests__/SaveJobButton.test.jsx` – Uses accessible name

---

## 5. Test Results

- **Backend:** `npm test` – PASS (health check)
- **Frontend:** `npm test` – PASS (SaveJobButton)

---

## 6. Next Steps (from Roadmap)

- Winston structured logging
- Redis caching (optional)
- E2E tests (Playwright)
- Readiness endpoint (DB check)
- Controller → Service → Repository refactor
