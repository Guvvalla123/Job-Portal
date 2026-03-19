const mongoose = require("mongoose");
const { cloudinary } = require("../config/cloudinary");
const { User } = require("../models/User");
const { Job } = require("../models/Job");
const { asyncHandler } = require("../utils/asyncHandler");
const { ApiError } = require("../utils/apiError");
const { logger } = require("../config/logger");

/**
 * Upload image to Cloudinary using stream (works well for images).
 */
const uploadImageToCloudinary = (fileBuffer, folder) =>
  new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder, resource_type: "image" },
      (error, result) => {
        if (error) return reject(error);
        return resolve(result);
      }
    );
    uploadStream.end(fileBuffer);
  });

/**
 * Upload PDF resume to Cloudinary using base64 data URI.
 * Binary files (PDF) can be corrupted when piped through streams due to encoding.
 * Base64 data URI preserves binary integrity and is the Cloudinary-recommended approach.
 * @param {Object} opts - { fileBuffer, folder, mimetype, userId, originalName }
 */
const uploadResumeToCloudinary = (opts) =>
  new Promise((resolve, reject) => {
    const { fileBuffer, folder, mimetype, userId, originalName } = opts;
    const base64 = fileBuffer.toString("base64");
    const dataUri = `data:${mimetype};base64,${base64}`;
    const ext = "pdf";
    const safeName = (originalName || "resume")
      .replace(/\.[^/.]+$/, "")
      .replace(/[^a-zA-Z0-9_-]/g, "_")
      .slice(0, 50);
    const publicId = `resume-${userId}-${Date.now()}-${safeName}.${ext}`;

    cloudinary.uploader.upload(
      dataUri,
      {
        folder,
        resource_type: "raw",
        public_id: publicId,
      },
      (error, result) => {
        if (error) return reject(error);
        return resolve(result);
      }
    );
  });

/**
 * Delete file from Cloudinary by public_id.
 */
const deleteFromCloudinary = (publicId, resourceType = "raw") =>
  new Promise((resolve, reject) => {
    cloudinary.uploader.destroy(publicId, { resource_type: resourceType }, (error, result) => {
      if (error) return reject(error);
      return resolve(result);
    });
  });

const ALLOWED_STRING_FIELDS = ["fullName", "headline", "about", "phone", "location", "website"];

const updateProfile = asyncHandler(async (req, res) => {
  const updates = {};

  for (const field of ALLOWED_STRING_FIELDS) {
    if (typeof req.body[field] === "string") updates[field] = req.body[field];
  }
  if (Array.isArray(req.body.skills)) updates.skills = req.body.skills;
  if (Array.isArray(req.body.experience)) updates.experience = req.body.experience;
  if (Array.isArray(req.body.projects)) updates.projects = req.body.projects;
  if (Array.isArray(req.body.education)) updates.education = req.body.education;

  const user = await User.findByIdAndUpdate(req.user.userId, updates, {
    returnDocument: "after",
    runValidators: true,
  }).select("-password -refreshToken");

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return res.status(200).json({
    success: true,
    message: "Profile updated",
    data: { user },
  });
});

const uploadProfileImage = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, "Image file is required");
  }

  const result = await uploadImageToCloudinary(req.file.buffer, "job-portal/profile-images");

  const user = await User.findByIdAndUpdate(
    req.user.userId,
    { profileImageUrl: result.secure_url },
    { returnDocument: "after", runValidators: true }
  ).select("-password -refreshToken");

  return res.status(200).json({
    success: true,
    message: "Profile image uploaded",
    data: { user },
  });
});

const uploadResume = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, "Resume file is required");
  }

  const userId = req.user.userId;
  const user = await User.findById(userId).select("resumePublicId");

  if (user?.resumePublicId) {
    try {
      await deleteFromCloudinary(user.resumePublicId);
    } catch (err) {
      // Log but don't fail - old file may already be deleted
      logger.warn("Could not delete old resume from Cloudinary", { error: err.message });
    }
  }

  const result = await uploadResumeToCloudinary({
    fileBuffer: req.file.buffer,
    folder: "job-portal/resumes",
    mimetype: req.file.mimetype,
    userId,
    originalName: req.file.originalname,
  });

  const resumeData = {
    resumeUrl: result.secure_url,
    resumePublicId: result.public_id,
    resumeFileName: req.file.originalname || `resume_${Date.now()}.pdf`,
    resumeSize: req.file.size,
    resumeUploadedAt: new Date(),
  };

  const updatedUser = await User.findByIdAndUpdate(
    userId,
    resumeData,
    { returnDocument: "after", runValidators: true }
  ).select("-password -refreshToken");

  return res.status(200).json({
    success: true,
    message: "Resume uploaded successfully",
    data: { user: updatedUser },
  });
});

const deleteResume = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const user = await User.findById(userId).select("resumePublicId resumeUrl");

  if (!user?.resumePublicId && !user?.resumeUrl) {
    throw new ApiError(404, "No resume found to delete");
  }

  if (user.resumePublicId) {
    try {
      await deleteFromCloudinary(user.resumePublicId);
    } catch (err) {
      logger.warn("Could not delete resume from Cloudinary", { error: err.message });
      // Still clear DB - file may have been manually deleted
    }
  }

  const updatedUser = await User.findByIdAndUpdate(
    userId,
    {
      resumeUrl: "",
      resumePublicId: "",
      resumeFileName: "",
      resumeSize: 0,
      resumeUploadedAt: null,
    },
    { returnDocument: "after" }
  ).select("-password -refreshToken");

  return res.status(200).json({
    success: true,
    message: "Resume deleted successfully",
    data: { user: updatedUser },
  });
});

const toggleSavedJob = asyncHandler(async (req, res) => {
  const { jobId } = req.params;
  const userId = req.user.userId;

  if (!mongoose.Types.ObjectId.isValid(jobId)) {
    throw new ApiError(400, "Invalid job ID");
  }

  const job = await Job.findById(jobId);
  if (!job || job.isActive === false) {
    throw new ApiError(404, "Job not found");
  }

  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, "User not found");

  const idx = user.savedJobs?.indexOf(jobId) ?? -1;
  if (idx >= 0) {
    user.savedJobs.splice(idx, 1);
    await user.save();
    return res.status(200).json({
      success: true,
      message: "Job removed from saved",
      data: { saved: false, savedJobs: user.savedJobs },
    });
  }

  user.savedJobs = user.savedJobs || [];
  user.savedJobs.push(jobId);
  await user.save();

  return res.status(200).json({
    success: true,
    message: "Job saved",
    data: { saved: true, savedJobs: user.savedJobs },
  });
});

const deleteAccount = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, "User not found");

  await User.findByIdAndDelete(userId);

  return res.status(200).json({
    success: true,
    message: "Account deleted successfully",
  });
});

const getSavedJobs = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.userId)
    .populate({
      path: "savedJobs",
      populate: { path: "company", select: "name" },
      match: { isActive: { $ne: false } },
    })
    .select("savedJobs");

  const jobs = user?.savedJobs?.filter(Boolean) || [];
  return res.status(200).json({
    success: true,
    data: { jobs },
  });
});

module.exports = {
  updateProfile,
  uploadProfileImage,
  uploadResume,
  deleteResume,
  toggleSavedJob,
  getSavedJobs,
  deleteAccount,
};
