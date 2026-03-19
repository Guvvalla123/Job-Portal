import { apiClient } from '../api/apiClient.js'
import { queryKeys } from './queryKeys.js'
import { CACHE_TIERS } from './queryOptions.js'

/**
 * Prefetch dashboard data after login so the first paint has data ready.
 * WHY: Without prefetch, user lands on dashboard → loading spinners → then data.
 * With prefetch, data is often ready before navigation completes = instant feel.
 */
export async function prefetchDashboardForRole(queryClient, role) {
  const { auth, dashboard } = CACHE_TIERS

  if (role === 'candidate') {
    await Promise.allSettled([
      queryClient.prefetchQuery({
        queryKey: queryKeys.auth.me(),
        queryFn: async () => {
          const res = await apiClient.get('/auth/me')
          return res.data.data.user
        },
        staleTime: auth.staleTime,
        gcTime: auth.gcTime,
      }),
      queryClient.prefetchQuery({
        queryKey: queryKeys.user.applications(),
        queryFn: async () => {
          const res = await apiClient.get('/applications/me')
          return res.data.data.applications
        },
        staleTime: dashboard.staleTime,
        gcTime: dashboard.gcTime,
      }),
      queryClient.prefetchQuery({
        queryKey: queryKeys.jobs.recommended(6),
        queryFn: async () => {
          const res = await apiClient.get('/jobs', { params: { limit: 6 } })
          return res.data.data.jobs
        },
        staleTime: CACHE_TIERS.public.staleTime,
        gcTime: CACHE_TIERS.public.gcTime,
      }),
    ])
  }

  if (role === 'recruiter') {
    await Promise.allSettled([
      queryClient.prefetchQuery({
        queryKey: queryKeys.recruiter.companies(),
        queryFn: async () => {
          const res = await apiClient.get('/companies/me')
          return res.data.data.companies || []
        },
        staleTime: dashboard.staleTime,
        gcTime: dashboard.gcTime,
      }),
      queryClient.prefetchQuery({
        queryKey: queryKeys.recruiter.jobs(),
        queryFn: async () => {
          const res = await apiClient.get('/jobs/me')
          return res.data.data.jobs || []
        },
        staleTime: dashboard.staleTime,
        gcTime: dashboard.gcTime,
      }),
    ])
  }

  if (role === 'admin') {
    await queryClient.prefetchQuery({
      queryKey: queryKeys.admin.stats(),
      queryFn: async () => {
        const res = await apiClient.get('/admin/stats')
        return res.data.data
      },
      staleTime: dashboard.staleTime,
      gcTime: dashboard.gcTime,
    })
  }
}
