/**
 * Shared validation helpers
 */
const { z } = require("zod");

const mongoIdRegex = /^[a-f\d]{24}$/i;

const mongoId = z.string().regex(mongoIdRegex, "Invalid ID format");

const mongoIdParam = (paramName) =>
  z.object({
    [paramName]: mongoId,
  });

module.exports = { mongoId, mongoIdParam, mongoIdRegex };
