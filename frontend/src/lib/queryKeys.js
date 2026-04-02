/**
 * Centralized query key factory — ensures consistent cache keys across all TanStack Query usage.
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
    /** Filters without `page` — for useInfiniteQuery */
    infiniteList: (filters) => ['jobs', 'list', 'infinite', filters],
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
    analyticsTrend: () => ['recruiter', 'analytics-trend'],
    /** @param {Record<string, string | undefined>} [filters] q, status, skill */
    jobApplications: (jobId, filters = {}) => ['recruiter', 'job-applications', jobId, filters],
    applicationDetail: (applicationId) => ['recruiter', 'application', applicationId],
    upcomingInterviews: () => ['recruiter', 'upcoming-interviews'],
  },

  /** Admin-specific */
  admin: {
    stats: () => ['admin', 'stats'],
    statsTrend: () => ['admin', 'stats-trend'],
    /** @param {number} [page]
     *  @param {string} [search] */
    users: (page, search) => {
      if (page == null && search == null) return ['admin', 'users']
      return ['admin', 'users', Number(page) || 1, search ?? '']
    },
    jobs: (page, search) => {
      if (page == null && search == null) return ['admin', 'jobs']
      return ['admin', 'jobs', Number(page) || 1, search ?? '']
    },
    companies: (page, search) => {
      if (page == null && search == null) return ['admin', 'companies']
      return ['admin', 'companies', Number(page) || 1, search ?? '']
    },
    applications: (page, status) => {
      if (page == null && status == null) return ['admin', 'applications']
      return ['admin', 'applications', Number(page) || 1, status ?? '']
    },
    auditLogs: (page, action, userId, dateFrom, dateTo) => {
      if (page == null && action == null && userId == null && dateFrom == null && dateTo == null) {
        return ['admin', 'audit-logs']
      }
      return ['admin', 'audit-logs', Number(page) || 1, action ?? '', userId ?? '', dateFrom ?? '', dateTo ?? '']
    },
  },

  /** Notifications - short stale for near real-time feel */
  notifications: {
    all: () => ['notifications'],
    /** @param {number} page */
    list: (page) => ['notifications', 'list', Number(page) || 1],
    /** TanStack useInfiniteQuery — single key for paged feed */
    infiniteList: () => ['notifications', 'list', 'infinite'],
    unreadCount: () => ['notifications', 'unreadCount'],
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
