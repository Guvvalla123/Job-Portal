const { asyncHandler } = require("../utils/asyncHandler");
const { created, success } = require("../utils/apiResponse");
const { ApiError } = require("../utils/apiError");
const applicationService = require("../services/applicationService");
const { Application } = require("../models/Application");
const { User } = require("../models/User");
const { logger } = require("../config/logger");
const { pipeResumePdfToResponse } = require("../services/resumeStreamService");
const auditLogService = require("../services/auditLogService");

const applyToJob = asyncHandler(async (req, res) => {
  const { jobId, coverLetter } = req.body;
  const result = await applicationService.applyToJob(jobId, req.user.userId, coverLetter);
  return created(res, result, "Application submitted");
});

const listMyApplications = asyncHandler(async (req, res) => {
  const result = await applicationService.listMyApplications(req.user.userId, req.query);
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
    req.user.role,
    req.query
  );
  return success(res, result);
});

const getApplicationById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await applicationService.getApplicationDetail(id, req.user.userId, req.user.role);
  return success(res, result);
});

const updateRecruiterNotes = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { recruiterNotes } = req.body;
  const result = await applicationService.updateRecruiterNotes(id, recruiterNotes, req.user.userId, req.user.role);
  return success(res, result, "Notes saved");
});

const updateInterview = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await applicationService.updateInterview(id, req.body, req.user.userId, req.user.role);
  return success(res, result, "Interview updated");
});

const listUpcomingInterviews = asyncHandler(async (req, res) => {
  const result = await applicationService.listUpcomingInterviews(req.user.userId, req.user.role);
  return success(res, result);
});

/**
 * Normalize resume fields from a document that may use:
 * - User-style: resumeUrl, resumePublicId, resumeFileName
 * - Nested: resume.url / resume.publicId / resume.public_id / resume.fileName
 */
function resumePayloadFromDoc(doc) {
  if (!doc) return null;
  const plain = typeof doc.toObject === "function" ? doc.toObject({ virtuals: true }) : { ...doc };

  let resumeUrl = plain.resumeUrl || "";
  let resumePublicId = plain.resumePublicId || "";
  let resumeFileName = plain.resumeFileName || "";

  const nested = plain.resume;
  if (nested && typeof nested === "object" && !nested._bsontype) {
    resumeUrl = resumeUrl || nested.url || nested.secure_url || nested.secureUrl || "";
    resumePublicId =
      resumePublicId || nested.publicId || nested.public_id || nested.resumePublicId || "";
    resumeFileName = resumeFileName || nested.fileName || nested.filename || nested.originalFilename || "";
  }

  if (!resumeUrl && !resumePublicId) return null;

  return {
    resumeUrl: resumeUrl || undefined,
    resumePublicId: resumePublicId || undefined,
    resumeFileName: resumeFileName || undefined,
  };
}

function candidateOrApplicantId(application) {
  const c = application.candidate;
  const a = application.applicant;
  if (c && typeof c === "object" && c._id) return c._id.toString();
  if (c) return c.toString();
  if (a && typeof a === "object" && a._id) return a._id.toString();
  if (a) return a.toString();
  return null;
}

const streamApplicationResume = asyncHandler(async (req, res) => {
  auditLogService.log({
    userId: req.user.userId,
    action: "resume_viewed",
    resourceType: "application",
    resourceId: String(req.application._id),
    req,
  });

  const application = await Application.findById(req.application._id).populate(
    "candidate",
    "resumeUrl resumePublicId resumeFileName"
  );

  if (!application) {
    throw new ApiError(404, "Application not found");
  }

  let resumeSource = resumePayloadFromDoc(application);

  const applicantDoc = application.candidate || application.applicant;
  if (!resumeSource) {
    resumeSource = resumePayloadFromDoc(applicantDoc);
  }

  if (!resumeSource) {
    const candidateId = candidateOrApplicantId(application);
    if (candidateId) {
      const user = await User.findById(candidateId).select(
        "resumeUrl resumePublicId resumeFileName"
      );
      resumeSource = resumePayloadFromDoc(user);
    }
  }

  if (!resumeSource) {
    throw new ApiError(404, "Resume not available");
  }

  logger.debug("streamApplicationResume: resolved resume refs", {
    applicationId: application._id?.toString(),
    hasResumeUrl: Boolean(resumeSource.resumeUrl),
    hasResumePublicId: Boolean(resumeSource.resumePublicId),
  });

  const filename = resumeSource.resumeFileName || "resume.pdf";
  const ok = await pipeResumePdfToResponse(res, resumeSource, filename);
  if (!ok) {
    throw new ApiError(404, "Resume not available");
  }
});

module.exports = {
  applyToJob,
  listMyApplications,
  updateApplicationStatus,
  listApplicationsForJob,
  getApplicationById,
  updateRecruiterNotes,
  updateInterview,
  listUpcomingInterviews,
  streamApplicationResume,
};
