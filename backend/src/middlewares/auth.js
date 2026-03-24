const { verifyAccessToken } = require("../utils/jwt");
const { ApiError } = require("../utils/apiError");
const { isBlacklisted } = require("../utils/tokenBlacklist");

const requireAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(new ApiError(401, "Unauthorized"));
  }

  const token = authHeader.split(" ")[1];

  try {
    const payload = verifyAccessToken(token);
    if (payload.jti) {
      const revoked = await isBlacklisted(payload.jti);
      if (revoked) return next(new ApiError(401, "Token has been revoked"));
    }
    req.user = payload;
    return next();
  } catch {
    return next(new ApiError(401, "Invalid or expired token"));
  }
};

const requireRole = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return next(new ApiError(403, "Forbidden"));
  }
  return next();
};

/** Alias for route definitions (same as requireAuth). */
const protect = requireAuth;

module.exports = { requireAuth, protect, requireRole };
