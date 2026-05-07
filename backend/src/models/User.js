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
    /** Plain text at registration/reset (validated in route); stored value is bcrypt hash (always long). */
    password: { type: String, required: true, minlength: 8 },
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
    /** Cloudinary public_id for profile image — used for reliable delete on account removal. */
    profileImagePublicId: { type: String, default: "" },
    resumeUrl: { type: String, default: "" },
    resumePublicId: { type: String, default: "" },
    resumeFileName: { type: String, default: "" },
    resumeSize: { type: Number, default: 0 },
    resumeUploadedAt: { type: Date },
    refreshToken: { type: String, default: "" },
    isActive: { type: Boolean, default: true },
    passwordResetToken: { type: String, default: "" },
    passwordResetExpires: { type: Date },
    savedJobs: [{ type: mongoose.Schema.Types.ObjectId, ref: "Job" }],
    /** Encrypted TOTP secret (AES-256-GCM); never exposed in API responses. */
    mfaTotpSecretEnc: { type: String, default: "", select: false },
    mfaEnabled: { type: Boolean, default: false },
    isPremium: { type: Boolean, default: false },
    premiumExpiresAt: { type: Date, default: null },
    atsChecksUsedThisMonth: { type: Number, default: 0, min: 0 },
    atsChecksResetAt: {
      type: Date,
      default: () => {
        const d = new Date();
        return new Date(d.getFullYear(), d.getMonth(), 1);
      },
    },
    resumeReviewsUsedThisMonth: { type: Number, default: 0, min: 0 },
    resumeReviewsResetAt: {
      type: Date,
      default: () => {
        const d = new Date();
        return new Date(d.getFullYear(), d.getMonth(), 1);
      },
    },
    lastActiveAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

userSchema.pre("save", async function preSave() {
  if (!this.isModified("password")) return;
  /** cost 12: ~4× CPU vs 10; aligns with OWASP guidance for sensitive credentials. */
  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.comparePassword = function comparePassword(plainTextPassword) {
  return bcrypt.compare(plainTextPassword, this.password);
};

userSchema.methods.canUseAtsChecker = function canUseAtsChecker() {
  return this.isPremium === true || this.atsChecksUsedThisMonth < 3;
};

userSchema.methods.canUseResumeReview = function canUseResumeReview() {
  return this.isPremium === true || this.resumeReviewsUsedThisMonth < 1;
};

userSchema.set("toJSON", {
  virtuals: true,
  transform(_doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    delete ret.password;
    delete ret.refreshToken;
    delete ret.mfaTotpSecretEnc;
    return ret;
  },
});

module.exports = { User: mongoose.model("User", userSchema) };
