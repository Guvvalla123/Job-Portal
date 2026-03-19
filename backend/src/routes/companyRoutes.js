const express = require("express");
const { createCompany, listMyCompanies, listPublicCompanies, getPublicCompany } = require("../controllers/companyController");
const { requireAuth, requireRole } = require("../middlewares/auth");
const { validate } = require("../middlewares/validate");
const { createCompanySchema } = require("../validations/companyValidation");
const { ROLES } = require("../constants/roles");

const router = express.Router();

router.get("/", listPublicCompanies);
router.get("/me", requireAuth, requireRole(ROLES.RECRUITER, ROLES.ADMIN), listMyCompanies);
router.get("/:id", getPublicCompany);

router.post(
  "/",
  requireAuth,
  requireRole(ROLES.RECRUITER, ROLES.ADMIN),
  validate(createCompanySchema),
  createCompany
);

module.exports = { companyRoutes: router };
