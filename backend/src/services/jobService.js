const { ApiError } = require("../utils/apiError");
const { matchAlertsForJob } = require("./jobAlertService");
const jobRepository = require("../repositories/jobRepository");
const applicationRepository = require("../repositories/applicationRepository");
const { Application } = require("../models/Application");
const { Company } = require("../models/Company");
const { logger } = require("../config/logger");
const cache = require("../utils/cache");

const createJob = async (payload, userId) => {
  const {
    companyId,
    title,
    description,
    location,
    employmentType,
    experienceLevel,
    minSalary,
    maxSalary,
    skills,
    isDraft,
    expiresAt,
  } = payload;

  const company = await Company.findById(companyId);
  if (!company) throw new ApiError(404, "Company not found");
  if (company.createdBy.toString() !== userId) throw new ApiError(403, "You do not own this company");

  const draft = Boolean(isDraft);
  const job = await jobRepository.create({
    title,
    description,
    location,
    employmentType,
    experienceLevel,
    minSalary,
    maxSalary,
    skills: Array.isArray(skills) ? skills : [],
    company: company._id,
    postedBy: userId,
    isDraft: draft,
    expiresAt: expiresAt || null,
  });

  invalidateJobListCache().catch(() => {});
  if (job.isActive !== false && !draft) {
    matchAlertsForJob(job).catch((err) => logger.error("JobAlert", { error: err.message }));
  }
  return { job };
};

const invalidateJobListCache = () => cache.invalidatePattern("jobs:list");

const listJobs = async (query) => {
  const key = cache.cacheKey("jobs:list", query);
  const cached = await cache.get(key);
  const ttl = cache.CACHE_TTL.jobsList || 30;
  const sortKey = query.sort || "newest";
  const isCacheable = query.page === 1 && !query.q && !query.location && sortKey === "newest";

  if (cached) {
    const data = cached.data ?? cached;
    if (isCacheable && cached._age) {
      const age = (Date.now() - cached._age) / 1000;
      if (age > ttl * 0.8 && Math.random() < 0.1) {
        setImmediate(() => listJobs(query).catch(() => {}));
      }
    }
    return data;
  }

  const filter = jobRepository.buildListFilter(query);
  const { page, limit } = query;
  const [jobs, total] = await Promise.all([
    jobRepository.findWithFilter(filter, { page, limit, sortKey }),
    jobRepository.count(filter),
  ]);

  const result = {
    jobs,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };

  if (isCacheable) {
    await cache.set(key, { data: result, _age: Date.now() }, ttl);
  }
  return result;
};

const getJobById = async (id) => {
  const job = await jobRepository.findActiveById(id);
  if (!job) throw new ApiError(404, "Job not found");
  return { job };
};

const listMyJobs = async (userId) => {
  const jobs = await jobRepository.findByPostedBy(userId);
  return { jobs };
};

const updateJob = async (id, payload, userId) => {
  const job = await jobRepository.findById(id);
  if (!job) throw new ApiError(404, "Job not found");
  if (job.postedBy.toString() !== userId) throw new ApiError(403, "Not authorized to update this job");

  const wasDraft = Boolean(job.isDraft);

  const {
    companyId,
    title,
    description,
    location,
    employmentType,
    experienceLevel,
    minSalary,
    maxSalary,
    skills,
    isDraft,
    expiresAt,
  } = payload;

  if (companyId) {
    const company = await Company.findById(companyId);
    if (!company) throw new ApiError(404, "Company not found");
    if (company.createdBy.toString() !== userId) throw new ApiError(403, "You do not own this company");
    job.company = company._id;
  }

  if (title !== undefined) job.title = title;
  if (description !== undefined) job.description = description;
  if (location !== undefined) job.location = location;
  if (employmentType !== undefined) job.employmentType = employmentType;
  if (experienceLevel !== undefined) job.experienceLevel = experienceLevel;
  if (minSalary !== undefined) job.minSalary = minSalary;
  if (maxSalary !== undefined) job.maxSalary = maxSalary;
  if (skills !== undefined) job.skills = Array.isArray(skills) ? skills : [];
  if (isDraft !== undefined) job.isDraft = Boolean(isDraft);
  if (expiresAt !== undefined) job.expiresAt = expiresAt || null;

  await job.save();
  invalidateJobListCache().catch(() => {});
  if (wasDraft && !job.isDraft && job.isActive !== false) {
    matchAlertsForJob(job).catch((err) => logger.error("JobAlert", { error: err.message }));
  }
  return { job };
};

const deleteJob = async (id, userId) => {
  const job = await jobRepository.findById(id);
  if (!job) throw new ApiError(404, "Job not found");
  if (job.postedBy.toString() !== userId) throw new ApiError(403, "Not authorized to delete this job");

  job.isActive = false;
  await job.save();
  invalidateJobListCache().catch(() => {});
  return {};
};

const getRecruiterAnalytics = async (userId) => {
  const jobIds = (await jobRepository.findJobIdsByPostedBy(userId)).map((j) => j._id);
  const [totalApplications, byStatus] = await Promise.all([
    applicationRepository.countByJobs(jobIds),
    applicationRepository.aggregateByStatus(jobIds),
  ]);
  const statusCounts = Object.fromEntries(byStatus.map((s) => [s._id, s.count]));
  return {
    totalJobs: jobIds.length,
    totalApplications,
    byStatus: statusCounts,
  };
};

/** Last N calendar months of application volume for recruiter's jobs. */
const getRecruiterApplicationTrend = async (userId, monthCount = 6) => {
  const jobIds = (await jobRepository.findJobIdsByPostedBy(userId)).map((j) => j._id);
  if (jobIds.length === 0) return { series: [] };

  const n = Math.min(Math.max(Number(monthCount) || 6, 1), 24);
  const series = [];
  for (let i = n - 1; i >= 0; i -= 1) {
    const start = new Date();
    start.setMonth(start.getMonth() - i);
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setMonth(end.getMonth() + 1);
    const applications = await Application.countDocuments({
      job: { $in: jobIds },
      createdAt: { $gte: start, $lt: end },
    });
    // All trend metrics use createdAt for consistent time-series bucketing
    const hired = await Application.countDocuments({
      job: { $in: jobIds },
      status: "hired",
      createdAt: { $gte: start, $lt: end },
    });
    series.push({
      month: start.toISOString().slice(0, 7),
      applications,
      hired,
    });
  }
  return { series };
};

module.exports = {
  createJob,
  listJobs,
  invalidateJobListCache,
  getJobById,
  listMyJobs,
  updateJob,
  deleteJob,
  getRecruiterAnalytics,
  getRecruiterApplicationTrend,
};
