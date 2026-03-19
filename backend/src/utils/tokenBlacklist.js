/**
 * Token blacklist - revokes access tokens on logout.
 * Uses Redis when available, in-memory fallback for dev/test.
 */
const cache = require("./cache");

const PREFIX = "blacklist:access:";

const blacklist = async (jti, ttlSeconds) => {
  if (!jti || ttlSeconds <= 0) return;
  await cache.set(`${PREFIX}${jti}`, "revoked", ttlSeconds);
};

const isBlacklisted = async (jti) => {
  if (!jti) return false;
  const val = await cache.get(`${PREFIX}${jti}`);
  return val === "revoked";
};

module.exports = { blacklist, isBlacklisted };
