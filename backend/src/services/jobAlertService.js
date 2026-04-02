const { JobAlert } = require("../models/JobAlert");
const { Job } = require("../models/Job");
const { addEmailJob } = require("../queues/emailQueue");
const { logger } = require("../config/logger");

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Normalize keywords from array (or legacy string from old documents). */
function alertKeywordsList(alert) {
  const k = alert.keywords;
  if (k == null) return [];
  if (Array.isArray(k)) return k.map(String).map((s) => s.trim()).filter(Boolean);
  if (typeof k === "string") return k.trim().split(/\s+/).filter(Boolean);
  return [];
}

function formatJobSalary(job) {
  const min = Number(job.minSalary) || 0;
  const max = Number(job.maxSalary) || 0;
  if (!min && !max) return "";
  if (min && max) return `$${min} – $${max}`;
  if (max) return `Up to $${max}`;
  return `From $${min}`;
}

/**
 * @param {object} alert — plain or doc
 * @param {object} job
 * @param {object} [options]
 * @param {string[]} [options.allowedFrequencies]
 */
function alertMatchesJob(alert, job, options = {}) {
  const { allowedFrequencies } = options;
  let matchesAlert = true;

  const terms = alertKeywordsList(alert);
  if (terms.length > 0) {
    const pattern = new RegExp(terms.map(escapeRegex).join("|"), "i");
    const text = `${job.title} ${job.description} ${(job.skills || []).join(" ")}`;
    if (!pattern.test(text)) matchesAlert = false;
  }

  if (matchesAlert && alert.location?.trim()) {
    const locPattern = new RegExp(escapeRegex(alert.location.trim()), "i");
    if (!locPattern.test(job.location || "")) matchesAlert = false;
  }

  if (matchesAlert && alert.employmentType) {
    if (job.employmentType !== alert.employmentType) matchesAlert = false;
  }

  if (matchesAlert && alert.salaryMin != null && alert.salaryMin > 0) {
    const jobMax = Number(job.maxSalary) || 0;
    const jobMin = Number(job.minSalary) || 0;
    const hasJobSalary = jobMax > 0 || jobMin > 0;
    if (!hasJobSalary) matchesAlert = false;
    else {
      const meets = jobMax >= alert.salaryMin || jobMin >= alert.salaryMin;
      if (!meets) matchesAlert = false;
    }
  }

  if (matchesAlert) {
    if (Array.isArray(allowedFrequencies) && allowedFrequencies.length > 0) {
      if (!allowedFrequencies.includes(alert.frequency)) matchesAlert = false;
    } else if (alert.frequency && alert.frequency !== "IMMEDIATE") {
      matchesAlert = false;
    }
  }

  return matchesAlert && Boolean(alert.user?.email);
}

/**
 * Find active alerts that match the given job (keywords, location, employment type, salary floor).
 * Loads alerts in batches to cap memory use.
 */
async function findMatchingAlerts(job, options = {}) {
  const { allowedFrequencies } = options;
  const baseFilter = { isActive: true };
  if (Array.isArray(allowedFrequencies) && allowedFrequencies.length > 0) {
    baseFilter.frequency = { $in: allowedFrequencies };
  } else {
    baseFilter.frequency = "IMMEDIATE";
  }

  const BATCH_SIZE = 100;
  const matches = [];
  let skip = 0;

  while (true) {
    const batch = await JobAlert.find(baseFilter)
      .populate("user", "email fullName")
      .skip(skip)
      .limit(BATCH_SIZE)
      .lean();

    if (!batch.length) break;

    for (const alert of batch) {
      if (alertMatchesJob(alert, job, options)) {
        matches.push({ alert, user: alert.user });
      }
    }

    skip += batch.length;
    if (batch.length < BATCH_SIZE) break;
  }

  return matches;
}

/**
 * Match job alerts for a newly created job, enqueue JOB_ALERT emails (lastSentAt updated in worker on success).
 */
async function matchAlertsForJob(job) {
  try {
    const populatedJob = await Job.findById(job._id).populate("company", "name");
    if (!populatedJob || populatedJob.isActive === false || populatedJob.isDraft) return;
    const exp = populatedJob.expiresAt;
    if (exp && new Date(exp) <= new Date()) return;

    const matches = await findMatchingAlerts(populatedJob);
    const jobLink = `/jobs/${populatedJob._id}`;
    const salary = formatJobSalary(populatedJob);

    for (const { alert, user } of matches) {
      try {
        await addEmailJob("JOB_ALERT", {
          userId: user._id,
          userEmail: user.email,
          userName: user.fullName || "",
          jobId: populatedJob._id,
          jobTitle: populatedJob.title,
          jobLocation: populatedJob.location || "",
          jobType: populatedJob.employmentType || "",
          salary: salary || undefined,
          companyName: populatedJob.company?.name || "",
          jobLink,
          alertId: String(alert._id),
        });
      } catch (err) {
        logger.error("[JobAlert] enqueue failed", { email: user.email, error: err.message });
      }
    }
  } catch (err) {
    logger.error("[JobAlert] matchAlertsForJob failed", { error: err.message });
  }
}

/** @deprecated Use matchAlertsForJob — kept for jobService import */
const notifyAlertsForJob = matchAlertsForJob;

module.exports = {
  matchAlertsForJob,
  notifyAlertsForJob,
  findMatchingAlerts,
  formatJobSalary,
};
