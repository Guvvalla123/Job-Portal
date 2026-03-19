const { z } = require("zod");

const createAlertSchema = z.object({
  keywords: z.string().max(500).optional().default(""),
  location: z.string().max(200).optional().default(""),
  employmentType: z.string().max(50).optional().default(""),
});

const updateAlertSchema = z.object({
  keywords: z.string().max(500).optional(),
  location: z.string().max(200).optional(),
  employmentType: z.string().max(50).optional(),
  isActive: z.boolean().optional(),
});

module.exports = { createAlertSchema, updateAlertSchema };
