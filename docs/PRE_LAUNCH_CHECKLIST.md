# Pre-launch checklist (production)

Use this before pointing a real domain and users at the stack. Details: `docs/DEPLOYMENT.md`.

## Origins & CORS

- [ ] **`CLIENT_URL`** lists every browser origin that calls the API, comma-separated, **exact** scheme + host + port (no trailing slash). Includes production Vercel URL and any preview origins that share this API.
- [ ] **`Idempotency-Key`** is in CORS allowlist (`backend/src/config/security.js`) so cross-origin POSTs (e.g. apply) can send it; verify with OPTIONS or browser devtools.

## Reverse proxy

- [ ] **`TRUST_PROXY_HOPS`** matches your host (typically **1** on Render/nginx). Wrong value breaks rate limits and `req.ip`-based audit fields. See `docs/DEPLOYMENT.md` “Reverse proxy”.

## Metrics & secrets

- [ ] **`METRICS_TOKEN`** set to a long random value; **`GET /api/metrics`** only reachable with header `X-Metrics-Token` (or block at edge).
- [ ] No secrets in git; production env from host secret store.

## Cookies & CSRF

- [ ] Production uses **HTTPS** so `Secure` cookies apply as configured in `authCookies` / env.
- [ ] **`COOKIE_SAME_SITE`** appropriate for SPA host vs API host (cross-site API + cookies often needs `none` + `Secure` — confirm against your actual layout).
- [ ] CSRF: authenticated mutations send **`X-CSRF-Token`** matching the CSRF cookie (see integration tests with `CSRF_ENFORCE_IN_TEST`).

## Helmet / CSP: API vs SPA

- **API (`Helmet` in `app.js`):** Applies to **JSON responses** from Express. `contentSecurityPolicy` in `backend/src/config/security.js` is mainly relevant if anything renders HTML from the API (normally it does not).
- **SPA (`vercel.json`):** Sets `X-Frame-Options`, `X-Content-Type-Options`, etc. for **static HTML/JS** from Vercel. It does **not** replace API security headers.
- [ ] **Browser → API calls** are allowed by CORS `CLIENT_URL`, not by API CSP `connectSrc` (CSP governs browser subresources on a **document** served by that origin; your SPA’s fetches are governed by the **page origin** + CORS on the API).

## Email & Redis

- [ ] For **contractual** mail and job alerts: **`REDIS_URL`** + **`npm run worker:email`** + **`npm run worker:job-alert-digest`** (see `render.yaml`). Otherwise acknowledge **best-effort** in-process path in `DEPLOYMENT.md`.

## Data & compliance

- [ ] Atlas: backups, IP allowlist, app DB user least privilege (`docs/MONGODB_ATLAS.md`).
- [ ] Privacy stance: `docs/PRIVACY_AND_DATA.md` (EU/UK vs single region).

## Smoke

- [ ] `GET /api/health` and `GET /api/ready` from monitor or load balancer.
- [ ] Register → login → apply (with `Idempotency-Key`) on staging.
