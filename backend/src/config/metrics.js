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
  module.exports = { recordRequest: noop, getMetrics: noopAsync, getContentType: () => "text/plain" };
} else {
  const { register, Counter, Histogram } = prom;
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
  const getMetrics = async () => register.metrics();
  const getContentType = () => register.contentType;
  module.exports = { recordRequest, getMetrics, getContentType };
}
