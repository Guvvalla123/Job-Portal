const { asyncHandler } = require("../utils/asyncHandler");
const { created, success } = require("../utils/apiResponse");
const authService = require("../services/authService");
const auditLogService = require("../services/auditLogService");

const register = asyncHandler(async (req, res) => {
  const result = await authService.register(req.body);
  return created(res, { user: result.user }, "Registration successful");
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const result = await authService.login(email, password);
  auditLogService.log({
    userId: result.user.id,
    action: "login",
    resourceType: "auth",
    req,
  });
  return success(res, result, "Login successful");
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
  const { refreshToken } = req.body;
  const result = await authService.refreshTokens(refreshToken);
  return success(res, result, "Tokens refreshed");
});

const logout = asyncHandler(async (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  auditLogService.log({
    userId: req.user.userId,
    action: "logout",
    resourceType: "auth",
    req,
  });
  await authService.logout(token, req.user.userId);
  return res.status(204).send();
});

module.exports = { register, login, me, forgotPassword, resetPassword, refresh, logout };
