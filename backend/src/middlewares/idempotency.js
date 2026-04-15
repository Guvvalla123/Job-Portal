/**
 * Idempotency middleware — replays cached success responses for the same key.
 * Uses `utils/cache`: **shared Redis** when `REDIS_URL` is set and `cache.initRedis()`
 * runs at server startup (`server.js`); otherwise **in-memory per Node process** only.
 * See docs/operations/DEPLOYMENT.md ("Idempotency & horizontal scale").
 */
const cache = require("../utils/cache");

const IDEMPOTENCY_TTL = 24 * 60 * 60; // 24 hours
const PREFIX = "idempotency:";

const idempotency = async (req, res, next) => {
  const key = req.headers["idempotency-key"];
  if (!key || typeof key !== "string" || key.length > 128) {
    return next(); // Optional: skip idempotency when header absent
  }

  const uid = req.user?.userId || "anon";
  const path = req.baseUrl ? `${req.baseUrl}${req.path}` : req.path || "";
  const cacheKey = `${PREFIX}${uid}:${req.method}:${path}:${key}`;

  try {
    const cached = await cache.get(cacheKey);
    if (cached?.body) {
      return res.status(cached.status || 200).json(cached.body);
    }
  } catch {
    // Fall through to normal processing
  }

  const originalJson = res.json.bind(res);
  res.json = function (body) {
    if (res.statusCode >= 200 && res.statusCode < 400) {
      cache.set(cacheKey, { status: res.statusCode, body }, IDEMPOTENCY_TTL).catch(() => {});
    }
    return originalJson(body);
  };
  next();
};

module.exports = { idempotency };
