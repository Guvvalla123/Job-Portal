/**
 * Enterprise-grade query key factory for React Query.
 *
 * WHY: Flat keys like ['me'] or ['jobs'] are fragile. A factory provides:
 * - Single source of truth for all keys
 * - Hierarchical invalidation (e.g. invalidate all user.* with one call)
 * - Type-safe, discoverable keys
 * - Easy to add user-scoping later if needed
 *
 * @see https://tanstack.com/query/latest/docs/framework/react/guides/query-keys
 */
export const queryKeys = {
  /** Auth & current user - cleared on logout */
  auth: {
    me: () => ['auth', 'me'],
    all: () => ['auth'],
  },

  /** Public job listings - safe to cache longer */
  jobs: {
    list: (filters) => ['jobs', 'list', filters],
    detail: (id) => ['jobs', 'detail', id],
    recommended: (limit = 6) => ['jobs', 'recommended', limit],
  },

  /** Public company data */
  companies: {
    list: (filters) => ['companies', 'list', filters],
    detail: (id) => ['companies', 'detail', id],
  },

  /** User-specific - requires auth, cleared on logout */
  user: {
    applications: () => ['user', 'applications'],
    savedJobs: () => ['user', 'saved-jobs'],
    jobAlerts: () => ['user', 'job-alerts'],
  },

  /** Recruiter-specific */
  recruiter: {
    companies: () => ['recruiter', 'companies'],
    jobs: () => ['recruiter', 'jobs'],
    analytics: () => ['recruiter', 'analytics'],
    jobApplications: (jobId) => ['recruiter', 'job-applications', jobId],
  },

  /** Admin-specific */
  admin: {
    stats: () => ['admin', 'stats'],
    users: (page) => (page != null ? ['admin', 'users', page] : ['admin', 'users']),
    jobs: (page) => (page != null ? ['admin', 'jobs', page] : ['admin', 'jobs']),
  },

  /** Notifications - short stale for near real-time feel */
  notifications: {
    all: () => ['notifications'],
  },
}

/**
 * Query keys that must be REMOVED (not just invalidated) on logout.
 * removeQueries wipes cache; invalidateQueries marks stale and refetches.
 * On logout we need wipe - User B must not see User A's cached data.
 */
export const userScopedQueryKeyPrefixes = [
  queryKeys.auth.all(),
  ['user'],
  ['recruiter'],
  ['admin'],
  queryKeys.notifications.all(),
]
