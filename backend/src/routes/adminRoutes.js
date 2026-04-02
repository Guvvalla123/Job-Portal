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
} = require("../controllers/adminController");
const { requireAuth, requireRole } = require("../middlewares/auth");
const { ROLES } = require("../constants/roles");

const router = express.Router();

router.use(requireAuth, requireRole(ROLES.ADMIN));

router.get("/stats", getStats);
router.get("/stats/trend", getStatsTrend);
router.get("/users", listAllUsers);
router.get("/jobs", listAllJobs);
router.get("/companies", listAllCompanies);
router.get("/applications", listAllApplications);
router.get("/audit-logs", listAuditLogs);

router.patch("/users/:id/toggle-status", toggleUserStatus);
router.patch("/users/:id/role", updateUserRole);
router.delete("/users/:id", deleteUser);

router.patch("/jobs/:id/toggle-status", toggleJobStatus);
router.patch("/jobs/:id/status", updateJobStatus);
router.delete("/jobs/:id", deleteJob);

router.delete("/companies/:id", deleteCompany);

module.exports = { adminRoutes: router };
