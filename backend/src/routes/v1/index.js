/**
 * API v1 routes - all versioned endpoints
 */
const express = require("express");
const { authRoutes } = require("../authRoutes");
const { jobRoutes } = require("../jobRoutes");
const { applicationRoutes } = require("../applicationRoutes");
const { userRoutes } = require("../userRoutes");
const { companyRoutes } = require("../companyRoutes");
const { adminRoutes } = require("../adminRoutes");
const { jobAlertRoutes } = require("../jobAlertRoutes");
const { notificationRoutes } = require("../notificationRoutes");

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/jobs", jobRoutes);
router.use("/applications", applicationRoutes);
router.use("/users", userRoutes);
router.use("/companies", companyRoutes);
router.use("/admin", adminRoutes);
router.use("/job-alerts", jobAlertRoutes);
router.use("/notifications", notificationRoutes);

module.exports = { v1Routes: router };
