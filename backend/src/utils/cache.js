/**
 * Cache layer — shared Redis when REDIS_URL is set (see initRedis() from server.js),
 * else in-memory per process. Idempotency keys (`idempotency:` prefix) use the same store.
 */
const { logger } = require("../config/logger");
const { env } = require("../config/env");

const TTL_MS = 5 * 60 * 1000; // 5 min default
const memoryStore = new Map();

const getMemory = (key) => {
  const entry = memoryStore.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expires) {
    memoryStore.delete(key);
    return null;
  }
  return entry.value;
};

const setMemory = (key, value, ttlMs = TTL_MS) => {
  memoryStore.set(key, { value, expires: Date.now() + ttlMs });
};

let redisClient = null;

const initRedis = () => {
  const url = env.REDIS_URL;
  if (!url) return null;
  try {
    const Redis = require("ioredis");
    redisClient = new Redis(url, { maxRetriesPerRequest: 3 });
    redisClient.on("error", (err) => logger.warn("Redis error", { error: err.message }));
    return redisClient;
  } catch (err) {
    logger.warn("Redis not available, using memory cache", { error: err.message });
    return null;
  }
};

const get = async (key) => {
  if (redisClient) {
    try {
      const val = await redisClient.get(key);
      return val ? JSON.parse(val) : null;
    } catch {
      return getMemory(key);
    }
  }
  return getMemory(key);
};

const set = async (key, value, ttlSeconds = 300) => {
  const serialized = JSON.stringify(value);
  if (redisClient) {
    try {
      await redisClient.setex(key, ttlSeconds, serialized);
      return;
    } catch {
      setMemory(key, value, ttlSeconds * 1000);
      return;
    }
  }
  setMemory(key, value, ttlSeconds * 1000);
};

const del = async (key) => {
  if (redisClient) {
    try {
      await redisClient.del(key);
    } catch {}
  }
  memoryStore.delete(key);
};

const invalidatePattern = async (prefix) => {
  if (redisClient) {
    try {
      const keys = [];
      for await (const key of redisClient.scanStream({ match: `${prefix}*`, count: 100 })) {
        keys.push(key);
      }
      if (keys.length) await redisClient.del(...keys);
    } catch {}
  }
  for (const key of memoryStore.keys()) {
    if (key.startsWith(prefix)) memoryStore.delete(key);
  }
};

const cacheKey = (prefix, params) => `${prefix}:${JSON.stringify(params)}`;

const CACHE_TTL = {
  jobsList: 30,
  jobDetail: 300,
};

module.exports = { get, set, del, invalidatePattern, cacheKey, CACHE_TTL, initRedis };
