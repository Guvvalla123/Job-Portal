const userRepository = require("../repositories/userRepository");
const applicationRepository = require("../repositories/applicationRepository");
const jobAlertRepository = require("../repositories/jobAlertRepository");
const notificationRepository = require("../repositories/notificationRepository");
const jobRepository = require("../repositories/jobRepository");
const companyRepository = require("../repositories/companyRepository");
const { ApiError } = require("../utils/apiError");

/**
 * Machine-readable export of a user's data (GDPR-style portability helper).
 * Excludes secrets, internal ids where redundant, and binary resume bytes (includes metadata + Cloudinary refs only).
 */
async function buildPersonalDataExport(userId) {
  const user = await userRepository.findByIdForDataExportLean(userId);

  if (!user) throw new ApiError(404, "User not found");

  const [applications, jobAlerts, notifications, postedJobs, companies] = await Promise.all([
    applicationRepository.findByCandidatePopulateJobForExport(userId),
    jobAlertRepository.findByUserLean(userId),
    notificationRepository.findByUserLean(userId),
    jobRepository.findPostedBySelectLean(userId, "title location isActive createdAt"),
    companyRepository.findCreatedBySelect(userId, "name website createdAt"),
  ]);

  return {
    exportVersion: 1,
    exportedAt: new Date().toISOString(),
    profile: {
      ...user,
      _id: undefined,
      id: String(user._id),
      savedJobs: user.savedJobs?.map((id) => String(id)) ?? [],
    },
    applications: applications.map((a) => ({
      id: String(a._id),
      status: a.status,
      coverLetter: a.coverLetter,
      createdAt: a.createdAt,
      job: a.job
        ? {
            id: String(a.job._id || a.job),
            title: a.job.title,
            location: a.job.location,
          }
        : null,
    })),
    jobAlerts,
    notifications,
    jobsPosted: postedJobs.map((j) => ({
      id: String(j._id),
      title: j.title,
      location: j.location,
      isActive: j.isActive,
      createdAt: j.createdAt,
    })),
    companiesOwned: companies.map((c) => ({
      id: String(c._id),
      name: c.name,
      website: c.website,
      createdAt: c.createdAt,
    })),
  };
}

module.exports = { buildPersonalDataExport };
