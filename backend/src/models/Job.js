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
    company: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: false, default: null },
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
      default: null,
    },
    applyUrl: {
      type: String,
      required: true,
      trim: true,
      validate: {
        validator(v) {
          try {
            new URL(v);
            return true;
          } catch {
            return false;
          }
        },
        message: "Invalid URL format",
      },
    },
    postedByCompanyName: { type: String, required: true, trim: true, maxlength: 100 },
    postedByCompanyLogo: { type: String, trim: true, default: null },
    postedByCompanyWebsite: { type: String, trim: true, default: null },
    category: {
      type: String,
      required: true,
      enum: [
        "technology",
        "finance",
        "marketing",
        "sales",
        "design",
        "operations",
        "human-resources",
        "other",
      ],
    },
    tags: {
      type: [
        {
          type: String,
          enum: ["remote", "urgent", "new", "hot", "featured"],
        },
      ],
      default: [],
    },
    isVerified: { type: Boolean, default: false },
    clickCount: { type: Number, default: 0, min: 0 },
    saveCount: { type: Number, default: 0, min: 0 },
    source: { type: String, default: "manual", enum: ["manual", "partner", "scraped"] },
    reportCount: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true, index: true },
    /** Draft jobs are visible only to the poster; excluded from public listings. */
    isDraft: { type: Boolean, default: false, index: true },
    /** When set and in the past, job is hidden from public listings (still visible in recruiter "my jobs"). */
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      index: true,
    },
  },
  { timestamps: true }
);

jobSchema.index({ title: "text", description: "text", skills: "text", location: "text" });

jobSchema.index({ category: 1 });
jobSchema.index({ isVerified: 1 });
jobSchema.index({ clickCount: -1 });
jobSchema.index({ category: 1, isActive: 1, expiresAt: 1 });

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
