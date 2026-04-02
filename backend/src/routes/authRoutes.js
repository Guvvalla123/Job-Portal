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
} = require("../controllers/authController");
const { validate } = require("../middlewares/validate");
const { requireAuth } = require("../middlewares/auth");
const { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema, refreshSchema } = require("../validations/authValidation");

const router = express.Router();

router.get("/csrf-token", csrfToken);
router.post("/register", validate(registerSchema), register);
router.post("/login", validate(loginSchema), login);
router.post("/refresh", validate(refreshSchema), refresh);
router.get("/me", requireAuth, me);
/** Logout resolves identity from Bearer and/or refresh cookie — do not use requireAuth. */
router.post("/logout", logout);
router.post("/forgot-password", validate(forgotPasswordSchema), forgotPassword);
router.post("/reset-password/:token", validate(resetPasswordSchema), resetPassword);

module.exports = { authRoutes: router };
