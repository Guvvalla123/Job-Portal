const mongoose = require("mongoose");

const jobAlertSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    keywords: { type: String, default: "" },
    location: { type: String, default: "" },
    employmentType: { type: String, default: "" },
    isActive: { type: Boolean, default: true },
    lastNotifiedAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = { JobAlert: mongoose.model("JobAlert", jobAlertSchema) };
