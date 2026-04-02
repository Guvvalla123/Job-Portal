const mongoose = require("mongoose");
const { env } = require("../config/env");

const auditTtlSeconds = Math.max(1, Number(env.AUDIT_LOG_TTL_DAYS) || 365) * 86400;

const auditLogSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    action: {
      type: String,
      required: true,
      enum: ["create", "update", "delete", "login", "logout", "register", "resume_viewed"],
      index: true,
    },
    resourceType: { type: String, required: true, index: true },
    resourceId: { type: String, index: true },
    changes: { type: mongoose.Schema.Types.Mixed },
    ip: { type: String },
    userAgent: { type: String },
  },
  { timestamps: true }
);

auditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: auditTtlSeconds });

auditLogSchema.set("toJSON", {
  virtuals: true,
  transform(_doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

module.exports = { AuditLog: mongoose.model("AuditLog", auditLogSchema) };
