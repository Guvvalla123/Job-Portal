const { asyncHandler } = require("../utils/asyncHandler");
const { created, success } = require("../utils/apiResponse");
const jobService = require("../services/jobService");
const jobReportService = require("../services/jobReportService");

const createJob = asyncHandler(async (req, res) => {
  const result = await jobService.createJob(req.body, req.user.userId, { role: req.user.role });
  return created(res, result, "Job created");
});

const listJobs = asyncHandler(async (req, res) => {
  const result = await jobService.listJobs(req.query);
  return success(res, result);
});

const getJobById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await jobService.getJobById(id);
  return success(res, result);
});

const listMyJobs = asyncHandler(async (req, res) => {
  const result = await jobService.listMyJobs(req.user.userId);
  return success(res, result);
});

const updateJob = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await jobService.updateJob(id, req.body, req.user.userId);
  return success(res, result, "Job updated");
});

const deleteJob = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await jobService.deleteJob(id, req.user.userId);
  return success(res, null, "Job deleted");
});

const getRecruiterAnalytics = asyncHandler(async (req, res) => {
  const result = await jobService.getRecruiterAnalytics(req.user.userId);
  return success(res, result);
});

const getRecruiterApplicationTrend = asyncHandler(async (req, res) => {
  const months = req.query.months ? Number(req.query.months) : 6;
  const result = await jobService.getRecruiterApplicationTrend(req.user.userId, months);
  return success(res, result, "Application trend loaded");
});

const trackClick = asyncHandler(async (req, res) => {
  await jobService.trackJobClick(req.params.id);
  return res.status(204).send();
});

const reportJob = asyncHandler(async (req, res) => {
  const { reason, description } = req.body;
  const report = await jobReportService.reportJob(req.user.userId, req.params.id, reason, description);
  return created(res, { report }, "Report submitted");
});

const getJobsByCategory = asyncHandler(async (req, res) => {
  const { category } = req.params;
  const { page, limit } = req.query;
  const result = await jobService.getJobsByCategory(category, page, limit);
  return success(res, result);
});

const getFreshJobs = asyncHandler(async (req, res) => {
  const limit = req.query.limit != null && req.query.limit !== "" ? Number(req.query.limit) : undefined;
  const result = await jobService.getFreshJobs(limit);
  return success(res, result);
});

module.exports = {
  createJob,
  listJobs,
  getJobById,
  listMyJobs,
  updateJob,
  deleteJob,
  getRecruiterAnalytics,
  getRecruiterApplicationTrend,
  trackClick,
  reportJob,
  getJobsByCategory,
  getFreshJobs,
};
