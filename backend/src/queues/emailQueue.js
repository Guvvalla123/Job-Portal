/**
 * Email queue - offloads email sending to background workers.
 * Falls back to direct send when Redis is not configured.
 */
const { Queue } = require("bullmq");
const { sendMail } = require("../utils/mail");
const { logger } = require("../config/logger");
const { JobAlert } = require("../models/JobAlert");
const { env } = require("../config/env");
const { incEmailDirectFallback, incEmailDirectFallbackFailed } = require("../config/metrics");

let emailQueue = null;

function warnDirectEmailFallback(emailType) {
  logger.warn("email_queue_direct_fallback", {
    emailType,
    hint: "Set REDIS_URL and run npm run worker:email (and worker:job-alert-digest if using digests) for durable delivery.",
  });
  incEmailDirectFallback();
}

const defaultJobOptions = {
  attempts: 3,
  backoff: { type: "exponential", delay: 5000 },
  removeOnComplete: { count: 100 },
  removeOnFail: { count: 500 },
};

const getConnection = () => {
  const url = env.REDIS_URL;
  if (!url) return null;
  try {
    const IORedis = require("ioredis");
    return new IORedis(url, { maxRetriesPerRequest: null });
  } catch (err) {
    logger.warn("Redis not available for email queue", { error: err.message });
    return null;
  }
};

const initQueue = () => {
  if (emailQueue) return emailQueue;
  const connection = getConnection();
  if (!connection) return null;
  emailQueue = new Queue("email", {
    connection,
    defaultJobOptions,
  });
  return emailQueue;
};

/**
 * Typed email job (worker dispatches on job name).
 * @param {string} type - e.g. JOB_ALERT
 * @param {object} payload
 * @param {object} [options] - BullMQ job options (merged over defaults)
 */
const addEmailJob = async (type, payload, options = {}) => {
  const queue = initQueue();
  const opts = { ...defaultJobOptions, ...options };
  if (queue) {
    await queue.add(type, payload, opts);
    return;
  }
  if (type === "JOB_ALERT") {
    warnDirectEmailFallback(type);
    const clientUrl = String(env.CLIENT_URL || "http://localhost:5173")
      .split(",")[0]
      .trim();
    const p = payload;
    const absoluteJobLink = p.jobLink?.startsWith("http") ? p.jobLink : `${clientUrl}${p.jobLink || ""}`;
    const salaryLine = p.salary ? `<p><strong>Salary:</strong> ${p.salary}</p>` : "";
    const subject = `New job match: ${p.jobTitle}`;
    const html = `
      <p>Hi ${p.userName || "there"},</p>
      <p>A new job matches your alert.</p>
      <p><strong>${p.jobTitle}</strong></p>
      <p>${p.companyName || "Company"} &middot; ${p.jobLocation || ""}</p>
      <p><strong>Type:</strong> ${p.jobType || "—"}</p>
      ${salaryLine}
      <p><a href="${absoluteJobLink}" style="color:#4f46e5;">View job</a></p>
      <p style="font-size:12px;color:#6b7280;">Manage or delete job alerts in your account to stop these emails.</p>
    `;
    setImmediate(() => {
      sendMail({ to: p.userEmail, subject, html })
        .then(() => {
          if (!p.alertId) return null;
          return JobAlert.updateOne({ _id: p.alertId }, { $set: { lastSentAt: new Date() } }).catch((e) =>
            logger.error("JOB_ALERT lastSentAt update failed", { error: e.message, alertId: p.alertId })
          );
        })
        .catch((err) => {
          incEmailDirectFallbackFailed();
          logger.error("Direct JOB_ALERT mail failed", { error: err.message, to: p.userEmail });
        });
    });
    return;
  }

  const clientUrl = String(env.CLIENT_URL || "http://localhost:5173")
    .split(",")[0]
    .trim();
  const absLink = (link) => {
    if (!link) return "";
    return link.startsWith("http") ? link : `${clientUrl}${link}`;
  };

  if (type === "APPLICATION_RECEIVED" && payload.userEmail) {
    warnDirectEmailFallback(type);
    const p = payload;
    const html =
      p.html ||
      `
      <p>Hi ${p.recipientName || "there"},</p>
      <p><strong>${p.candidateName || "A candidate"}</strong> applied for <strong>${p.jobTitle || "your job"}</strong>.</p>
      <p><a href="${absLink(p.link)}" style="color:#4f46e5;">View application</a></p>
    `;
    setImmediate(() => {
      sendMail({
        to: p.userEmail,
        subject: p.subject || `New application: ${p.jobTitle || "Your job"}`,
        html,
      }).catch((err) => {
        incEmailDirectFallbackFailed();
        logger.error("Direct APPLICATION_RECEIVED mail failed", { error: err.message });
      });
    });
    return;
  }

  if (type === "APPLICATION_STATUS_CHANGED" && payload.userEmail) {
    warnDirectEmailFallback(type);
    const p = payload;
    const html =
      p.html ||
      `
      <p>Hi ${p.userName || "there"},</p>
      <p>Your application for <strong>${p.jobTitle || "a job"}</strong> is now <strong>${p.status || "updated"}</strong>.</p>
      <p><a href="${absLink(p.link)}" style="color:#4f46e5;">View your applications</a></p>
    `;
    setImmediate(() => {
      sendMail({
        to: p.userEmail,
        subject: p.subject || "Application status updated",
        html,
      }).catch((err) => {
        incEmailDirectFallbackFailed();
        logger.error("Direct STATUS mail failed", { error: err.message });
      });
    });
    return;
  }

  if (type === "INTERVIEW_SCHEDULED" && payload.userEmail) {
    warnDirectEmailFallback(type);
    const p = payload;
    const html =
      p.html ||
      `
      <p>Hi ${p.userName || "there"},</p>
      <p>Interview for <strong>${p.jobTitle || "your application"}</strong>${p.formattedDate ? ` on <strong>${p.formattedDate}</strong>` : ""}.</p>
      <p><a href="${absLink(p.link)}" style="color:#4f46e5;">View your applications</a></p>
    `;
    setImmediate(() => {
      sendMail({
        to: p.userEmail,
        subject: p.subject || "Interview scheduled",
        html,
      }).catch((err) => {
        incEmailDirectFallbackFailed();
        logger.error("Direct INTERVIEW mail failed", { error: err.message });
      });
    });
    return;
  }

  logger.warn("No Redis; typed email job skipped (not implemented for direct fallback)", { type });
};

/**
 * Queue a raw send-mail job (legacy). When Redis is unavailable, sends directly.
 */
const queueEmail = async (payload) => {
  const queue = initQueue();
  if (queue) {
    await queue.add("send", payload, defaultJobOptions);
    return;
  }
  warnDirectEmailFallback("send");
  setImmediate(() => {
    sendMail(payload).catch((err) => {
      incEmailDirectFallbackFailed();
      logger.error("Direct mail send failed", { error: err.message, to: payload.to });
    });
  });
};

const closeQueue = async () => {
  if (!emailQueue) return;
  try {
    await emailQueue.close();
  } finally {
    emailQueue = null;
  }
};

/**
 * Snapshot of BullMQ email queue counts for Prometheus (see config/metrics.js).
 * @returns {Promise<Record<string, number>|null>} null if queue/Redis not active on this process.
 */
async function getEmailQueueJobCounts() {
  const queue = initQueue();
  if (!queue) return null;
  try {
    return await queue.getJobCounts("waiting", "paused", "active", "delayed", "completed", "failed");
  } catch {
    return null;
  }
}

module.exports = { queueEmail, addEmailJob, initQueue, closeQueue, getEmailQueueJobCounts };
