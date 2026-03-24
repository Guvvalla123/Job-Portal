/**
 * One-off: set Cloudinary raw resumes to access_mode "public" (fixes 401 on unsigned fetch).
 * Run from backend root: node scripts/updateResumeAccessMode.js
 * Requires: MONGODB_URI, CLOUDINARY_* env (same as app).
 */
require("dotenv").config({ quiet: true });

const mongoose = require("mongoose");
const { env } = require("../src/config/env");
const { cloudinary } = require("../src/config/cloudinary");
const { User } = require("../src/models/User");
const { logger } = require("../src/config/logger");

async function updateBatch(ids) {
  if (!ids.length) return { updated: [] };
  return cloudinary.api.update_resources_access_mode_by_ids("public", ids, { resource_type: "raw" });
}

async function main() {
  await mongoose.connect(env.MONGODB_URI);
  const users = await User.find({
    resumePublicId: { $exists: true, $nin: [null, ""] },
  }).select("resumePublicId email");

  const ids = [...new Set(users.map((u) => u.resumePublicId).filter(Boolean))];
  logger.info("updateResumeAccessMode: candidates", { count: ids.length });

  const chunkSize = 50;
  for (let i = 0; i < ids.length; i += chunkSize) {
    const chunk = ids.slice(i, i + chunkSize);
    try {
      const res = await updateBatch(chunk);
      logger.info("updateResumeAccessMode: batch ok", { from: i, size: chunk.length, res });
    } catch (err) {
      logger.warn("updateResumeAccessMode: batch failed, falling back per-id", { error: err.message });
      for (const id of chunk) {
        try {
          await updateBatch([id]);
          logger.info("updateResumeAccessMode: ok", { publicId: id });
        } catch (e) {
          logger.error("updateResumeAccessMode: failed", { publicId: id, error: e.message });
        }
      }
    }
  }

  await mongoose.disconnect();
  logger.info("updateResumeAccessMode: done");
}

main().catch((e) => {
  logger.error("updateResumeAccessMode: fatal", { error: e.message, stack: e.stack });
  process.exit(1);
});
