const express = require("express");
const {
  createJob,
  listJobs,
  getJobById,
  listMyJobs,
  updateJob,
  deleteJob,
  getRecruiterAnalytics,
  getRecruiterApplicationTrend,
} = require("../controllers/jobController");
const { requireAuth, requireRole } = require("../middlewares/auth");
const { requireJobOwner } = require("../middlewares/authorize");
const { audit } = require("../middlewares/audit");
const { validate, validateQuery, validateParams } = require("../middlewares/validate");
const { createJobSchema, listJobsQuerySchema } = require("../validations/jobValidation");
const { mongoIdParam } = require("../validations/common");
const { ROLES } = require("../constants/roles");

const router = express.Router();

router.get("/", validateQuery(listJobsQuerySchema), listJobs);
router.get("/me", requireAuth, requireRole(ROLES.RECRUITER, ROLES.ADMIN), listMyJobs);
router.get("/analytics", requireAuth, requireRole(ROLES.RECRUITER, ROLES.ADMIN), getRecruiterAnalytics);
router.get("/analytics/trend", requireAuth, requireRole(ROLES.RECRUITER, ROLES.ADMIN), getRecruiterApplicationTrend);
router.get("/:id", validateParams(mongoIdParam("id")), getJobById);
router.post(
  "/",
  requireAuth,
  requireRole(ROLES.RECRUITER, ROLES.ADMIN),
  validate(createJobSchema),
  audit("create", "job", (req, body) => body?.data?.job?._id),
  createJob
);
router.put(
  "/:id",
  requireAuth,
  requireRole(ROLES.RECRUITER, ROLES.ADMIN),
  requireJobOwner("id"),
  validateParams(mongoIdParam("id")),
  validate(createJobSchema),
  audit("update", "job"),
  updateJob
);
router.delete(
  "/:id",
  requireAuth,
  requireRole(ROLES.RECRUITER, ROLES.ADMIN),
  requireJobOwner("id"),
  validateParams(mongoIdParam("id")),
  audit("delete", "job"),
  deleteJob
);

module.exports = { jobRoutes: router };
