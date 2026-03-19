const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const { ROLES } = require("../constants/roles");

const experienceSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    company: { type: String, required: true, trim: true },
    location: { type: String, default: "" },
    startDate: { type: String, required: true },
    endDate: { type: String, default: "" },
    current: { type: Boolean, default: false },
    description: { type: String, default: "" },
  },
  { _id: true }
);

const projectSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    url: { type: String, default: "" },
    technologies: [{ type: String }],
  },
  { _id: true }
);

const educationSchema = new mongoose.Schema(
  {
    degree: { type: String, required: true, trim: true },
    institution: { type: String, required: true, trim: true },
    fieldOfStudy: { type: String, default: "" },
    startYear: { type: String, default: "" },
    endYear: { type: String, default: "" },
    grade: { type: String, default: "" },
  },
  { _id: true }
);

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6 },
    role: {
      type: String,
      enum: [ROLES.CANDIDATE, ROLES.RECRUITER, ROLES.ADMIN],
      default: ROLES.CANDIDATE,
    },
    headline: { type: String, default: "" },
    about: { type: String, default: "" },
    phone: { type: String, default: "" },
    location: { type: String, default: "" },
    website: { type: String, default: "" },
    skills: [{ type: String }],
    experience: [experienceSchema],
    projects: [projectSchema],
    education: [educationSchema],
    profileImageUrl: { type: String, default: "" },
    resumeUrl: { type: String, default: "" },
    resumePublicId: { type: String, default: "" },
    resumeFileName: { type: String, default: "" },
    resumeSize: { type: Number, default: 0 },
    resumeUploadedAt: { type: Date },
    refreshToken: { type: String, default: "" },
    isActive: { type: Boolean, default: true },
    passwordResetToken: { type: String, default: "" },
    passwordResetExpires: { type: Date },
    isEmailVerified: { type: Boolean, default: false },
    emailVerificationToken: { type: String, default: "" },
    emailVerificationExpires: { type: Date },
    savedJobs: [{ type: mongoose.Schema.Types.ObjectId, ref: "Job" }],
  },
  { timestamps: true }
);

userSchema.pre("save", async function preSave() {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.comparePassword = function comparePassword(plainTextPassword) {
  return bcrypt.compare(plainTextPassword, this.password);
};

module.exports = { User: mongoose.model("User", userSchema) };
