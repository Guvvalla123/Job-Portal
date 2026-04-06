const dotenv = require("dotenv");
const { z } = require("zod");

dotenv.config({ quiet: true });

const commaSeparatedUrls = z.string().refine(
  (val) =>
    val
      .split(",")
      .map((u) => u.trim())
      .filter(Boolean)
      .every((u) => {
        try {
          // eslint-disable-next-line no-new
          new URL(u);
          return true;
        } catch {
          return false;
        }
      }),
  { message: "CLIENT_URL must be one or more comma-separated valid URLs" }
);

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.string().default("5000"),
  CLIENT_URL: commaSeparatedUrls.default("http://localhost:5173"),
  MONGODB_URI: z.string().min(1, "MONGODB_URI is required"),
  JWT_ACCESS_SECRET: z.string().min(16, "JWT_ACCESS_SECRET should be at least 16 chars"),
  JWT_REFRESH_SECRET: z.string().min(16, "JWT_REFRESH_SECRET should be at least 16 chars"),
  JWT_ACCESS_EXPIRES: z.string().default("15m"),
  JWT_REFRESH_EXPIRES: z.string().default("7d"),
  /** When true (or NODE_ENV=production), express-rate-limit middleware is mounted. */
  RATE_LIMIT_ENABLED: z
    .string()
    .optional()
    .transform((v) => v === "true" || v === "1"),
  /** Override refresh + CSRF SameSite (strict | lax | none). Default: strict in production, lax in dev. */
  COOKIE_SAME_SITE: z.enum(["strict", "lax", "none"]).optional(),
  CLOUDINARY_CLOUD_NAME: z.string().min(1, "CLOUDINARY_CLOUD_NAME is required"),
  CLOUDINARY_API_KEY: z.string().min(1, "CLOUDINARY_API_KEY is required"),
  CLOUDINARY_API_SECRET: z.string().min(1, "CLOUDINARY_API_SECRET is required"),
  /** If set, GET /api/metrics requires header X-Metrics-Token matching this value */
  METRICS_TOKEN: z.preprocess((v) => (v === "" || v == null ? undefined : v), z.string().min(16).optional()),
  /** Audit log TTL in days (MongoDB TTL index on createdAt) */
  AUDIT_LOG_TTL_DAYS: z.coerce.number().min(1).max(3650).default(365),
  /**
   * Number of reverse-proxy hops to trust for req.ip / rate limiting (Render, nginx).
   * Set explicitly in staging to validate (e.g. 1). See docs/DEPLOYMENT.md.
   */
  TRUST_PROXY_HOPS: z.preprocess((v) => {
    if (v === undefined || v === "" || v == null) return undefined;
    const n = parseInt(String(v), 10);
    return Number.isFinite(n) ? n : undefined;
  }, z.number().int().min(0).max(10).optional()),
  /** Optional: Sentry DSN for server error tracking (never commit real DSN). */
  SENTRY_DSN: z.preprocess((v) => (v === "" || v == null ? undefined : v), z.string().url().optional()),
  /** Optional: release string for Sentry (e.g. git SHA from Render GITHUB_COMMIT / SENTRY_RELEASE). */
  SENTRY_RELEASE: z.preprocess((v) => (v === "" || v == null ? undefined : v), z.string().max(200).optional()),
  /**
   * Optional: Redis for BullMQ email queue + shared cache. When unset, email uses in-process best-effort send.
   * Production with job alerts / transactional mail should set this and run workers.
   */
  REDIS_URL: z.preprocess((v) => (v === "" || v == null ? undefined : v), z.string().min(1).optional()),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment variables:", parsed.error.flatten().fieldErrors);
  throw new Error("Invalid environment configuration.");
}

const data = parsed.data;
const trustProxyHops =
  data.TRUST_PROXY_HOPS !== undefined && data.TRUST_PROXY_HOPS !== null
    ? data.TRUST_PROXY_HOPS
    : data.NODE_ENV === "production"
      ? 1
      : 0;

const env = { ...data, trustProxyHops };

module.exports = { env };
