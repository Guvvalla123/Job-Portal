const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    action: { type: String, required: true, enum: ["create", "update", "delete", "login", "logout"], index: true },
    resourceType: { type: String, required: true, index: true },
    resourceId: { type: String, index: true },
    changes: { type: mongoose.Schema.Types.Mixed },
    ip: { type: String },
    userAgent: { type: String },
  },
  { timestamps: true }
);

auditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 }); // 90 days TTL

module.exports = { AuditLog: mongoose.model("AuditLog", auditLogSchema) };
