# MERN Job Portal – Complete Project Summary

## Overview

A production-ready, enterprise-grade job portal built with the MERN stack (MongoDB, Express, React, Node.js). Supports candidates, recruiters, and admins with full CRUD, authentication, authorization, background processing, and observability.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 19, Vite, Tailwind CSS, React Query, React Router |
| **Backend** | Node.js, Express 5, MongoDB (Mongoose) |
| **Auth** | JWT (access + refresh), token blacklist, refresh rotation |
| **Cache** | Redis (optional), in-memory fallback |
| **Queue** | BullMQ (email, job alerts) |
| **Storage** | MongoDB, Cloudinary (images, resumes) |
| **Deploy** | Docker, Docker Compose, GitHub Actions CI/CD |

---

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   React     │────▶│   Nginx     │────▶│   Express   │
│   (Vite)    │     │   (proxy)   │     │   API       │
└─────────────┘     └─────────────┘     └──────┬──────┘
                                                │
                    ┌───────────────────────────┼───────────────────────────┐
                    │                           │                           │
                    ▼                           ▼                           ▼
             ┌─────────────┐             ┌─────────────┐             ┌─────────────┐
             │  MongoDB   │             │   Redis     │             │  BullMQ     │
             │             │             │  (cache,   │             │  (email     │
             │             │             │  blacklist)│             │   worker)   │
             └─────────────┘             └─────────────┘             └─────────────┘
```

---

## User Roles & Capabilities

| Role | Capabilities |
|------|--------------|
| **Candidate** | Browse jobs, apply, save jobs, job alerts, profile, resume upload |
| **Recruiter** | Create companies, post jobs, manage applications, analytics |
| **Admin** | All recruiter + user/job moderation, platform stats |

---

## API Structure

**Base URL:** `/api/v1`

| Module | Endpoints |
|--------|-----------|
| **Auth** | register, login, refresh, logout, me, forgot-password, reset-password |
| **Jobs** | list, get, create, update, delete, me, analytics |
| **Applications** | create (apply), list mine, list by job, update status |
| **Users** | profile, upload image/resume, saved jobs, delete account |
| **Companies** | list public, list mine, get, create |
| **Job Alerts** | create, list, update, delete |
| **Notifications** | list, mark read |
| **Admin** | stats, users, jobs, toggle user/job status |

**System:** `/api/health`, `/api/ready`, `/api/metrics`

---

## Security Features

- **Helmet** – Secure HTTP headers
- **CORS** – Configurable origins
- **HPP** – Parameter pollution protection
- **Input sanitization** – NoSQL injection, prototype pollution
- **Rate limiting** – Per-endpoint (auth: 10/15min, strict: 5/15min, API: 200/15min)
- **JWT** – Access (15m) + refresh (7d), rotation, blacklist on logout
- **ABAC** – Resource-level ownership (job, application, company)
- **Validation** – Zod schemas on all inputs

---

## Reliability & Observability

- **Health** – `/api/health` (liveness), `/api/ready` (readiness + DB)
- **Logging** – Winston, requestId, structured JSON in prod
- **Audit** – Login, logout, job/application mutations
- **Metrics** – Prometheus (latency, throughput) at `/api/metrics`
- **Circuit breaker** – Mail (opossum)
- **Background jobs** – BullMQ with retries, DLQ for failures

---

## Caching & Performance

- **Job list** – Redis/in-memory, 3min TTL, stampede protection (probabilistic early refresh)
- **Invalidation** – On job create/update/delete
- **Indexes** – Jobs (title, location, skills), applications, users

---

## Resilience Features

- **Idempotency** – `Idempotency-Key` header on application submit
- **DLQ** – Failed email jobs moved to `email:dlq` queue
- **Graceful shutdown** – SIGTERM/SIGINT handling
- **Fallbacks** – In-memory cache when Redis down, direct send when queue down

---

## Project Structure

```
job-portal-mern/
├── backend/
│   ├── src/
│   │   ├── config/       # env, security, logger, metrics, db
│   │   ├── constants/    # roles
│   │   ├── controllers/
│   │   ├── middlewares/   # auth, authorize, audit, idempotency, validate
│   │   ├── models/
│   │   ├── queues/       # emailQueue
│   │   ├── repositories/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── utils/        # cache, jwt, mail, tokenBlacklist, apiResponse
│   │   └── workers/      # emailWorker
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── context/
│   │   ├── layouts/
│   │   ├── pages/
│   │   └── utils/
│   ├── Dockerfile
│   └── nginx.conf
├── docs/
├── docker-compose.yml
├── docker-compose.dev.yml
└── .github/workflows/ci.yml
```

---

## Run Commands

```bash
# Development
cd backend && npm run dev
cd frontend && npm run dev

# With Docker services (MongoDB + Redis)
docker compose -f docker-compose.dev.yml up -d

# Full stack
docker compose up -d

# Email worker (separate process)
cd backend && npm run worker:email

# Tests
cd backend && npm test
cd frontend && npm test
```

---

## Environment Variables

**Backend:** `MONGODB_URI`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `CLIENT_URL`, `CLOUDINARY_*`, `REDIS_URL` (optional), `SMTP_*` (optional)

**Frontend:** `VITE_API_URL` (optional, defaults to /api)
