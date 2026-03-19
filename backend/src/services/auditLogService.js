/**
 * Audit logging - tracks critical actions for compliance and debugging.
 * Writes async to avoid blocking response.
 */
const { AuditLog } = require("../models/AuditLog");
const { logger } = require("../config/logger");

const log = async ({ userId, action, resourceType, resourceId, changes, req }) => {
  const ip = req?.ip || req?.connection?.remoteAddress || req?.headers?.["x-forwarded-for"]?.split(",")[0]?.trim();
  const userAgent = req?.headers?.["user-agent"];

  const doc = {
    userId: userId || null,
    action,
    resourceType,
    resourceId: resourceId || null,
    changes: changes || undefined,
    ip: ip || undefined,
    userAgent: userAgent || undefined,
  };

  setImmediate(() => {
    AuditLog.create(doc).catch((err) => {
      logger.error("AuditLog write failed", { error: err.message, action, resourceType });
    });
  });
};

module.exports = { log };
