const express = require("express");
const {
  applyToJob,
  listMyApplications,
  updateApplicationStatus,
  listApplicationsForJob,
  getApplicationById,
  updateRecruiterNotes,
  updateInterview,
  listUpcomingInterviews,
  streamApplicationResume,
} = require("../controllers/applicationController");
const { protect, requireRole } = require("../middlewares/auth");
const { requireJobOwnerByJobId, requireApplicationJobOwner } = require("../middlewares/authorize");
const { audit } = require("../middlewares/audit");
const { idempotency } = require("../middlewares/idempotency");
const { validate, validateQuery } = require("../middlewares/validate");
const {
  applyJobSchema,
  updateStatusSchema,
  updateNotesSchema,
  updateInterviewSchema,
  listJobApplicationsQuerySchema,
  listMyApplicationsQuerySchema,
} = require("../validations/applicationValidation");
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

router.get(
  "/me",
  protect,
  requireRole(ROLES.CANDIDATE),
  validateQuery(listMyApplicationsQuerySchema),
  listMyApplications
);

router.get(
  "/interviews/upcoming",
  protect,
  requireRole(ROLES.RECRUITER, ROLES.ADMIN),
  listUpcomingInterviews
);

router.get(
  "/job/:jobId",
  protect,
  requireRole(ROLES.RECRUITER, ROLES.ADMIN),
  requireJobOwnerByJobId("jobId"),
  validateQuery(listJobApplicationsQuerySchema),
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

router.get(
  "/:id",
  protect,
  requireRole(ROLES.RECRUITER, ROLES.ADMIN),
  requireApplicationJobOwner("id"),
  getApplicationById
);

router.patch(
  "/:id/notes",
  protect,
  requireRole(ROLES.RECRUITER, ROLES.ADMIN),
  requireApplicationJobOwner("id"),
  validate(updateNotesSchema),
  audit("update", "application"),
  updateRecruiterNotes
);

router.patch(
  "/:id/interview",
  protect,
  requireRole(ROLES.RECRUITER, ROLES.ADMIN),
  requireApplicationJobOwner("id"),
  validate(updateInterviewSchema),
  audit("update", "application"),
  updateInterview
);

module.exports = { applicationRoutes: router };
