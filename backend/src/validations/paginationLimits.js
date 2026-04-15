/**
 * Central caps for paginated list queries (Zod .max()).
 * Documented in docs/api/API_CONTRACT.md — change both code and doc together.
 */
module.exports = {
  /** Public job search (GET /api/v1/jobs) */
  JOBS_LIST_MAX: 50,
  /** Candidate "my applications" and similar large lists */
  APPLICATIONS_LIST_MAX: 100,
};
