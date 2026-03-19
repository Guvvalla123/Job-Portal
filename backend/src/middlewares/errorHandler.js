const { ApiError } = require("../utils/apiError");
const { child } = require("../config/logger");

const errorHandler = (err, req, res, _next) => {
  const requestId = req.id || "";
  if (process.env.NODE_ENV !== "test") {
    const log = child(requestId);
    log.error(err.message, { stack: err.stack, name: err.name });
  }

  const errorPayload = (statusCode, message, fields = null) => {
    const payload = { success: false, message };
    if (requestId) payload.requestId = requestId;
    if (fields) payload.fields = fields;
    return res.status(statusCode).json(payload);
  };

  if (err.name === "ValidationError" && err.errors) {
    const fields = Object.entries(err.errors).reduce((acc, [key, val]) => {
      acc[key] = val.message;
      return acc;
    }, {});
    return errorPayload(400, "Validation failed", fields);
  }

  if (err.name === "CastError") {
    return errorPayload(400, "Invalid ID format");
  }

  if (err.name === "JsonWebTokenError") {
    return errorPayload(401, "Invalid token");
  }

  if (err.name === "TokenExpiredError") {
    return errorPayload(401, "Token expired");
  }

  if (err.name === "MulterError") {
    const msg =
      err.code === "LIMIT_FILE_SIZE"
        ? "File too large. Resume must be less than 2MB."
        : err.code === "LIMIT_UNEXPECTED_FILE"
          ? "Unexpected field name. Use 'resume' for resume upload."
          : err.message;
    return errorPayload(400, msg);
  }

  if (err instanceof ApiError) {
    return errorPayload(err.statusCode, err.message);
  }

  const statusCode = err.statusCode || 500;
  const message =
    statusCode === 500 && process.env.NODE_ENV === "production"
      ? "Internal server error"
      : err.message || "Internal server error";

  return errorPayload(statusCode, message);
};

module.exports = { errorHandler };
