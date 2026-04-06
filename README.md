# Job Portal MERN

Production-style job board (Naukri-like) with candidates, recruiters, and admins—REST API on Express, SPA on React.

The application connects job seekers with employers: candidates discover roles, apply with optional cover letters, upload PDF resumes, save jobs, and configure email job alerts. Recruiters and admins publish listings tied to companies, run hiring pipelines, and track applications; admins get a cross-tenant console with audit logs.

## ✨ Features

### 👤 For Candidates

- Browse and search jobs; view job and company detail pages
- Apply once per job (idempotent); track application status
- Rich profile (headline, skills, experience, projects, education)
- Profile photo and PDF resume upload (Cloudinary)
- Saved jobs
- In-app notifications (applications, interviews, job-alert matches)
- Job alerts with keywords, location, frequency (IMMEDIATE / DAILY / WEEKLY)

### 🏢 For Recruiters

- Create and manage companies; upload company logo
- Create, edit, publish, draft, and expire jobs; manage own listings
- Recruiter analytics and application trend charts
- Applicant pipeline per job: status updates, notes, interview scheduling
- Secure PDF resume viewing for applicants to own jobs

### ⚙️ For Admins

- Platform stats and trend endpoints
- Manage users (role, active flag, delete)
- Moderate jobs and companies; override job status
- View all applications; read paginated audit logs

## 🛠️ Tech Stack

### Backend

| Technology        | Version   | Purpose                                      |
| ----------------- | --------- | -------------------------------------------- |
| Node.js           | ≥18       | Runtime (`engines` in `backend/package.json`) |
| Express           | ^5.2.1    | HTTP API                                     |
| Mongoose          | ^9.3.0    | MongoDB ODM                                  |
| Zod               | ^4.3.6    | Request validation                           |
| jsonwebtoken      | ^9.0.3    | Access + refresh JWT                         |
| bcryptjs          | ^3.0.3    | Password hashing (cost 12 on save)         |
| cookie-parser     | ^1.4.7    | httpOnly refresh + CSRF cookies            |
| helmet            | ^8.1.0    | Security headers / CSP                       |
| express-rate-limit| ^8.3.1    | Auth + API throttling (when enabled)        |
| Cloudinary        | ^2.9.0    | Images + resume storage                      |
| BullMQ            | ^5.71.0   | Email queue                                  |
| ioredis           | ^5.4.1    | Redis client for BullMQ                      |
| nodemailer        | ^8.0.2    | SMTP email                                   |
| Winston           | ^3.17.0   | Structured logging                           |
| prom-client       | ^15.1.3   | Prometheus metrics                           |
| multer            | ^2.1.1    | Multipart uploads (memory)                   |
| axios             | ^1.13.6   | Outbound HTTP                                |
| hpp / compression | ^0.2.3 / ^1.8.1 | HPP + gzip                              |
| dotenv            | ^17.3.1   | Environment loading                          |
| uuid              | ^11.0.3   | Token IDs                                    |
| opossum           | ^8.1.2    | Circuit breaker                              |
| streamifier       | ^0.1.1    | Stream helpers                               |

### Frontend

| Technology              | Version   | Purpose                          |
| ----------------------- | --------- | -------------------------------- |
| React                   | ^19.2.0   | UI                               |
| Vite                    | ^7.3.1    | Dev server + production build    |
| Tailwind CSS            | ^4.2.1    | Styling (`@tailwindcss/vite`)    |
| TanStack React Query    | ^5.90.21 | Server state + cache             |
| React Router            | ^7.13.1   | Routing                          |
| React Hook Form         | ^7.71.2   | Forms                            |
| Zod                     | ^4.3.6    | Client schemas                   |
| @hookform/resolvers     | ^5.2.2    | Zod + RHF                        |
| axios                   | ^1.13.6   | API client (`withCredentials`)   |
| framer-motion           | ^12.38.0  | Motion                           |
| recharts                | ^3.8.1    | Charts                           |
| sonner                  | ^2.0.7    | Toasts                           |
| react-helmet-async      | ^3.0.0    | Document head / SEO              |
| react-error-boundary    | ^4.0.14   | Route-level errors               |
| prop-types              | ^15.8.1   | Runtime prop checks              |
| vitest                  | ^2.1.6    | Unit tests (dev)                 |
| eslint / prettier       | ^9.x      | Lint + format                    |

## 📁 Project Structure

```
job-portal-mern/
├── backend/
│   ├── src/
│   │   ├── config/        Env, logger, metrics, security (CORS, Helmet, rate limits)
│   │   ├── constants/     Roles, statuses, cookie names
│   │   ├── controllers/   Route handlers
│   │   ├── middlewares/   Auth, CSRF, validate, audit, idempotency, etc.
│   │   ├── models/        Mongoose schemas
│   │   ├── queues/        BullMQ email queue + fallbacks
│   │   ├── repositories/  Data access helpers
│   │   ├── routes/        Express routers (`v1` mounted under `/api/v1`)
│   │   ├── services/      Business logic
│   │   ├── utils/         JWT, mail, cookies, blacklist, errors, etc.
│   │   ├── validations/   Zod schemas
│   │   ├── workers/       `emailWorker`, `jobAlertDigestWorker`
│   │   ├── app.js         Express app assembly
│   │   └── server.js      HTTP listen + DB connect
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/           Axios modules per domain
│   │   ├── components/    Shared UI + layouts + feature pieces
│   │   ├── context/       Auth provider
│   │   ├── features/      Role-specific UI slices
│   │   ├── hooks/         Reusable hooks
│   │   ├── layouts/       App shell, nav
│   │   ├── lib/           Query keys, auth helpers, utilities
│   │   ├── pages/         Route-level pages
│   │   ├── App.jsx        Routes
│   │   └── main.jsx       Entry + providers
│   ├── .env.example
│   ├── .env.development   Local defaults (optional)
│   └── package.json
├── docs/                  Deep-dive docs (architecture, deployment, reference)
├── postman/               Postman collection + local environment
├── scripts/               e.g. `wait-for-api.cjs` for `npm run dev`
└── package.json           Root scripts (`dev`, `dev:open`, workspace runners)
```

## ⚡ Quick Start

### Prerequisites

- **Node.js** 18+ (see `backend/package.json` `engines`; 20+ recommended)
- **npm** 10+ (typical with current Node)
- **MongoDB** (Atlas or local)
- **Cloudinary** account (required by backend env schema)
- **Redis** (optional — BullMQ email / digests; app falls back to direct send)
- **SMTP** (optional — password reset, transactional mail)

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd job-portal-mern
```

### 2. Install dependencies

```bash
# Root (concurrently + wait-on for npm run dev)
npm install

# Backend and frontend each have their own package.json
cd backend && npm install
cd ../frontend && npm install
```

### 3. Configure environment

```bash
# Backend
cd backend
cp .env.example .env
# Edit .env — at minimum: MONGODB_URI, JWT_* secrets, Cloudinary

# Frontend (optional — defaults in vite.config + .env.development)
cd ../frontend
cp .env.example .env.development
# Set VITE_BACKEND_PORT or VITE_BACKEND_URL to match backend PORT (default backend 5000)
```

### 4. Start development

```bash
# From repo root — API + Vite (waits for API before web)
npm run dev

# With browser open
npm run dev:open

# Or separately:
# Terminal 1
cd backend && npm run dev

# Terminal 2
cd frontend && npm run dev
```

### 5. Access the application

- **Frontend:** http://localhost:5173 (Vite `server.port`)
- **Backend API:** `http://localhost:<PORT>` (default **5000** from `backend/.env.example`)
- **API health:** http://localhost:5000/api/health  
- **API ready (DB):** http://localhost:5000/api/ready  

If `frontend/.env.development` sets `VITE_BACKEND_PORT=9000`, point Vite’s proxy at the same port as `backend` `PORT`.

## 🔑 Environment Variables

### Backend (`.env`)

Values below mirror `backend/.env.example` (see that file for full comments).

```env
# ── Core ──────────────────────────
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:5173

# ── Database ──────────────────────
MONGODB_URI=mongodb+srv://...

# ── JWT ───────────────────────────
JWT_ACCESS_SECRET=replace_with_64_char_random_hex
JWT_REFRESH_SECRET=replace_with_64_char_random_hex
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d

# ── Cloudinary ────────────────────
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# ── Security ──────────────────────
# RATE_LIMIT_ENABLED=true
# COOKIE_SAME_SITE=strict
# METRICS_TOKEN=your-secret-token-here
# AUDIT_LOG_TTL_DAYS=365

# ── Optional: Redis ───────────────
# REDIS_URL=redis://localhost:6379

# ── Optional: Email ───────────────
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=587
# SMTP_USER=your_email@gmail.com
# SMTP_PASS=your_app_password
# SMTP_FROM=noreply@jobportal.com
```

### Frontend (`.env.development` / `.env.example`)

```env
# Proxy target — must match backend PORT (vite default fallback: 5000)
# VITE_BACKEND_PORT=5000
# Or: VITE_BACKEND_URL=http://127.0.0.1:5000

VITE_SITE_URL=https://jobportal.example.com
# Optional: VITE_GA_MEASUREMENT_ID, social URLs — see frontend/.env.example
```

## 🌐 API Overview

**Base URL:** `/api/v1`

| Area          | Base path          | Auth / notes                                      |
| ------------- | ------------------ | ------------------------------------------------- |
| Auth          | `/auth`            | Mixed — register/login/refresh public; `/me` JWT  |
| Users         | `/users`           | Authenticated (profile, resume, saved jobs)      |
| Jobs          | `/jobs`            | List/detail public; mutations recruiter/admin    |
| Applications  | `/applications`    | Candidate apply; recruiter/admin pipeline        |
| Companies     | `/companies`       | List/detail public; CRUD recruiter/admin         |
| Notifications | `/notifications`   | Authenticated                                     |
| Job alerts    | `/job-alerts`      | Candidate                                         |
| Admin         | `/admin`           | Admin JWT only                                    |

### Key endpoints

#### Auth

```
GET  /api/v1/auth/csrf-token
POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/logout
POST /api/v1/auth/refresh
GET  /api/v1/auth/me
POST /api/v1/auth/forgot-password
POST /api/v1/auth/reset-password/:token
```

#### Jobs

```
GET    /api/v1/jobs
GET    /api/v1/jobs/me
GET    /api/v1/jobs/analytics
GET    /api/v1/jobs/analytics/trend
GET    /api/v1/jobs/:id
POST   /api/v1/jobs
PUT    /api/v1/jobs/:id
DELETE /api/v1/jobs/:id
```

#### Applications

```
POST   /api/v1/applications
GET    /api/v1/applications/me
GET    /api/v1/applications/interviews/upcoming
GET    /api/v1/applications/job/:jobId
GET    /api/v1/applications/:id
GET    /api/v1/applications/:id/resume
PATCH  /api/v1/applications/:id/status
PATCH  /api/v1/applications/:id/notes
PATCH  /api/v1/applications/:id/interview
```

#### Companies

```
GET    /api/v1/companies
GET    /api/v1/companies/me
POST   /api/v1/companies
PATCH  /api/v1/companies/:id
DELETE /api/v1/companies/:id
POST   /api/v1/companies/:id/logo
GET    /api/v1/companies/:id
```

#### Notifications

```
GET    /api/v1/notifications
GET    /api/v1/notifications/unread-count
PATCH  /api/v1/notifications/read-all
PATCH  /api/v1/notifications/:id/read
DELETE /api/v1/notifications/:id
```

#### Job alerts

```
GET    /api/v1/job-alerts
POST   /api/v1/job-alerts
PATCH  /api/v1/job-alerts/:id
DELETE /api/v1/job-alerts/:id
```

#### Users (profile)

```
PATCH  /api/v1/users/change-password
PATCH  /api/v1/users/profile
POST   /api/v1/users/profile/image
POST   /api/v1/users/profile/resume
GET    /api/v1/users/profile/resume/file
DELETE /api/v1/users/profile/resume
POST   /api/v1/users/saved-jobs/:jobId
GET    /api/v1/users/saved-jobs
DELETE /api/v1/users/account
```

#### Admin

```
GET    /api/v1/admin/stats
GET    /api/v1/admin/stats/trend
GET    /api/v1/admin/users
PATCH  /api/v1/admin/users/:id/toggle-status
PATCH  /api/v1/admin/users/:id/role
DELETE /api/v1/admin/users/:id
GET    /api/v1/admin/jobs
PATCH  /api/v1/admin/jobs/:id/toggle-status
PATCH  /api/v1/admin/jobs/:id/status
DELETE /api/v1/admin/jobs/:id
GET    /api/v1/admin/companies
DELETE /api/v1/admin/companies/:id
GET    /api/v1/admin/applications
GET    /api/v1/admin/audit-logs
```

#### System

```
GET /api/health
GET /api/ready
GET /api/metrics   # requires X-Metrics-Token when METRICS_TOKEN is set
```

## 🔐 Security Features

- Short-lived JWT access tokens (default 15m), kept in memory on the client
- HttpOnly refresh cookie (default 7d) + rotation + reuse detection
- CSRF double-submit cookie on mutating routes (exemptions for auth bootstrap paths—see `middlewares/csrf.js`)
- Bcrypt password hashing (cost factor **12** on save)
- Rate limiting on sensitive auth routes when enabled
- Helmet (including CSP) and HPP
- CORS restricted via `CLIENT_URL`
- Zod validation + sanitization middleware
- RBAC and resource-ownership checks on writes
- Audit log collection with Mongo TTL (`AUDIT_LOG_TTL_DAYS`, default 365)
- Access-token `jti` blacklist on logout
- Metrics endpoint gated by `X-Metrics-Token` when configured

## 👥 User Roles & Permissions

| Feature              | Candidate | Recruiter | Admin |
| -------------------- | --------- | --------- | ----- |
| Browse jobs          | ✅        | ✅        | ✅    |
| Apply                | ✅        | ❌        | ❌    |
| Post / manage own jobs | ❌      | ✅        | ✅    |
| Company CRUD (own)   | ❌        | ✅        | ✅    |
| Pipeline / resumes   | ❌        | ✅        | ✅    |
| Job alerts           | ✅        | ❌        | ❌    |
| Admin dashboard      | ❌        | ❌        | ✅    |
| Cross-tenant moderation | ❌     | ❌        | ✅    |
| Audit logs           | ❌        | ❌        | ✅    |

## 📧 Email & Queue System

Workers (BullMQ; require `REDIS_URL` in `.env`):

```bash
cd backend
npm run worker:email
npm run worker:job-alert-digest
```

Email job types handled in `queues/emailQueue.js` include: **JOB_ALERT**, **APPLICATION_RECEIVED**, **APPLICATION_STATUS_CHANGED**, **INTERVIEW_SCHEDULED** (plus legacy `queueEmail` **send** jobs). Default BullMQ options: **3** attempts, **exponential** backoff from **5s**. **Without Redis**, matching types fall back to **direct** `sendMail` where implemented.

## 🗄️ Database Models

| Model        | Purpose |
| ------------ | ------- |
| User         | Auth, profile, resume metadata, saved jobs, refresh token field (stripped in JSON) |
| Job          | Listings: company ref, poster, draft / expiry, salary, skills |
| Application  | Candidate–job apply; status, notes, interview subdoc |
| Company      | Employer profile; logo; `createdBy` |
| Notification | In-app inbox: type, title, body, link, read state |
| JobAlert     | Candidate alert criteria + frequency |
| AuditLog     | Compliance trail; TTL on `createdAt` |

## 🧪 Running Tests

```bash
cd backend && npm test
cd frontend && npm test
cd frontend && npm run test:coverage
cd frontend && npm run analyze   # bundle visualizer
```

## 🧪 Production Deployment

### Backend

```bash
cd backend
npm ci
npm start    # node src/server.js
```

### Frontend

```bash
cd frontend
npm ci
npm run build
# Serve the `dist/` folder with any static host or CDN
```

### Recommended platforms

- **API:** Railway, Render, Fly.io
- **SPA:** Vercel, Netlify
- **DB:** MongoDB Atlas
- **Redis:** Upstash, Redis Cloud

### Post-deploy checklist

- [ ] All required env vars set (`env.js` validation passes)
- [ ] `GET /api/health` → 200
- [ ] `GET /api/ready` → 200
- [ ] Register + login + refresh cookie flow works on prod origins
- [ ] Apply + recruiter pipeline works
- [ ] SMTP + workers (if used)
- [ ] Cloudinary uploads
- [ ] Admin routes behind admin role

## 📚 Documentation

| Document | Purpose |
| -------- | ------- |
| `README.md` | Quick start + overview (this file) |
| `docs/PROJECT_REFERENCE.md` | Full technical reference |
| `docs/DEPLOYMENT.md` | Deployment guide |
| `docs/PRE_LAUNCH_CHECKLIST.md` | CORS, cookies, Redis/workers, metrics — run before go-live |
| `docs/PRIVACY_AND_DATA.md` | PII / GDPR stance |
| `docs/openapi.yaml` | OpenAPI 3 snapshot (`npm run openapi:validate`) |
| `docs/ARCHITECTURE.md` | System architecture |
| `docs/PACKAGES_AND_SCRIPTS.md` | Package and script notes |
| `postman/README.md` | API collection usage |

## 🔮 Roadmap

- [ ] E2E tests (e.g. Playwright)
- [ ] OAuth / SSO login
- [ ] Real-time notifications (SSE / WebSocket)
- [ ] Mobile app (React Native)
- [ ] Smarter job matching
- [ ] Video interviews
- [ ] Team / organization accounts

## 📄 License

**ISC** — see `backend/package.json`. The monorepo root (`package.json`) is **private**; reuse terms depend on your organization’s policy.

---

Built with care using the MERN stack and modern frontend tooling.
