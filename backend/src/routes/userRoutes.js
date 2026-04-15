const express = require("express");
const {
  changePassword,
  updateProfile,
  uploadProfileImage,
  uploadResume,
  streamMyResumePdf,
  deleteResume,
  toggleSavedJob,
  getSavedJobs,
  deleteAccount,
  exportMyData,
} = require("../controllers/userController");
const { requireAuth, requireRole } = require("../middlewares/auth");
const { validate, validateParams } = require("../middlewares/validate");
const { updateProfileSchema, changePasswordSchema } = require("../validations/userValidation");
const { mongoIdParam } = require("../validations/common");
const { ROLES } = require("../constants/roles");
const { singleImage, singlePdf } = require("../middlewares/upload");

const router = express.Router();

router.patch("/change-password", requireAuth, validate(changePasswordSchema), changePassword);
router.patch("/profile", requireAuth, validate(updateProfileSchema), updateProfile);
router.post("/profile/image", requireAuth, singleImage("image"), uploadProfileImage);
router.post("/profile/resume", requireAuth, singlePdf("resume"), uploadResume);
router.get("/profile/resume/file", requireAuth, streamMyResumePdf);
router.delete("/profile/resume", requireAuth, deleteResume);
router.post(
  "/saved-jobs/:jobId",
  requireAuth,
  requireRole(ROLES.CANDIDATE),
  validateParams(mongoIdParam("jobId")),
  toggleSavedJob
);
router.get("/saved-jobs", requireAuth, requireRole(ROLES.CANDIDATE), getSavedJobs);
router.get("/me/data-export", requireAuth, exportMyData);
router.delete("/account", requireAuth, deleteAccount);

module.exports = { userRoutes: router };
