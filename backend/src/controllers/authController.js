const jwt = require("jsonwebtoken");
const { asyncHandler } = require("../utils/asyncHandler");
const { created, success } = require("../utils/apiResponse");
const { ApiError } = require("../utils/apiError");
const authService = require("../services/authService");
const { verifyAccessToken, verifyRefreshToken } = require("../utils/jwt");
const auditLogService = require("../services/auditLogService");
const {
  setRefreshTokenCookie,
  clearRefreshTokenCookie,
  clearCsrfCookie,
  issueCsrfToken,
} = require("../utils/authCookies");
const { REFRESH_TOKEN_COOKIE } = require("../constants/cookies");
const { logger } = require("../config/logger");

const register = asyncHandler(async (req, res) => {
  const result = await authService.register(req.body);
  setRefreshTokenCookie(res, result.refreshTokenForCookie);
  const csrfToken = issueCsrfToken(res);
  auditLogService.log({
    userId: result.user.id,
    action: "register",
    resourceType: "auth",
    req,
  });
  return created(
    res,
    {
      user: result.user,
      accessToken: result.accessToken,
      csrfToken,
    },
    "Registration successful"
  );
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const result = await authService.login(email, password);
  setRefreshTokenCookie(res, result.refreshTokenForCookie);
  const csrfToken = issueCsrfToken(res);
  auditLogService.log({
    userId: result.user.id,
    action: "login",
    resourceType: "auth",
    req,
  });
  return success(
    res,
    {
      user: result.user,
      accessToken: result.accessToken,
      csrfToken,
    },
    "Login successful"
  );
});

const me = asyncHandler(async (req, res) => {
  const result = await authService.getMe(req.user.userId);
  return success(res, result);
});

const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  await authService.forgotPassword(email);
  return success(res, null, "If an account exists with this email, you will receive a reset link.");
});

const resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;
  await authService.resetPassword(token, password);
  return success(res, null, "Password reset successful. You can now sign in.");
});

const refresh = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE];
  if (!refreshToken) {
    throw new ApiError(401, "Session expired. Please login again.");
  }
  const result = await authService.refreshTokens(refreshToken);
  setRefreshTokenCookie(res, result.refreshTokenForCookie);
  const csrfToken = issueCsrfToken(res);
  return success(
    res,
    {
      user: result.user,
      accessToken: result.accessToken,
      csrfToken,
    },
    "Tokens refreshed"
  );
});

/**
 * Logout must not require a valid access token — otherwise an expired access JWT
 * leaves the httpOnly refresh cookie in place and the next page load auto-refreshes.
 * Resolve userId from a valid Bearer, else from a decoded (possibly expired) Bearer,
 * else from the refresh cookie.
 */
const logout = asyncHandler(async (req, res) => {
  let userId = null;
  let accessTokenForBlacklist = null;

  const authHeader = req.headers.authorization;
  const bearer = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (bearer) {
    try {
      const payload = verifyAccessToken(bearer);
      userId = payload.userId;
      accessTokenForBlacklist = bearer;
    } catch {
      const decoded = jwt.decode(bearer);
      if (decoded?.userId) {
        userId = decoded.userId;
        accessTokenForBlacklist = bearer;
      }
    }
  }

  if (!userId) {
    const refreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE];
    if (refreshToken) {
      try {
        const payload = verifyRefreshToken(refreshToken);
        userId = payload.userId;
      } catch {
        /* invalid refresh — still clear cookies below */
      }
    }
  }

  if (userId) {
    auditLogService.log({
      userId,
      action: "logout",
      resourceType: "auth",
      req,
    });
    await authService.logout(accessTokenForBlacklist, userId);
  } else {
    const orphanRefresh = req.cookies?.[REFRESH_TOKEN_COOKIE];
    if (orphanRefresh) {
      try {
        await authService.invalidateSessionByRefreshCookie(orphanRefresh);
      } catch (err) {
        logger.warn("Logout could not revoke refresh in DB (best-effort)", { error: err?.message });
      }
    }
  }

  clearRefreshTokenCookie(res);
  clearCsrfCookie(res);
  return res.status(204).send();
});

const csrfToken = asyncHandler(async (req, res) => {
  const token = issueCsrfToken(res);
  return success(res, { csrfToken: token });
});

module.exports = { register, login, me, forgotPassword, resetPassword, refresh, logout, csrfToken };
