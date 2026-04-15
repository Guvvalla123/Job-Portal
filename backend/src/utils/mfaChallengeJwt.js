const jwt = require("jsonwebtoken");
const { env } = require("../config/env");

const TYP = "mfa_chal";
const TTL = "5m";

const signOpts = { expiresIn: TTL, algorithm: "HS256" };
const verifyOpts = { algorithms: ["HS256"] };

/**
 * Short-lived token after password OK, before TOTP — no refresh cookie yet.
 */
function signMfaChallengeToken(userId) {
  return jwt.sign({ typ: TYP, userId: String(userId) }, env.JWT_ACCESS_SECRET, signOpts);
}

function verifyMfaChallengeToken(token) {
  const payload = jwt.verify(token, env.JWT_ACCESS_SECRET, verifyOpts);
  if (payload.typ !== TYP || !payload.userId) {
    throw new Error("Invalid MFA challenge token");
  }
  return String(payload.userId);
}

module.exports = { signMfaChallengeToken, verifyMfaChallengeToken, MFA_CHALLENGE_TYP: TYP };
