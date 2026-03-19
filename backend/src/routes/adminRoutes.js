const express = require("express");
const {
  getStats,
  listAllUsers,
  listAllJobs,
  toggleUserStatus,
  toggleJobStatus,
} = require("../controllers/adminController");
const { requireAuth, requireRole } = require("../middlewares/auth");
const { ROLES } = require("../constants/roles");

const router = express.Router();

router.use(requireAuth, requireRole(ROLES.ADMIN));

router.get("/stats", getStats);
router.get("/users", listAllUsers);
router.get("/jobs", listAllJobs);
router.patch("/users/:id/toggle-status", toggleUserStatus);
router.patch("/jobs/:id/toggle-status", toggleJobStatus);

module.exports = { adminRoutes: router };
