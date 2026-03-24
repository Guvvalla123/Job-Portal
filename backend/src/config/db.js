const mongoose = require("mongoose");
const { env } = require("./env");
const { logger } = require("./logger");
const { ensureIndexes } = require("../models/indexes");

const CONNECT_TIMEOUT_MS = 10000;

/** Avoid noisy "disconnected" log when initial connection never succeeded (e.g. Atlas IP block). */
let mongoEverConnected = false;

function logMongoConnectionHelp(err) {
  const msg = err?.message || "";
  const isAtlas =
    msg.includes("Atlas") || msg.includes("whitelist") || msg.includes("ServerSelectionError");
  logger.error("MongoDB connection failed", { error: msg });
  logger.error("Fix: MongoDB Atlas → Network Access → Add IP Address → Add Current IP Address (or 0.0.0.0/0 for dev only)");
  if (isAtlas) {
    logger.error("Atlas hint: your PC's IP must be allowed. See https://www.mongodb.com/docs/atlas/security/ip-access-list/");
  }
  logger.error("Alternative (local): from repo root run: docker compose -f docker-compose.dev.yml up -d");
  logger.error('Then set MONGODB_URI=mongodb://127.0.0.1:27017/job_portal in backend/.env');
}

const connectDB = async () => {
  try {
    await mongoose.connect(env.MONGODB_URI, {
      maxPoolSize: 20,
      serverSelectionTimeoutMS: CONNECT_TIMEOUT_MS,
      connectTimeoutMS: CONNECT_TIMEOUT_MS,
    });
    await ensureIndexes();
    logger.info("MongoDB connected");
  } catch (err) {
    logMongoConnectionHelp(err);
    throw err;
  }
};

mongoose.connection.on("connected", () => {
  mongoEverConnected = true;
});

mongoose.connection.on("error", (err) => {
  logger.error("MongoDB connection error", { error: err.message });
});

mongoose.connection.on("disconnected", () => {
  if (mongoEverConnected) {
    logger.warn("MongoDB disconnected");
  }
});

module.exports = { connectDB };
