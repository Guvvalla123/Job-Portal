const { ApiError } = require("../utils/apiError");

const formatZodError = (error) =>
  error.issues.map((i) => (i.path.length ? `${i.path.join(".")}: ${i.message}` : i.message)).join("; ");

const validate = (schema) => (req, res, next) => {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return next(new ApiError(400, formatZodError(parsed.error)));
  }
  req.body = parsed.data;
  return next();
};

const validateQuery = (schema) => (req, res, next) => {
  const parsed = schema.safeParse(req.query);
  if (!parsed.success) {
    return next(new ApiError(400, formatZodError(parsed.error)));
  }
  req.query = parsed.data;
  return next();
};

const validateParams = (schema) => (req, res, next) => {
  const parsed = schema.safeParse(req.params);
  if (!parsed.success) {
    return next(new ApiError(400, formatZodError(parsed.error)));
  }
  req.params = { ...req.params, ...parsed.data };
  return next();
};

module.exports = { validate, validateQuery, validateParams };
