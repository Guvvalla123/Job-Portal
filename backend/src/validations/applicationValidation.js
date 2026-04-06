const { z } = require("zod");
const { APPLICATION_STATUSES, INTERVIEW_STATUSES } = require("../constants/applicationStatus");
const { APPLICATIONS_LIST_MAX } = require("./paginationLimits");

const applyJobSchema = z.object({
  jobId: z.string().min(1, "Job ID is required"),
  coverLetter: z.string().max(2000).optional().default(""),
});

const updateStatusSchema = z.object({
  status: z.enum(APPLICATION_STATUSES),
});

const updateNotesSchema = z.object({
  recruiterNotes: z.string().max(8000).optional().default(""),
});

const updateInterviewSchema = z.object({
  scheduledAt: z.union([z.string(), z.null()]).optional(),
  timezone: z.string().max(80).optional(),
  durationMinutes: z.coerce.number().int().min(15).max(480).optional(),
  notes: z.string().max(2000).optional(),
  status: z.enum(INTERVIEW_STATUSES).optional(),
  /** If true (default), set application pipeline to `interview` when scheduling */
  syncPipelineStatus: z.boolean().optional(),
});

const listJobApplicationsQuerySchema = z.object({
  status: z.enum(APPLICATION_STATUSES).optional(),
  q: z.string().max(200).optional(),
  skill: z.string().max(80).optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(APPLICATIONS_LIST_MAX).optional().default(20),
});

const listMyApplicationsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(APPLICATIONS_LIST_MAX).optional().default(20),
});

module.exports = {
  applyJobSchema,
  updateStatusSchema,
  updateNotesSchema,
  updateInterviewSchema,
  listJobApplicationsQuerySchema,
  listMyApplicationsQuerySchema,
};
