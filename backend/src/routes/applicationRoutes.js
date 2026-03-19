const express = require("express");
const {
  applyToJob,
  listMyApplications,
  updateApplicationStatus,
  listApplicationsForJob,
} = require("../controllers/applicationController");
const { requireAuth, requireRole } = require("../middlewares/auth");
const { requireJobOwnerByJobId, requireApplicationJobOwner } = require("../middlewares/authorize");
const { audit } = require("../middlewares/audit");
const { idempotency } = require("../middlewares/idempotency");
const { validate } = require("../middlewares/validate");
const { applyJobSchema, updateStatusSchema } = require("../validations/applicationValidation");
const { ROLES } = require("../constants/roles");

const router = express.Router();

router.post(
  "/",
  requireAuth,
  requireRole(ROLES.CANDIDATE),
  idempotency,
  validate(applyJobSchema),
  audit("create", "application", (req, body) => body?.data?.application?._id),
  applyToJob
);
router.get("/me", requireAuth, requireRole(ROLES.CANDIDATE), listMyApplications);
router.get(
  "/job/:jobId",
  requireAuth,
  requireRole(ROLES.RECRUITER, ROLES.ADMIN),
  requireJobOwnerByJobId("jobId"),
  listApplicationsForJob
);
router.patch(
  "/:id/status",
  requireAuth,
  requireRole(ROLES.RECRUITER, ROLES.ADMIN),
  requireApplicationJobOwner("id"),
  validate(updateStatusSchema),
  audit("update", "application"),
  updateApplicationStatus
);

module.exports = { applicationRoutes: router };
