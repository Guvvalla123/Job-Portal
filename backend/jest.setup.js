/**
 * Jest setup - runs before tests. Sets env vars so config/env.js validates.
 * Use .env.test for local overrides (e.g. real test DB).
 */
process.env.NODE_ENV = "test";
process.env.PORT = "5000";
process.env.CLIENT_URL = "http://localhost:5173";
process.env.MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/job_portal_test";
process.env.JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || "test_access_secret_32chars_minimum_required!!";
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "test_refresh_secret_32chars_minimum_required!!";
process.env.CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || "test_cloud";
process.env.CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY || "test_key";
process.env.CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET || "test_secret";
