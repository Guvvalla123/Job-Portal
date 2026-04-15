/**
 * Centralized multer configs: strict MIME + size limits for production use.
 * — Images (profile, company logo): JPEG / PNG / WebP only, max 2MB.
 * — Resume: PDF only, max 5MB.
 */
const multer = require("multer");
const { ApiError } = require("../utils/apiError");

const IMAGE_MIMES = ["image/jpeg", "image/png", "image/webp"];
const IMAGE_MAX_BYTES = 2 * 1024 * 1024;
const PDF_MAX_BYTES = 5 * 1024 * 1024;

const imageFileFilter = (_req, file, cb) => {
  if (IMAGE_MIMES.includes(file.mimetype)) {
    return cb(null, true);
  }
  return cb(
    new ApiError(
      415,
      "Only JPEG, PNG, and WebP images are allowed.",
      [],
      "UNSUPPORTED_MEDIA_TYPE",
    ),
  );
};

const pdfFileFilter = (_req, file, cb) => {
  if (file.mimetype === "application/pdf") {
    return cb(null, true);
  }
  return cb(new ApiError(415, "Only PDF files are allowed.", [], "UNSUPPORTED_MEDIA_TYPE"));
};

const imageMulter = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: IMAGE_MAX_BYTES, files: 1 },
  fileFilter: imageFileFilter,
});

const pdfMulter = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: PDF_MAX_BYTES, files: 1 },
  fileFilter: pdfFileFilter,
});

/**
 * Express middleware: single image field (default "image" — profile photo).
 */
function singleImage(fieldName = "image") {
  return (req, res, next) => {
    imageMulter.single(fieldName)(req, res, (err) => {
      if (!err) return next();
      return handleMulterError(err, next);
    });
  };
}

/**
 * Express middleware: single PDF field (default "resume").
 */
function singlePdf(fieldName = "resume") {
  return (req, res, next) => {
    pdfMulter.single(fieldName)(req, res, (err) => {
      if (!err) return next();
      return handleMulterError(err, next);
    });
  };
}

function handleMulterError(err, next) {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return next(
        new ApiError(
          400,
          "File is too large. Images must be at most 2MB; PDF resumes at most 5MB.",
          [{ field: err.field || "file", message: err.message }],
          "UPLOAD_TOO_LARGE",
        ),
      );
    }
    if (err.code === "LIMIT_UNEXPECTED_FILE") {
      return next(
        new ApiError(
          400,
          "Unexpected file field. Use the correct field name for this upload.",
          [{ field: err.field || "file", message: err.message }],
          "UPLOAD_ERROR",
        ),
      );
    }
    return next(
      new ApiError(400, err.message || "Upload failed.", [{ field: err.field || "file", message: err.message }], "UPLOAD_ERROR"),
    );
  }
  return next(err);
}

module.exports = {
  singleImage,
  singlePdf,
  handleMulterError,
  IMAGE_MAX_BYTES,
  PDF_MAX_BYTES,
  IMAGE_MIMES,
};
