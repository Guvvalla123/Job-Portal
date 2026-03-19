/**
 * Winston structured logging
 * - JSON format in production for log aggregation (Datadog, ELK, CloudWatch)
 * - Human-readable in development
 * - requestId attached via child logger
 */
const winston = require("winston");
const { env } = require("./env");

const isProd = env.NODE_ENV === "production";

const baseFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.errors({ stack: true })
);

const devFormat = winston.format.combine(
  baseFormat,
  winston.format.colorize(),
  winston.format.printf(({ level, message, timestamp, requestId, ...meta }) => {
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : "";
    const idStr = requestId ? ` [${requestId}]` : "";
    return `${timestamp}${idStr} ${level}: ${message}${metaStr}`;
  })
);

const prodFormat = winston.format.combine(
  baseFormat,
  winston.format.json()
);

const logger = winston.createLogger({
  level: isProd ? "info" : "debug",
  format: isProd ? prodFormat : devFormat,
  defaultMeta: { service: "job-portal-api" },
  transports: [new winston.transports.Console()],
});

/**
 * Create a child logger with requestId for request-scoped logging
 */
const child = (requestId) => logger.child({ requestId: requestId || "" });

/**
 * HTTP request logging - log after response finishes
 */
const logRequest = (req, res, next) => {
  const start = Date.now();
  const log = child(req.id);

  res.on("finish", () => {
    const duration = Date.now() - start;
    const meta = {
      method: req.method,
      url: req.originalUrl || req.url,
      status: res.statusCode,
      durationMs: duration,
    };
    if (res.statusCode >= 500) {
      log.error("Request failed", meta);
    } else if (res.statusCode >= 400) {
      log.warn("Request client error", meta);
    } else {
      log.info("Request completed", meta);
    }
    try {
      const { recordRequest } = require("./metrics");
      const route = (req.route && req.route.path) || req.baseUrl || req.path || req.url || "unknown";
      recordRequest(req.method, String(route), res.statusCode, duration);
    } catch (_) {}
  });

  next();
};

module.exports = { logger, child, logRequest };
