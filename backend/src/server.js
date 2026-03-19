const mongoose = require("mongoose");
const { app } = require("./app");
const { env } = require("./config/env");
const { connectDB } = require("./config/db");
const { logger } = require("./config/logger");
const cache = require("./utils/cache");

let server = null;
let isShuttingDown = false;

const shutdown = async (signal) => {
  if (isShuttingDown) return;
  isShuttingDown = true;
  logger.info(`${signal} received. Shutting down gracefully...`);

  try {
    if (server) {
      await new Promise((resolve) => {
        server.close(() => {
          logger.info("HTTP server closed");
          resolve();
        });
      });
    }
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
    logger.error("Failed to start server", { error: error.message, stack: error.stack });
    process.exit(1);
  }
};

startServer();
