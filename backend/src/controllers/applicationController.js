const { asyncHandler } = require("../utils/asyncHandler");
const { created, success } = require("../utils/apiResponse");
const applicationService = require("../services/applicationService");

const applyToJob = asyncHandler(async (req, res) => {
  const { jobId, coverLetter } = req.body;
  const result = await applicationService.applyToJob(jobId, req.user.userId, coverLetter);
  return created(res, result, "Application submitted");
});

const listMyApplications = asyncHandler(async (req, res) => {
  const result = await applicationService.listMyApplications(req.user.userId);
  return success(res, result);
});

const updateApplicationStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const result = await applicationService.updateApplicationStatus(
    id,
    status,
    req.user.userId,
    req.user.role
  );
  return success(res, result, "Application status updated");
});

const listApplicationsForJob = asyncHandler(async (req, res) => {
  const { jobId } = req.params;
  const result = await applicationService.listApplicationsForJob(
    jobId,
    req.user.userId,
    req.user.role
  );
  return success(res, result);
});

module.exports = {
  applyToJob,
  listMyApplications,
  updateApplicationStatus,
  listApplicationsForJob,
};
