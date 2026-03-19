const { asyncHandler } = require("../utils/asyncHandler");
const { created, success } = require("../utils/apiResponse");
const jobService = require("../services/jobService");

const createJob = asyncHandler(async (req, res) => {
  const result = await jobService.createJob(req.body, req.user.userId);
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

module.exports = {
  createJob,
  listJobs,
  getJobById,
  listMyJobs,
  updateJob,
  deleteJob,
  getRecruiterAnalytics,
};
