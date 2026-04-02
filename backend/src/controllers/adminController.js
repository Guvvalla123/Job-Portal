const mongoose = require("mongoose");
const { User } = require("../models/User");
const { Job } = require("../models/Job");
const { Application } = require("../models/Application");
const { Company } = require("../models/Company");
const { AuditLog } = require("../models/AuditLog");
const { asyncHandler } = require("../utils/asyncHandler");
const { ApiError } = require("../utils/apiError");
const { success } = require("../utils/apiResponse");
const { ROLES } = require("../constants/roles");
const jobRepository = require("../repositories/jobRepository");
const { cascadeBeforeUserDelete } = require("../utils/userDeleteCascade");
const { invalidateJobListCache } = require("../services/jobService");

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const startOfCurrentMonth = () => {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
};

const getStats = asyncHandler(async (req, res) => {
  const monthStart = startOfCurrentMonth();
  const [totalUsers, totalJobs, activeJobs, totalApplications, totalCompanies, newUsersThisMonth] =
    await Promise.all([
      User.countDocuments(),
      Job.countDocuments(),
      Job.countDocuments({ ...jobRepository.publicJobVisibilityFilter() }),
      Application.countDocuments(),
      Company.countDocuments(),
      User.countDocuments({ createdAt: { $gte: monthStart } }),
    ]);

  return success(
    res,
    {
      totalUsers,
      totalJobs,
      activeJobs,
      totalApplications,
      totalCompanies,
      newUsersThisMonth,
    },
    "Platform stats loaded"
  );
});

const listAllUsers = asyncHandler(async (req, res) => {
  const { page = "1", limit = "20", search, q } = req.query;
  const pageNumber = Math.max(Number(page), 1);
  const limitNumber = Math.min(Math.max(Number(limit), 1), 100);
  const searchTerm = String(search || q || "").trim();

  const filter = {};
  if (searchTerm) {
    filter.$or = [
      { fullName: new RegExp(escapeRegex(searchTerm), "i") },
      { email: new RegExp(escapeRegex(searchTerm), "i") },
    ];
  }

  const [users, total] = await Promise.all([
    User.find(filter)
      .select("-password -refreshToken")
      .sort({ createdAt: -1 })
      .skip((pageNumber - 1) * limitNumber)
      .limit(limitNumber),
    User.countDocuments(filter),
  ]);

  return success(
    res,
    {
      users,
      pagination: {
        total,
        page: pageNumber,
        limit: limitNumber,
        totalPages: Math.ceil(total / limitNumber) || 0,
      },
    },
    "Users loaded"
  );
});

const listAllJobs = asyncHandler(async (req, res) => {
  const { page = "1", limit = "20", search, q } = req.query;
  const pageNumber = Math.max(Number(page), 1);
  const limitNumber = Math.min(Math.max(Number(limit), 1), 100);
  const searchTerm = String(search || q || "").trim();

  const filter = {};
  if (searchTerm) {
    filter.title = new RegExp(escapeRegex(searchTerm), "i");
  }

  const [jobs, total] = await Promise.all([
    Job.find(filter)
      .populate("company", "name")
      .populate("postedBy", "fullName email")
      .sort({ createdAt: -1 })
      .skip((pageNumber - 1) * limitNumber)
      .limit(limitNumber)
      .lean(),
    Job.countDocuments(filter),
  ]);

  const ids = jobs.map((j) => j._id);
  let countMap = new Map();
  if (ids.length > 0) {
    const agg = await Application.aggregate([
      { $match: { job: { $in: ids } } },
      { $group: { _id: "$job", count: { $sum: 1 } } },
    ]);
    countMap = new Map(agg.map((a) => [String(a._id), a.count]));
  }

  const jobsWithCounts = jobs.map((j) => ({
    ...j,
    applicationCount: countMap.get(String(j._id)) || 0,
  }));

  return success(
    res,
    {
      jobs: jobsWithCounts,
      pagination: {
        total,
        page: pageNumber,
        limit: limitNumber,
        totalPages: Math.ceil(total / limitNumber) || 0,
      },
    },
    "Jobs loaded"
  );
});

const toggleUserStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid user id");
  }

  const user = await User.findById(id).select("-password -refreshToken");
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  user.isActive = !user.isActive;
  await user.save();

  if (!user.isActive) {
    await User.updateOne({ _id: user._id }, { $set: { refreshToken: "" } });
  }

  return success(res, { user }, `User ${user.isActive ? "activated" : "deactivated"}`);
});

const toggleJobStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid job id");
  }

  const job = await Job.findById(id);
  if (!job) {
    throw new ApiError(404, "Job not found");
  }

  job.isActive = !job.isActive;
  await job.save();

  invalidateJobListCache().catch(() => {});

  return success(res, { job }, `Job ${job.isActive ? "activated" : "deactivated"}`);
});

/** PATCH body: { isActive: boolean } — used by admin UI */
const updateJobStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { isActive } = req.body;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid job id");
  }
  if (typeof isActive !== "boolean") {
    throw new ApiError(400, "isActive must be a boolean");
  }

  const job = await Job.findById(id);
  if (!job) {
    throw new ApiError(404, "Job not found");
  }

  job.isActive = isActive;
  await job.save();

  invalidateJobListCache().catch(() => {});

  return success(res, { job }, `Job ${job.isActive ? "activated" : "deactivated"}`);
});

const updateUserRole = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid user id");
  }
  if (![ROLES.CANDIDATE, ROLES.RECRUITER, ROLES.ADMIN].includes(role)) {
    throw new ApiError(400, "Invalid role");
  }

  const user = await User.findById(id).select("-password -refreshToken");
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (user.role === ROLES.ADMIN && role !== ROLES.ADMIN) {
    const adminCount = await User.countDocuments({ role: ROLES.ADMIN });
    if (adminCount <= 1) {
      throw new ApiError(400, "Cannot remove the last admin");
    }
  }

  user.role = role;
  await user.save();

  return success(res, { user }, "User role updated");
});

const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid user id");
  }

  if (String(req.user.userId) === String(id)) {
    throw new ApiError(400, "Cannot delete your own account");
  }

  const user = await User.findById(id);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (user.role === ROLES.ADMIN) {
    const adminCount = await User.countDocuments({ role: ROLES.ADMIN });
    if (adminCount <= 1) {
      throw new ApiError(400, "Cannot delete the last admin");
    }
  }

  await cascadeBeforeUserDelete(id);
  await User.findByIdAndDelete(id);
  return success(res, {}, "User deleted");
});

const listAllCompanies = asyncHandler(async (req, res) => {
  const { page = "1", limit = "20", search, q } = req.query;
  const pageNumber = Math.max(Number(page), 1);
  const limitNumber = Math.min(Math.max(Number(limit), 1), 100);
  const searchTerm = String(search || q || "").trim();

  const match = {};
  if (searchTerm) {
    match.name = new RegExp(escapeRegex(searchTerm), "i");
  }

  const total = await Company.countDocuments(match);
  const companies = await Company.aggregate([
    { $match: match },
    {
      $lookup: {
        from: "jobs",
        localField: "_id",
        foreignField: "company",
        as: "jobsArr",
      },
    },
    { $addFields: { jobsCount: { $size: "$jobsArr" } } },
    { $sort: { createdAt: -1 } },
    { $skip: (pageNumber - 1) * limitNumber },
    { $limit: limitNumber },
    {
      $lookup: {
        from: "users",
        localField: "createdBy",
        foreignField: "_id",
        as: "creatorArr",
      },
    },
    { $unwind: { path: "$creatorArr", preserveNullAndEmptyArrays: true } },
    {
      $project: {
        name: 1,
        website: 1,
        location: 1,
        description: 1,
        logoUrl: 1,
        createdBy: 1,
        createdAt: 1,
        updatedAt: 1,
        jobsCount: 1,
        recruiter: {
          _id: "$creatorArr._id",
          fullName: "$creatorArr.fullName",
          email: "$creatorArr.email",
        },
      },
    },
  ]);

  return success(
    res,
    {
      companies,
      pagination: {
        total,
        page: pageNumber,
        limit: limitNumber,
        totalPages: Math.ceil(total / limitNumber) || 0,
      },
    },
    "Companies loaded"
  );
});

const deleteCompany = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid company id");
  }

  const jobCount = await Job.countDocuments({ company: id });
  if (jobCount > 0) {
    throw new ApiError(400, "Reassign or delete jobs before deleting this company");
  }

  const company = await Company.findByIdAndDelete(id);
  if (!company) {
    throw new ApiError(404, "Company not found");
  }

  return success(res, {}, "Company deleted");
});

const listAllApplications = asyncHandler(async (req, res) => {
  const { page = "1", limit = "20", status } = req.query;
  const pageNumber = Math.max(Number(page), 1);
  const limitNumber = Math.min(Math.max(Number(limit), 1), 100);

  const filter = {};
  if (status && String(status).trim()) {
    filter.status = String(status).trim();
  }

  const [applications, total] = await Promise.all([
    Application.find(filter)
      .populate("candidate", "fullName email")
      .populate({
        path: "job",
        select: "title company",
        populate: { path: "company", select: "name logoUrl" },
      })
      .sort({ createdAt: -1 })
      .skip((pageNumber - 1) * limitNumber)
      .limit(limitNumber),
    Application.countDocuments(filter),
  ]);

  return success(
    res,
    {
      applications,
      pagination: {
        total,
        page: pageNumber,
        limit: limitNumber,
        totalPages: Math.ceil(total / limitNumber) || 0,
      },
    },
    "Applications loaded"
  );
});

const getStatsTrend = asyncHandler(async (req, res) => {
  const months = 6;
  const series = [];
  for (let i = months - 1; i >= 0; i -= 1) {
    const start = new Date();
    start.setMonth(start.getMonth() - i);
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setMonth(end.getMonth() + 1);
    const [newUsers, newJobs] = await Promise.all([
      User.countDocuments({ createdAt: { $gte: start, $lt: end } }),
      Job.countDocuments({ createdAt: { $gte: start, $lt: end } }),
    ]);
    series.push({
      month: start.toISOString().slice(0, 7),
      users: newUsers,
      jobs: newJobs,
    });
  }
  return success(res, { series }, "Stats trend loaded");
});

const listAuditLogs = asyncHandler(async (req, res) => {
  const { page = "1", limit = "50", action, userId, dateFrom, dateTo } = req.query;
  const pageNumber = Math.max(Number(page), 1);
  const limitNumber = Math.min(Math.max(Number(limit), 1), 100);

  const filter = {};
  if (action && String(action).trim()) {
    filter.action = String(action).trim();
  }
  if (userId && mongoose.Types.ObjectId.isValid(String(userId))) {
    filter.userId = userId;
  }
  if (dateFrom || dateTo) {
    filter.createdAt = {};
    if (dateFrom) {
      const d = new Date(String(dateFrom));
      if (!Number.isNaN(d.getTime())) filter.createdAt.$gte = d;
    }
    if (dateTo) {
      const d = new Date(String(dateTo));
      if (!Number.isNaN(d.getTime())) filter.createdAt.$lte = d;
    }
    if (Object.keys(filter.createdAt).length === 0) delete filter.createdAt;
  }

  const [logs, total] = await Promise.all([
    AuditLog.find(filter)
      .populate("userId", "fullName email")
      .sort({ createdAt: -1 })
      .skip((pageNumber - 1) * limitNumber)
      .limit(limitNumber)
      .lean(),
    AuditLog.countDocuments(filter),
  ]);

  const entries = logs.map((log) => ({
    _id: log._id,
    actor: log.userId
      ? { _id: log.userId._id, fullName: log.userId.fullName, email: log.userId.email }
      : null,
    action: log.action,
    target: {
      type: log.resourceType,
      id: log.resourceId,
    },
    ip: log.ip || "",
    userAgent: log.userAgent || "",
    changes: log.changes,
    createdAt: log.createdAt,
  }));

  return success(
    res,
    {
      logs: entries,
      pagination: {
        total,
        page: pageNumber,
        limit: limitNumber,
        totalPages: Math.ceil(total / limitNumber) || 0,
      },
    },
    "Audit logs loaded"
  );
});

const deleteJob = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid job id");
  }

  const job = await Job.findById(id);
  if (!job) {
    throw new ApiError(404, "Job not found");
  }

  job.isActive = false;
  await job.save();

  invalidateJobListCache().catch(() => {});

  return success(res, { job }, "Job deactivated");
});

module.exports = {
  getStats,
  getStatsTrend,
  listAllUsers,
  listAllJobs,
  toggleUserStatus,
  toggleJobStatus,
  updateJobStatus,
  updateUserRole,
  deleteUser,
  listAllCompanies,
  deleteCompany,
  listAllApplications,
  listAuditLogs,
  deleteJob,
};
