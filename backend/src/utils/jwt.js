const jwt = require("jsonwebtoken");
const { env } = require("../config/env");

const signAccessToken = (payload) =>
  jwt.sign(payload, env.JWT_ACCESS_SECRET, { expiresIn: env.JWT_ACCESS_EXPIRES, jwtid: require("crypto").randomUUID() });

const signRefreshToken = (payload) =>
  jwt.sign(payload, env.JWT_REFRESH_SECRET, { expiresIn: env.JWT_REFRESH_EXPIRES });

const verifyAccessToken = (token) => jwt.verify(token, env.JWT_ACCESS_SECRET);

const verifyRefreshToken = (token) => jwt.verify(token, env.JWT_REFRESH_SECRET);

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
};
