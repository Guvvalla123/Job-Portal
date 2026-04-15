const express = require("express");
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
const { singleImage } = require("../middlewares/upload");

const router = express.Router();

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
  singleImage("logo"),
  uploadCompanyLogo
);

router.get("/:id", validateParams(mongoIdParam("id")), getPublicCompany);

module.exports = { companyRoutes: router };
