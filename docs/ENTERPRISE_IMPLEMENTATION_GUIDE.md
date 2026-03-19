# Enterprise-Grade Implementation Guide

This document provides step-by-step implementation guidance for evolving the MERN Job Portal to enterprise standards. Each section includes trade-offs, production considerations, and scalability implications.

---

## 1. Authentication Hardening

### Current State
- Access + refresh tokens issued on login
- Refresh token stored in User document (single token per user)
- No refresh endpoint, no logout, no token revocation

### 1.1 Refresh Token Rotation

**Implementation Steps:**

1. **Add `POST /api/v1/auth/refresh` endpoint**
   - Accept `refreshToken` in body (or HttpOnly cookie for XSS mitigation)
   - Verify refresh token (signature + expiry)
   - **Critical:** Check token is in DB and matches stored hash (prevents reuse)
   - Issue new access + refresh tokens
   - Invalidate old refresh token (delete from DB or mark revoked)
   - Return new tokens

2. **Store refresh tokens with metadata**
   - Option A: Keep single `refreshToken` on User (current) – simpler but no multi-device revocation
   - Option B: New `RefreshToken` collection: `{ userId, tokenHash, deviceInfo, expiresAt, revokedAt }` – enables per-device revocation and session tracking

**Trade-off:** Option B adds complexity but is required for "logout all devices" and session management. For high traffic, use Redis for token lookup instead of MongoDB.

3. **Frontend:** On 401, call `/refresh` before redirecting to login. Store refresh token in HttpOnly cookie (recommended) or memory; avoid localStorage for refresh token.

**Code locations:**
- `backend/src/routes/authRoutes.js` – add refresh route
- `backend/src/controllers/authController.js` – refresh handler
- `backend/src/services/authService.js` – `refreshTokens(oldRefreshToken)`
- `backend/src/utils/jwt.js` – add `verifyRefreshToken`

---

### 1.2 Token Revocation / Blacklisting

**Implementation Steps:**

1. **Blacklist approach (recommended for stateless access tokens):**
   - On logout/revoke: add `jti` (JWT ID) or token fingerprint to Redis set with TTL = access token expiry
   - In `requireAuth`: after verifying JWT, check Redis blacklist; if present, reject with 401
   - Key format: `blacklist:access:{jti}` or `blacklist:access:{hash}`

2. **Refresh token revocation:**
   - Delete from DB/Redis or set `revokedAt`
   - On refresh: reject if token is revoked

3. **Bulk revocation (e.g. password change):**
   - Invalidate all refresh tokens for user
   - Optionally blacklist all access tokens for user (requires tracking; simpler: short access token TTL so they expire quickly)

**Trade-off:** Blacklisting adds a Redis lookup per authenticated request. Acceptable for most workloads; use connection pooling.

---

### 1.3 Secure Logout Flow

**Implementation Steps:**

1. **Add `POST /api/v1/auth/logout`**
   - Require auth (Bearer token)
   - Blacklist current access token (add to Redis with TTL)
   - Revoke current refresh token (delete or mark revoked)
   - Return 204

2. **Optional: `POST /api/v1/auth/logout-all`**
   - Revoke all refresh tokens for user
   - Blacklist not feasible for all access tokens; rely on short TTL (e.g. 15 min)

3. **Frontend:** On logout, call `/logout`, clear tokens, redirect to `/login`

---

### 1.4 Session Tracking Strategy

**Implementation Steps:**

1. **Create `Session` model or use `RefreshToken` with metadata:**
   ```
   { userId, refreshTokenHash, deviceInfo, ip, userAgent, createdAt, lastActiveAt, revokedAt }
   ```

2. **Endpoints:**
   - `GET /api/v1/auth/sessions` – list active sessions for current user
   - `DELETE /api/v1/auth/sessions/:id` – revoke specific session
   - `DELETE /api/v1/auth/sessions` – revoke all other sessions (keep current)

3. **On each refresh:** Update `lastActiveAt` for the session.

**Trade-off:** Session table grows; add TTL/index to auto-expire old entries. Consider Redis for active sessions if scale is high.

---

## 2. Advanced Authorization (ABAC)

### Current State
- RBAC: `requireRole('recruiter', 'admin')` on routes
- Resource ownership checked in services (e.g. `job.postedBy === userId`)

### 2.1 Resource-Level Permissions (ABAC)

**Implementation Steps:**

1. **Define permission matrix:**
   | Resource   | Action   | Owner Check              | Role Check        |
   |-----------|----------|--------------------------|-------------------|
   | Job       | update   | postedBy === userId      | recruiter, admin  |
   | Job       | delete   | postedBy === userId      | recruiter, admin  |
   | Company   | update   | createdBy === userId     | recruiter, admin  |
   | Application| create  | applicant === userId      | candidate         |
   | Application| read   | applicant OR job.postedBy| candidate, recruiter |

2. **Create `requireOwnership(resource, ownerField)` middleware:**
   - Load resource by ID from params
   - Check `resource[ownerField].toString() === req.user.userId`
   - Admin bypass: `if (req.user.role === 'admin') return next()`
   - Attach resource to `req` for downstream use

3. **Create `requireResourcePermission(resourceType, action)` middleware:**
   - Generic: loads resource, checks ownership + role based on config
   - Use a permissions config object to avoid repetition

**Example:**
```javascript
// middlewares/authorize.js
const PERMISSIONS = {
  job: { update: { roles: ['recruiter','admin'], ownerField: 'postedBy' }, ... },
  application: { read: { roles: ['candidate','recruiter','admin'], ownerField: 'applicant' }, ... },
};
const requireResource = (resourceType, action) => async (req, res, next) => {
  const resource = await loadResource(resourceType, req.params.id);
  if (!resource) return next(new ApiError(404, 'Not found'));
  const config = PERMISSIONS[resourceType][action];
  if (req.user.role === 'admin') return next();
  if (config.roles && !config.roles.includes(req.user.role)) return next(new ApiError(403, 'Forbidden'));
  if (config.ownerField && resource[config.ownerField].toString() !== req.user.userId)
    return next(new ApiError(403, 'Not authorized to access this resource'));
  req[resourceType] = resource;
  next();
};
```

4. **Apply to routes:**
   - `PUT /jobs/:id` → `requireAuth`, `requireRole`, `requireResource('job','update')`, then controller
   - `GET /applications/:id` → `requireAuth`, `requireResource('application','read')` (with special logic for recruiter viewing applicant's application)

---

### 2.2 Fine-Grained Access Control Middleware

**Implementation Steps:**

1. **Centralize permission checks** in `backend/src/config/permissions.js`
2. **Use route-level middleware composition:** `requireAuth` → `requireRole` → `requireResource`
3. **For cross-resource checks** (e.g. recruiter viewing application for their job): add `requireJobOwner` or similar that loads job, checks `job.postedBy`, then loads application and verifies `application.job` matches

---

## 3. Audit Logging

### Implementation Steps

1. **Create `AuditLog` model:**
   ```
   { userId, action, resourceType, resourceId, changes?, ip, userAgent, timestamp }
   ```
   - `action`: 'create' | 'update' | 'delete' | 'login' | 'logout'
   - `changes`: for update, store `{ field: { old, new } }` (optional, for debugging)

2. **Create `auditLogService.log({ userId, action, resourceType, resourceId, req })`**
   - Extract ip, userAgent from `req`
   - Write to DB (async, non-blocking)

3. **Middleware `auditAction(action, resourceType, getResourceId)`**
   - Wraps route handler
   - On success (res.statusCode < 400): call `auditLogService.log` with `resourceId` from `req.params` or `getResourceId(req)`

4. **Apply to critical routes:**
   - Auth: login, logout, password reset
   - Jobs: create, update, delete
   - Applications: create, status change
   - Users: profile update, role change (admin)

5. **Storage considerations:**
   - **MongoDB:** Simple, queryable. Use TTL index (e.g. 90 days) for retention.
   - **High volume:** Write to a separate audit DB or use a log aggregation service (e.g. Elasticsearch, Datadog) to avoid impacting main DB.
   - **Async:** Use `setImmediate` or a queue so audit write doesn't block response.

**Trade-off:** Sync audit adds latency. Async is preferred; ensure logs are written even on process crash (queue with ack).

---

## 4. Advanced Rate Limiting

### Current State
- Global: 200 req/15min per IP
- Auth: 10 req/15min per IP

### 4.1 Per-User and Per-IP Limits

**Implementation Steps:**

1. **Use `express-rate-limit` with custom `keyGenerator`:**
   ```javascript
   keyGenerator: (req) => {
     const ip = req.ip || req.connection.remoteAddress;
     const userId = req.user?.userId;
     return userId ? `user:${userId}` : `ip:${ip}`;
   }
   ```
   - Requires Redis store for distributed rate limiting (multiple instances)

2. **Install `rate-limit-redis`:**
   ```javascript
   const RedisStore = require('rate-limit-redis');
   const redis = new Redis(process.env.REDIS_URL);
   rateLimit({ store: new RedisStore({ client: redis }), keyGenerator, ... });
   ```

3. **Different limits:**
   - Anonymous: 50/15min
   - Authenticated: 300/15min
   - Premium/Admin: 1000/15min (optional)

---

### 4.2 Per-Endpoint Strategies

**Implementation Steps:**

1. **Create rate limit presets:**
   - `strict`: 5/15min (password reset, sensitive)
   - `auth`: 10/15min (login, register)
   - `write`: 50/15min (POST/PUT/DELETE)
   - `read`: 200/15min (GET list)
   - `search`: 30/15min (expensive queries)

2. **Apply per route:**
   - `/auth/forgot-password` → strict
   - `/auth/login`, `/auth/register` → auth
   - `/jobs` GET → read
   - `/jobs` POST → write
   - `/jobs/:id` PUT/DELETE → write

3. **Skip rate limit for health/ready** (already done)

---

### 4.3 Burst vs Sustained

**Implementation Steps:**

1. **Sliding window:** `express-rate-limit` uses fixed window by default. For sliding window, use `rate-limit-redis` with a custom implementation or a library like `express-slow-down` for gradual throttling.

2. **Burst handling:**
   - Option A: Two limits – e.g. 10/min sustained + 30/min burst (requires custom store)
   - Option B: Use `windowMs` and `max` – e.g. 100/15min allows bursts up to 100 then blocks
   - Option C: `express-slow-down` – delays responses after threshold instead of hard block (better UX for bursts)

3. **Recommended:** Start with `express-rate-limit` + Redis store + per-endpoint limits. Add `express-slow-down` for search/expensive endpoints if needed.

---

## 5. Caching Strategy

### Current State
- Job list first page cached 3 min (no filters)
- Generic cache with TTL

### 5.1 Cache Invalidation Rules

**Implementation Steps:**

1. **Define invalidation triggers:**
   | Event           | Invalidate Keys                    |
   |----------------|-----------------------------------|
   | Job created    | `jobs:list:*`                     |
   | Job updated    | `jobs:list:*`, `jobs:detail:{id}` |
   | Job deleted    | `jobs:list:*`, `jobs:detail:{id}` |
   | Company updated| `companies:detail:{id}`, `jobs:list:*` if jobs affected |

2. **Create `cache.invalidatePattern(prefix)`** (Redis):
   - Use `SCAN` + `DEL` for keys matching `prefix*`
   - In-memory fallback: maintain key registry by prefix or flush all (simpler)

3. **Call invalidation in services** after create/update/delete:
   ```javascript
   await jobRepository.create(...);
   await cache.invalidatePattern('jobs:list');
   ```

---

### 5.2 TTL Per Resource

**Implementation Steps:**

1. **Define TTL config:**
   ```javascript
   const CACHE_TTL = {
     jobsList: 180,      // 3 min
     jobDetail: 300,     // 5 min
     companyDetail: 600, // 10 min
     userProfile: 60,    // 1 min (frequently updated)
   };
   ```

2. **Use in cache calls:**
   ```javascript
   await cache.set(key, data, CACHE_TTL.jobsList);
   ```

---

### 5.3 Stale-While-Revalidate

**Implementation Steps:**

1. **Pattern:** Serve stale data immediately, revalidate in background, update cache.
2. **Implementation:**
   - On cache hit: return data, and if TTL > 80% expired, trigger async refresh (don't await)
   - On cache miss: fetch, set cache, return
3. **Trade-off:** More complex; adds code paths. Consider for high-traffic read endpoints (job list). Simpler: just use short TTL and accept occasional stale data.

---

## 6. Background Processing

### Current State
- `notifyAlertsForJob` runs synchronously after job create (`.catch` for errors)
- `sendMail` in forgot-password is sync

### 6.1 Job Queue (BullMQ)

**Implementation Steps:**

1. **Install BullMQ:** `npm i bullmq`

2. **Create queue and worker:**
   - `backend/src/queues/emailQueue.js` – define queue with Redis connection
   - `backend/src/workers/emailWorker.js` – process jobs: send mail, handle retries

3. **Job types:**
   - `send-password-reset`
   - `send-job-alert`
   - `send-email-verification`
   - `send-notification`

4. **Replace sync calls:**
   ```javascript
   // Before: await sendMail(...)
   // After:  await emailQueue.add('send-password-reset', { to, subject, html });
   ```

5. **Worker process:**
   - Run worker in separate process: `node src/workers/emailWorker.js`
   - Or use same process (simpler but blocks on job processing)
   - For production: separate worker process or container

6. **Retry config:** BullMQ default 3 retries with exponential backoff. Configure per job type if needed.

**Trade-off:** Adds Redis dependency and operational complexity. Essential for reliability when sending many emails. Alternative: use a transactional email service (SendGrid, SES) with built-in retries.

---

### 6.2 Job Alert Processing

**Implementation Steps:**

1. **Queue job on job create:**
   ```javascript
   await jobQueue.add('notify-alerts', { jobId: job._id });
   ```

2. **Worker:** Load job, call `notifyAlertsForJob`, send emails via email queue (or inline).

3. **Batch emails:** For many matches, chunk into batches of 10–50 to avoid memory spikes.

---

## 7. Observability Upgrade

### 7.1 Metrics (Latency, Throughput)

**Implementation Steps:**

1. **Choose stack:**
   - **Prometheus + Grafana:** Open-source, pull-based, widely used
   - **Cloud:** Datadog, New Relic, AWS CloudWatch – easier setup, cost at scale

2. **Add `prom-client` (Prometheus):**
   ```javascript
   const { register, Counter, Histogram } = require('prom-client');
   const httpRequestDuration = new Histogram({...});
   const httpRequestTotal = new Counter({...});
   ```

3. **Middleware to record:**
   - Request duration (histogram)
   - Request count by method, path, status (counter)
   - Run before `logRequest` or integrate with it

4. **Expose `/metrics` endpoint:**
   - `app.get('/metrics', (req, res) => { res.set('Content-Type', register.contentType); res.end(register.metrics()); });`
   - Restrict to internal network or add auth in production

---

### 7.2 Monitoring Integration

**Implementation Steps:**

1. **Grafana dashboards:**
   - Request rate, error rate, p95/p99 latency
   - DB connection pool, Redis latency
   - Queue depth (BullMQ)

2. **Alerts:**
   - Error rate > 5%
   - p99 latency > 2s
   - Health/ready failing
   - Queue backlog > 1000

3. **Log aggregation:** Ensure Winston logs to stdout; use Datadog/ELK/Loki to collect and query.

---

## 8. Infrastructure Enhancements

### 8.1 Reverse Proxy (Nginx)

**Current State:** Nginx in frontend Dockerfile proxies `/api` to backend.

**Enhancements:**

1. **Move Nginx to dedicated service** (or use cloud load balancer):
   - Single entry point for API + static assets
   - SSL termination at Nginx
   - Gzip (already in Express; Nginx can also compress)

2. **Example config (API + static):**
   ```nginx
   upstream backend {
     server backend:5000;
     keepalive 32;
   }
   server {
     listen 443 ssl;
     ssl_certificate /etc/ssl/cert.pem;
     ssl_certificate_key /etc/ssl/key.pem;
     location /api {
       proxy_pass http://backend;
       proxy_http_version 1.1;
       proxy_set_header Connection "";
       proxy_set_header Host $host;
       proxy_set_header X-Real-IP $remote_addr;
       proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
       proxy_set_header X-Forwarded-Proto $scheme;
     }
     location / {
       root /usr/share/nginx/html;
       try_files $uri $uri/ /index.html;
     }
   }
   ```

---

### 8.2 CDN for Frontend Assets

**Implementation Steps:**

1. **Build with hashed filenames** (Vite default: `[name].[hash].js`)
2. **Upload `dist/` to S3/GCS** or use Vercel/Netlify
3. **Configure CDN (CloudFront, Cloudflare):**
   - Origin: S3 or Nginx
   - Cache static assets (js, css, images) with long TTL (1 year)
   - `index.html` – short TTL or no cache
4. **Set `Cache-Control` headers** on origin for static assets

---

### 8.3 Load Balancing

**Implementation Steps:**

1. **Horizontal scaling:** Run multiple backend instances behind Nginx/ALB
2. **Sticky sessions:** Not needed for JWT (stateless)
3. **Shared state:** Redis for rate limit, cache, blacklist, queues
4. **DB connection pool:** Mongoose handles per-process pool; ensure `maxPoolSize` is appropriate (e.g. 10 per instance)

---

## 9. Production Safety

### 9.1 Circuit Breaker / Retry Patterns

**Implementation Steps:**

1. **For external calls** (email, Cloudinary, third-party APIs):
   - Use `opossum` or similar circuit breaker library
   - Config: failureThreshold 5, resetTimeout 30s
   - Fallback: log error, return degraded response or queue for retry

2. **Retry with backoff:**
   - Use `p-retry` or BullMQ retries for async jobs
   - Exponential backoff: 1s, 2s, 4s, 8s

3. **MongoDB:** Mongoose has built-in retry for connection. For queries, consider retry on transient errors (e.g. network timeout).

---

### 9.2 Failure Handling and Resilience

**Implementation Steps:**

1. **Graceful shutdown:** Already implemented (SIGTERM/SIGINT)
2. **Health/Ready:** Already implemented; ensure K8s/ECS use them for probes
3. **Timeout propagation:** Set timeouts on outbound HTTP (axios, fetch) and DB queries
4. **Error boundaries:** Frontend has ErrorBoundary; ensure API errors return consistent format
5. **Idempotency:** For critical operations (e.g. payment, application submit), support idempotency key in header to prevent duplicate processing

---

## Implementation Priority

| Priority | Area                    | Effort | Impact | Recommended Order |
|----------|-------------------------|--------|--------|------------------|
| 1        | Auth: Refresh + Logout  | Medium | High   | 1st              |
| 2        | Token blacklist         | Low    | High   | 2nd              |
| 3        | ABAC / resource ownership | Medium | High | 3rd              |
| 4        | Audit logging           | Medium | High   | 4th              |
| 5        | Background queue        | Medium | High   | 5th              |
| 6        | Advanced rate limiting  | Low    | Medium | 6th              |
| 7        | Cache invalidation      | Low    | Medium | 7th              |
| 8        | Metrics + monitoring    | Medium | High   | 8th              |
| 9        | Circuit breaker         | Low    | Medium | 9th              |
| 10       | CDN / load balancing    | Low    | Medium | As needed        |

---

## Summary

This guide provides a roadmap for enterprise hardening. Start with authentication (refresh, logout, blacklist) and authorization (ABAC), then add audit logging and background processing. Observability and infrastructure improvements can follow as traffic grows. Each change should be tested in staging and rolled out incrementally.
