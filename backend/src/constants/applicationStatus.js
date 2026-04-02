/**
 * Recruiter pipeline — single source for enum + API validation.
 * Legacy DB value `shortlisted` is migrated to `screening` (see scripts/migrateApplicationStatuses.js).
 */
const APPLICATION_STATUSES = [
  "applied",
  "screening",
  "interview",
  "offer",
  "hired",
  "rejected",
];

const INTERVIEW_STATUSES = ["scheduled", "completed", "cancelled", "no_show"];

module.exports = {
  APPLICATION_STATUSES,
  INTERVIEW_STATUSES,
};
