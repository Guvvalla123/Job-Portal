const express = require("express");
const {
  createAlert,
  listAlerts,
  updateAlert,
  deleteAlert,
} = require("../controllers/jobAlertController");
const { requireAuth, requireRole } = require("../middlewares/auth");
const { validate, validateParams } = require("../middlewares/validate");
const { createAlertSchema, updateAlertSchema } = require("../validations/jobAlertValidation");
const { mongoIdParam } = require("../validations/common");
const { ROLES } = require("../constants/roles");

const router = express.Router();

router.post("/", requireAuth, requireRole(ROLES.CANDIDATE), validate(createAlertSchema), createAlert);
router.get("/", requireAuth, requireRole(ROLES.CANDIDATE), listAlerts);
router.patch(
  "/:id",
  requireAuth,
  requireRole(ROLES.CANDIDATE),
  validateParams(mongoIdParam("id")),
  validate(updateAlertSchema),
  updateAlert
);
router.delete("/:id", requireAuth, requireRole(ROLES.CANDIDATE), validateParams(mongoIdParam("id")), deleteAlert);

module.exports = { jobAlertRoutes: router };
