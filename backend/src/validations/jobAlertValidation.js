const { z } = require("zod");

const FREQUENCIES = ["IMMEDIATE", "DAILY", "WEEKLY"];

/** Accept string (space/comma-separated), array of strings, or empty → normalized string array */
const keywordsField = z.preprocess((val) => {
  if (val == null || val === "") return [];
  if (Array.isArray(val)) return val.map(String).map((s) => s.trim()).filter(Boolean).slice(0, 50);
  if (typeof val === "string") {
    return val
      .split(/[\s,]+/)
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 50);
  }
  return [];
}, z.array(z.string().max(80)).max(50));

const createAlertSchema = z.object({
  keywords: keywordsField.optional().default([]),
  location: z.string().max(200).optional().default(""),
  employmentType: z.string().max(50).optional().default(""),
  salaryMin: z.coerce.number().min(0).optional(),
  frequency: z.enum(FREQUENCIES).optional().default("IMMEDIATE"),
});

const updateAlertSchema = z.object({
  keywords: keywordsField.optional(),
  location: z.string().max(200).optional(),
  employmentType: z.string().max(50).optional(),
  salaryMin: z.coerce.number().min(0).optional().nullable(),
  frequency: z.enum(FREQUENCIES).optional(),
  isActive: z.boolean().optional(),
});

module.exports = { createAlertSchema, updateAlertSchema };
