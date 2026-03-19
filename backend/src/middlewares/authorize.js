/**
 * ABAC middleware - resource-level authorization.
 * Loads resource, checks ownership, attaches to req for downstream use.
 */
const { ApiError } = require("../utils/apiError");
const jobRepository = require("../repositories/jobRepository");
const applicationRepository = require("../repositories/applicationRepository");
const { Job } = require("../models/Job");
const { Company } = require("../models/Company");

/**
 * Require user to own the job (postedBy === userId).
 * Use for PUT/DELETE /jobs/:id
 */
const requireJobOwner = (paramName = "id") => async (req, res, next) => {
  if (req.user.role === "admin") return next();

  const jobId = req.params[paramName];
  const job = await jobRepository.findById(jobId);
  if (!job) return next(new ApiError(404, "Job not found"));

  if (job.postedBy?.toString() !== req.user.userId) {
    return next(new ApiError(403, "Not authorized to access this job"));
  }
  req.job = job;
  next();
};

/**
 * Require user to own the job (for jobId param).
 * Use for GET /applications/job/:jobId
 */
const requireJobOwnerByJobId = (paramName = "jobId") => async (req, res, next) => {
  if (req.user.role === "admin") return next();

  const jobId = req.params[paramName];
  const job = await jobRepository.findById(jobId);
  if (!job) return next(new ApiError(404, "Job not found"));

  if (job.postedBy?.toString() !== req.user.userId) {
    return next(new ApiError(403, "Not authorized to view applications for this job"));
  }
  req.job = job;
  next();
};

/**
 * Require user to own the job that the application belongs to.
 * Use for PATCH /applications/:id/status
 */
const requireApplicationJobOwner = (paramName = "id") => async (req, res, next) => {
  if (req.user.role === "admin") return next();

  const applicationId = req.params[paramName];
  const application = await applicationRepository.findById(applicationId, "job");
  if (!application) return next(new ApiError(404, "Application not found"));

  const jobId = application.job?._id || application.job;
  const job = await Job.findById(jobId);
  if (!job) return next(new ApiError(404, "Job not found"));

  if (job.postedBy?.toString() !== req.user.userId) {
    return next(new ApiError(403, "Not authorized to update this application"));
  }
  req.application = application;
  req.job = job;
  next();
};

/**
 * Require user to own the company (createdBy === userId).
 * Use for PUT/DELETE companies
 */
const requireCompanyOwner = (paramName = "id") => async (req, res, next) => {
  if (req.user.role === "admin") return next();

  const companyId = req.params[paramName];
  const company = await Company.findById(companyId);
  if (!company) return next(new ApiError(404, "Company not found"));

  if (company.createdBy?.toString() !== req.user.userId) {
    return next(new ApiError(403, "Not authorized to access this company"));
  }
  req.company = company;
  next();
};

module.exports = {
  requireJobOwner,
  requireJobOwnerByJobId,
  requireApplicationJobOwner,
  requireCompanyOwner,
};
