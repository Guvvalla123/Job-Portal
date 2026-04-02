const mongoose = require("mongoose");
const { APPLICATION_STATUSES, INTERVIEW_STATUSES } = require("../constants/applicationStatus");

const interviewSchema = new mongoose.Schema(
  {
    scheduledAt: { type: Date, default: null },
    timezone: { type: String, default: "", trim: true },
    durationMinutes: { type: Number, default: 60, min: 15, max: 480 },
    notes: { type: String, default: "", maxlength: 2000 },
    status: {
      type: String,
      enum: INTERVIEW_STATUSES,
      default: "scheduled",
    },
  },
  { _id: false }
);

const applicationSchema = new mongoose.Schema(
  {
    job: { type: mongoose.Schema.Types.ObjectId, ref: "Job", required: true, index: true },
    candidate: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    coverLetter: { type: String, default: "" },
    status: {
      type: String,
      enum: APPLICATION_STATUSES,
      default: "applied",
      index: true,
    },
    recruiterNotes: { type: String, default: "", maxlength: 8000 },
    interview: { type: interviewSchema, default: () => ({}) },
  },
  { timestamps: true }
);

applicationSchema.index({ job: 1, candidate: 1 }, { unique: true });
applicationSchema.index({ job: 1, status: 1 });
applicationSchema.index({ "interview.scheduledAt": 1 }, { sparse: true });

applicationSchema.set("toJSON", {
  virtuals: true,
  transform(_doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

module.exports = { Application: mongoose.model("Application", applicationSchema) };
