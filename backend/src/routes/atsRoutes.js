const express = require("express");
const { analyzeResume, getHistory, getUsageStats, getCheck } = require("../controllers/atsController");
const { requireAuth } = require("../middlewares/auth");
const { csrfProtection } = require("../middlewares/csrf");
const { validate, validateParams } = require("../middlewares/validate");
const { atsCheckSchema } = require("../validations/jobValidation");
const { mongoIdParam } = require("../validations/common");

const router = express.Router();

router.post("/analyze", requireAuth, csrfProtection, validate(atsCheckSchema), analyzeResume);
router.get("/history", requireAuth, getHistory);
router.get("/usage", requireAuth, getUsageStats);
router.get("/history/:id", requireAuth, validateParams(mongoIdParam("id")), getCheck);

module.exports = { atsRoutes: router };
