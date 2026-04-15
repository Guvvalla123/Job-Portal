const { ApiError } = require("../utils/apiError");
const { createNotification } = require("./notificationService");
const applicationRepository = require("../repositories/applicationRepository");
const jobRepository = require("../repositories/jobRepository");
const userRepository = require("../repositories/userRepository");
const { addEmailJob } = require("../queues/emailQueue");
const { logger } = require("../config/logger");

function jobPostedByUserId(job) {
  if (!job?.postedBy) return "";
  const p = job.postedBy;
  if (typeof p === "object" && p._id != null) return String(p._id);
  return String(p);
}

async function assertRecruiterOwnsApplicationJob(application, userId, userRole) {
  const jobId = application.job?._id || application.job;
  if (!jobId) throw new ApiError(404, "Job not found for this application");

  const job = await jobRepository.findByIdSelect(jobId, "postedBy title");
  if (!job) throw new ApiError(404, "Job not found");

  const jobOwnerId = jobPostedByUserId(job);
  const recruiterId = String(userId ?? "").trim();
  const canAccess = jobOwnerId === recruiterId || userRole === "admin";
  if (!canAccess) throw new ApiError(403, "You can only manage applications for your jobs");
  return { job, jobId };
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

  const populatedJob = await jobRepository.findByIdPopulatePostedBy(jobId, "fullName email");
  if (populatedJob?.postedBy?._id) {
    const candidate = await userRepository.findByIdLean(candidateId, "fullName");
    const candidateName = candidate?.fullName?.trim() || "A candidate";
    const jobTitle = populatedJob.title || "a job";
    await createNotification({
      userId: populatedJob.postedBy._id,
      type: "APPLICATION_RECEIVED",
      title: "New application received",
      message: `${candidateName} applied for ${jobTitle}`,
      link: `/recruiter/applications/${application._id}`,
      meta: { applicationId: application._id, jobId },
    }).catch((err) =>
      logger.error("Side effect failed", {
        service: "applicationService",
        operation: "createNotification",
        error: err.message,
        stack: err.stack,
      }),
    );

    const recruiter = populatedJob.postedBy;
    const recEmail = recruiter?.email;
    if (recEmail) {
      addEmailJob("APPLICATION_RECEIVED", {
        userEmail: recEmail,
        recipientName: recruiter.fullName,
        candidateName,
        jobTitle,
        link: `/recruiter/applications/${application._id}`,
      }).catch((err) =>
        logger.error("Side effect failed", {
          service: "applicationService",
          operation: "addEmailJob",
          error: err.message,
          stack: err.stack,
        }),
      );
    }
  }

  return { application };
};

const listMyApplications = async (candidateId, query = {}) => {
  const { page, limit } = query;
  return applicationRepository.findByCandidatePaginated(candidateId, { page, limit });
};

const updateApplicationStatus = async (applicationId, status, userId, userRole) => {
  const application = await applicationRepository.findById(applicationId, "job");
  if (!application) throw new ApiError(404, "Application not found");

  const { job } = await assertRecruiterOwnsApplicationJob(application, userId, userRole);

  application.status = status;
  await application.save();

  createNotification({
    userId: application.candidate,
    type: "APPLICATION_STATUS_CHANGED",
    title: "Application status updated",
    message: `Your application for "${job?.title}" is now ${status}.`,
    link: `/candidate/applications`,
    meta: { applicationId: application._id, status },
  }).catch((err) =>
    logger.error("Side effect failed", {
      service: "applicationService",
      operation: "createNotification",
      error: err.message,
      stack: err.stack,
    }),
  );

  const cand = await userRepository.findByIdLean(application.candidate, "email fullName");
  if (cand?.email) {
    addEmailJob("APPLICATION_STATUS_CHANGED", {
      userEmail: cand.email,
      userName: cand.fullName,
      jobTitle: job?.title || "a job",
      status,
      link: `/candidate/applications`,
    }).catch((err) =>
      logger.error("Side effect failed", {
        service: "applicationService",
        operation: "addEmailJob",
        error: err.message,
        stack: err.stack,
      }),
    );
  }

  return { application };
};

const listApplicationsForJob = async (jobId, userId, userRole, query = {}) => {
  const job = await jobRepository.findById(jobId);
  if (!job) throw new ApiError(404, "Job not found");

  const jobOwnerId = jobPostedByUserId(job);
  const recruiterId = String(userId ?? "").trim();
  const canView = jobOwnerId === recruiterId || userRole === "admin";
  if (!canView) throw new ApiError(403, "You can only view applications for your jobs");

  const { status, q, skill, page, limit } = query;
  return applicationRepository.findByJobPaginated(jobId, {
    status: status || undefined,
    q,
    skill,
    page,
    limit,
  });
};

const getApplicationDetail = async (applicationId, userId, userRole) => {
  const application = await applicationRepository.findByIdPopulatedForRecruiterDetail(applicationId);

  if (!application) throw new ApiError(404, "Application not found");
  await assertRecruiterOwnsApplicationJob(application, userId, userRole);

  return { application };
};

const updateRecruiterNotes = async (applicationId, recruiterNotes, userId, userRole) => {
  const application = await applicationRepository.findById(applicationId, "job");
  if (!application) throw new ApiError(404, "Application not found");
  await assertRecruiterOwnsApplicationJob(application, userId, userRole);

  application.recruiterNotes = recruiterNotes ?? "";
  await application.save();
  return { application };
};

const updateInterview = async (applicationId, payload, userId, userRole) => {
  const application = await applicationRepository.findById(applicationId, "job");
  if (!application) throw new ApiError(404, "Application not found");
  await assertRecruiterOwnsApplicationJob(application, userId, userRole);

  const interviewScheduledInRequest =
    payload.scheduledAt !== undefined &&
    payload.scheduledAt !== null &&
    String(payload.scheduledAt).trim() !== "";

  const next = application.interview?.toObject?.() || application.interview || {};
  if (payload.scheduledAt !== undefined) {
    if (payload.scheduledAt === null || payload.scheduledAt === "") {
      next.scheduledAt = null;
    } else {
      const d = new Date(payload.scheduledAt);
      if (Number.isNaN(d.getTime())) throw new ApiError(400, "Invalid interview scheduledAt");
      next.scheduledAt = d;
    }
  }
  if (payload.timezone !== undefined) next.timezone = String(payload.timezone || "").slice(0, 80);
  if (payload.durationMinutes !== undefined) next.durationMinutes = Number(payload.durationMinutes) || 60;
  if (payload.notes !== undefined) next.notes = String(payload.notes || "").slice(0, 2000);
  if (payload.status !== undefined) next.status = payload.status;

  application.interview = next;
  if (next.scheduledAt && payload.syncPipelineStatus !== false) {
    application.status = "interview";
  }
  await application.save();

  if (interviewScheduledInRequest && next.scheduledAt) {
    const jobIdForTitle = application.job?._id || application.job;
    const jobDoc = await jobRepository.findTitleLean(jobIdForTitle);
    const jobTitle = jobDoc?.title || "your application";
    const formattedDate = next.scheduledAt.toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
    createNotification({
      userId: application.candidate,
      type: "INTERVIEW_SCHEDULED",
      title: "Interview scheduled",
      message: `Interview for ${jobTitle} on ${formattedDate}`,
      link: `/candidate/applications`,
      meta: {
        applicationId: application._id,
        scheduledAt: next.scheduledAt.toISOString(),
      },
    }).catch((err) =>
      logger.error("Side effect failed", {
        service: "applicationService",
        operation: "createNotification",
        error: err.message,
        stack: err.stack,
      }),
    );

    const cand = await userRepository.findByIdLean(application.candidate, "email fullName");
    if (cand?.email) {
      addEmailJob("INTERVIEW_SCHEDULED", {
        userEmail: cand.email,
        userName: cand.fullName,
        jobTitle,
        formattedDate,
        link: `/candidate/applications`,
      }).catch((err) =>
        logger.error("Side effect failed", {
          service: "applicationService",
          operation: "addEmailJob",
          error: err.message,
          stack: err.stack,
        }),
      );
    }
  }

  return { application };
};

const listUpcomingInterviews = async (userId, userRole) => {
  const jobs = await jobRepository.findJobIdsByPostedBy(userId);
  const jobIds = jobs.map((j) => j._id);
  if (jobIds.length === 0) return { interviews: [] };

  if (userRole === "admin") {
    const all = await applicationRepository.findUpcomingInterviewsAllAdmin();
    return { interviews: all };
  }

  const interviews = await applicationRepository.findUpcomingInterviewsForJobs(jobIds);
  return { interviews };
};

module.exports = {
  applyToJob,
  listMyApplications,
  updateApplicationStatus,
  listApplicationsForJob,
  getApplicationDetail,
  updateRecruiterNotes,
  updateInterview,
  listUpcomingInterviews,
};
