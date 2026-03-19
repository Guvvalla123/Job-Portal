const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, index: true },
    description: { type: String, required: true },
    location: { type: String, required: true, index: true },
    employmentType: {
      type: String,
      enum: ["full-time", "part-time", "contract", "internship"],
      default: "full-time",
      index: true,
    },
    experienceLevel: {
      type: String,
      enum: ["fresher", "junior", "mid", "senior", "lead"],
      default: "junior",
      index: true,
    },
    minSalary: { type: Number, default: 0 },
    maxSalary: { type: Number, default: 0 },
    skills: [{ type: String, index: true }],
    company: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true },
    postedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

jobSchema.index({ title: "text", description: "text", skills: "text", location: "text" });

module.exports = { Job: mongoose.model("Job", jobSchema) };
