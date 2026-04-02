const { ApiError } = require("../utils/apiError");
const { CSRF_COOKIE } = require("../constants/cookies");
const { env } = require("../config/env");

/**
 * Requires readable CSRF cookie to match X-CSRF-Token (double-submit).
 * Exempt safe methods and auth bootstrap routes. Skipped in NODE_ENV=test for Supertest.
 */
const csrfProtection = (req, res, next) => {
  if (env.NODE_ENV === "test") return next();

  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return next();

  const url = (req.originalUrl || "").split("?")[0];

  const exemptPrefixes = [
    "/api/health",
    "/api/ready",
    "/api/metrics",
    "/api/v1/auth/login",
    "/api/v1/auth/register",
    "/api/v1/auth/refresh",
    "/api/v1/auth/logout",
    "/api/v1/auth/forgot-password",
    "/api/v1/auth/csrf-token",
  ];

  if (exemptPrefixes.some((p) => url === p || url.startsWith(`${p}/`))) return next();
  if (url.startsWith("/api/v1/auth/reset-password")) return next();

  const cookieToken = req.cookies?.[CSRF_COOKIE];
  const headerToken = req.get("x-csrf-token");
  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    return next(new ApiError(403, "CSRF token missing or invalid"));
  }
  return next();
};

module.exports = { csrfProtection };
