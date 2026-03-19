const express = require("express");
const mongoose = require("mongoose");
const { v1Routes } = require("./v1");

const router = express.Router();
const startTime = Date.now();

/**
 * Liveness probe - process is alive. No DB dependency.
 * K8s/load balancers use this to restart unhealthy pods.
 */
router.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "API is healthy",
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor((Date.now() - startTime) / 1000),
  });
});

/**
 * Readiness probe - app can accept traffic (DB connected).
 * K8s uses this to remove pod from service endpoints when not ready.
 */
router.get("/ready", async (req, res) => {
  const state = mongoose.connection.readyState;
  const isReady = state === 1;

  if (!isReady) {
    return res.status(503).json({
      success: false,
      message: "Service not ready",
      db: { status: ["disconnected", "connected", "connecting", "disconnecting"][state] },
      timestamp: new Date().toISOString(),
    });
  }

  res.status(200).json({
    success: true,
    message: "Service ready",
    db: "connected",
    timestamp: new Date().toISOString(),
  });
});

/**
 * API v1 - versioned routes
 */
router.use("/v1", v1Routes);

module.exports = { apiRoutes: router };
