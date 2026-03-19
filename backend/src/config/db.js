const mongoose = require("mongoose");
const { env } = require("./env");
const { logger } = require("./logger");
const { ensureIndexes } = require("../models/indexes");

const CONNECT_TIMEOUT_MS = 10000;

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
    logger.error("MongoDB connection failed", { error: err.message });
    throw err;
  }
};

mongoose.connection.on("error", (err) => {
  logger.error("MongoDB connection error", { error: err.message });
});

mongoose.connection.on("disconnected", () => {
  logger.warn("MongoDB disconnected");
});

module.exports = { connectDB };
