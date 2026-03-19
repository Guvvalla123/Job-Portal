const { z } = require("zod");

const applyJobSchema = z.object({
  jobId: z.string().min(1, "Job ID is required"),
  coverLetter: z.string().max(2000).optional().default(""),
});

const updateStatusSchema = z.object({
  status: z.enum(["applied", "shortlisted", "rejected", "hired"]),
});

module.exports = { applyJobSchema, updateStatusSchema };
