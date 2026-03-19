/**
 * Cache strategy tiers for React Query.
 *
 * WHY different staleTime/gcTime per tier:
 * - Public data (jobs, companies): Changes infrequently, safe to cache 5min
 * - User profile (me): Moderate change rate, 2min keeps UI snappy
 * - User activity (applications, saved): Changes on user action, 1min
 * - Notifications: Near real-time feel, 30s
 * - Admin data: Sensitive, shorter cache
 *
 * gcTime (formerly cacheTime): How long inactive cache stays in memory.
 * Shorter for user data = less risk of leaking across sessions.
 */
export const CACHE_TIERS = {
  /** Public listings - jobs, companies. Safe to cache long. */
  public: {
    staleTime: 5 * 60 * 1000,      // 5 min
    gcTime: 30 * 60 * 1000,        // 30 min
  },

  /** Current user profile - /auth/me */
  auth: {
    staleTime: 2 * 60 * 1000,      // 2 min
    gcTime: 10 * 60 * 1000,        // 10 min
  },

  /** User activity - applications, saved jobs, alerts */
  userActivity: {
    staleTime: 1 * 60 * 1000,     // 1 min
    gcTime: 5 * 60 * 1000,         // 5 min
  },

  /** Notifications - near real-time */
  notifications: {
    staleTime: 30 * 1000,          // 30 sec
    gcTime: 2 * 60 * 1000,         // 2 min
  },

  /** Recruiter/Admin - moderate freshness */
  dashboard: {
    staleTime: 1 * 60 * 1000,      // 1 min
    gcTime: 5 * 60 * 1000,         // 5 min
  },

  /** Entity detail - job/company by ID. Cached while viewing. */
  detail: {
    staleTime: 3 * 60 * 1000,      // 3 min
    gcTime: 15 * 60 * 1000,        // 15 min
  },
}
