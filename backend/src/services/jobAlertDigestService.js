const { Job } = require("../models/Job");
const { JobAlert } = require("../models/JobAlert");
const { addEmailJob } = require("../queues/emailQueue");
const { logger } = require("../config/logger");
const { findMatchingAlerts, formatJobSalary } = require("./jobAlertService");

/**
 * Batch digest for DAILY / WEEKLY alerts: jobs created in the last 1d / 7d, one email per (alert, job) match.
 * Each enqueue is isolated — one failure does not block others.
 * @param {"DAILY" | "WEEKLY"} frequency
 */
async function runDigest(frequency) {
  if (frequency !== "DAILY" && frequency !== "WEEKLY") {
    logger.warn("[JobAlertDigest] invalid frequency", { frequency });
    return { jobsScanned: 0, enqueued: 0 };
  }

  const windowMs = frequency === "WEEKLY" ? 7 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
  const since = new Date(Date.now() - windowMs);
  const now = new Date();

  const jobs = await Job.find({
    createdAt: { $gte: since },
    isActive: { $ne: false },
    isDraft: { $ne: true },
    $or: [{ expiresAt: null }, { expiresAt: { $exists: false } }, { expiresAt: { $gt: now } }],
  })
    .populate("company", "name")
    .lean();

  let enqueued = 0;

  for (const job of jobs) {
    try {
      const matches = await findMatchingAlerts(job, { allowedFrequencies: [frequency] });
      const jobLink = `/jobs/${job._id}`;
      const salary = formatJobSalary(job);

      for (const { alert, user } of matches) {
        try {
          await addEmailJob("JOB_ALERT", {
            userId: user._id,
            userEmail: user.email,
            userName: user.fullName || "",
            jobId: job._id,
            jobTitle: job.title,
            jobLocation: job.location || "",
            jobType: job.employmentType || "",
            salary: salary || undefined,
            companyName: job.company?.name || "",
            jobLink,
          });
          await JobAlert.updateOne({ _id: alert._id }, { $set: { lastSentAt: new Date() } });
          enqueued += 1;
        } catch (err) {
          logger.error("[JobAlertDigest] enqueue failed", { email: user?.email, error: err.message });
        }
      }
    } catch (err) {
      logger.error("[JobAlertDigest] job scan failed", { jobId: job._id, error: err.message });
    }
  }

  logger.info("[JobAlertDigest] run complete", { frequency, jobsScanned: jobs.length, enqueued });
  return { jobsScanned: jobs.length, enqueued };
}

module.exports = { runDigest };
