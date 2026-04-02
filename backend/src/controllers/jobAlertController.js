const { JobAlert } = require("../models/JobAlert");
const { asyncHandler } = require("../utils/asyncHandler");
const { ApiError } = require("../utils/apiError");
const { success, created } = require("../utils/apiResponse");

const createAlert = asyncHandler(async (req, res) => {
  const { keywords, location, employmentType, salaryMin, frequency } = req.body;
  const alert = await JobAlert.create({
    user: req.user.userId,
    keywords: keywords ?? [],
    location: location ?? "",
    employmentType: employmentType ?? "",
    salaryMin: salaryMin != null ? salaryMin : undefined,
    frequency: frequency ?? "IMMEDIATE",
  });

  return created(res, { alert }, "Job alert created");
});

const listAlerts = asyncHandler(async (req, res) => {
  const alerts = await JobAlert.find({ user: req.user.userId }).sort({ createdAt: -1 });
  return success(res, { alerts }, "Job alerts loaded");
});

const updateAlert = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { keywords, location, employmentType, salaryMin, frequency, isActive } = req.body;

  const alert = await JobAlert.findOne({ _id: id, user: req.user.userId });
  if (!alert) throw new ApiError(404, "Alert not found");

  if (keywords !== undefined) alert.keywords = keywords;
  if (location !== undefined) alert.location = location;
  if (employmentType !== undefined) alert.employmentType = employmentType;
  if (salaryMin !== undefined) alert.salaryMin = salaryMin == null ? undefined : salaryMin;
  if (frequency !== undefined) alert.frequency = frequency;
  if (isActive !== undefined) alert.isActive = isActive;
  await alert.save();

  return success(res, { alert }, "Alert updated");
});

const deleteAlert = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await JobAlert.findOneAndDelete({ _id: id, user: req.user.userId });
  if (!result) throw new ApiError(404, "Alert not found");

  return success(res, {}, "Alert deleted");
});

module.exports = {
  createAlert,
  listAlerts,
  updateAlert,
  deleteAlert,
};
