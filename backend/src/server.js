const mongoose = require("mongoose");
const { initSentry } = require("./config/sentry");
initSentry();
const { app } = require("./app");
const { env } = require("./config/env");
const { connectDB } = require("./config/db");
const { logger } = require("./config/logger");
const cache = require("./utils/cache");
const { closeQueue } = require("./queues/emailQueue");

let server = null;
let isShuttingDown = false;

const DRAIN_MS = 10000;

const shutdown = async (signal) => {
  if (isShuttingDown) return;
  isShuttingDown = true;
  logger.info(`${signal} received. Shutting down gracefully...`);

  try {
    if (server) {
      await Promise.race([
        new Promise((resolve) => {
          server.close(() => {
            logger.info("HTTP server closed");
            resolve();
          });
        }),
        new Promise((resolve) => {
          setTimeout(() => {
            logger.warn(`HTTP close timed out after ${DRAIN_MS}ms; continuing shutdown`);
            resolve();
          }, DRAIN_MS);
        }),
      ]);
    }

    await closeQueue().catch((err) => logger.warn("Email queue close failed", { error: err.message }));

    await mongoose.disconnect();
    logger.info("MongoDB disconnected");
    process.exit(0);
  } catch (err) {
    logger.error("Shutdown error", { error: err.message, stack: err.stack });
    process.exit(1);
  }
};

const startServer = async () => {
  try {
    await connectDB();
    cache.initRedis();
    server = app.listen(Number(env.PORT), () => {
      logger.info(`Backend running on port ${env.PORT}`, { env: env.NODE_ENV });
    });

    server.on("error", (err) => {
      logger.error("Server error", { error: err.message });
      process.exit(1);
    });

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));
  } catch (error) {
    // DB errors already logged in connectDB with fix hints; avoid duplicate stack noise
    if (!String(error?.message || "").includes("MongoDB")) {
      logger.error("Failed to start server", { error: error.message, stack: error.stack });
    }
    process.exit(1);
  }
};

startServer();
