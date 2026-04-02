const express = require("express");
const multer = require("multer");
const { ApiError } = require("../utils/apiError");
const {
  createCompany,
  updateCompany,
  deleteCompany,
  uploadCompanyLogo,
  listMyCompanies,
  listPublicCompanies,
  getPublicCompany,
} = require("../controllers/companyController");
const { requireAuth, requireRole } = require("../middlewares/auth");
const { validate, validateParams } = require("../middlewares/validate");
const { createCompanySchema, updateCompanySchema } = require("../validations/companyValidation");
const { mongoIdParam } = require("../validations/common");
const { ROLES } = require("../constants/roles");

const router = express.Router();

const logoUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPEG, PNG, and WebP images are allowed"));
    }
  },
});

router.get("/", listPublicCompanies);
router.get("/me", requireAuth, requireRole(ROLES.RECRUITER, ROLES.ADMIN), listMyCompanies);

router.post(
  "/",
  requireAuth,
  requireRole(ROLES.RECRUITER, ROLES.ADMIN),
  validate(createCompanySchema),
  createCompany
);

router.patch(
  "/:id",
  requireAuth,
  requireRole(ROLES.RECRUITER, ROLES.ADMIN),
  validateParams(mongoIdParam("id")),
  validate(updateCompanySchema),
  updateCompany
);

router.delete("/:id", requireAuth, requireRole(ROLES.RECRUITER, ROLES.ADMIN), validateParams(mongoIdParam("id")), deleteCompany);

router.post(
  "/:id/logo",
  requireAuth,
  requireRole(ROLES.RECRUITER, ROLES.ADMIN),
  validateParams(mongoIdParam("id")),
  (req, res, next) => {
    logoUpload.single("logo")(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        return next(new ApiError(400, err.message));
      }
      if (err) return next(err);
      return next();
    });
  },
  uploadCompanyLogo
);

router.get("/:id", validateParams(mongoIdParam("id")), getPublicCompany);

module.exports = { companyRoutes: router };
