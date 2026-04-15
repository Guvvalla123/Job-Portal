const { authenticator } = require("otplib");
const { ApiError } = require("../utils/apiError");
const { encryptTotpSecret, decryptTotpSecret } = require("../utils/mfaSecretCrypto");
const { env } = require("../config/env");
const userRepository = require("../repositories/userRepository");
const { ROLES } = require("../constants/roles");

authenticator.options = { window: 1 };

function requireMfaKey() {
  if (!env.MFA_ENCRYPTION_KEY || env.MFA_ENCRYPTION_KEY.length < 32) {
    throw new ApiError(500, "MFA encryption is not configured (MFA_ENCRYPTION_KEY min 32 chars).");
  }
}

/**
 * Generate a new secret for enrollment (plaintext shown once to the user).
 */
function generateEnrollmentSecret() {
  return authenticator.generateSecret();
}

function buildOtpauthUrl(email, secret) {
  const issuer = "CareerSync";
  return authenticator.keyuri(email || "admin", issuer, secret);
}

async function enableMfaForUser(userId, plainSecret, code) {
  requireMfaKey();
  const ok = authenticator.verify({ token: code, secret: plainSecret });
  if (!ok) throw new ApiError(400, "Invalid authenticator code.");

  const enc = encryptTotpSecret(plainSecret, env.MFA_ENCRYPTION_KEY);
  await userRepository.updateById(userId, { mfaTotpSecretEnc: enc, mfaEnabled: true });
  return {};
}

async function verifyLoginTotp(userId, code) {
  requireMfaKey();
  const user = await userRepository.findById(userId, "+mfaTotpSecretEnc mfaEnabled role");
  if (!user?.mfaEnabled) throw new ApiError(400, "MFA is not enabled for this account.");
  const secret = decryptTotpSecret(user.mfaTotpSecretEnc, env.MFA_ENCRYPTION_KEY);
  if (!secret) throw new ApiError(500, "Could not read MFA secret.");

  const ok = authenticator.verify({ token: code, secret });
  if (!ok) throw new ApiError(401, "Invalid authenticator code.");
  return user;
}

async function disableMfaForUser(userId, password) {
  requireMfaKey();
  const user = await userRepository.findById(userId, "+password mfaEnabled");
  if (!user) throw new ApiError(404, "User not found");
  if (!user.mfaEnabled) throw new ApiError(400, "MFA is not enabled.");

  const valid = await user.comparePassword(password);
  if (!valid) throw new ApiError(401, "Current password is incorrect.");

  await userRepository.updateById(userId, {
    mfaEnabled: false,
    mfaTotpSecretEnc: "",
  });
  return {};
}

function assertAdminRole(jwtPayload) {
  if (!jwtPayload || jwtPayload.role !== ROLES.ADMIN) {
    throw new ApiError(403, "Only administrators can manage MFA for this flow.");
  }
}

module.exports = {
  generateEnrollmentSecret,
  buildOtpauthUrl,
  enableMfaForUser,
  verifyLoginTotp,
  disableMfaForUser,
  assertAdminRole,
  requireMfaKey,
};
