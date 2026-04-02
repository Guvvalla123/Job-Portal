const mongoose = require("mongoose");

const jobAlertSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    keywords: {
      type: [String],
      default: [],
    },
    location: { type: String, default: "" },
    employmentType: { type: String, default: "" },
    salaryMin: { type: Number, min: 0 },
    frequency: {
      type: String,
      enum: ["IMMEDIATE", "DAILY", "WEEKLY"],
      default: "IMMEDIATE",
    },
    isActive: { type: Boolean, default: true },
    lastSentAt: { type: Date },
  },
  { timestamps: true }
);

jobAlertSchema.index({ user: 1, isActive: 1 });
jobAlertSchema.index({ isActive: 1, frequency: 1 });

jobAlertSchema.set("toJSON", {
  virtuals: true,
  transform(_doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

module.exports = { JobAlert: mongoose.model("JobAlert", jobAlertSchema) };
