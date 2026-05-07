const { asyncHandler } = require("../utils/asyncHandler");
const { success } = require("../utils/apiResponse");
const atsService = require("../services/atsService");

const analyzeResume = asyncHandler(async (req, res) => {
  const { resumeText, jobDescription, jobId } = req.body;
  const result = await atsService.analyzeResume(req.user.userId, resumeText, jobDescription, jobId);
  return success(res, result, "ATS analysis complete.");
});

const getHistory = asyncHandler(async (req, res) => {
  const { page, limit } = req.query;
  const result = await atsService.getAtsHistory(req.user.userId, page, limit);
  return success(res, result);
});

const getCheck = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await atsService.getAtsCheck(id, req.user.userId);
  return success(res, result);
});

const getUsageStats = asyncHandler(async (req, res) => {
  const result = await atsService.getUsageStats(req.user.userId);
  return success(res, result);
});

module.exports = {
  analyzeResume,
  getHistory,
  getCheck,
  getUsageStats,
};
