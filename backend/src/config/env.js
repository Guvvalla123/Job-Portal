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

const boolish = z
  .string()
  .optional()
  .transform((v) => v === "true" || v === "1");

const envSchema = z
  .object({
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    PORT: z.string().default("5000"),
    CLIENT_URL: commaSeparatedUrls.default("http://localhost:5173"),
    MONGODB_URI: z.string().min(1, "MONGODB_URI is required"),
    /** Production-grade minimum length (OWASP: use long random secrets). */
    JWT_ACCESS_SECRET: z.string().min(32, "JWT_ACCESS_SECRET must be at least 32 characters"),
    JWT_REFRESH_SECRET: z.string().min(32, "JWT_REFRESH_SECRET must be at least 32 characters"),
    JWT_ACCESS_EXPIRES: z.string().default("15m"),
    JWT_REFRESH_EXPIRES: z.string().default("7d"),
    /** When true (or NODE_ENV=production), express-rate-limit middleware is mounted. */
    RATE_LIMIT_ENABLED: boolish,
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
     * Set explicitly in staging to validate (e.g. 1). See docs/operations/DEPLOYMENT.md.
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
    /**
     * When true, all SMTP_* vars below must be set (validated at boot).
     * Use in production when email is required (password reset, alerts).
     */
    REQUIRE_SMTP: boolish,
    SMTP_HOST: z.preprocess((v) => (v === "" || v == null ? undefined : v), z.string().min(1).optional()),
    SMTP_PORT: z.preprocess((v) => (v === "" || v == null ? undefined : v), z.string().min(1).optional()),
    SMTP_USER: z.preprocess((v) => (v === "" || v == null ? undefined : v), z.string().optional()),
    SMTP_PASS: z.preprocess((v) => (v === "" || v == null ? undefined : v), z.string().optional()),
    SMTP_FROM: z.preprocess((v) => (v === "" || v == null ? undefined : v), z.string().optional()),
    /**
     * When true in production, every admin must enroll TOTP before /api/v1/admin/* access.
     * Requires MFA_ENCRYPTION_KEY (min 32 chars) for storing encrypted secrets.
     */
    ADMIN_MFA_REQUIRED: boolish,
    /** Used to encrypt TOTP secrets at rest; required when admins enable MFA or when ADMIN_MFA_REQUIRED is true. */
    MFA_ENCRYPTION_KEY: z.preprocess((v) => (v === "" || v == null ? undefined : v), z.string().optional()),
    /**
     * When NODE_ENV=production and true, REDIS_URL must be set (shared idempotency + queues).
     */
    REQUIRE_REDIS_IN_PRODUCTION: boolish,
  })
  .superRefine((data, ctx) => {
    if (data.REQUIRE_SMTP) {
      if (!data.SMTP_HOST) ctx.addIssue({ code: "custom", message: "SMTP_HOST is required when REQUIRE_SMTP=true", path: ["SMTP_HOST"] });
      if (!data.SMTP_PORT) ctx.addIssue({ code: "custom", message: "SMTP_PORT is required when REQUIRE_SMTP=true", path: ["SMTP_PORT"] });
      if (data.SMTP_USER === undefined || data.SMTP_USER === "")
        ctx.addIssue({ code: "custom", message: "SMTP_USER is required when REQUIRE_SMTP=true", path: ["SMTP_USER"] });
      if (data.SMTP_PASS === undefined || data.SMTP_PASS === "")
        ctx.addIssue({ code: "custom", message: "SMTP_PASS is required when REQUIRE_SMTP=true", path: ["SMTP_PASS"] });
    }
    if (data.NODE_ENV === "production" && data.ADMIN_MFA_REQUIRED) {
      if (!data.MFA_ENCRYPTION_KEY || data.MFA_ENCRYPTION_KEY.length < 32) {
        ctx.addIssue({
          code: "custom",
          message: "MFA_ENCRYPTION_KEY must be set (min 32 chars) when ADMIN_MFA_REQUIRED=true in production",
          path: ["MFA_ENCRYPTION_KEY"],
        });
      }
    }
    if (data.NODE_ENV === "production" && data.REQUIRE_REDIS_IN_PRODUCTION && !data.REDIS_URL) {
      ctx.addIssue({
        code: "custom",
        message: "REDIS_URL is required when REQUIRE_REDIS_IN_PRODUCTION=true in production",
        path: ["REDIS_URL"],
      });
    }
  });

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment variables:", parsed.error.flatten().fieldErrors);
  console.error(parsed.error.issues);
  throw new Error("Invalid environment configuration.");
}

const data = parsed.data;
const trustProxyHops =
  data.TRUST_PROXY_HOPS !== undefined && data.TRUST_PROXY_HOPS !== null
    ? data.TRUST_PROXY_HOPS
    : data.NODE_ENV === "production"
      ? 1
      : 0;

if (data.NODE_ENV === "production" && trustProxyHops === 0) {
  // eslint-disable-next-line no-console
  console.warn(
    "[env] TRUST_PROXY_HOPS is 0 in production — req.ip and rate limits may be wrong behind a reverse proxy. Set TRUST_PROXY_HOPS=1 (or your CDN hop count)."
  );
}

if (data.NODE_ENV === "development" && !data.REDIS_URL) {
  // eslint-disable-next-line no-console
  console.info(
    "[env] REDIS_URL is not set — shared cache, idempotency keys, and BullMQ email jobs use in-memory fallbacks in this Node process only.\n" +
      "      To run Redis locally: from the `backend/` folder execute `docker compose up -d redis`, add REDIS_URL=redis://127.0.0.1:6379 to `.env`, restart the API, then run `npm run worker:email` (and `npm run worker:job-alert-digest` if you use digest alerts). See `backend/docker-compose.yml` and `.env.example`."
  );
}

const adminMfaRequired = data.ADMIN_MFA_REQUIRED === true;

const env = {
  ...data,
  trustProxyHops,
  adminMfaRequired,
};

module.exports = { env };
