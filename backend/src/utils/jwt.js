const jwt = require("jsonwebtoken");
const { env } = require("../config/env");

const signOptsAccess = { expiresIn: env.JWT_ACCESS_EXPIRES, jwtid: require("crypto").randomUUID(), algorithm: "HS256" };
const signOptsRefresh = { expiresIn: env.JWT_REFRESH_EXPIRES, algorithm: "HS256" };

const signAccessToken = (payload) => jwt.sign(payload, env.JWT_ACCESS_SECRET, signOptsAccess);

const signRefreshToken = (payload) => jwt.sign(payload, env.JWT_REFRESH_SECRET, signOptsRefresh);

const JWT_VERIFY_OPTS = { algorithms: ["HS256"] };

const verifyAccessToken = (token) => jwt.verify(token, env.JWT_ACCESS_SECRET, JWT_VERIFY_OPTS);

const verifyRefreshToken = (token) => jwt.verify(token, env.JWT_REFRESH_SECRET, JWT_VERIFY_OPTS);

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
};
