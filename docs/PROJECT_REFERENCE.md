# Job Portal MERN — Project reference (canonical)

Single source of truth for what this repository contains. Last updated: March 2026.

---

## 1. What this is

A full-stack **job portal** (candidate / recruiter / admin) with:

- **MongoDB** persistence, **Express** API, **React (Vite)** SPA, **JWT** auth (access + refresh), **Cloudinary** for profile images and resume PDFs.
- **Recruiter ATS-style** features: application pipeline (stages), notes, interview scheduling, filters, analytics, upcoming interviews.
- **Production-oriented** middleware: security headers, CORS, sanitization, optional rate limiting in production, health/ready/metrics, audit hooks, idempotent apply.

---

## 2. Repository layout

```
job-portal-mern/
├── backend/                 # Node API
├── frontend/                # Vite + React SPA
├── docs/                    # This file + deployment, architecture, guides
├── scripts/                 # Root: wait-for-api.cjs (monorepo dev)
├── postman/                 # API collection (see postman/README.md)
├── package.json             # Root: dev both apps
├── README.md                # Quick start
└── PROJECT_OVERVIEW.txt     # Plain-text companion (same facts, no Markdown)
```

---

## 3. Backend (`backend/`)

### 3.1 Runtime & entry

| Item | Detail |
|------|--------|
| Entry | `src/server.js` → loads `app.js`, connects MongoDB, listens on `PORT` (env, default `5000`) |
| App | `src/app.js` — middleware stack, conditional rate limits (`NODE_ENV === 'production'`), `/api` routes, metrics |

### 3.2 Config (`src/config/`)

| File | Role |
|------|------|
| `env.js` | Zod-validated env (required: `MONGODB_URI`, JWT secrets, Cloudinary) |
| `db.js` | Mongoose connection |
| `security.js` | CORS, Helmet, HPP options, `RATE_LIMITS`, `rateLimitingEnabled` |
| `logger.js` | Winston logging |
| `metrics.js` | Prometheus `/api/metrics` |
| `cloudinary.js` | Upload config |
| `permissions.js` | RBAC helpers |

### 3.3 Models (`src/models/`)

| Model | Purpose |
|-------|---------|
| `User.js` | Auth, profile, skills, experience/projects/education, resume fields, saved jobs |
| `Job.js` | Postings, `postedBy`, company ref, skills, salary, active flag |
| `Application.js` | Job + candidate unique pair, **pipeline `status`**, `recruiterNotes`, nested **`interview`** (scheduledAt, timezone, duration, notes, interview status) |
| `Company.js` | Company profile, `createdBy` |
| `JobAlert.js` | Candidate job alerts |
| `Notification.js` | In-app notifications |
| `AuditLog.js` | Audit trail |
| `indexes.js` | Index helpers |

**Application pipeline statuses** (`constants/applicationStatus.js`):  
`applied` → `screening` → `interview` → `offer` → `hired` | `rejected`  

**Interview sub-statuses:** `scheduled`, `completed`, `cancelled`, `no_show`  

Legacy DB value `shortlisted` → run once:  
`node backend/scripts/migrateApplicationStatuses.js` (with `MONGODB_URI` set).

### 3.4 Routes & API surface

**Prefix:** `app.use("/api", …)` where `routes/index.js` mounts `router.use("/v1", v1Routes)`.  
So versioned API base is **`/api/v1`**.  
**Unversioned:** `GET /api/health`, `GET /api/ready`, `GET /api/metrics`.

**`routes/v1/index.js` mounts:**

| Mount path | File | Area |
|------------|------|------|
| `/auth` | `authRoutes.js` | Register, login, refresh, logout, me, forgot/reset password |
| `/jobs` | `jobRoutes.js` | CRUD, list, `me`, analytics |
| `/applications` | `applicationRoutes.js` | Apply, list mine, list by job, resume stream, detail, status, notes, interview, upcoming interviews |
| `/users` | `userRoutes.js` | Profile, image, resume, saved jobs, account |
| `/companies` | `companyRoutes.js` | Public + recruiter company APIs |
| `/admin` | `adminRoutes.js` | Admin stats / moderation |
| `/job-alerts` | `jobAlertRoutes.js` | Job alerts |
| `/notifications` | `notificationRoutes.js` | Notifications |

**Applications (recruiter/admin) — important paths** (all under `/api/v1/applications`):

- `POST /` — candidate apply (idempotency key supported)
- `GET /me` — candidate’s applications
- `GET /interviews/upcoming` — recruiter upcoming interviews
- `GET /job/:jobId` — list apps for job (query: `status`, `q`, `skill`)
- `GET /:id/resume` — PDF stream (must be registered before `GET /:id`)
- `GET /:id` — full application detail
- `PATCH /:id/status` — pipeline stage
- `PATCH /:id/notes` — recruiter notes
- `PATCH /:id/interview` — schedule/update interview

**Authorization:** `middlewares/authorize.js` — job owner (`postedBy`) for applications; company owner patterns; admin bypass where implemented.

### 3.5 Services & data access

- **`services/`** — `authService`, `jobService`, `applicationService`, `jobAlertService`, `auditLogService`, `resumeStreamService`, etc.
- **`repositories/`** — `jobRepository`, `applicationRepository`, `userRepository`
- **`controllers/`** — Thin handlers per domain
- **`validations/`** — Zod schemas per route group
- **`middlewares/`** — `auth`, `validate` / `validateQuery`, `audit`, `idempotency`, `sanitizeInput`, `errorHandler`, `notFound`, `requestId`

### 3.6 Workers & infra

- **`queues/emailQueue.js`**, **`workers/emailWorker.js`** — BullMQ email (optional; SMTP in env)
- **`utils/cache.js`** — Redis or in-memory cache for job lists
- **`utils/jwt.js`**, **`tokenBlacklist.js`** — Tokens
- **`utils/mail.js`** — Nodemailer + circuit breaker (opossum)

### 3.7 Scripts (`backend/scripts/`)

| Script | Purpose |
|--------|---------|
| `migrateApplicationStatuses.js` | `shortlisted` → `screening` |
| `updateResumeAccessMode.js` | Cloudinary resume access migration (see package.json script) |

### 3.8 Tests

- Jest + Supertest: `src/__tests__/health.test.js`, `ready.test.js`, `auth.test.js`
- `npm test` in `backend/`

### 3.9 Environment (required vs optional)

See **`backend/.env.example`**. Required in `env.js` schema: `MONGODB_URI`, `JWT_*`, `CLOUDINARY_*`, `CLIENT_URL`, `PORT` (defaulted).  
Optional (documented in example): `REDIS_URL`, SMTP variables for email flows.

---

## 4. Frontend (`frontend/`)

### 4.1 Stack

React 19, Vite 7, Tailwind CSS v4 (`@tailwindcss/vite`), TanStack Query v5, React Router 7, React Hook Form + Zod, Sonner, react-helmet-async, axios (`api/apiClient.js`), framer-motion (selective).

### 4.2 Entry & shell

| File | Role |
|------|------|
| `index.html` | Root mount |
| `src/main.jsx` | QueryClient, Router, AuthProvider, ThemeProvider, ErrorBoundary, `ErrorFallback` |
| `src/App.jsx` | Route table |
| `src/layouts/AppLayout.jsx` | Header, nav, mobile sheet, footer, `Outlet` + `PageShell` / `AnimatedPage` |
| `src/index.css` | Tailwind import, design tokens, typography utilities |

### 4.3 Pages (`src/pages/`)

| Path / file | Role |
|-------------|------|
| `HomePage.jsx` | Landing |
| `JobsPage.jsx`, `JobDetailsPage.jsx` | Browse / detail / apply |
| `CompaniesPage.jsx`, `CompanyDetailsPage.jsx` | Companies |
| `LoginPage`, `RegisterPage`, `ForgotPasswordPage`, `ResetPasswordPage` | Auth |
| `candidate/CandidateDashboardPage.jsx` | Profile, saved jobs, alerts, applications |
| `recruiter/RecruiterDashboardPage.jsx` | Companies, jobs, **pipeline UI**, analytics, upcoming interviews |
| `admin/AdminDashboardPage.jsx` | Admin |
| `NotFoundPage`, `ServerErrorPage`, `PlaceholderPage` | Errors / stubs |

### 4.4 Features (`src/features/recruiter/`)

| File | Role |
|------|------|
| `applicationPipeline.js` | Stage labels, badge classes, funnel colors |
| `ApplicantsPipelinePanel.jsx` | Filters, debounced search, kanban columns, cards |
| `ApplicantDetailModal.jsx` | Detail, notes, interview, resume actions, quick stage buttons |

### 4.5 Components (selected)

`components/ui/` — Button, Input, Select, Modal, Sheet, Skeleton, Badge, Card, Tabs, EmptyState, PageHeader, LoadingState, Dropdown, Tooltip, etc.  
`components/layout/` — AuthLayout, PageShell, RouteFallback.  
`resume/` — ResumeViewer, LazyResumeViewer.  
Others: Footer, SaveJobButton, NotificationDropdown, ProfileDropdown, ThemeToggle, ProtectedRoute, SeoHead, AnalyticsTracker, skeletons, etc.

### 4.6 Lib & hooks

- **`lib/queryKeys.js`** — React Query key factory (includes recruiter job applications, application detail, upcoming interviews)
- **`lib/queryOptions.js`**, **`prefetchDashboard.js`**, **`openApplicationResumeTab.js`** (open/download resume with JWT)
- **`hooks/`** — `useDebouncedValue`, `useHeaderScrolled`, `useCountUp`

### 4.7 API client

- **`api/apiClient.js`** — Axios base URL `/api/v1`, interceptors (refresh), credentials
- Dev: Vite **`vite.config.js`** proxies `/api` → `VITE_BACKEND_URL` or `http://127.0.0.1:${VITE_BACKEND_PORT}`; see **`frontend/.env.development`** / **`.env.example`**

### 4.8 Scripts

- `npm run dev` — Vite
- `npm run build` — SEO domain replace script + Vite build
- `npm run lint`, `npm test` (Vitest)

---

## 5. Root monorepo

**`package.json` scripts:**

- `npm run dev` — `concurrently` backend + `node scripts/wait-for-api.cjs` then frontend (waits for `/api/health` on resolved port)
- `npm run dev:open` — same + `--open`
- `scripts/wait-for-api.cjs` — Reads `PORT` / `BACKEND_PORT`, then `backend/.env` `PORT`, then `frontend/.env.development` `VITE_BACKEND_PORT`, default `5000`

---

## 6. Security & ops notes

- **Never commit** `backend/.env`, credential files, or ad-hoc `.txt` files with secrets.
- **Rate limiting** is applied only when `NODE_ENV === 'production'` (see `config/security.js` + `app.js`).
- **CORS** uses `CLIENT_URL` (comma-separated origins supported in code).
- **Resume access** is recruiter/admin with application job ownership checks.

---

## 7. Further documentation (kept in repo)

| Document | Topic |
|----------|--------|
| `docs/DEPLOYMENT.md` | Env strategy, Docker notes |
| `DEPLOYMENT.md` (root) | Render/Railway/Vercel-style steps |
| `docs/ARCHITECTURE.md` | High-level architecture |
| `docs/PACKAGES_AND_SCRIPTS.md` | Package notes |
| `ROADMAP_TO_PRODUCTION.txt` | Checklist |
| `docs/*` (other files) | UX system, audits, enterprise guides, interview Q&A, changelogs |

---

## 8. Quick commands

```bash
# From repo root — API + UI (after backend .env is filled)
npm install
npm run dev

# Backend only
cd backend && npm install && npm run dev

# Frontend only (API must be running on the port Vite proxies to)
cd frontend && npm install && npm run dev
```

---

*This file replaces the removed `PROJECT_SUMMARY.txt` and `docs/PROJECT_SUMMARY.md` as the canonical project description.*
