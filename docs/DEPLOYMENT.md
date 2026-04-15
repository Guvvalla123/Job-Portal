# Deployment Guide

## Environment strategy

| Environment | Purpose | Key config |
|-------------|---------|------------|
| **development** | Local dev | `.env` with local MongoDB, `CLIENT_URL=http://localhost:5173` |
| **test** | CI / unit tests | `NODE_ENV=test`, MongoDB service, `CSRF_ENFORCE_IN_TEST=true` for integration tests |
| **staging** | Pre-production | Staging DB, real TLS, `RATE_LIMIT_ENABLED=true`, `TRUST_PROXY_HOPS` matches host |
| **production** | Live | Atlas + secrets manager, `NODE_ENV=production`, Redis + workers for email |

## Administrator MFA (TOTP)

- **Optional org policy:** set **`ADMIN_MFA_REQUIRED=true`** in production so every user with role `admin` must enroll an authenticator before **`/api/v1/admin/*`** returns data (see `requireAdminPortalAccess` + `amfa` on JWTs in `backend/src/services/authService.js`).
- **Required env when policy is on:** **`MFA_ENCRYPTION_KEY`** (min **32** characters) encrypts stored TOTP secrets (`backend/src/utils/mfaSecretCrypto.js`).
- **Enrollment:** `POST /api/v1/auth/mfa/setup` (authenticated admin) → `POST /api/v1/auth/mfa/enable` with `{ secret, code }`, or use the SPA **`/admin/security`** page.
- **Sign-in:** after password, admins with MFA enabled receive **`mfaRequired` + `mfaToken`** from `POST /auth/login`, then `POST /auth/mfa/verify-login` with `{ mfaToken, code }` (handled in the login UI).

## Stronger env validation (optional flags)

| Variable | Effect |
|----------|--------|
| **`REQUIRE_SMTP=true`** | Boot fails unless `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` are set. |
| **`REQUIRE_REDIS_IN_PRODUCTION=true`** | In `NODE_ENV=production`, boot fails if `REDIS_URL` is unset. |
| **`ADMIN_MFA_REQUIRED=true`** | In production, requires `MFA_ENCRYPTION_KEY` and enforces admin enrollment (see above). |

All are parsed in **`backend/src/config/env.js`**.

## Reverse proxy (Express `trust proxy`)

Render, nginx, and similar sit **one hop** in front of Node. Without `trust proxy`, `req.ip` and **express-rate-limit** key off the proxy IP, not the client.

- **Default:** `trustProxyHops` is **1** when `NODE_ENV=production`, else **0** (see `backend/src/config/env.js`).
- **Override:** set `TRUST_PROXY_HOPS` to an integer `0–10` (e.g. staging validation).

**How to validate with two clients**

1. Deploy API with `TRUST_PROXY_HOPS=1` (or rely on production default).
2. From **machine A** and **machine B**, hit a rate-limited route (e.g. `POST /api/v1/auth/login` with wrong password) until limited.
3. Confirm **each client** gets its own limit (429) rather than one client starving the other because all traffic appears from the proxy IP.
4. Optional: log `req.ip` behind a temporary debug route and confirm it matches the **real** public IP (not the load balancer only).

See `backend/src/app.js` (`app.set("trust proxy", …)` immediately after `express()`).

## Observability

### Sentry (optional)

| Location | Variable | Notes |
|----------|----------|--------|
| Backend | `SENTRY_DSN` | Server DSN; omit in test (auto-disabled when `NODE_ENV=test`). |
| Backend | `SENTRY_RELEASE` | Optional; else `RENDER_GIT_COMMIT` / `GITHUB_SHA` used when set. |
| Frontend | `VITE_SENTRY_DSN` | Public browser DSN only (safe to expose). |
| Frontend | `VITE_SENTRY_RELEASE` | Optional build/release tag. |

5xx errors include **`request_id`** tag in Sentry when `req.id` is present (`backend/src/middlewares/errorHandler.js`).

**BullMQ (email queue):** when Redis is in use, `GET /api/metrics` (with token) includes gauge **`email_queue_jobs`** labeled by `state` (`waiting`, `active`, `failed`, etc.) refreshed on each scrape (`backend/src/config/metrics.js`). Use alerts on rising `failed` or sustained `waiting`. Workers do not expose HTTP—monitor worker logs and Redis/Render process health.

### Uptime checks

Configure your monitor (Render health checks, Better Stack, Pingdom, etc.) against:

- **Liveness:** `GET /api/health` — process up (no DB required).
- **Readiness:** `GET /api/ready` — MongoDB connected (`200` vs `503`).

## Email & Redis (production processes)

**If email and job alerts are contractual:** you **MUST** set **`REDIS_URL`** and run **three** processes in production:

1. **Web:** `node src/server.js` (from `backend/`)
2. **`npm run worker:email`** — transactional mail (applications, interviews, etc.)
3. **`npm run worker:job-alert-digest`** — DAILY/WEEKLY digest matches (IMMEDIATE alerts still need the email worker path)

Blueprint: `render.yaml` defines one web service and two workers—provision all three in Render (or equivalent).

**Without Redis (best-effort only):** the API logs `email_queue_direct_fallback` and increments `email_direct_fallback_*` (`backend/src/queues/emailQueue.js`). Mail runs in-process via `setImmediate`; **restarts drop unsent mail**; no shared queue depth. Suitable only when mail is non-critical.

`REDIS_URL` is optional in `backend/src/config/env.js` but **required** for the production story above.

## Idempotency & horizontal scale

`POST /api/v1/applications` supports **`Idempotency-Key`** (`backend/src/middlewares/idempotency.js`). The replay cache uses the same store as **`utils/cache.js`**:

- **`REDIS_URL` set** and **`cache.initRedis()`** on server start (`server.js`): responses are cached in **Redis** → safe across **multiple API instances** for the same key.
- **No `REDIS_URL`:** cache is **in-memory per Node process** → another instance does **not** see the same idempotency cache. **Final safety:** MongoDB **unique index** on `(job, candidate)` (`Application` model). A duplicate insert returns **`409`** with code **`DUPLICATE_KEY`** (`MongoServerError` 11000) or **`409`** **`CONFLICT`** from `applicationService` (“You already applied…”) when the app detects an existing row first.

Operators should assume **strict cross-instance dedup for the middleware layer** requires Redis; the DB still prevents double applications.

## Logging, PII, and error reporting

- **Do not** log passwords, refresh tokens, raw `Authorization` headers, or full request bodies in application code. Winston logs **error message + stack** in non-test (`errorHandler.js`); avoid putting user passwords into thrown `Error` messages.
- **API error JSON** to clients should stay generic for 500s in production (`errorHandler.js`).
- **Sentry:** backend uses `sendDefaultPii: false` and redacts `request.data` / cookies in `beforeSend` (`config/sentry.js`). Add org-level scrubbing rules in Sentry for field names (`email`, `password`, etc.).
- **Audit logs** store IP and user agent by design (`auditLogService.js`)—treat as operational data with retention (`AUDIT_LOG_TTL_DAYS`).

## User data export (portability)

Authenticated users may call **`GET /api/v1/users/me/data-export`** (JSON attachment). The candidate dashboard includes a **Download my data** action on the profile tab. This complements Atlas backups; it does not replace them — keep an operational backup runbook in your org (MongoDB Atlas snapshots, etc.).

## Pre-launch checklist

Before go-live: validate CORS, `TRUST_PROXY_HOPS`, `METRICS_TOKEN`, CSRF/cookies, Redis/workers, admin MFA policy, and run smoke tests against staging. See **`PROJECT_STATUS.txt`** (root) for current gaps.

## Render (`render.yaml`)

The repo includes **`render.yaml`** as a blueprint: web service + two workers. Set **sync: false** secrets in the Render dashboard (Mongo URI, JWT, Cloudinary, `CLIENT_URL`, optional Redis, SMTP, Sentry). **Do not** commit real secrets.

- **Health check path:** `/api/health`
- **Start command (web):** `node src/server.js` (from `backend/`)

## Vercel (frontend)

`vercel.json` sets `rootDirectory: frontend`, build output `dist`, and SPA rewrite to `index.html`.

### Env checklist

| Variable | Production | Preview |
|----------|------------|---------|
| `VITE_API_URL` | Full HTTPS API origin ending in `/api/v1` **or** same-origin proxy path if you proxy | Same, or preview API URL |
| `VITE_SITE_URL` | Canonical frontend URL | Preview URL pattern if SEO scripts matter |
| `VITE_SENTRY_DSN` | Browser DSN | Optional |
| `VITE_SENTRY_RELEASE` | Git SHA / version | Optional |

Backend **`CLIENT_URL`** must list the **exact** Vercel production origin (and preview origins if you use preview deployments with the same API).

## Docker & CI

See root `README.md` for `docker compose`. GitHub Actions (`.github/workflows/ci.yml`) runs backend lint/test, frontend lint/test/build, and optional **Playwright** flow when configured.

### E2E (CI)

The `e2e` job seeds Mongo (`backend/scripts/e2e-seed.js`), starts the API, builds the SPA with `VITE_API_URL` pointing at the API, runs `vite preview`, then `E2E_FULL=1 playwright test`. Locally:

```bash
# Terminal 1 — API
cd backend && npm run dev

# Terminal 2 — seed once
node backend/scripts/e2e-seed.js

# Terminal 3 — build + preview
cd frontend && VITE_API_URL=http://127.0.0.1:5000/api/v1 npm run build && npx vite preview --port 4173 --host 127.0.0.1

# Terminal 4
cd frontend && E2E_FULL=1 npm run test:e2e
```

## Rollback

- **Vercel:** promote previous deployment.
- **Render:** redeploy previous commit or image.
- **Database:** backward-compatible migrations only; avoid breaking API and DB in one irreversible step.

## Security

- Never commit `.env` or secrets.
- Rotate JWT and Cloudinary credentials on compromise.
- Keep `CLIENT_URL` aligned with deployed SPA origins (CORS + cookies).

## Related docs

- `docs/ARCHITECTURE.md` — system design and modules.
- `docs/api/API_CONTRACT.md` — API overview + `docs/api/openapi.yaml`.
- `docs/PROJECT_STATUS.md` — honest build/testing/feature status (updated with the codebase).

## CVE / dependency policy

Dependabot opens weekly PRs (`.github/dependabot.yml`). Merge patch/minor updates after CI green; review major bumps for breaking changes. Run `npm audit` locally for urgent advisories.
