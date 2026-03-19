const mongoose = require("mongoose");

const applicationSchema = new mongoose.Schema(
  {
    job: { type: mongoose.Schema.Types.ObjectId, ref: "Job", required: true, index: true },
    candidate: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    coverLetter: { type: String, default: "" },
    status: {
      type: String,
      enum: ["applied", "shortlisted", "rejected", "hired"],
      default: "applied",
      index: true,
    },
  },
  { timestamps: true }
);

applicationSchema.index({ job: 1, candidate: 1 }, { unique: true });

module.exports = { Application: mongoose.model("Application", applicationSchema) };
