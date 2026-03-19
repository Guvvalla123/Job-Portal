const mongoose = require("mongoose");
const { User } = require("../models/User");
const { Job } = require("../models/Job");
const { Application } = require("../models/Application");
const { Company } = require("../models/Company");
const { asyncHandler } = require("../utils/asyncHandler");
const { ApiError } = require("../utils/apiError");

const getStats = asyncHandler(async (req, res) => {
  const [totalUsers, totalJobs, totalApplications, totalCompanies] = await Promise.all([
    User.countDocuments(),
    Job.countDocuments({ isActive: { $ne: false } }),
    Application.countDocuments(),
    Company.countDocuments(),
  ]);

  return res.status(200).json({
    success: true,
    data: { totalUsers, totalJobs, totalApplications, totalCompanies },
  });
});

const listAllUsers = asyncHandler(async (req, res) => {
  const { page = "1", limit = "20" } = req.query;
  const pageNumber = Math.max(Number(page), 1);
  const limitNumber = Math.min(Math.max(Number(limit), 1), 100);

  const [users, total] = await Promise.all([
    User.find()
      .select("-password -refreshToken")
      .sort({ createdAt: -1 })
      .skip((pageNumber - 1) * limitNumber)
      .limit(limitNumber),
    User.countDocuments(),
  ]);

  return res.status(200).json({
    success: true,
    data: {
      users,
      pagination: {
        total,
        page: pageNumber,
        limit: limitNumber,
        totalPages: Math.ceil(total / limitNumber),
      },
    },
  });
});

const listAllJobs = asyncHandler(async (req, res) => {
  const { page = "1", limit = "20" } = req.query;
  const pageNumber = Math.max(Number(page), 1);
  const limitNumber = Math.min(Math.max(Number(limit), 1), 100);

  const [jobs, total] = await Promise.all([
    Job.find()
      .populate("company", "name")
      .populate("postedBy", "fullName email")
      .sort({ createdAt: -1 })
      .skip((pageNumber - 1) * limitNumber)
      .limit(limitNumber),
    Job.countDocuments(),
  ]);

  return res.status(200).json({
    success: true,
    data: {
      jobs,
      pagination: {
        total,
        page: pageNumber,
        limit: limitNumber,
        totalPages: Math.ceil(total / limitNumber),
      },
    },
  });
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

  return res.status(200).json({
    success: true,
    message: `User ${user.isActive ? "activated" : "deactivated"}`,
    data: { user },
  });
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

  return res.status(200).json({
    success: true,
    message: `Job ${job.isActive ? "activated" : "deactivated"}`,
    data: { job },
  });
});

module.exports = {
  getStats,
  listAllUsers,
  listAllJobs,
  toggleUserStatus,
  toggleJobStatus,
};
