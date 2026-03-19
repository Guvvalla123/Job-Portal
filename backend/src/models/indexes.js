/**
 * Ensure compound indexes for common query patterns.
 * Run at app startup - indexes are created if not exist.
 */
const { Job } = require("./Job");
const { Application } = require("./Application");

const ensureIndexes = async () => {
  await Promise.all([
    Job.ensureIndexes(),
    Application.ensureIndexes(),
  ]);
};

module.exports = { ensureIndexes };
