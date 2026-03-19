# Interview Questions – MERN Job Portal

Questions organized by area: Backend, Frontend, System Design, and DevOps.

---

## Backend

### Authentication & Security

1. **How does JWT refresh token rotation work, and why is it more secure than a long-lived token?**
   - *Answer:* On refresh, we issue new access + refresh tokens and invalidate the old refresh token. If a token is reused (e.g. stolen), we detect it and revoke all sessions. Rotation limits the damage window.

2. **What is token blacklisting, and when do we use it?**
   - *Answer:* We store revoked access token `jti` in Redis with TTL = remaining expiry. On each authenticated request, we check the blacklist. Used on logout to invalidate the current token immediately.

3. **How do you prevent NoSQL injection in MongoDB?**
   - *Answer:* Input sanitization middleware strips `$` and `.` from user input, limits recursion depth, and validates with Zod. Never pass raw user input into queries.

4. **What is the difference between RBAC and ABAC?**
   - *Answer:* RBAC = role-based (e.g. recruiter can update jobs). ABAC = attribute-based, adds resource ownership (e.g. recruiter can only update *their* jobs). We use both: `requireRole` + `requireJobOwner`.

### Architecture & Design

5. **Explain the Controller → Service → Repository pattern.**
   - *Answer:* Controllers handle HTTP, call services for business logic. Services orchestrate, call repositories for data access. Repositories only talk to DB. Keeps concerns separated and testable.

6. **Why use a job queue (BullMQ) for emails instead of sending synchronously?**
   - *Answer:* Emails can fail or be slow. Queuing decouples the request from delivery, allows retries, and prevents request timeouts. User gets fast response; email is sent in background.

7. **What is idempotency, and why is it important for application submission?**
   - *Answer:* Same request executed multiple times produces the same result. User might double-click or retry on network failure. With `Idempotency-Key`, we cache the first response and return it for duplicates.

8. **How does cache stampede protection work?**
   - *Answer:* When many requests miss cache at once, all hit DB. We use probabilistic early expiry: when cache age > 80% of TTL, 10% of requests trigger async refresh. Others get stale data; DB load is reduced.

### Data & Performance

9. **How do you invalidate cache when a job is updated?**
   - *Answer:* On job create/update/delete, we call `cache.invalidatePattern('jobs:list')` to remove all job list cache entries. Redis uses SCAN + DEL; in-memory iterates keys.

10. **What indexes would you add for the job search query?**
    - *Answer:* Compound index on `(title, location, employmentType, isActive)`. Text index on `title`, `description`, `skills` if full-text search is needed.

---

## Frontend

### React & State

11. **Why use React Query instead of useEffect for data fetching?**
    - *Answer:* Caching, background refetch, stale-while-revalidate, retries, loading/error states. Reduces boilerplate and handles edge cases (e.g. tab focus refetch).

12. **How does the 401 interceptor handle token refresh?**
    - *Answer:* On 401, we check for refresh token. If present, call `/auth/refresh`. On success, retry the original request with new token. If refresh fails, clear storage and redirect to login. We use a queue for concurrent 401s so only one refresh runs.

13. **Why lazy-load routes?**
    - *Answer:* Reduces initial bundle size. Each page is loaded on demand. Improves first contentful paint and time to interactive.

14. **What is the purpose of ErrorBoundary?**
    - *Answer:* Catches React render errors in child components, shows fallback UI instead of blank screen. Prevents one broken component from crashing the whole app.

### UX & Performance

15. **How do you handle form validation?**
    - *Answer:* React Hook Form + Zod resolver. Client-side validation for UX; server validates with same schemas for security.

16. **What optimizations did you apply for production?**
    - *Answer:* Lazy loading, code splitting, QueryClient staleTime/retry, apiClient timeout, ErrorBoundary, compression (backend).

---

## System Design

### Scalability

17. **How would you scale this system to 1M users?**
    - *Answer:* Horizontal scaling of API (stateless). Redis for cache, rate limit, blacklist. Read replicas for MongoDB. CDN for static assets. BullMQ workers scale independently. Consider sharding by `userId` if DB becomes bottleneck.

18. **When would you split the monolith into microservices?**
    - *Answer:* When team size > 5–8 and needs independent deploys, or when one domain (e.g. job search) needs 10x the compute. Extract notification/email first (already async), then search if Elasticsearch is added.

19. **How do you handle eventual consistency in a job portal?**
    - *Answer:* Core flows (apply, create job) are synchronous and consistent. Notifications, job alerts, analytics are async and eventually consistent. Users accept slight delay for non-critical updates.

### Reliability

20. **What happens when Redis goes down?**
    - *Answer:* Cache falls back to in-memory (per instance). Token blacklist may allow recently logged-out tokens until they expire. Email queue falls back to direct send. Graceful degradation.

21. **How do you prevent duplicate application submissions?**
    - *Answer:* Idempotency-Key header + Redis cache. DB unique constraint on (job, candidate) as backup. First request creates application; duplicates return cached 201.

22. **What is a dead-letter queue, and why use it?**
    - *Answer:* Queue for jobs that fail after all retries. Allows inspection, manual replay, or alerting. Prevents losing failed work and helps debug recurring failures.

---

## DevOps

### Deployment

23. **Explain your Docker setup.**
    - *Answer:* Multi-stage builds for backend and frontend. Frontend built with Vite, served by nginx. Backend runs Node. docker-compose includes MongoDB, Redis. Full stack: backend, frontend, DB, Redis.

24. **What is the difference between liveness and readiness probes?**
    - *Answer:* Liveness: is the process alive? Restart if not. Readiness: can it accept traffic? (e.g. DB connected). Remove from load balancer if not ready. We use `/api/health` and `/api/ready`.

25. **How does your CI pipeline work?**
    - *Answer:* GitHub Actions on push/PR to main/develop. Backend: lint, test (with MongoDB service). Frontend: lint, test, build. Parallel jobs.

### Observability

26. **What metrics do you expose, and how would you alert?**
    - *Answer:* Prometheus: `http_request_duration_seconds`, `http_requests_total`. Alert on error rate > 5%, p99 latency > 2s, health/ready failing. SLO-based: error budget burn rate.

27. **How do you correlate logs across services?**
    - *Answer:* `requestId` (and `trace_id` with OpenTelemetry) in every log line. Log aggregator (Datadog, ELK) indexes by requestId for trace view.

28. **Why use structured logging (JSON) in production?**
    - *Answer:* Machine-parseable for log aggregators. Enables filtering, alerting, and dashboards. Consistent schema for `requestId`, `duration`, `status`.

---

## Behavioral / Scenario

29. **A user reports they applied twice by accident. How do you handle it?**
    - *Answer:* With Idempotency-Key, duplicate requests return the same 201. If they didn’t use it, we have a unique constraint on (job, candidate); second apply returns 409. We can add a “withdraw application” feature.

30. **The email worker is falling behind. What do you check?**
    - *Answer:* Queue depth, worker concurrency, SMTP latency, failure rate. Scale workers, add more concurrency, check circuit breaker. Inspect DLQ for error patterns.
