const express = require("express");
const {
  applyToJob,
  listMyApplications,
  updateApplicationStatus,
  listApplicationsForJob,
  streamApplicationResume,
} = require("../controllers/applicationController");
const { protect, requireRole } = require("../middlewares/auth");
const { requireJobOwnerByJobId, requireApplicationJobOwner } = require("../middlewares/authorize");
const { audit } = require("../middlewares/audit");
const { idempotency } = require("../middlewares/idempotency");
const { validate } = require("../middlewares/validate");
const { applyJobSchema, updateStatusSchema } = require("../validations/applicationValidation");
const { ROLES } = require("../constants/roles");

const router = express.Router();

router.post(
  "/",
  protect,
  requireRole(ROLES.CANDIDATE),
  idempotency,
  validate(applyJobSchema),
  audit("create", "application", (req, body) => body?.data?.application?._id),
  applyToJob
);

router.get("/me", protect, requireRole(ROLES.CANDIDATE), listMyApplications);

router.get(
  "/job/:jobId",
  protect,
  requireRole(ROLES.RECRUITER, ROLES.ADMIN),
  requireJobOwnerByJobId("jobId"),
  listApplicationsForJob
);

// CRITICAL: register GET /:id/resume before any GET /:id (if added later) or Express will treat "resume" as :id.
router.get(
  "/:id/resume",
  protect,
  requireRole(ROLES.RECRUITER, ROLES.ADMIN),
  requireApplicationJobOwner("id"),
  streamApplicationResume
);

router.patch(
  "/:id/status",
  protect,
  requireRole(ROLES.RECRUITER, ROLES.ADMIN),
  requireApplicationJobOwner("id"),
  validate(updateStatusSchema),
  audit("update", "application"),
  updateApplicationStatus
);

module.exports = { applicationRoutes: router };
