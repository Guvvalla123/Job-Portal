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
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment variables:", parsed.error.flatten().fieldErrors);
  throw new Error("Invalid environment configuration.");
}

const env = parsed.data;

module.exports = { env };
