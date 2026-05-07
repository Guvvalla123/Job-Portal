const mongoose = require("mongoose");

const suggestionSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      enum: ["keyword", "format", "skill", "experience", "quantify"],
    },
    priority: {
      type: String,
      required: true,
      enum: ["high", "medium", "low"],
    },
    message: { type: String, required: true, maxlength: 500 },
    example: { type: String, maxlength: 500, default: null },
  },
  { _id: true }
);

const atsCheckSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: false,
      default: null,
    },
    jobTitle: { type: String, trim: true, default: null },
    companyName: { type: String, trim: true, default: null },
    resumeTextLength: { type: Number, default: 0 },
    jobDescriptionLength: { type: Number, default: 0 },
    score: { type: Number, required: true, min: 0, max: 100 },
    grade: {
      type: String,
      required: true,
      enum: ["A", "B", "C", "D", "F"],
    },
    summary: { type: String, maxlength: 500, default: null },
    presentKeywords: { type: [String], default: [] },
    missingKeywords: { type: [String], default: [] },
    skillsGap: { type: [String], default: [] },
    suggestions: { type: [suggestionSchema], default: [] },
    formatCheck: {
      singleColumn: { type: Boolean, default: false },
      standardFonts: { type: Boolean, default: false },
      noTables: { type: Boolean, default: false },
      properHeadings: { type: Boolean, default: false },
      contactInfoComplete: { type: Boolean, default: false },
      consistentDates: { type: Boolean, default: false },
      score: { type: Number, min: 0, max: 100, default: 0 },
    },
    modelUsed: { type: String, default: "gpt-4o-mini" },
    tokensUsed: { type: Number, default: 0 },
    processingTimeMs: { type: Number, default: 0 },
    isPremiumCheck: { type: Boolean, default: false },
  },
  { timestamps: true }
);

atsCheckSchema.index({ user: 1 });
atsCheckSchema.index({ createdAt: -1 });
atsCheckSchema.index({ user: 1, createdAt: -1 });

atsCheckSchema.set("toJSON", {
  transform(_doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

module.exports = { AtsCheck: mongoose.model("AtsCheck", atsCheckSchema) };
