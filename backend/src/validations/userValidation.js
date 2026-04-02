const { z } = require("zod");
const { PASSWORD_REGEX, PASSWORD_REQUIREMENT_MESSAGE } = require("../constants/passwordPolicy");

const experienceSchema = z.object({
  title: z.string().min(1).max(200),
  company: z.string().min(1).max(200),
  location: z.string().max(100).optional(),
  startDate: z.string().min(1),
  endDate: z.string().optional(),
  current: z.boolean().optional(),
  description: z.string().max(2000).optional(),
});

const projectSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  url: z.string().url().max(500).optional().or(z.literal("")),
  technologies: z.array(z.string().max(100)).optional(),
});

const educationSchema = z.object({
  degree: z.string().min(1).max(200),
  institution: z.string().min(1).max(200),
  fieldOfStudy: z.string().max(100).optional(),
  startYear: z.string().max(10).optional(),
  endYear: z.string().max(10).optional(),
  grade: z.string().max(50).optional(),
});

const updateProfileSchema = z.object({
  fullName: z.string().min(2).max(100).optional(),
  headline: z.string().max(200).optional(),
  about: z.string().max(3000).optional(),
  phone: z.string().max(30).optional(),
  location: z.string().max(100).optional(),
  website: z.string().url().max(500).optional().or(z.literal("")),
  skills: z.array(z.string().max(100)).optional(),
  experience: z.array(experienceSchema).optional(),
  projects: z.array(projectSchema).optional(),
  education: z.array(educationSchema).optional(),
});

const changePasswordSchema = z.object({
  oldPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().regex(PASSWORD_REGEX, PASSWORD_REQUIREMENT_MESSAGE),
});

module.exports = { updateProfileSchema, changePasswordSchema };
