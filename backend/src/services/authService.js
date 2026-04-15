const crypto = require("crypto");
const { ApiError } = require("../utils/apiError");
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require("../utils/jwt");
const { signMfaChallengeToken } = require("../utils/mfaChallengeJwt");
const { queueEmail } = require("../queues/emailQueue");
const { blacklist: blacklistToken } = require("../utils/tokenBlacklist");
const userRepository = require("../repositories/userRepository");
const { env } = require("../config/env");
const { ROLES } = require("../constants/roles");

const hashToken = (token) => crypto.createHash("sha256").update(token).digest("hex");

/**
 * `amfa` on JWT: admin portal satisfied MFA step for this session (always true for non-admin or admin without TOTP).
 */
function initialAmfaForUser(user) {
  if (user.role !== ROLES.ADMIN) return true;
  if (!user.mfaEnabled) {
    return !env.adminMfaRequired;
  }
  return false;
}

/**
 * Issue access + refresh tokens, persist refresh hash. Used by login and register.
 * @param {import("mongoose").Document} user - User document with _id, role, fullName, email
 * @param {{ amfaSatisfied?: boolean }} [opts]
 */
const issueSessionForUser = async (user, opts = {}) => {
  const amfaSatisfied = opts.amfaSatisfied !== undefined ? opts.amfaSatisfied : initialAmfaForUser(user);
  const payload = { userId: user._id.toString(), role: user.role, amfa: amfaSatisfied };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);
  const refreshTokenHash = hashToken(refreshToken);

  await userRepository.updateById(user._id, { refreshToken: refreshTokenHash });

  return {
    accessToken,
    /** Raw refresh string for httpOnly cookie only — never expose in JSON. */
    refreshTokenForCookie: refreshToken,
    user: { id: user._id, fullName: user.fullName, email: user.email, role: user.role },
  };
};

const register = async (data) => {
  const existing = await userRepository.findByEmail(data.email);
  if (existing) throw new ApiError(409, "Email already registered");

  const user = await userRepository.create(data);
  return issueSessionForUser(user);
};

const login = async (email, password) => {
  const user = await userRepository.findByEmail(email).select("+mfaTotpSecretEnc");
  if (!user) throw new ApiError(401, "Invalid credentials");

  const isValid = await user.comparePassword(password);
  if (!isValid) throw new ApiError(401, "Invalid credentials");

  if (!user.isActive) {
    throw new ApiError(403, "Your account has been disabled. Please contact support.");
  }

  if (user.role === ROLES.ADMIN && user.mfaEnabled) {
    return {
      mfaPending: true,
      mfaToken: signMfaChallengeToken(user._id),
      user: { id: user._id, fullName: user.fullName, email: user.email, role: user.role },
    };
  }

  return issueSessionForUser(user);
};

const getMe = async (userId) => {
  const user = await userRepository.findById(
    userId,
    "-password -refreshToken -passwordResetToken -resumeUrl -resumePublicId -mfaTotpSecretEnc"
  );
  if (!user) throw new ApiError(404, "User not found");
  const u = user.toObject ? user.toObject() : { ...user };
  u.hasResume = Boolean(u.resumeFileName && String(u.resumeFileName).trim());
  u.mfaEnabled = Boolean(user.mfaEnabled);
  u.adminMfaRequired = env.adminMfaRequired;
  return { user: u };
};

const forgotPassword = async (email) => {
  const user = await userRepository.findByEmail(email);
  if (!user) return { sent: false };

  const token = crypto.randomBytes(32).toString("hex");
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
  await userRepository.updateById(user._id, {
    passwordResetToken: hashedToken,
    passwordResetExpires: Date.now() + 60 * 60 * 1000,
  });

  const clientUrl = String(env.CLIENT_URL || "http://localhost:5173")
    .split(",")[0]
    .trim();
  const resetUrl = `${clientUrl}/reset-password/${token}`;

  const safeName = String(user.fullName || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

  await queueEmail({
    to: user.email,
    subject: "CareerSync – Reset your password",
    html: `
      <p>Hi ${safeName},</p>
      <p>You requested a password reset. Click the link below to set a new password:</p>
      <p><a href="${resetUrl}" style="color:#4f46e5;">Reset Password</a></p>
      <p>This link expires in 1 hour.</p>
      <p>If you didn't request this, you can ignore this email.</p>
    `,
  });

  return { sent: true };
};

const resetPassword = async (token, password) => {
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
  const user = await userRepository.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user) throw new ApiError(400, "Invalid or expired reset link. Please request a new one.");

  const doc = await userRepository.findById(user._id, "+password");
  if (!doc) throw new ApiError(400, "Invalid or expired reset link. Please request a new one.");
  doc.password = password;
  doc.passwordResetToken = "";
  doc.passwordResetExpires = undefined;
  await doc.save();

  return {};
};

const refreshTokens = async (refreshToken) => {
  if (!refreshToken) throw new ApiError(401, "Refresh token required");

  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw new ApiError(401, "Invalid or expired refresh token");
  }

  const user = await userRepository.findById(payload.userId, "refreshToken isActive role mfaEnabled");
  if (!user || !user.refreshToken) throw new ApiError(401, "Invalid refresh token");

  if (!user.isActive) {
    throw new ApiError(403, "Account disabled.");
  }

  const tokenHash = hashToken(refreshToken);
  if (user.refreshToken !== tokenHash) {
    await userRepository.updateById(user._id, { refreshToken: "" });
    throw new ApiError(401, "Refresh token reused - session revoked");
  }

  let nextAmfa = payload.amfa;
  if (nextAmfa === undefined) {
    if (user.role !== ROLES.ADMIN || !user.mfaEnabled) {
      nextAmfa = true;
    } else {
      nextAmfa = false;
    }
  }

  if (user.role === ROLES.ADMIN && user.mfaEnabled && nextAmfa !== true) {
    throw new ApiError(401, "Session incomplete — sign in again with two-factor authentication.");
  }

  const newPayload = { userId: payload.userId, role: payload.role, amfa: nextAmfa };
  const accessToken = signAccessToken(newPayload);
  const newRefreshToken = signRefreshToken(newPayload);
  const newRefreshTokenHash = hashToken(newRefreshToken);

  await userRepository.updateById(user._id, { refreshToken: newRefreshTokenHash });

  const refreshedUser = await userRepository.findById(user._id, "fullName email role mfaEnabled");
  return {
    accessToken,
    refreshTokenForCookie: newRefreshToken,
    user: { id: refreshedUser._id, fullName: refreshedUser.fullName, email: refreshedUser.email, role: refreshedUser.role },
  };
};

const changePassword = async (userId, oldPassword, newPassword) => {
  const user = await userRepository.findById(userId, "+password");
  if (!user) throw new ApiError(404, "User not found");

  const ok = await user.comparePassword(oldPassword);
  if (!ok) throw new ApiError(401, "Current password is incorrect");

  user.password = newPassword;
  await user.save();
  return {};
};

const logout = async (accessToken, userId) => {
  const jwt = require("jsonwebtoken");
  let decoded;
  try {
    decoded = jwt.decode(accessToken);
  } catch {}
  if (decoded?.jti && decoded?.exp) {
    const ttlSeconds = Math.max(0, decoded.exp - Math.floor(Date.now() / 1000));
    await blacklistToken(decoded.jti, ttlSeconds);
  }
  await userRepository.updateById(userId, { $unset: { refreshToken: 1 } });
};

/**
 * When logout cannot resolve userId (e.g. expired refresh JWT) but a cookie value exists,
 * still revoke the server session: verify if possible, else match stored refreshToken hash.
 */
const invalidateSessionByRefreshCookie = async (refreshToken) => {
  if (!refreshToken || typeof refreshToken !== "string") return;
  try {
    const payload = verifyRefreshToken(refreshToken);
    await userRepository.updateById(payload.userId, { $unset: { refreshToken: 1 } });
    return;
  } catch {
    /* expired or invalid signature — hash may still match DB */
  }
  const tokenHash = hashToken(refreshToken);
  const user = await userRepository.findOne({ refreshToken: tokenHash });
  if (user?._id) {
    await userRepository.updateById(user._id, { $unset: { refreshToken: 1 } });
  }
};

const mfaService = require("./mfaService");

/**
 * Complete admin login after TOTP (mfaToken from password step).
 */
const completeMfaLogin = async (mfaToken, code) => {
  const { verifyMfaChallengeToken } = require("../utils/mfaChallengeJwt");
  let userId;
  try {
    userId = verifyMfaChallengeToken(mfaToken);
  } catch {
    throw new ApiError(401, "Invalid or expired MFA challenge. Please sign in again.");
  }

  const user = await mfaService.verifyLoginTotp(userId, code);
  if (user.role !== ROLES.ADMIN) {
    throw new ApiError(403, "MFA login is only valid for administrator accounts.");
  }

  return issueSessionForUser(user, { amfaSatisfied: true });
};

module.exports = {
  register,
  login,
  getMe,
  forgotPassword,
  resetPassword,
  refreshTokens,
  changePassword,
  logout,
  invalidateSessionByRefreshCookie,
  completeMfaLogin,
  issueSessionForUser,
};
