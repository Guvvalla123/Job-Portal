# Job Portal – Enterprise Architecture Document

**Version:** 1.0  
**Last Updated:** March 2025  
**Author:** Principal Full Stack Engineer

---

## 1. Requirements & System Design

### 1.1 Business Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| BR-1 | Candidates can register, create profiles, browse jobs, apply, save jobs, set alerts | P0 |
| BR-2 | Recruiters can create companies, post jobs, manage applications, shortlist/hire | P0 |
| BR-3 | Admins can manage users, jobs, applications, view analytics | P0 |
| BR-4 | Email notifications (forgot password, job alerts, application status) | P0 |
| BR-5 | Resume/CV upload and storage | P0 |
| BR-6 | OAuth (Google, LinkedIn) for faster signup | P1 |
| BR-7 | Advanced search, filters, pagination | P1 |
| BR-8 | ATS-lite: pipeline stages, notes, bulk actions | P1 |
| BR-9 | Monetization: featured jobs, subscriptions | P2 |

### Logging & PII (operations)

Operational policy for logs, Sentry, and secrets is summarized in **`docs/DEPLOYMENT.md`** (“Logging, PII, and error reporting”). Keep error messages and third-party payloads free of passwords and unnecessary PII.

### 1.2 Non-Functional Requirements

| Category | Requirement | Target |
|----------|-------------|--------|
| **Scalability** | Horizontal scaling of API servers | Support 10K+ concurrent users |
| **Availability** | Uptime | 99.5% |
| **Latency** | API response time (p95) | < 500ms |
| **Security** | OWASP Top 10 compliance | Full compliance |
| **Data** | Backup frequency | Daily; RPO < 24h |
| **Recovery** | RTO | < 4 hours |

### 1.3 System Architecture

**Chosen: Modular Monolith**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT (React SPA)                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │   Public    │  │  Candidate   │  │  Recruiter   │  │       Admin        │ │
│  │ Jobs/Co.    │  │  Dashboard   │  │  Dashboard   │  │     Dashboard      │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        │ HTTPS / REST
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         API GATEWAY / LOAD BALANCER                          │
│                    (Nginx / Cloud LB - rate limit, SSL)                        │
└─────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         EXPRESS API (Modular Monolith)                        │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────────────┐ │
│  │ Auth Module  │ │ Job Module   │ │ Application  │ │ Company / User /     │ │
│  │ (JWT/OAuth)  │ │ (CRUD, search)│ │ Module       │ │ Admin / Notification│ │
│  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────────────┘ │
│                                                                              │
│  Middleware: CORS, Helmet, Rate Limit, Sanitize, Error Handler, Logger        │
└─────────────────────────────────────────────────────────────────────────────┘
                    │                    │                    │
                    ▼                    ▼                    ▼
┌──────────────────────┐  ┌──────────────────────┐  ┌──────────────────────┐
│      MongoDB         │  │   Redis (optional)    │  │   Cloudinary         │
│  (Primary Data Store)│  │   (Session/Cache)     │  │   (Files/Resumes)    │
└──────────────────────┘  └──────────────────────┘  └──────────────────────┘
```

**Rationale for Modular Monolith:**
- Single deployable unit; simpler ops for team size 1–5
- Clear module boundaries (auth, jobs, applications, companies, admin)
- Can extract microservices later (e.g., job-alert worker) if needed
- Lower cost than full microservices for current scale

### 1.4 API Contract & Data Flow

**Base URL:** `https://api.jobportal.com/v1` (or `/api` for current)

**Standard Response:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional message"
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Human-readable error",
  "fields": { "fieldName": "Validation error" }
}
```

**Auth Flow:**
```
Client → POST /auth/login { email, password }
       ← { accessToken, refreshToken, user }
Client → GET /auth/me (Bearer accessToken)
       ← { user }
Client → POST /auth/refresh { refreshToken } (cookie or body)
       ← { accessToken }
```

---

## 2. Technology Strategy

### 2.1 MERN Stack Justification

| Layer | Choice | Justification |
|-------|--------|----------------|
| **DB** | MongoDB | Document model fits profiles, jobs, nested experience/education; flexible schema for MVP; Atlas for managed hosting |
| **Backend** | Node.js + Express | Single language (JS); async I/O; large ecosystem; fast iteration |
| **Frontend** | React | Component model; strong ecosystem; Vite for fast builds |
| **Validation** | Zod | Type-safe; shared schemas; runtime validation |

### 2.2 Supporting Technologies

| Technology | Purpose | When to Use |
|------------|---------|-------------|
| **Redis** | Session store, cache (job lists, company lists) | When traffic > 1K req/min |
| **Elasticsearch** | Full-text job search | When MongoDB $text is insufficient |
| **Bull/BullMQ** | Job queues (emails, alerts) | When async processing needed |
| **Sentry** | Error tracking | Production |
| **Cloudinary** | Image/resume storage | From day one |

### 2.3 Third-Party vs In-House

| Capability | Choice | Reason |
|-------------|--------|--------|
| Auth | JWT in-house + Passport for OAuth | JWT simple; OAuth via Passport |
| Email | Nodemailer + SMTP (SendGrid/AWS SES) | Cost-effective; no vendor lock-in |
| File storage | Cloudinary | Managed, CDN, image transforms |
| Search | MongoDB $text → Elasticsearch later | Start simple; upgrade when needed |
| Payments | Stripe | Industry standard |

---

## 3. Backend Engineering (Node.js + Express)

### 3.1 Layered Architecture

```
Request → Route → Controller → Service → Repository → Model (MongoDB)
                ↓
            Validation (Zod)
                ↓
            Auth Middleware (JWT/RBAC)
```

| Layer | Responsibility | Example |
|-------|----------------|---------|
| **Route** | HTTP method, path, middleware chain | `router.post('/jobs', requireAuth, requireRole('recruiter'), validate(jobSchema), createJob)` |
| **Controller** | Parse req, call service, format res | `createJob(req, res)` → `jobService.create(req.body, req.user)` |
| **Service** | Business logic, orchestration | `jobService.create()` validates company ownership, creates job, triggers alerts |
| **Repository** | Data access abstraction | `jobRepo.create(payload)` |
| **Model** | Schema, indexes | Mongoose Job model |

**Current state:** Controllers call models directly. Introduce Service layer as we refactor.

### 3.2 RESTful API Conventions

| Method | Path Pattern | Action |
|--------|--------------|--------|
| GET | /resources | List (paginated) |
| GET | /resources/:id | Get one |
| POST | /resources | Create |
| PUT | /resources/:id | Full update |
| PATCH | /resources/:id | Partial update |
| DELETE | /resources/:id | Delete (soft where applicable) |

### 3.3 Error Handling

- Central `errorHandler` middleware
- `ApiError` class for known errors (4xx, 5xx)
- Zod validation errors → 400 with `fields`
- Mongoose ValidationError, CastError → 400
- JWT errors → 401
- Unknown → 500 (message hidden in production)

### 3.4 Authentication & Authorization

- **Auth:** JWT access token (15m) + refresh token (7d)
- **Storage:** Access in `Authorization: Bearer <token>`; refresh in httpOnly cookie or body
- **RBAC:** `requireAuth` + `requireRole('candidate'|'recruiter'|'admin')`
- **Resource ownership:** Controllers check `job.postedBy === req.user.userId` etc.

### 3.5 API Security

- Helmet (secure headers)
- CORS (whitelist CLIENT_URL)
- Rate limiting (auth: 15/15min; API: 200/15min prod)
- Input sanitization (express-mongo-sanitize, custom sanitizeInput)
- HPP (HTTP Parameter Pollution)
- Body size limit (1mb)

---

## 4. Frontend Engineering (React)

### 4.1 Architecture

```
src/
├── api/           # apiClient, interceptors
├── components/    # Reusable UI
├── context/       # AuthContext, ThemeContext
├── hooks/         # Custom hooks
├── layouts/       # AppLayout
├── pages/         # Route-level components
├── utils/         # Helpers
└── main.jsx, App.jsx
```

### 4.2 State Management

- **Server state:** TanStack Query (cache, refetch, mutations)
- **Auth state:** AuthContext (user, login, logout)
- **UI state:** React state, URL params for filters
- **No Redux** for current scope; add Zustand if needed for complex client state

### 4.3 Performance

- Vite for fast HMR and builds
- React.lazy + Suspense for route-level code splitting
- TanStack Query caching (staleTime, cacheTime)
- Image lazy loading (native or library)

### 4.4 Accessibility & Responsiveness

- Semantic HTML, ARIA where needed
- Tailwind responsive utilities (sm:, md:, lg:)
- Focus management in modals

---

## 5. Data Layer (MongoDB)

### 5.1 Schema Design

**User:** fullName, email, password, role, profile fields, savedJobs, refreshToken, etc.  
**Company:** name, website, location, description, logoUrl, createdBy  
**Job:** title, description, location, employmentType, experienceLevel, skills, company, postedBy, isActive  
**Application:** job, candidate, coverLetter, status (applied|shortlisted|rejected|hired)  
**JobAlert:** userId, keywords, location, employmentType  
**Notification:** userId, type, title, message, link, read

### 5.2 Indexes

- Job: `{ title: "text", description: "text", skills: "text", location: "text" }`
- Job: `{ isActive: 1 }`, `{ company: 1 }`, `{ postedBy: 1 }`
- Application: `{ job: 1 }`, `{ candidate: 1 }`
- User: `{ email: 1 }` (unique)

### 5.3 Transactions

- Use `session.startTransaction()` for multi-document operations (e.g., create job + update company stats)
- Replica set required for transactions

### 5.4 Migration Strategy

- Mongoose schema versioning or migration scripts
- Backward-compatible schema changes first

---

## 6. Performance & Scalability

### 6.1 Caching

- **Redis:** Session store, cache hot job lists (TTL 5–15 min)
- **HTTP:** Cache-Control for static assets; CDN for frontend

### 6.2 Horizontal Scaling

- Stateless API; scale with multiple Node processes
- Nginx/load balancer in front
- MongoDB Atlas (auto-scaling)

### 6.3 Critical Path Optimization

- Paginate all list endpoints
- Lean queries; limit populated fields
- Index all filter/sort fields

---

## 7. Security & Compliance

### 7.1 OWASP Top 10

- **Injection:** Sanitize input; parameterized queries (Mongoose)
- **Broken Auth:** Strong JWT secrets; httpOnly cookies for refresh
- **XSS:** React escapes by default; CSP via Helmet
- **CSRF:** SameSite cookies; consider CSRF tokens for state-changing ops
- **Sensitive Data:** HTTPS; no secrets in client; env vars for secrets

### 7.2 RBAC Matrix

| Resource | Candidate | Recruiter | Admin |
|----------|-----------|-----------|-------|
| Own profile | CRUD | — | R |
| Jobs (public) | R | R | R |
| Jobs (own) | — | CRUD | CRUD |
| Applications (own) | R | — | R |
| Applications (job) | — | R, update status | R, update |
| Companies (own) | — | CRUD | R |
| Users | — | — | R, block |
| Admin stats | — | — | R |

---

## 8. DevOps & Infrastructure

### 8.1 Environments

- `development` – local
- `staging` – pre-production
- `production` – live

### 8.2 Docker

```dockerfile
# Backend
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["node", "src/server.js"]
```

### 8.3 CI/CD

- GitHub Actions: lint, test, build
- Deploy: Render / Railway / AWS / Vercel (frontend) + backend on cloud

### 8.4 Domains & SSL

- Custom domain; SSL via Let's Encrypt or cloud provider

---

## 9. Testing Strategy

| Type | Tool | Scope |
|------|------|-------|
| Unit | Jest | Services, utils |
| Integration | Supertest | API routes |
| E2E | Playwright | Critical flows |
| Frontend | Vitest + RTL | Components, hooks |

**Coverage target:** 70%+ for critical paths (auth, jobs, applications)

---

## 10. Observability

- **Logging:** Winston (structured JSON in prod)
- **Request ID:** uuid per request; include in logs and res headers
- **Monitoring:** Uptime, error rate, latency (Sentry, Datadog, or cloud-native)
- **Alerting:** On error spike, latency degradation

---

## 11. Code Quality

- ESLint (backend + frontend)
- Prettier (consistent formatting)
- Pre-commit hooks (lint-staged)
- Code review for main branch

---

## 12. Production Readiness

- Graceful shutdown (SIGTERM/SIGINT)
- Health check endpoint (`/api/health`)
- Retry for external services (email, Cloudinary)
- Circuit breaker for optional services (Redis)
- Backup strategy (MongoDB Atlas automated backups)
- Rollback plan (blue-green or similar)

---

## 13. Delivery Expectations

- Production-quality code; no pseudo-code
- Documented decisions in this architecture
- Incremental delivery; each phase shippable
- Technical mentorship in implementation

---

## Appendix: Module Map

| Module | Routes | Controller | Models |
|--------|--------|------------|--------|
| Auth | /auth/* | authController | User |
| Jobs | /jobs/* | jobController | Job |
| Applications | /applications/* | applicationController | Application |
| Companies | /companies/* | companyController | Company |
| Users | /users/* | userController | User |
| Admin | /admin/* | adminController | User, Job, Application, Company |
| Job Alerts | /job-alerts/* | jobAlertController | JobAlert |
| Notifications | /notifications/* | notificationController | Notification |
