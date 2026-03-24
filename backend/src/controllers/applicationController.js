const { Readable } = require("stream");
const { asyncHandler } = require("../utils/asyncHandler");
const { created, success } = require("../utils/apiResponse");
const { ApiError } = require("../utils/apiError");
const applicationService = require("../services/applicationService");
const { Application } = require("../models/Application");
const { User } = require("../models/User");
const { fetchResumePdfBuffer } = require("../services/resumeStreamService");
const { logger } = require("../config/logger");

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
  const axios = require("axios");
  const { v2: cloudinary } = require("cloudinary");

  // Find application and populate candidate resume fields
  const application = await Application.findById(req.application._id).populate(
    "candidate",
    "resumeUrl resumePublicId resumeFileName"
  );

  if (!application) {
    throw new ApiError(404, "Application not found");
  }

  // Resolve resume source from multiple possible locations
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

  let buffer = null;
  const filename = resumeSource.resumeFileName || "resume.pdf";

  // Try fetching resume using direct URL first
  if (resumeSource.resumeUrl) {
    try {
      const response = await axios.get(resumeSource.resumeUrl, {
        responseType: "arraybuffer",
      });
      buffer = response.data;
    } catch (err) {
      logger.warn("Failed to fetch resume via URL, will try publicId", {
        error: err.message,
      });
    }
  }

  // Fallback to Cloudinary publicId if URL fetch fails
  // Fallback to Cloudinary publicId if URL fetch fails
  if (!buffer && resumeSource.resumePublicId) {
    try {
      // Try BOTH delivery types

      const urls = [
        cloudinary.url(resumeSource.resumePublicId, {
          resource_type: "raw",
          type: "upload",
          secure: true,
        }),
        cloudinary.url(resumeSource.resumePublicId, {
          resource_type: "raw",
          type: "authenticated",
          sign_url: true,
          secure: true,
        }),
      ];

      for (const fileUrl of urls) {
        try {
          const response = await axios.get(fileUrl, {
            responseType: "arraybuffer",
          });
          buffer = response.data;
          break;
        } catch (err) {
          logger.warn("Cloudinary URL failed", {
            url: fileUrl,
            error: err.message,
          });
        }
      }
    } catch (err) {
      logger.error("Failed to fetch resume via publicId", {
        error: err.message,
      });
    }
  }

  // If both methods fail, return error
  if (!buffer) {
    throw new ApiError(404, "Resume not available");
  }

  // Send PDF response
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `inline; filename*=UTF-8''${encodeURIComponent(filename)}`
  );
  res.setHeader("Content-Length", String(buffer.length));
  res.setHeader("Cache-Control", "private, no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");

  return Readable.from(buffer).pipe(res);
});

module.exports = {
  applyToJob,
  listMyApplications,
  updateApplicationStatus,
  listApplicationsForJob,
  streamApplicationResume,
};
