/**
 * Security configuration for production-grade API
 * Centralizes helmet, CORS, HPP, and rate limiting settings.
 */
const { env } = require("./env");

const isDev = env.NODE_ENV === "development";

/**
 * CORS origins - support comma-separated for multiple frontends (e.g. web + admin)
 */
const getAllowedOrigins = () => {
  const url = env.CLIENT_URL || "http://localhost:5173";
  return url.split(",").map((o) => o.trim()).filter(Boolean);
};

const corsOptions = {
  origin: (origin, callback) => {
    const allowed = getAllowedOrigins();
    if (!origin) return callback(null, true);
    if (allowed.includes(origin)) return callback(null, true);
    callback(null, false);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Request-Id"],
  maxAge: 86400,
};

/**
 * Helmet - secure HTTP headers
 * API-only: no need for strict CSP on HTML; focus on XSS, clickjacking, etc.
 */
const helmetOptions = {
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  noSniff: true,
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  xssFilter: true,
};

/**
 * HPP - HTTP Parameter Pollution
 * Prevents duplicate params (e.g. ?id=1&id=2) from causing unexpected behavior
 */
const hppOptions = {
  whitelist: ["page", "limit", "q", "location", "employmentType", "experienceLevel", "sort"],
};

/**
 * Rate limits (requests per 15 min window)
 * Per-endpoint strategies: strict (sensitive), auth, write, read
 */
const RATE_LIMITS = {
  auth: {
    windowMs: 15 * 60 * 1000,
    max: isDev ? 100 : 10,
    message: { success: false, message: "Too many authentication attempts. Try again later." },
  },
  strict: {
    windowMs: 15 * 60 * 1000,
    max: isDev ? 20 : 5,
    message: { success: false, message: "Too many requests. Try again later." },
  },
  write: {
    windowMs: 15 * 60 * 1000,
    max: isDev ? 500 : 50,
    message: { success: false, message: "Too many write requests. Try again later." },
  },
  api: {
    windowMs: 15 * 60 * 1000,
    max: isDev ? 1000 : 200,
    message: { success: false, message: "Too many requests. Try again later." },
  },
  public: {
    windowMs: 15 * 60 * 1000,
    max: isDev ? 500 : 100,
    message: { success: false, message: "Too many requests. Try again later." },
  },
};

module.exports = {
  corsOptions,
  helmetOptions,
  hppOptions,
  RATE_LIMITS,
};
