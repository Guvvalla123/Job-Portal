/**
 * ABAC middleware - resource-level authorization.
 * Loads resource, checks ownership, attaches to req for downstream use.
 */
const mongoose = require("mongoose");
const { ApiError } = require("../utils/apiError");
const jobRepository = require("../repositories/jobRepository");
const { Application } = require("../models/Application");
const { Company } = require("../models/Company");
const { logger } = require("../config/logger");

function normalizeDocId(ref) {
  if (ref == null) return "";
  if (typeof ref === "object" && ref._id != null) return String(ref._id);
  return String(ref);
}

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
 * Require user to own the job that the application belongs to (Job.postedBy === JWT userId).
 * Use for PATCH /applications/:id/status, GET /applications/:id/resume
 */
const requireApplicationJobOwner = (paramName = "id") => async (req, res, next) => {
  const applicationId = req.params[paramName];
  if (!mongoose.Types.ObjectId.isValid(applicationId)) {
    return next(new ApiError(400, "Invalid application ID"));
  }

  const application = await Application.findById(applicationId).populate({
    path: "job",
    select: "postedBy",
  });
  if (!application) return next(new ApiError(404, "Application not found"));

  req.application = application;

  if (req.user.role === "admin") {
    return next();
  }

  const job = application.job;
  if (!job) return next(new ApiError(404, "Job not found"));

  const recruiterId = normalizeDocId(req.user.userId ?? req.user.id ?? req.user.sub);
  const jobOwnerId = normalizeDocId(job.postedBy);

  logger.debug("Auth check", { userId: req.user?.userId });

  if (!recruiterId || !jobOwnerId || recruiterId !== jobOwnerId) {
    return next(new ApiError(403, "Not authorized to update this application"));
  }

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
