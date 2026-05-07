const { ApiError } = require("../utils/apiError");
const { ROLES } = require("../constants/roles");
const { matchAlertsForJob } = require("./jobAlertService");
const jobRepository = require("../repositories/jobRepository");
const applicationRepository = require("../repositories/applicationRepository");
const companyRepository = require("../repositories/companyRepository");
const { logger } = require("../config/logger");
const cache = require("../utils/cache");

const createJob = async (payload, userId, options = {}) => {
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
    applyUrl,
    postedByCompanyName,
    postedByCompanyLogo,
    postedByCompanyWebsite,
    category,
    tags,
    source,
    postedBy,
    isVerified,
  } = payload;

  const isAdmin = options.role === ROLES.ADMIN;
  const hasCompanyId = companyId != null && String(companyId).trim().length > 0;

  let companyObjectId = null;
  if (hasCompanyId) {
    const company = await companyRepository.findById(companyId);
    if (!company) throw new ApiError(404, "Company not found");
    if (!isAdmin && company.createdBy.toString() !== userId) {
      throw new ApiError(403, "You do not own this company");
    }
    companyObjectId = company._id;
  } else if (!isAdmin) {
    throw new ApiError(400, "Company is required");
  }

  const draft = Boolean(isDraft);
  const postedByValue = postedBy === undefined ? userId : postedBy;
  const sourceValue =
    source === "partner" || source === "scraped" || source === "manual" ? source : "manual";
  const isVerifiedFinal = isAdmin && isVerified === true;

  const job = await jobRepository.create({
    title,
    description,
    location,
    employmentType,
    experienceLevel,
    minSalary,
    maxSalary,
    skills: Array.isArray(skills) ? skills : [],
    company: companyObjectId,
    postedBy: postedByValue,
    isDraft: draft,
    expiresAt: expiresAt || null,
    applyUrl,
    postedByCompanyName,
    postedByCompanyLogo: postedByCompanyLogo ?? null,
    postedByCompanyWebsite: postedByCompanyWebsite ?? null,
    category,
    tags: Array.isArray(tags) ? tags : [],
    source: sourceValue,
    isVerified: isVerifiedFinal,
  });

  invalidateJobListCache().catch(() => {});
  if (job.isActive !== false && !draft) {
    matchAlertsForJob(job).catch((err) => logger.error("JobAlert", { error: err.message }));
  }
  return { job };
};

const invalidateJobListCache = () => cache.invalidatePattern("jobs:list");

async function assertRecruiterCanModifyJob(job, userId) {
  if (job.postedBy && job.postedBy.toString() === userId) return;
  if (!job.postedBy && job.company) {
    const company = await companyRepository.findById(job.company);
    if (company && company.createdBy.toString() === userId) return;
  }
  throw new ApiError(403, "Not authorized to modify this job");
}

const listJobs = async (query) => {
  const key = cache.cacheKey("jobs:list", query);
  const cached = await cache.get(key);
  const ttl = cache.CACHE_TTL.jobsList || 30;
  const sortKey = query.sort || "newest";
  const hasTags = Array.isArray(query.tags) && query.tags.length > 0;
  const isCacheable =
    query.page === 1 &&
    !query.q &&
    !query.location &&
    sortKey === "newest" &&
    !query.category &&
    !hasTags &&
    query.isVerified === undefined &&
    !query.postedWithin &&
    !query.employmentType &&
    !query.experienceLevel;

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
  await assertRecruiterCanModifyJob(job, userId);

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
    const company = await companyRepository.findById(companyId);
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
  await assertRecruiterCanModifyJob(job, userId);

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
    const applications = await applicationRepository.countByJobsCreatedBetween(jobIds, start, end);
    const hired = await applicationRepository.countByJobsCreatedBetweenWithStatus(jobIds, start, end, "hired");
    series.push({
      month: start.toISOString().slice(0, 7),
      applications,
      hired,
    });
  }
  return { series };
};

const trackJobClick = async (jobId) => {
  const updated = await jobRepository.incrementClickCount(jobId);
  if (!updated) throw new ApiError(404, "Job not found");
  return { success: true, clickCount: updated.clickCount };
};

const getFreshJobs = async (limit = 20) => {
  const jobs = await jobRepository.findFreshPublicJobs({ limit });
  return { jobs };
};

const getExpiringJobs = async () => {
  const jobs = await jobRepository.findExpiringWithin24h();
  return { jobs };
};

const getJobsByCategory = async (category, page = 1, limit = 10) => {
  const p = Math.max(1, Number(page) || 1);
  const l = Math.min(50, Math.max(1, Number(limit) || 10));
  const sortKey = "newest";
  const [jobs, total] = await Promise.all([
    jobRepository.findPublicByCategory(category, { page: p, limit: l, sortKey }),
    jobRepository.countPublicByCategory(category),
  ]);
  return {
    jobs,
    pagination: {
      total,
      page: p,
      limit: l,
      totalPages: Math.ceil(total / l),
    },
  };
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
  trackJobClick,
  getFreshJobs,
  getExpiringJobs,
  getJobsByCategory,
};
