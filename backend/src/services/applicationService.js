const { ApiError } = require("../utils/apiError");
const { createNotification } = require("../controllers/notificationController");
const applicationRepository = require("../repositories/applicationRepository");
const jobRepository = require("../repositories/jobRepository");
const { Job } = require("../models/Job");

/**
 * Job.postedBy is an ObjectId when unpopulated, or a User subdoc when populated.
 * Never use postedBy.toString() for auth — populated docs compare incorrectly to JWT userId.
 */
function jobPostedByUserId(job) {
  if (!job?.postedBy) return "";
  const p = job.postedBy;
  if (typeof p === "object" && p._id != null) return String(p._id);
  return String(p);
}

const applyToJob = async (jobId, candidateId, coverLetter) => {
  const job = await jobRepository.findActiveById(jobId);
  if (!job) throw new ApiError(404, "Job not found");

  const exists = await applicationRepository.findOne({ job: jobId, candidate: candidateId });
  if (exists) throw new ApiError(409, "You already applied to this job");

  const application = await applicationRepository.create({
    job: jobId,
    candidate: candidateId,
    coverLetter: coverLetter || "",
  });

  const populatedJob = await Job.findById(jobId).populate("postedBy");
  if (populatedJob?.postedBy?._id) {
    createNotification({
      userId: populatedJob.postedBy._id,
      type: "new_applicant",
      title: "New applicant",
      message: `Someone applied to "${populatedJob.title}"`,
      link: `/recruiter/dashboard`,
      meta: { jobId, applicationId: application._id },
    }).catch(() => {});
  }

  return { application };
};

const listMyApplications = async (candidateId) => {
  const applications = await applicationRepository.findByCandidate(candidateId);
  return { applications };
};

const updateApplicationStatus = async (applicationId, status, userId, userRole) => {
  const application = await applicationRepository.findById(applicationId, "job");
  if (!application) throw new ApiError(404, "Application not found");

  const jobId = application.job?._id || application.job;
  if (!jobId) throw new ApiError(404, "Job not found for this application");

  const job = await Job.findById(jobId).select("postedBy title");
  if (!job) throw new ApiError(404, "Job not found");

  const jobOwnerId = jobPostedByUserId(job);
  const recruiterId = String(userId ?? "").trim();
  const canUpdate = jobOwnerId === recruiterId || userRole === "admin";

  if (process.env.NODE_ENV !== "production") {
    console.log("=== AUTH DEBUG (updateApplicationStatus) ===");
    console.log("recruiterId:", recruiterId);
    console.log("applicationId:", String(applicationId));
    console.log("application.job ref:", application.job);
    console.log("job._id:", job._id);
    console.log("job.postedBy:", job.postedBy);
    console.log("jobOwnerId (resolved):", jobOwnerId);
    console.log("comparison:", jobOwnerId, "vs", recruiterId, "=>", canUpdate);
  }

  if (!canUpdate) {
    throw new ApiError(403, "You can only update applications for your jobs");
  }

  application.status = status;
  await application.save();

  const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
  createNotification({
    userId: application.candidate,
    type: "application_status",
    title: "Application status updated",
    message: `Your application for "${job?.title}" is now ${status}.`,
    link: `${clientUrl}/jobs/${jobId}`,
    meta: { applicationId: application._id, status },
  }).catch(() => {});

  return { application };
};

const listApplicationsForJob = async (jobId, userId, userRole) => {
  const job = await jobRepository.findById(jobId);
  if (!job) throw new ApiError(404, "Job not found");

  const jobOwnerId = jobPostedByUserId(job);
  const recruiterId = String(userId ?? "").trim();
  const canView = jobOwnerId === recruiterId || userRole === "admin";
  if (!canView) throw new ApiError(403, "You can only view applications for your jobs");

  const applications = await applicationRepository.findByJob(jobId);
  return { applications };
};

module.exports = {
  applyToJob,
  listMyApplications,
  updateApplicationStatus,
  listApplicationsForJob,
};
