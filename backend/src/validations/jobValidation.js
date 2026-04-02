const { z } = require("zod");

const listJobsQuerySchema = z.object({
  q: z.string().max(200).optional().default(""),
  location: z.string().max(200).optional().default(""),
  employmentType: z.enum(["full-time", "part-time", "contract", "internship"]).optional(),
  experienceLevel: z.enum(["fresher", "junior", "mid", "senior", "lead"]).optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(50).optional().default(10),
  sort: z
    .preprocess((v) => {
      if (v == null || v === "") return "newest";
      const m = { recent: "newest", "salary-desc": "salary_high", "salary-asc": "salary_low" };
      return m[v] || v;
    }, z.enum(["newest", "oldest", "salary_high", "salary_low"]))
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
    companyId: z.string().min(1),
    isDraft: z.coerce.boolean().optional().default(false),
    expiresAt: z
      .union([z.string(), z.date(), z.null()])
      .optional()
      .nullable()
      .transform((v) => {
        if (v == null || v === "") return null;
        const d = v instanceof Date ? v : new Date(v);
        return Number.isNaN(d.getTime()) ? null : d;
      }),
  })
  .refine((data) => data.maxSalary >= data.minSalary, {
    message: "maxSalary must be greater than or equal to minSalary",
    path: ["maxSalary"],
  });

module.exports = { createJobSchema, listJobsQuerySchema };
