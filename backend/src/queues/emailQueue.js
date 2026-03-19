/**
 * Email queue - offloads email sending to background workers.
 * Falls back to direct send when Redis is not configured.
 */
const { Queue } = require("bullmq");
const { sendMail } = require("../utils/mail");
const { logger } = require("../config/logger");

let emailQueue = null;

const getConnection = () => {
  const url = process.env.REDIS_URL;
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
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: "exponential", delay: 1000 },
      removeOnComplete: { count: 1000 },
    },
  });
  return emailQueue;
};

/**
 * Queue an email job. When Redis is unavailable, sends directly.
 */
const queueEmail = async (payload) => {
  const queue = initQueue();
  if (queue) {
    await queue.add("send", payload);
    return;
  }
  setImmediate(() => {
    sendMail(payload).catch((err) => logger.error("Direct mail send failed", { error: err.message, to: payload.to }));
  });
};

module.exports = { queueEmail, initQueue };
