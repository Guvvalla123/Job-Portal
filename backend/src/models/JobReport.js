const mongoose = require("mongoose");

const jobReportSchema = new mongoose.Schema(
  {
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true,
    },
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    reason: {
      type: String,
      required: true,
      enum: [
        "fake_job",
        "expired_link",
        "wrong_company",
        "duplicate",
        "inappropriate",
        "other",
      ],
    },
    description: { type: String, maxlength: 500 },
    status: {
      type: String,
      enum: ["pending", "reviewed", "resolved", "dismissed"],
      default: "pending",
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    reviewedAt: { type: Date, default: null },
    adminNotes: { type: String, maxlength: 500, default: null },
  },
  { timestamps: true }
);

jobReportSchema.index({ job: 1, reportedBy: 1 }, { unique: true });
jobReportSchema.index({ status: 1 });
jobReportSchema.index({ createdAt: -1 });

jobReportSchema.set("toJSON", {
  transform(_doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

module.exports = { JobReport: mongoose.model("JobReport", jobReportSchema) };
