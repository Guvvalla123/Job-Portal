/**
 * Prometheus metrics for observability.
 * Expose /metrics for scraping by Prometheus/Grafana.
 * Gracefully no-op if prom-client is not installed.
 */
let prom;
try {
  prom = require("prom-client");
} catch {
  prom = null;
}

const noop = () => {};
const noopAsync = async () => "";

if (!prom) {
  module.exports = {
    recordRequest: noop,
    getMetrics: noopAsync,
    getContentType: () => "text/plain",
    incEmailDirectFallback: noop,
    incEmailDirectFallbackFailed: noop,
  };
} else {
  const { register, Counter, Histogram, Gauge } = prom;

  const EMAIL_QUEUE_STATES = ["waiting", "paused", "active", "delayed", "completed", "failed"];
  const emailQueueJobs = new Gauge({
    name: "email_queue_jobs",
    help: "BullMQ email queue job counts by state (scraped from API process; 0 if queue inactive)",
    labelNames: ["state"],
  });

  async function refreshEmailQueueGauges() {
    try {
      const { getEmailQueueJobCounts } = require("../queues/emailQueue");
      const counts = await getEmailQueueJobCounts();
      for (const s of EMAIL_QUEUE_STATES) {
        const n = counts && typeof counts[s] === "number" ? counts[s] : 0;
        emailQueueJobs.set({ state: s }, n);
      }
    } catch {
      for (const s of EMAIL_QUEUE_STATES) {
        emailQueueJobs.set({ state: s }, 0);
      }
    }
  }
  const emailDirectFallbackTotal = new Counter({
    name: "email_direct_fallback_total",
    help: "Emails sent in-process because REDIS_URL queue was unavailable",
  });
  const emailDirectFallbackFailed = new Counter({
    name: "email_direct_fallback_failed_total",
    help: "In-process email sends that failed (no Redis queue path)",
  });
  const httpRequestDuration = new Histogram({
    name: "http_request_duration_seconds",
    help: "Duration of HTTP requests in seconds",
    labelNames: ["method", "route", "status"],
    buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
  });
  const httpRequestTotal = new Counter({
    name: "http_requests_total",
    help: "Total number of HTTP requests",
    labelNames: ["method", "route", "status"],
  });
  const recordRequest = (method, route, status, durationMs) => {
    const routeLabel = route || "unknown";
    const statusLabel = status >= 500 ? "5xx" : status >= 400 ? "4xx" : "2xx";
    httpRequestDuration.labels(method, routeLabel, statusLabel).observe(durationMs / 1000);
    httpRequestTotal.labels(method, routeLabel, statusLabel).inc();
  };
  const getMetrics = async () => {
    await refreshEmailQueueGauges();
    return register.metrics();
  };
  const getContentType = () => register.contentType;
  const incEmailDirectFallback = () => emailDirectFallbackTotal.inc();
  const incEmailDirectFallbackFailed = () => emailDirectFallbackFailed.inc();
  module.exports = {
    recordRequest,
    getMetrics,
    getContentType,
    incEmailDirectFallback,
    incEmailDirectFallbackFailed,
  };
}
