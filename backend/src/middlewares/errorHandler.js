const { ApiError } = require("../utils/apiError");
const { child } = require("../config/logger");
const { env } = require("../config/env");
const { captureException } = require("../config/sentry");

const statusToDefaultCode = (status) => {
  const map = {
    400: "BAD_REQUEST",
    401: "UNAUTHORIZED",
    403: "FORBIDDEN",
    404: "NOT_FOUND",
    409: "CONFLICT",
    422: "UNPROCESSABLE_ENTITY",
    429: "TOO_MANY_REQUESTS",
    500: "INTERNAL_ERROR",
    503: "SERVICE_UNAVAILABLE",
  };
  return map[status] || `HTTP_${status}`;
};

const errorHandler = (err, req, res, _next) => {
  const requestId = req.id || "";
  if (env.NODE_ENV !== "test") {
    const log = child(requestId);
    log.error(err.message, { stack: err.stack, name: err.name });
  }

  const errorPayload = (statusCode, message, code, errors = []) => {
    const payload = {
      success: false,
      message,
      code,
      errors: Array.isArray(errors) ? errors : [],
    };
    if (requestId) payload.requestId = requestId;
    return res.status(statusCode).json(payload);
  };

  if (err.name === "ValidationError" && err.errors) {
    const errors = Object.entries(err.errors).map(([field, val]) => ({
      field,
      message: val.message,
    }));
    return errorPayload(400, "Validation failed", "VALIDATION_FAILED", errors);
  }

  if (err.name === "CastError") {
    return errorPayload(400, "Invalid ID format", "INVALID_ID", []);
  }

  if (err.name === "JsonWebTokenError") {
    return errorPayload(401, "Invalid token", "INVALID_TOKEN", []);
  }

  if (err.name === "TokenExpiredError") {
    return errorPayload(401, "Token expired", "TOKEN_EXPIRED", []);
  }

  /** MongoDB duplicate key (e.g. unique job+candidate on applications) */
  if (err.name === "MongoServerError" && err.code === 11000) {
    return errorPayload(409, "Resource already exists", "DUPLICATE_KEY", []);
  }

  if (err.name === "MulterError") {
    const msg =
      err.code === "LIMIT_FILE_SIZE"
        ? "File too large. Images: max 2MB. PDF resumes: max 5MB."
        : err.code === "LIMIT_UNEXPECTED_FILE"
          ? "Unexpected file field for this upload."
          : err.message;
    return errorPayload(400, msg, "UPLOAD_ERROR", [{ field: err.field || "file", message: msg }]);
  }

  if (err instanceof ApiError) {
    if (err.statusCode >= 500 && env.NODE_ENV !== "test") {
      captureException(err, { requestId });
    }
    const code = err.code || statusToDefaultCode(err.statusCode);
    return errorPayload(err.statusCode, err.message, code, err.errors || []);
  }

  const fallbackStatus = err.statusCode || 500;
  if (fallbackStatus >= 500 && env.NODE_ENV !== "test") {
    captureException(err, { requestId });
  }
  const message =
    fallbackStatus === 500 && env.NODE_ENV === "production"
      ? "Internal server error"
      : err.message || "Internal server error";

  return errorPayload(fallbackStatus, message, statusToDefaultCode(fallbackStatus), []);
};

module.exports = { errorHandler };
