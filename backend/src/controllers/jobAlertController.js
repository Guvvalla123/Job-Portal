const mongoose = require("mongoose");
const { JobAlert } = require("../models/JobAlert");
const { Job } = require("../models/Job");
const { User } = require("../models/User");
const { asyncHandler } = require("../utils/asyncHandler");
const { ApiError } = require("../utils/apiError");
const { ROLES } = require("../constants/roles");

const createAlert = asyncHandler(async (req, res) => {
  const { keywords, location, employmentType } = req.body;
  const alert = await JobAlert.create({
    user: req.user.userId,
    keywords: keywords || "",
    location: location || "",
    employmentType: employmentType || "",
  });

  return res.status(201).json({
    success: true,
    message: "Job alert created",
    data: { alert },
  });
});

const listAlerts = asyncHandler(async (req, res) => {
  const alerts = await JobAlert.find({ user: req.user.userId }).sort({ createdAt: -1 });
  return res.status(200).json({
    success: true,
    data: { alerts },
  });
});

const updateAlert = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { keywords, location, employmentType, isActive } = req.body;

  const alert = await JobAlert.findOne({ _id: id, user: req.user.userId });
  if (!alert) throw new ApiError(404, "Alert not found");

  if (keywords !== undefined) alert.keywords = keywords;
  if (location !== undefined) alert.location = location;
  if (employmentType !== undefined) alert.employmentType = employmentType;
  if (isActive !== undefined) alert.isActive = isActive;
  await alert.save();

  return res.status(200).json({
    success: true,
    message: "Alert updated",
    data: { alert },
  });
});

const deleteAlert = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await JobAlert.findOneAndDelete({ _id: id, user: req.user.userId });
  if (!result) throw new ApiError(404, "Alert not found");

  return res.status(200).json({
    success: true,
    message: "Alert deleted",
  });
});

module.exports = {
  createAlert,
  listAlerts,
  updateAlert,
  deleteAlert,
};
