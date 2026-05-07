const { User } = require("../models/User");
const { ROLES } = require("../constants/roles");
const { env } = require("./env");
const { logger } = require("./logger");

/**
 * Ensures one admin account exists when ADMIN_* env vars are set.
 * Uses `new User().save()` so the password pre-save hook hashes the password.
 */
async function seedAdmin() {
  const existing = await User.findOne({ role: ROLES.ADMIN });
  if (existing) {
    logger.info("Admin exists");
    return;
  }

  const { ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME } = env;
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD || !ADMIN_NAME) {
    return;
  }

  const admin = new User({
    fullName: ADMIN_NAME,
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    role: ROLES.ADMIN,
    isActive: true,
  });

  try {
    await admin.save();
  } catch (err) {
    if (err && err.code === 11000) {
      logger.info("Admin exists");
      return;
    }
    throw err;
  }

  logger.info(`Admin account ready: ${ADMIN_EMAIL}`);
}

module.exports = seedAdmin;
