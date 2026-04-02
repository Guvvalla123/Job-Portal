const { ApiError } = require("../utils/apiError");

const zodIssuesToErrors = (error) =>
  (error.issues || []).map((i) => ({
    field: Array.isArray(i.path) ? i.path.filter(Boolean).join(".") : "",
    message: i.message,
  }));

const validate = (schema) => (req, res, next) => {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return next(
      new ApiError(422, "Validation failed", zodIssuesToErrors(parsed.error), "UNPROCESSABLE_ENTITY")
    );
  }
  req.body = parsed.data;
  return next();
};

const validateQuery = (schema) => (req, res, next) => {
  const parsed = schema.safeParse(req.query);
  if (!parsed.success) {
    return next(
      new ApiError(422, "Validation failed", zodIssuesToErrors(parsed.error), "UNPROCESSABLE_ENTITY")
    );
  }
  req.query = parsed.data;
  return next();
};

const validateParams = (schema) => (req, res, next) => {
  const parsed = schema.safeParse(req.params);
  if (!parsed.success) {
    return next(
      new ApiError(422, "Validation failed", zodIssuesToErrors(parsed.error), "UNPROCESSABLE_ENTITY")
    );
  }
  req.params = { ...req.params, ...parsed.data };
  return next();
};

module.exports = { validate, validateQuery, validateParams };
