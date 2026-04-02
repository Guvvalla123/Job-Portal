const { z } = require("zod");
const { ROLES } = require("../constants/roles");
const { PASSWORD_REGEX, PASSWORD_REQUIREMENT_MESSAGE } = require("../constants/passwordPolicy");

const registerSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  password: z.string().regex(PASSWORD_REGEX, PASSWORD_REQUIREMENT_MESSAGE),
  role: z.enum([ROLES.CANDIDATE, ROLES.RECRUITER]).default(ROLES.CANDIDATE),
});

const loginSchema = z.object({
  email: z.string().email(),
  /** Existing accounts may predate stricter policy; validation is on register/reset only. */
  password: z.string().min(1, "Password is required"),
});

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

const resetPasswordSchema = z.object({
  password: z.string().regex(PASSWORD_REGEX, PASSWORD_REQUIREMENT_MESSAGE),
});

const refreshSchema = z.object({});

module.exports = { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema, refreshSchema };
