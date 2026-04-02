const { z } = require("zod");

const createCompanySchema = z.object({
  name: z.string().min(2, "Company name must be at least 2 characters"),
  website: z.string().url("Invalid URL").optional().or(z.literal("")),
  location: z.string().optional(),
  description: z.string().optional(),
});

const updateCompanySchema = z.object({
  name: z.string().min(2).optional(),
  website: z.string().url("Invalid URL").optional().or(z.literal("")),
  location: z.string().optional(),
  description: z.string().optional(),
});

module.exports = { createCompanySchema, updateCompanySchema };
