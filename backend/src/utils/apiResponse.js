/**
 * Standardized API response helpers
 */
const success = (res, data, message = null, statusCode = 200) => {
  const payload = { success: true, data };
  if (message) payload.message = message;
  return res.status(statusCode).json(payload);
};

const created = (res, data, message = null) => success(res, data, message, 201);

const error = (res, message, statusCode = 500) =>
  res.status(statusCode).json({ success: false, message });

module.exports = { success, created, error };
