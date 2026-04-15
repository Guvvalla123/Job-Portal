/**
 * Email worker - processes email jobs from the queue.
 * Failed jobs (after all retries) are moved to DLQ for inspection.
 * Run as: node src/workers/emailWorker.js
 */
require("dotenv").config({ quiet: true });
const { Worker, Queue } = require("bullmq");
const { sendMail } = require("../utils/mail");
const { logger } = require("../config/logger");
const jobAlertRepository = require("../repositories/jobAlertRepository");

const REDIS_URL = process.env.REDIS_URL;
if (!REDIS_URL) {
  console.error("REDIS_URL is required to run the email worker");
  process.exit(1);
}

const connection = require("ioredis")(REDIS_URL, { maxRetriesPerRequest: null });
const dlq = new Queue("email:dlq", { connection });

function absLink(link) {
  if (!link) return "";
  const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
  return link.startsWith("http") ? link : `${clientUrl}${link}`;
}

function buildJobAlertMail(payload) {
  const absoluteJobLink = absLink(payload.jobLink);
  const salaryLine = payload.salary ? `<p><strong>Salary:</strong> ${payload.salary}</p>` : "";
  const subject = `New job match: ${payload.jobTitle}`;
  const html = `
      <p>Hi ${payload.userName || "there"},</p>
      <p>A new job matches your alert.</p>
      <p><strong>${payload.jobTitle}</strong></p>
      <p>${payload.companyName || "Company"} &middot; ${payload.jobLocation || ""}</p>
      <p><strong>Type:</strong> ${payload.jobType || "—"}</p>
      ${salaryLine}
      <p><a href="${absoluteJobLink}" style="color:#4f46e5;">View job</a></p>
      <p style="font-size:12px;color:#6b7280;">Manage or delete job alerts in your account to stop these emails.</p>
    `;
  return { to: payload.userEmail, subject, html };
}

function buildApplicationReceivedMail(p) {
  const subject = p.subject || `New application: ${p.jobTitle || "Your job"}`;
  const html =
    p.html ||
    `
    <p>Hi ${p.recipientName || "there"},</p>
    <p><strong>${p.candidateName || "A candidate"}</strong> applied for <strong>${p.jobTitle || "your job"}</strong>.</p>
    <p><a href="${absLink(p.link)}" style="color:#4f46e5;">View application</a></p>
  `;
  return { to: p.userEmail || p.to, subject, html };
}

function buildStatusChangedMail(p) {
  const subject = p.subject || "Application status updated";
  const html =
    p.html ||
    `
    <p>Hi ${p.userName || "there"},</p>
    <p>Your application for <strong>${p.jobTitle || "a job"}</strong> is now <strong>${p.status || "updated"}</strong>.</p>
    <p><a href="${absLink(p.link)}" style="color:#4f46e5;">View your applications</a></p>
  `;
  return { to: p.userEmail || p.to, subject, html };
}

function buildInterviewScheduledMail(p) {
  const subject = p.subject || "Interview scheduled";
  const html =
    p.html ||
    `
    <p>Hi ${p.userName || "there"},</p>
    <p>Interview for <strong>${p.jobTitle || "your application"}</strong>${p.formattedDate ? ` on <strong>${p.formattedDate}</strong>` : ""}.</p>
    <p><a href="${absLink(p.link)}" style="color:#4f46e5;">View your applications</a></p>
  `;
  return { to: p.userEmail || p.to, subject, html };
}

const worker = new Worker(
  "email",
  async (job) => {
    const d = job.data;
    if (d.to && d.subject && (d.html != null || d.text != null)) {
      await sendMail({ to: d.to, subject: d.subject, html: d.html, text: d.text });
      logger.info("Email sent", { to: d.to, subject: d.subject, jobId: job.id, jobName: job.name });
      return;
    }

    if (job.name === "JOB_ALERT") {
      const { to, subject, html } = buildJobAlertMail(d);
      await sendMail({ to, subject, html });
      logger.info("Email sent", { to, subject, jobId: job.id, jobName: job.name });
      return;
    }

    if (job.name === "APPLICATION_RECEIVED") {
      const { to, subject, html } = buildApplicationReceivedMail(d);
      await sendMail({ to, subject, html });
      logger.info("Email sent", { to, subject, jobId: job.id, jobName: job.name });
      return;
    }

    if (job.name === "APPLICATION_STATUS_CHANGED" || job.name === "STATUS_CHANGED") {
      const { to, subject, html } = buildStatusChangedMail(d);
      await sendMail({ to, subject, html });
      logger.info("Email sent", { to, subject, jobId: job.id, jobName: job.name });
      return;
    }

    if (job.name === "INTERVIEW_SCHEDULED") {
      const { to, subject, html } = buildInterviewScheduledMail(d);
      await sendMail({ to, subject, html });
      logger.info("Email sent", { to, subject, jobId: job.id, jobName: job.name });
      return;
    }

    throw new Error(`Unsupported email job name: ${job.name}`);
  },
  {
    connection,
    concurrency: 5,
  }
);

worker.on("completed", async (job) => {
  logger.debug("Email job completed", { jobId: job.id, jobName: job.name });
  if (job.name === "JOB_ALERT" && job.data?.alertId) {
    try {
      await jobAlertRepository.updateLastSentAt(job.data.alertId);
    } catch (err) {
      logger.error("JOB_ALERT lastSentAt update failed", { error: err.message, alertId: job.data.alertId });
    }
  }
});

worker.on("failed", async (job, err) => {
  logger.error("Email job failed", {
    jobId: job?.id,
    jobName: job?.name,
    error: err.message,
    attempts: job?.attemptsMade,
  });
  if (job && job.attemptsMade >= (job.opts?.attempts ?? 3)) {
    try {
      await dlq.add("failed", {
        ...job.data,
        _failedAt: new Date().toISOString(),
        _error: err.message,
        _jobId: job.id,
        _jobName: job.name,
      });
      logger.warn("Job moved to DLQ", { jobId: job.id });
    } catch (e) {
      logger.error("Failed to move job to DLQ", { error: e.message });
    }
  }
});

worker.on("error", (err) => {
  logger.error("Email worker error", { error: err.message });
});

process.on("SIGTERM", async () => {
  await worker.close();
  process.exit(0);
});

logger.info("Email worker started");
