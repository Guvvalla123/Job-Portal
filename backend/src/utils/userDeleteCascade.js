const { logger } = require("../config/logger");
const { Job } = require("../models/Job");
const { Application } = require("../models/Application");
const { Company } = require("../models/Company");
const { JobAlert } = require("../models/JobAlert");
const { Notification } = require("../models/Notification");

/**
 * Best-effort cleanup before removing a user document.
 * Logs partial failures; rethrows if Promise.all rejects.
 */
async function cascadeBeforeUserDelete(userId) {
  const id = String(userId);
  try {
    await Promise.all([
      Job.updateMany({ postedBy: id }, { $set: { isActive: false } }),
      Application.deleteMany({ candidate: id }),
      Company.updateMany({ createdBy: id }, { $set: { createdBy: null } }),
      JobAlert.deleteMany({ user: id }),
      Notification.deleteMany({ user: id }),
    ]);
  } catch (err) {
    logger.error("userDeleteCascade failed", {
      userId: id,
      error: err.message,
      stack: err.stack,
    });
    throw err;
  }
}

module.exports = { cascadeBeforeUserDelete };
