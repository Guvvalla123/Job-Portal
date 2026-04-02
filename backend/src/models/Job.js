const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, index: true },
    description: { type: String, required: true, maxlength: 10000 },
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
    /** Draft jobs are visible only to the poster; excluded from public listings. */
    isDraft: { type: Boolean, default: false, index: true },
    /** When set and in the past, job is hidden from public listings (still visible in recruiter "my jobs"). */
    expiresAt: { type: Date, default: null, index: true },
  },
  { timestamps: true }
);

jobSchema.index({ title: "text", description: "text", skills: "text", location: "text" });

jobSchema.set("toJSON", {
  virtuals: true,
  transform(_doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

module.exports = { Job: mongoose.model("Job", jobSchema) };
