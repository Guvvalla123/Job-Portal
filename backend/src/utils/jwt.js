const jwt = require("jsonwebtoken");
const { env } = require("../config/env");

const crypto = require("crypto");

const signAccessToken = (payload) =>
  jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES,
    jwtid: crypto.randomUUID(),
    algorithm: "HS256",
  });

/** New `jti` every call so stored refresh hash rotates and old cookies fail reuse detection. */
const signRefreshToken = (payload) =>
  jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES,
    jwtid: crypto.randomUUID(),
    algorithm: "HS256",
  });

const JWT_VERIFY_OPTS = { algorithms: ["HS256"] };

const verifyAccessToken = (token) => jwt.verify(token, env.JWT_ACCESS_SECRET, JWT_VERIFY_OPTS);

const verifyRefreshToken = (token) => jwt.verify(token, env.JWT_REFRESH_SECRET, JWT_VERIFY_OPTS);

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
};
