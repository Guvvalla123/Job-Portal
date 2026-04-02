const crypto = require("crypto");
const { env } = require("../config/env");
const { REFRESH_TOKEN_COOKIE, CSRF_COOKIE } = require("../constants/cookies");

/** Parse JWT_REFRESH_EXPIRES like "7d", "12h" into milliseconds (best-effort). */
function refreshCookieMaxAgeMs() {
  const raw = String(env.JWT_REFRESH_EXPIRES || "7d").trim();
  const m = /^(\d+)([dhms])$/i.exec(raw);
  if (!m) return 7 * 24 * 60 * 60 * 1000;
  const n = Number(m[1]);
  const u = m[2].toLowerCase();
  const mult = u === "d" ? 86400000 : u === "h" ? 3600000 : u === "m" ? 60000 : 1000;
  return n * mult;
}

function refreshCookieBaseOptions() {
  const isProd = env.NODE_ENV === "production";
  const sameSite = env.COOKIE_SAME_SITE || (isProd ? "strict" : "lax");
  return {
    httpOnly: true,
    secure: isProd,
    sameSite,
    path: "/api/v1/auth",
    maxAge: refreshCookieMaxAgeMs(),
  };
}

function setRefreshTokenCookie(res, refreshToken) {
  res.cookie(REFRESH_TOKEN_COOKIE, refreshToken, refreshCookieBaseOptions());
}

/**
 * Clear refresh cookie with the same path/flags as login (must match `setRefreshTokenCookie`).
 * Uses clearCookie + immediate expiry for clients that ignore one of the mechanisms.
 */
function clearRefreshTokenCookie(res) {
  const { httpOnly, secure, sameSite, path } = refreshCookieBaseOptions();
  res.clearCookie(REFRESH_TOKEN_COOKIE, { httpOnly, secure, sameSite, path });
  res.cookie(REFRESH_TOKEN_COOKIE, "", {
    httpOnly,
    secure,
    sameSite,
    path,
    maxAge: 0,
    expires: new Date(0),
  });
}

/** CSRF cookie is not httpOnly — must be cleared on logout with the same path/flags as setCsrfCookie. */
function clearCsrfCookie(res) {
  const isProd = env.NODE_ENV === "production";
  const sameSite = env.COOKIE_SAME_SITE || (isProd ? "strict" : "lax");
  res.cookie(CSRF_COOKIE, "", {
    httpOnly: false,
    secure: isProd,
    sameSite,
    path: "/api",
    maxAge: 0,
    expires: new Date(0),
  });
}

/** Double-submit CSRF: readable cookie + matching X-CSRF-Token header on mutations. */
function setCsrfCookie(res, token) {
  const isProd = env.NODE_ENV === "production";
  res.cookie(CSRF_COOKIE, token, {
    httpOnly: false,
    secure: isProd,
    sameSite: env.COOKIE_SAME_SITE || (isProd ? "strict" : "lax"),
    path: "/api",
    maxAge: 24 * 60 * 60 * 1000,
  });
}

function issueCsrfToken(res) {
  const token = crypto.randomBytes(32).toString("hex");
  setCsrfCookie(res, token);
  return token;
}

module.exports = {
  setRefreshTokenCookie,
  clearRefreshTokenCookie,
  clearCsrfCookie,
  setCsrfCookie,
  issueCsrfToken,
  REFRESH_TOKEN_COOKIE,
  CSRF_COOKIE,
};
