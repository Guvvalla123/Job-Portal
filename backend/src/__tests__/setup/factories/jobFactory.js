const { Job } = require("../../../models/Job");

async function createJob(recruiterId, companyId, overrides = {}) {
  return Job.create({
    title: "Software Engineer",
    description: "A detailed description for the test job posting that meets minimum length.",
    location: "Berlin",
    employmentType: "full-time",
    experienceLevel: "mid",
    minSalary: 50000,
    maxSalary: 80000,
    skills: ["node", "react"],
    company: companyId,
    postedBy: recruiterId,
    isActive: true,
    isDraft: false,
    expiresAt: null,
    ...overrides,
  });
}

async function createDraftJob(recruiterId, companyId, overrides = {}) {
  return createJob(recruiterId, companyId, { isDraft: true, ...overrides });
}

async function createExpiredJob(recruiterId, companyId, overrides = {}) {
  const past = new Date(Date.now() - 86400000);
  return createJob(recruiterId, companyId, { expiresAt: past, ...overrides });
}

module.exports = { createJob, createDraftJob, createExpiredJob };
