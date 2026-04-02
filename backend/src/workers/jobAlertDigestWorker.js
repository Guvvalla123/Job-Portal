/**
 * Registers repeatable DAILY / WEEKLY digest jobs and processes them.
 * Run alongside emailWorker when Redis is available: npm run worker:job-alert-digest
 */
require("dotenv").config({ quiet: true });
const IORedis = require("ioredis");
const { Worker, Queue } = require("bullmq");
const { runDigest } = require("../services/jobAlertDigestService");
const { logger } = require("../config/logger");

const REDIS_URL = process.env.REDIS_URL;
if (!REDIS_URL) {
  console.error("REDIS_URL is required to run the job alert digest worker");
  process.exit(1);
}

const connection = new IORedis(REDIS_URL, { maxRetriesPerRequest: null });

async function registerRepeatables() {
  const q = new Queue("job-alert-digest", { connection });
  await q.add("digest", { frequency: "DAILY" }, { repeat: { pattern: "0 8 * * *" }, jobId: "digest-daily" });
  await q.add("digest", { frequency: "WEEKLY" }, { repeat: { pattern: "0 9 * * 1" }, jobId: "digest-weekly" });
  await q.close();
  logger.info("Job alert digest repeatable schedules registered (daily 08:00 UTC, weekly Monday 09:00 UTC)");
}

const worker = new Worker(
  "job-alert-digest",
  async (job) => {
    const freq = job.data?.frequency;
    if (freq === "DAILY" || freq === "WEEKLY") {
      await runDigest(freq);
      return;
    }
    throw new Error(`Unknown digest frequency: ${freq}`);
  },
  { connection, concurrency: 1 }
);

worker.on("completed", (job) => {
  logger.debug("Digest job completed", { jobId: job.id, name: job.name });
});

worker.on("failed", (job, err) => {
  logger.error("Digest job failed", { jobId: job?.id, error: err.message });
});

process.on("SIGTERM", async () => {
  await worker.close();
  process.exit(0);
});

registerRepeatables()
  .then(() => {
    logger.info("Job alert digest worker started");
  })
  .catch((err) => {
    logger.error("Failed to register digest schedules", { error: err.message });
    process.exit(1);
  });
