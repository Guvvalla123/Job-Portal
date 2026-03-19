# Distributed Architecture Guide

**Principal Engineer perspective:** Evolving a production MERN stack to support millions of users with high availability, resilience, and scalability.

---

## Design Principles

1. **Start modular, extract microservices only when justified** – Premature microservices add operational cost without benefit.
2. **Prefer simplicity until proven necessary** – Add complexity only when metrics show a need.
3. **Design for failure** – Assume components fail; build graceful degradation.
4. **Measure before optimizing** – SLOs and observability first; then optimize.

---

## 1. Distributed System Design

### Service Boundaries

**Current state:** Monolithic API (auth, jobs, applications, companies, users) in one process.

**Evolution path:**

| Phase | Approach | When |
|-------|----------|------|
| **1** | Modular monolith (current) | &lt; 100K DAU |
| **2** | Extract high-churn services | Job alerts, notifications, email workers |
| **3** | Extract read-heavy services | Job search, company listing |
| **4** | Full microservices | Multi-team, independent deploy cadence |

**Recommendation:** Stay modular until you hit:
- Team size &gt; 5–8 engineers needing independent deploys
- Clear scaling mismatch (e.g. job search needs 10x the compute of auth)
- Different tech stack requirements (e.g. Elasticsearch for search)

**Service extraction priority:**
1. **Notification/Email service** – Already async via BullMQ; natural boundary.
2. **Job search service** – If you add Elasticsearch, extract.
3. **Auth service** – Only if you need shared identity across multiple products.

---

### Inter-Service Communication

| Pattern | Use case | Trade-off |
|---------|----------|------------|
| **REST** | Synchronous, request–response (e.g. auth validation) | Simple, but coupling and latency. |
| **Message queue (BullMQ/RabbitMQ)** | Async, fire-and-forget (emails, notifications) | Decoupled, but eventual consistency. |
| **gRPC** | Internal, high-throughput RPC | Efficient, but adds tooling. |

**Guidance:**
- **REST** for user-facing or low-frequency calls.
- **Message queue** for notifications, emails, analytics, audit fan-out.
- **gRPC** only when REST latency or throughput becomes a bottleneck.

**Event-driven option:** Emit domain events (e.g. `job.created`, `application.submitted`) to a topic. Consumers (notification service, analytics) subscribe. Use when you have 3+ independent consumers of the same event.

---

### Data Consistency & Idempotency

**Eventual consistency:** Acceptable for notifications, job alerts, non-critical analytics. Not for payments or core auth state.

**Idempotency:**
- **Critical operations:** Application submit, payment, profile update.
- **Mechanism:** Client sends `Idempotency-Key: <uuid>` header. Server stores `(key, response)` in Redis with TTL (e.g. 24h). Replay returns cached response.
- **Scope:** Apply to `POST /applications`, `PUT /users/profile`, any money-moving endpoints.

**Saga pattern:** For multi-step workflows (e.g. application → notify recruiter → update analytics), use compensating transactions if a step fails. For most cases, at-least-once delivery + idempotent handlers is enough.

---

## 2. Advanced Caching

### Cache Stampede Protection

**Problem:** Many requests miss cache at once; all hit DB.

**Solutions:**

| Strategy | Implementation | Trade-off |
|----------|----------------|-----------|
| **Probabilistic early expiry** | Recompute when `ttl_remaining < random(0, ttl) * 0.2` | Simple; some extra recomputes. |
| **Lock/mutex** | First miss acquires lock; others wait or get stale | Prevents stampede; adds lock complexity. |
| **Request coalescing** | Deduplicate in-flight requests for same key | Reduces DB load; needs in-memory map or Redis. |

**Recommendation:** Start with **probabilistic early expiry** for hot keys (job list first page). Add **request coalescing** if DB load spikes during cache expiry.

```text
# Pseudocode
if (cached && ttl_remaining < ttl * 0.2 && Math.random() < 0.1) {
  trigger_async_refresh(key);  // Don't block
}
return cached || fetch_and_cache();
```

---

### Stale-While-Revalidate

**Pattern:** Serve stale data immediately; refresh in background; update cache.

**When:** High-traffic reads (job list, company list) where 30–60s staleness is acceptable.

**Implementation:**
- On cache hit: return data. If `age > 0.8 * TTL`, enqueue background refresh (don't await).
- On cache miss: fetch, cache, return.

**Trade-off:** Users may see slightly stale data. Good for browse-heavy, low-write workloads.

---

### Multi-Layer Caching

| Layer | Storage | TTL | Use case |
|-------|---------|-----|----------|
| **CDN** | Edge (CloudFront, Cloudflare) | 1h–1d | Static assets, public job/company pages |
| **Redis** | Central | 3–10 min | API responses (job list, hot queries) |
| **In-memory** | Per instance | 1–5 min | Very hot keys (fallback when Redis down) |

**CDN caching:**
- Cache `GET /jobs`, `GET /companies` at edge with `Cache-Control: public, max-age=300`.
- Use `Vary: Accept-Language` if localized.
- Purge on job create/update via CDN API or cache tags.

**Redis:** Already in place. Ensure connection pooling and failover (Redis Cluster or Sentinel for HA).

---

## 3. Observability at Scale

### Distributed Tracing (OpenTelemetry)

**Goal:** Trace a request across services, queues, and DB calls.

**Setup:**
- Instrument Express with `@opentelemetry/instrumentation-http`.
- Instrument MongoDB, Redis, BullMQ with OTel instrumentations.
- Export to Jaeger, Tempo, or vendor (Datadog, Honeycomb).

**Trace ID propagation:**
- Generate at gateway/entry; pass via `traceparent` or `X-Trace-Id`.
- Include in logs, metrics labels, and error reports.

**Correlation:**
- `trace_id` + `span_id` in every log line.
- Metrics with `trace_id` sample for exemplars (link metric to trace).

---

### SLO-Based Alerting

**Define SLOs first:**

| SLO | Target | Measurement |
|-----|--------|-------------|
| **Availability** | 99.9% | Successful requests / total (exclude 5xx) |
| **Latency p99** | &lt; 500ms | API response time |
| **Error budget** | 0.1% | 1 - availability |

**Alerting rules (avoid alert fatigue):**
- **Page:** When error budget consumed &gt; 50% in 1h.
- **Ticket:** When error budget consumed &gt; 10% in 1h.
- **No alert:** For single 5xx; alert on sustained degradation.

**Burn rate:** Alert when `(errors / total) > 0.001` for 5 min (fast burn) or 1h (slow burn).

---

### Log–Metric–Trace Correlation

- **Logs:** Structured JSON; include `trace_id`, `span_id`, `request_id`.
- **Metrics:** Add `trace_id` as exemplar for latency histograms (Grafana 8+).
- **Traces:** Link from trace to logs via `trace_id` in log aggregator.

---

## 4. Background Processing at Scale

### Retry Strategies

**Current:** BullMQ default (3 retries, exponential backoff).

**At scale:**
- **Exponential backoff:** `delay = base * 2^attempt` (e.g. 1s, 2s, 4s, 8s).
- **Jitter:** Add `random(0, 0.3 * delay)` to avoid thundering herd.
- **Max attempts:** 5–7 for emails; 3 for critical (avoid infinite retries).

**Config per job type:**
```javascript
// Email: tolerant
{ attempts: 5, backoff: { type: 'exponential', delay: 2000 } }

// Payment: strict
{ attempts: 3, backoff: { type: 'exponential', delay: 5000 } }
```

---

### Dead-Letter Queue (DLQ)

**Purpose:** Capture jobs that fail after all retries for inspection and manual replay.

**Implementation:**
- BullMQ: Use `failed` queue or move to `dlq` queue on `failed` event.
- Store: `jobId`, `payload`, `error`, `attempts`, `timestamp`.
- Process: Dashboard to inspect, retry, or discard.

**Alert:** When DLQ depth &gt; 100 or growth rate &gt; 10/min.

---

### Idempotent Job Processing

**Mechanism:**
- Include `idempotencyKey` in job payload (client-generated or deterministic from input).
- Before processing: check Redis `processed:{idempotencyKey}`. If exists, skip.
- After success: set `processed:{idempotencyKey}` with TTL (e.g. 7d).

**Critical for:** Application submissions, payment callbacks, webhook handlers.

---

## 5. Security at Scale

### API Gateway Considerations

**Responsibilities:**
- TLS termination
- Rate limiting (global, before app)
- Request validation (size, schema)
- Auth (JWT validation, API key)
- Routing to backend services

**Options:**
- **Kong, AWS API Gateway, Azure API Management** – Full-featured.
- **Nginx + Lua, Envoy** – Lighter; more custom work.
- **Cloud provider LB + WAF** – Simpler; less flexibility.

**Recommendation:** Start with Nginx/Envoy in front of your app. Add Kong or cloud API gateway when you need multi-tenant rate limits, API keys, or complex routing.

---

### Request Signing / Zero-Trust

**Internal service-to-service:**
- **mTLS** – Mutual TLS for service identity.
- **JWT with short expiry** – Service A gets token from auth service; calls B with it.
- **API keys** – Simpler; rotate regularly; store in secrets manager.

**External webhooks:**
- **HMAC signature** – `X-Signature: sha256=...` of body with shared secret.
- **Verify** before processing to prevent spoofing.

**Zero-trust:** Assume network is hostile. Authenticate every call; never trust `X-Forwarded-For` alone for auth.

---

### Distributed Rate Limiting

**Problem:** Per-instance limits don't work across multiple app instances.

**Solution:** Redis-backed rate limiter (e.g. `rate-limit-redis`).
- Key: `ratelimit:{user_id|ip}:{window}`.
- Increment + TTL in Redis.
- Sliding window or fixed window.

**Tiers:**
- Anonymous: 50/min per IP.
- Authenticated: 300/min per user.
- Premium: 1000/min per user.

---

## 6. Data & Scalability

### Database Sharding Strategy

**When:** Single MongoDB cluster can't keep up (e.g. &gt; 1M docs, high write throughput).

**Shard key selection:**
- **User-based:** `userId` – Good for user-scoped data (applications, saved jobs).
- **Tenant-based:** `companyId` – Good for multi-tenant.
- **Time-based:** `createdAt` – Good for time-series; beware hot shards.

**Avoid:** Random or high-cardinality keys that scatter related data.

**MongoDB sharding:** Use hashed shard key for even distribution, or range for locality.

---

### Read Replicas

**Use case:** Read-heavy workload (job search, company list) with write load on primary.

**Setup:**
- MongoDB: Configure replica set; read from secondary for `find` queries.
- Mongoose: `readPreference: 'secondary'` for specific queries.

**Trade-off:** Replication lag (typically &lt; 1s). Don't use for read-after-write consistency; use primary for that.

---

### Query Optimization

- **Indexes:** Cover hot queries; avoid full collection scans.
- **Projection:** Select only needed fields to reduce data transfer.
- **Pagination:** Cursor-based for large lists (avoid `skip` on large offsets).
- **Aggregation pipeline:** Push work to DB; avoid large in-memory operations.

---

## 7. Infrastructure Evolution

### Load Balancing & Auto-Scaling

**Load balancer:** Distribute traffic across N app instances. Health checks on `/api/health` and `/api/ready`.

**Auto-scaling triggers:**
- CPU &gt; 70%
- Request rate &gt; 80% of target
- Queue depth (BullMQ) &gt; 1000

**Scale down:** Graceful shutdown; drain connections; finish in-flight requests.

---

### Kubernetes

**When:** Need orchestration, rolling updates, self-healing, multi-environment parity.

**Resources:**
- **Deployment** for API and workers.
- **Service** for internal discovery.
- **Ingress** for external traffic.
- **HPA** (Horizontal Pod Autoscaler) for CPU/request-based scaling.
- **ConfigMap/Secret** for config and secrets.

**Helm charts:** Package app + dependencies for repeatable deploys.

---

### Deployment Strategies

| Strategy | Risk | Rollback | Use case |
|---------|------|----------|----------|
| **Rolling** | Medium | Gradual | Default |
| **Blue-green** | Low | Instant switch | Critical releases |
| **Canary** | Low | Gradual | High-risk changes |

**Canary:** Route 5% traffic to new version; monitor error rate, latency; gradually increase.

---

## 8. Reliability Engineering

### SLOs/SLAs

**SLO examples:**
- 99.9% availability (8.76h downtime/year).
- p99 latency &lt; 500ms.
- 99% of jobs processed within 5 min.

**SLA:** Contract with customers; usually looser than internal SLO (e.g. 99.5% SLA, 99.9% SLO).

---

### Chaos Testing Basics

**Principles:** Inject failures in a controlled way; validate system recovers.

**Experiments:**
- Kill random pod – Verify K8s reschedules; no data loss.
- Latency injection – Add 500ms delay to DB; verify timeouts and fallbacks.
- Redis failure – Verify in-memory fallback; no crash.

**Tools:** Chaos Mesh, Litmus, or custom scripts. Start in staging only.

---

### Fault Tolerance Strategies

| Failure | Mitigation |
|---------|------------|
| **DB down** | Return 503; retry; circuit breaker. |
| **Redis down** | In-memory cache; skip cache; degrade. |
| **Queue down** | Buffer in DB or fail open (sync send). |
| **External API down** | Circuit breaker; fallback; queue for retry. |
| **Instance crash** | Stateless app; LB removes; K8s restarts. |

---

## Implementation Roadmap

| Phase | Focus | Effort |
|-------|-------|--------|
| **1** | Idempotency keys, DLQ, cache stampede protection | 1–2 weeks |
| **2** | OpenTelemetry tracing, SLO alerting | 2–3 weeks |
| **3** | Redis rate limiting, API gateway (Nginx/Envoy) | 2 weeks |
| **4** | Read replicas, query optimization | 1–2 weeks |
| **5** | K8s migration, canary deploys | 4–6 weeks |
| **6** | Service extraction (notification, search) | 6–8 weeks |

---

## Summary

- **Stay modular** until team size or scaling demands microservices.
- **Prioritize observability** (tracing, SLOs, correlation) before heavy optimization.
- **Add resilience** (idempotency, DLQ, circuit breakers) before scaling.
- **Scale data** (replicas, sharding) when metrics justify it.
- **Adopt K8s** when you need orchestration and advanced deployment strategies.

Avoid overengineering: implement each capability when the cost of *not* having it exceeds the cost of building it.
