/**
 * Standardized API response helpers
 * Success: { success, message, data }
 * error(): aligns with middleware error shape (prefer throwing ApiError for route handlers)
 */
const success = (res, data, message = "Success", statusCode = 200) => {
  const payload = {
    success: true,
    message,
    data: data === undefined || data === null ? {} : data,
  };
  return res.status(statusCode).json(payload);
};

const created = (res, data, message = "Created") => success(res, data, message, 201);

const error = (res, message, statusCode = 500, code = "INTERNAL_ERROR", errors = []) =>
  res.status(statusCode).json({
    success: false,
    message,
    code,
    errors: Array.isArray(errors) ? errors : [],
  });

module.exports = { success, created, error };
