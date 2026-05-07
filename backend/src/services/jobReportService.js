const mongoose = require("mongoose");
const { JobReport } = require("../models/JobReport");
const { Job } = require("../models/Job");
const { User } = require("../models/User");
const { ROLES } = require("../constants/roles");
const { ApiError } = require("../utils/apiError");
const { createNotification } = require("./notificationService");
const cache = require("../utils/cache");

const REPORT_STATUSES = new Set(["pending", "reviewed", "resolved", "dismissed"]);
const ADMIN_REVIEW_STATUSES = new Set(["reviewed", "resolved", "dismissed"]);

/**
 * @param {string} userId
 * @param {string} jobId
 * @param {string} reason
 * @param {string} [description]
 */
const reportJob = async (userId, jobId, reason, description) => {
  if (!mongoose.isValidObjectId(String(jobId))) {
    throw new ApiError(400, "Invalid job id");
  }

  const job = await Job.findById(jobId).select("isActive isDraft reportCount title");
  if (!job) throw new ApiError(404, "Job not found");
  if (!job.isActive || job.isDraft) {
    throw new ApiError(400, "This job cannot be reported");
  }

  let report;
  try {
    report = await JobReport.create({
      job: jobId,
      reportedBy: userId,
      reason,
      description: description != null ? String(description).slice(0, 500) : "",
    });
  } catch (err) {
    if (err && err.code === 11000) {
      throw new ApiError(409, "You have already reported this job");
    }
    throw err;
  }

  const updatedJob = await Job.findByIdAndUpdate(
    jobId,
    { $inc: { reportCount: 1 } },
    { new: true, select: "reportCount title" }
  );

  if (updatedJob && updatedJob.reportCount === 5) {
    const admins = await User.find({ role: ROLES.ADMIN, isActive: true }).select("_id").lean();
    await Promise.all(
      admins.map((admin) =>
        createNotification({
          userId: admin._id,
          type: "GENERAL",
          title: "Job reached report threshold",
          message: `Job "${updatedJob.title}" has received ${updatedJob.reportCount} reports and may need review.`,
          link: "",
          meta: { jobId: String(jobId), reportCount: updatedJob.reportCount },
        })
      )
    );
  }

  return report;
};

/**
 * @param {object} filters
 * @param {number} [filters.page]
 * @param {number} [filters.limit]
 * @param {string} [filters.status]
 * @param {string} [filters.jobId]
 * @param {string} [filters.reason]
 */
const getReports = async (filters = {}) => {
  const page = Math.max(1, Number(filters.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(filters.limit) || 20));
  const query = {};
  if (filters.status && REPORT_STATUSES.has(filters.status)) {
    query.status = filters.status;
  }
  if (filters.jobId && mongoose.isValidObjectId(String(filters.jobId))) {
    query.job = filters.jobId;
  }
  if (filters.reason) {
    query.reason = filters.reason;
  }

  const skip = (page - 1) * limit;
  const [reports, total] = await Promise.all([
    JobReport.find(query)
      .populate("job", "title company isActive isDraft location category")
      .populate("reportedBy", "fullName email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    JobReport.countDocuments(query),
  ]);

  return {
    reports,
    pagination: {
      total,
      page,
      limit,
      totalPages: total === 0 ? 0 : Math.ceil(total / limit),
    },
  };
};

/**
 * @param {string} reportId
 * @param {string} adminId
 * @param {string} status
 * @param {string} [notes]
 */
const reviewReport = async (reportId, adminId, status, notes) => {
  if (!mongoose.isValidObjectId(String(reportId))) {
    throw new ApiError(400, "Invalid report id");
  }
  if (!ADMIN_REVIEW_STATUSES.has(status)) {
    throw new ApiError(400, "Invalid status for review");
  }

  const report = await JobReport.findById(reportId);
  if (!report) throw new ApiError(404, "Report not found");

  report.status = status;
  if (notes !== undefined) {
    report.adminNotes = notes != null ? String(notes).slice(0, 500) : null;
  }
  report.reviewedBy = adminId;
  report.reviewedAt = new Date();
  await report.save();

  if (status === "resolved") {
    await Job.findByIdAndUpdate(report.job, { isActive: false });
    await cache.invalidatePattern("jobs:list");
  }

  const populated = await JobReport.findById(report._id)
    .populate("job", "title company isActive")
    .populate("reportedBy", "fullName email")
    .populate("reviewedBy", "fullName email");

  return populated;
};

module.exports = {
  reportJob,
  getReports,
  reviewReport,
};
