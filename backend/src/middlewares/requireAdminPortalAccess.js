const { ApiError } = require("../utils/apiError");
const { env } = require("../config/env");
const { ROLES } = require("../constants/roles");
const userRepository = require("../repositories/userRepository");

/**
 * After requireAuth + requireRole(ADMIN): enforces optional org-wide MFA policy and step-up session flag.
 * Access JWT / refresh must include `amfa: true` once MFA is satisfied for users with mfaEnabled.
 */
const requireAdminPortalAccess = async (req, res, next) => {
  if (req.user.role !== ROLES.ADMIN) {
    return next();
  }

  const user = await userRepository.findById(req.user.userId, "mfaEnabled");
  if (!user) {
    return next(new ApiError(404, "User not found"));
  }

  if (user.mfaEnabled && req.user.amfa !== true) {
    return next(
      new ApiError(403, "Two-factor authentication is required for admin access.", "MFA_STEP_REQUIRED", [])
    );
  }

  if (env.adminMfaRequired && !user.mfaEnabled) {
    return next(
      new ApiError(
        403,
        "Administrator authenticator (MFA) enrollment is required before using the admin console.",
        "MFA_ENROLLMENT_REQUIRED",
        []
      )
    );
  }

  return next();
};

module.exports = { requireAdminPortalAccess };
