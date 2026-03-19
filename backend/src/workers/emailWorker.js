/**
 * Email worker - processes email jobs from the queue.
 * Failed jobs (after all retries) are moved to DLQ for inspection.
 * Run as: node src/workers/emailWorker.js
 */
require("dotenv").config({ quiet: true });
const { Worker, Queue } = require("bullmq");
const { sendMail } = require("../utils/mail");
const { logger } = require("../config/logger");

const REDIS_URL = process.env.REDIS_URL;
if (!REDIS_URL) {
  console.error("REDIS_URL is required to run the email worker");
  process.exit(1);
}

const connection = require("ioredis")(REDIS_URL, { maxRetriesPerRequest: null });
const dlq = new Queue("email:dlq", { connection });

const worker = new Worker(
  "email",
  async (job) => {
    const { to, subject, html, text } = job.data;
    await sendMail({ to, subject, html, text });
    logger.info("Email sent", { to, subject, jobId: job.id });
  },
  {
    connection,
    concurrency: 5,
  }
);

worker.on("failed", async (job, err) => {
  logger.error("Email job failed", { jobId: job?.id, error: err.message, attempts: job?.attemptsMade });
  if (job && job.attemptsMade >= (job.opts?.attempts ?? 3)) {
    try {
      await dlq.add("failed", {
        ...job.data,
        _failedAt: new Date().toISOString(),
        _error: err.message,
        _jobId: job.id,
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
