const { z } = require("zod");
const { JOBS_LIST_MAX } = require("./paginationLimits");

const jobCategoryEnum = z.enum([
  "technology",
  "finance",
  "marketing",
  "sales",
  "design",
  "operations",
  "human-resources",
  "other",
]);

const jobTagEnum = z.enum(["remote", "urgent", "new", "hot", "featured"]);

/** Empty string → null for optional nullable URL fields */
function emptyStringToNull(v) {
  if (v === "") return null;
  return v;
}

const optionalNullableUrl = z.preprocess(
  emptyStringToNull,
  z.union([z.string().url(), z.null()]).optional()
);

const expiresAtField = z
  .union([z.string(), z.date(), z.null()])
  .optional()
  .nullable()
  .transform((v) => {
    if (v == null || v === "") return null;
    const d = v instanceof Date ? v : new Date(v);
    return Number.isNaN(d.getTime()) ? null : d;
  });

const listJobsQuerySchema = z.object({
  q: z.string().max(200).optional().default(""),
  location: z.string().max(200).optional().default(""),
  employmentType: z.enum(["full-time", "part-time", "contract", "internship"]).optional(),
  experienceLevel: z.enum(["fresher", "junior", "mid", "senior", "lead"]).optional(),
  category: jobCategoryEnum.optional(),
  tags: z.preprocess((v) => {
    if (v == null || v === "") return undefined;
    if (Array.isArray(v)) return v;
    if (typeof v === "string") {
      return v
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }
    return v;
  }, z.array(jobTagEnum).optional()),
  isVerified: z.preprocess((v) => {
    if (v === undefined || v === null || v === "") return undefined;
    if (v === true || v === "true" || v === "1") return true;
    if (v === false || v === "false" || v === "0") return false;
    return v;
  }, z.boolean().optional()),
  postedWithin: z.enum(["today", "3days", "7days"]).optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(JOBS_LIST_MAX).optional().default(10),
  sort: z
    .preprocess((v) => {
      if (v == null || v === "") return "newest";
      const m = { recent: "newest", "salary-desc": "salary_high", "salary-asc": "salary_low" };
      return m[v] || v;
    }, z.enum(["newest", "oldest", "salary_high", "salary_low", "most-clicked"]))
    .optional()
    .default("newest"),
});

const createJobSchema = z
  .object({
    title: z.string().min(3),
    description: z.string().min(20).max(10000, "Description cannot exceed 10000 characters"),
    location: z.string().min(2),
    employmentType: z.enum(["full-time", "part-time", "contract", "internship"]),
    experienceLevel: z.enum(["fresher", "junior", "mid", "senior", "lead"]),
    minSalary: z.coerce.number().nonnegative(),
    maxSalary: z.coerce.number().nonnegative(),
    skills: z.array(z.string()).default([]),
    companyId: z.preprocess(
      (v) => (v === "" || v == null ? undefined : String(v)),
      z.string().min(1).optional()
    ),
    isDraft: z.coerce.boolean().optional().default(false),
    expiresAt: expiresAtField,
    applyUrl: z.string().url(),
    postedByCompanyName: z.string().min(1).max(100),
    postedByCompanyLogo: optionalNullableUrl,
    postedByCompanyWebsite: optionalNullableUrl,
    category: jobCategoryEnum,
    tags: z.array(jobTagEnum).optional(),
    source: z.enum(["manual", "partner", "scraped"]).optional().default("manual"),
    isVerified: z.preprocess((v) => {
      if (v === undefined || v === null || v === "") return undefined;
      if (v === true || v === "true" || v === "1") return true;
      if (v === false || v === "false" || v === "0") return false;
      return undefined;
    }, z.boolean().optional()),
  })
  .refine((data) => data.maxSalary >= data.minSalary, {
    message: "maxSalary must be greater than or equal to minSalary",
    path: ["maxSalary"],
  });

const updateJobSchema = z
  .object({
    title: z.string().min(3).optional(),
    description: z.string().min(20).max(10000, "Description cannot exceed 10000 characters").optional(),
    location: z.string().min(2).optional(),
    employmentType: z.enum(["full-time", "part-time", "contract", "internship"]).optional(),
    experienceLevel: z.enum(["fresher", "junior", "mid", "senior", "lead"]).optional(),
    minSalary: z.coerce.number().nonnegative().optional(),
    maxSalary: z.coerce.number().nonnegative().optional(),
    skills: z.array(z.string()).optional(),
    companyId: z.string().min(1).optional(),
    isDraft: z.coerce.boolean().optional(),
    expiresAt: expiresAtField,
    applyUrl: z.string().url().optional(),
    postedByCompanyName: z.string().min(1).max(100).optional(),
    postedByCompanyLogo: optionalNullableUrl,
    postedByCompanyWebsite: optionalNullableUrl,
    category: jobCategoryEnum.optional(),
    tags: z.array(jobTagEnum).optional(),
  })
  .refine(
    (data) => {
      if (data.minSalary != null && data.maxSalary != null) {
        return data.maxSalary >= data.minSalary;
      }
      return true;
    },
    {
      message: "maxSalary must be greater than or equal to minSalary",
      path: ["maxSalary"],
    }
  );

const atsCheckSchema = z.object({
  resumeText: z.string().min(100).max(10000),
  jobDescription: z.string().min(50).max(8000),
  jobId: z.string().nullable().optional(),
});

const reportJobSchema = z.object({
  reason: z.enum([
    "fake_job",
    "expired_link",
    "wrong_company",
    "duplicate",
    "inappropriate",
    "other",
  ]),
  description: z.string().max(500).optional(),
});

const subscriptionVerifySchema = z.object({
  razorpayPaymentId: z.string().min(1),
  razorpayOrderId: z.string().min(1),
  razorpaySignature: z.string().min(1),
});

module.exports = {
  createJobSchema,
  updateJobSchema,
  listJobsQuerySchema,
  atsCheckSchema,
  reportJobSchema,
  subscriptionVerifySchema,
};
