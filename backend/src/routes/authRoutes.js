const express = require("express");
const {
  register,
  login,
  me,
  forgotPassword,
  resetPassword,
  refresh,
  logout,
  csrfToken,
  verifyMfaLogin,
  mfaSetup,
  mfaEnable,
  mfaDisable,
} = require("../controllers/authController");
const { validate } = require("../middlewares/validate");
const { requireAuth, requireRole } = require("../middlewares/auth");
const { ROLES } = require("../constants/roles");
const {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  refreshSchema,
  mfaVerifyLoginSchema,
  mfaEnableSchema,
  mfaDisableSchema,
} = require("../validations/authValidation");

const router = express.Router();

router.get("/csrf-token", csrfToken);
router.post("/register", validate(registerSchema), register);
router.post("/login", validate(loginSchema), login);
router.post("/mfa/verify-login", validate(mfaVerifyLoginSchema), verifyMfaLogin);
router.post("/refresh", validate(refreshSchema), refresh);
router.post("/mfa/setup", requireAuth, requireRole(ROLES.ADMIN), mfaSetup);
router.post("/mfa/enable", requireAuth, requireRole(ROLES.ADMIN), validate(mfaEnableSchema), mfaEnable);
router.post("/mfa/disable", requireAuth, requireRole(ROLES.ADMIN), validate(mfaDisableSchema), mfaDisable);
router.get("/me", requireAuth, me);
/** Logout resolves identity from Bearer and/or refresh cookie — do not use requireAuth. */
router.post("/logout", logout);
router.post("/forgot-password", validate(forgotPasswordSchema), forgotPassword);
router.post("/reset-password/:token", validate(resetPasswordSchema), resetPassword);

module.exports = { authRoutes: router };
