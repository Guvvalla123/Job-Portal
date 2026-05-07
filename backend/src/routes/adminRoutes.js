const express = require("express");
const {
  getStats,
  getStatsTrend,
  listAllUsers,
  listAllJobs,
  toggleUserStatus,
  toggleJobStatus,
  updateJobStatus,
  updateUserRole,
  deleteUser,
  listAllCompanies,
  deleteCompany,
  listAllApplications,
  listAuditLogs,
  deleteJob,
  createJob,
  verifyJob,
  extendJobExpiry,
  getJobReports,
  reviewJobReport,
  getSubscriptions,
  getRevenueStats,
} = require("../controllers/adminController");
const { requireAuth, requireRole } = require("../middlewares/auth");
const { requireAdminPortalAccess } = require("../middlewares/requireAdminPortalAccess");
const { ROLES } = require("../constants/roles");
const { validate, validateParams } = require("../middlewares/validate");
const { createJobSchema } = require("../validations/jobValidation");
const { mongoIdParam } = require("../validations/common");
const { audit } = require("../middlewares/audit");
const { z } = require("zod");

const router = express.Router();

router.use(requireAuth, requireRole(ROLES.ADMIN), requireAdminPortalAccess);

const adminReviewJobReportSchema = z.object({
  status: z.enum(["reviewed", "resolved", "dismissed"]),
  adminNotes: z.string().max(500).optional(),
});

const extendJobExpirySchema = z.object({
  days: z.coerce.number().int().min(1).max(30),
});

router.get("/stats", getStats);
router.get("/stats/trend", getStatsTrend);
router.get("/users", listAllUsers);
router.get("/jobs", listAllJobs);
router.get("/companies", listAllCompanies);
router.get("/applications", listAllApplications);
router.get("/audit-logs", listAuditLogs);

router.post(
  "/jobs/create",
  validate(createJobSchema),
  audit("create", "job", (req, body) => body?.data?.job?._id || body?.data?.job?.id),
  createJob
);
router.patch("/jobs/:id/verify", validateParams(mongoIdParam("id")), verifyJob);
router.patch(
  "/jobs/:id/extend",
  validateParams(mongoIdParam("id")),
  validate(extendJobExpirySchema),
  extendJobExpiry
);

router.get("/job-reports", getJobReports);
router.patch(
  "/job-reports/:id",
  validateParams(mongoIdParam("id")),
  validate(adminReviewJobReportSchema),
  reviewJobReport
);

router.get("/subscriptions", getSubscriptions);
router.get("/revenue", getRevenueStats);

router.patch("/users/:id/toggle-status", toggleUserStatus);
router.patch("/users/:id/role", updateUserRole);
router.delete("/users/:id", deleteUser);

router.patch("/jobs/:id/toggle-status", toggleJobStatus);
router.patch("/jobs/:id/status", updateJobStatus);
router.delete("/jobs/:id", deleteJob);

router.delete("/companies/:id", deleteCompany);

module.exports = { adminRoutes: router };
