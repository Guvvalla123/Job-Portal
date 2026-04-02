import { Link } from 'react-router-dom'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'
import { listUpcomingInterviews } from '../../api/applicationsApi.js'
import { getRecruiterAnalytics, getRecruiterApplicationTrend } from '../../api/jobsApi.js'
import { queryKeys } from '../../lib/queryKeys.js'
import { CACHE_TIERS } from '../../lib/queryOptions.js'
import { PipelineFunnelStrip, formatChartMonth } from '../../features/recruiter/PipelineFunnelStrip.jsx'

export function RecruiterOverviewPage() {
  const analyticsQuery = useQuery({
    queryKey: queryKeys.recruiter.analytics(),
    queryFn: () => getRecruiterAnalytics(),
  })

  const analyticsTrendQuery = useQuery({
    queryKey: queryKeys.recruiter.analyticsTrend(),
    queryFn: () => getRecruiterApplicationTrend(6),
    staleTime: CACHE_TIERS.dashboard.staleTime,
    gcTime: CACHE_TIERS.dashboard.gcTime,
  })

  const upcomingInterviewsQuery = useQuery({
    queryKey: queryKeys.recruiter.upcomingInterviews(),
    queryFn: async () => {
      const d = await listUpcomingInterviews()
      return d.interviews ?? []
    },
    placeholderData: keepPreviousData,
  })

  const analytics = analyticsQuery.data || {}
  const byStatus = analytics.byStatus || {}
  const activePipeline =
    (byStatus.screening || 0) + (byStatus.interview || 0) + (byStatus.offer || 0)
  const upcoming = upcomingInterviewsQuery.data || []
  const trendSeries = analyticsTrendQuery.data?.series ?? []
  const recruiterChartData = trendSeries.map((s) => ({
    month: formatChartMonth(s.month),
    applications: s.applications,
    hired: s.hired,
  }))

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-linear-to-br from-indigo-600 to-indigo-800 px-6 py-8 shadow-lg sm:px-8">
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Overview</h1>
        <p className="mt-2 max-w-2xl text-sm text-indigo-100 sm:text-base">
          Hiring health at a glance — volume, pipeline mix, and what&apos;s next on your calendar.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-950/80 dark:text-indigo-300">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.193 23.193 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total jobs</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{analytics.totalJobs ?? '—'}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-950/80 dark:text-indigo-300">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Applications</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{analytics.totalApplications ?? '—'}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Active pipeline</p>
              <p className="text-2xl font-bold text-violet-700 dark:text-violet-300">{activePipeline || '—'}</p>
              <p className="text-[10px] text-gray-400 dark:text-gray-500">Screening + interview + offer</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Hired</p>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{analytics.byStatus?.hired ?? '—'}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">Applications over time</h2>
        <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
          Monthly new applications and hires on your jobs (6 months).
        </p>
        {analyticsTrendQuery.isError && (
          <p className="mt-4 text-sm text-red-600 dark:text-red-400" role="alert">
            Could not load application trend.
          </p>
        )}
        {analyticsTrendQuery.isPending ? (
          <div className="mt-4 h-56 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />
        ) : recruiterChartData.length > 0 ? (
          <div className="mt-4 h-56 w-full min-h-[14rem]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={recruiterChartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="#9ca3af" />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="#9ca3af" />
                <Tooltip
                  contentStyle={{
                    borderRadius: '0.5rem',
                    border: '1px solid rgb(229 231 235)',
                    fontSize: '0.75rem',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '0.75rem' }} />
                <Line type="monotone" dataKey="applications" name="Applications" stroke="#4f46e5" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="hired" name="Hired" stroke="#059669" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">Post a job to start seeing application trends.</p>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">Pipeline mix</h2>
          <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
            Share of applicants by stage (bar excludes rejected).
          </p>
          <div className="mt-4">
            <PipelineFunnelStrip byStatus={byStatus} />
          </div>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">Upcoming interviews</h2>
              <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">Next on your calendar</p>
            </div>
            <Link
              to="/recruiter/interviews"
              className="text-sm font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
            >
              View all →
            </Link>
          </div>
          {upcomingInterviewsQuery.isLoading && <p className="mt-4 text-sm text-gray-400">Loading…</p>}
          {upcomingInterviewsQuery.isError && (
            <p className="mt-4 text-sm text-red-600 dark:text-red-400">Could not load interviews.</p>
          )}
          {!upcomingInterviewsQuery.isLoading && !upcomingInterviewsQuery.isError && upcoming.length === 0 && (
            <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">No upcoming interviews. Schedule from the Jobs page.</p>
          )}
          <ul className="mt-3 max-h-56 space-y-2 overflow-y-auto text-sm">
            {upcoming.slice(0, 5).map((row) => (
              <li
                key={row._id}
                className="rounded-xl border border-indigo-100 bg-indigo-50/50 px-3 py-2.5 dark:border-indigo-900/50 dark:bg-indigo-950/30"
              >
                <p className="font-medium text-gray-900 dark:text-white">{row.job?.title || 'Job'}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">{row.candidate?.fullName || 'Candidate'}</p>
                <p className="text-xs font-medium text-indigo-700 dark:text-indigo-300">
                  {row.interview?.scheduledAt
                    ? new Date(row.interview.scheduledAt).toLocaleString(undefined, {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })
                    : '—'}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 rounded-xl border border-dashed border-indigo-200 bg-indigo-50/50 px-4 py-4 dark:border-indigo-900/60 dark:bg-indigo-950/20">
        <Link
          to="/recruiter/jobs"
          className="inline-flex items-center rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
        >
          Manage jobs & applicants
        </Link>
        <Link
          to="/recruiter/companies"
          className="inline-flex items-center rounded-lg border border-indigo-200 bg-white px-4 py-2.5 text-sm font-semibold text-indigo-800 hover:bg-indigo-50 dark:border-indigo-800 dark:bg-gray-900 dark:text-indigo-200 dark:hover:bg-indigo-950/40"
        >
          Company profiles
        </Link>
      </div>
    </div>
  )
}
