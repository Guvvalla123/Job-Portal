const express = require("express");
const multer = require("multer");
const { ApiError } = require("../utils/apiError");
const {
  updateProfile,
  uploadProfileImage,
  uploadResume,
  streamMyResumePdf,
  deleteResume,
  toggleSavedJob,
  getSavedJobs,
  deleteAccount,
} = require("../controllers/userController");
const { requireAuth, requireRole } = require("../middlewares/auth");
const { validate, validateParams } = require("../middlewares/validate");
const { updateProfileSchema } = require("../validations/userValidation");
const { mongoIdParam } = require("../validations/common");
const { ROLES } = require("../constants/roles");

const router = express.Router();

const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPEG, PNG, and WebP images are allowed"));
    }
  },
});

const RESUME_MAX_SIZE = 2 * 1024 * 1024; // 2MB

const resumeUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: RESUME_MAX_SIZE },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype !== "application/pdf") {
      return cb(new ApiError(400, "Only PDF files are allowed"));
    }
    cb(null, true);
  },
});

router.patch("/profile", requireAuth, validate(updateProfileSchema), updateProfile);
router.post("/profile/image", requireAuth, imageUpload.single("image"), uploadProfileImage);
router.post("/profile/resume", requireAuth, resumeUpload.single("resume"), uploadResume);
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
router.delete("/account", requireAuth, deleteAccount);

module.exports = { userRoutes: router };
