const express = require("express");
const { register, login, me, forgotPassword, resetPassword, refresh, logout } = require("../controllers/authController");
const { validate } = require("../middlewares/validate");
const { requireAuth } = require("../middlewares/auth");
const { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema, refreshSchema } = require("../validations/authValidation");

const router = express.Router();

router.post("/register", validate(registerSchema), register);
router.post("/login", validate(loginSchema), login);
router.post("/refresh", validate(refreshSchema), refresh);
router.get("/me", requireAuth, me);
router.post("/logout", requireAuth, logout);
router.post("/forgot-password", validate(forgotPasswordSchema), forgotPassword);
router.post("/reset-password/:token", validate(resetPasswordSchema), resetPassword);

module.exports = { authRoutes: router };
