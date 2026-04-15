import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
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
import { getStats, getStatsTrend } from '../../api/adminApi.js'
import { queryKeys } from '../../lib/queryKeys.js'
import { CACHE_TIERS } from '../../lib/queryOptions.js'
import { Card } from '../../components/ui/Card.jsx'
import { Skeleton } from '../../components/ui/Skeleton.jsx'
import { PageHeader } from '../../components/ui/PageHeader.jsx'
import { adminNav } from '../../lib/adminNav.js'

function formatStat(n) {
  if (n == null || Number.isNaN(Number(n))) return '—'
  return Number(n).toLocaleString()
}

function formatChartMonth(isoYm) {
  if (!isoYm || typeof isoYm !== 'string') return ''
  const [y, m] = isoYm.split('-')
  const d = new Date(Number(y), Number(m) - 1, 1)
  if (Number.isNaN(d.getTime())) return isoYm
  return d.toLocaleString(undefined, { month: 'short', year: '2-digit' })
}

function IconUsers({ className = 'h-6 w-6' }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z"
      />
    </svg>
  )
}

function IconBriefcase({ className = 'h-6 w-6' }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.184 2.675-.394.633-1.163 1.085-2.086 1.085H7.02c-.923 0-1.692-.452-2.086-1.085-.397-.639-1.184-1.581-1.184-2.675v-4.25m16.5 0a2.18 2.18 0 0 0 .75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 0 0-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0 1 12 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 0 1-.673-.38m0 0A2.18 2.18 0 0 1 3 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 0 1 3.413-.387m7.5 0V5.25A2.25 2.25 0 0 0 9 3h-.75a2.25 2.25 0 0 0-2.25 2.25v.894m7.5 0a48.667 48.667 0 0 0-7.5 0M12 12.75h.008v.008H12v-.008Z"
      />
    </svg>
  )
}

function IconBuilding({ className = 'h-6 w-6' }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Z"
      />
    </svg>
  )
}

function IconClipboard({ className = 'h-6 w-6' }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z"
      />
    </svg>
  )
}

function IconBolt({ className = 'h-6 w-6' }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" />
    </svg>
  )
}

function IconCalendar({ className = 'h-6 w-6' }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5a2.25 2.25 0 0 0 2.25-2.25m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5a2.25 2.25 0 0 1 2.25 2.25v7.5"
      />
    </svg>
  )
}

function IconChevron({ className = 'h-5 w-5' }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
    </svg>
  )
}

function StatCard({ icon, label, value }) {
  const IconGlyph = icon
  return (
    <Card padding="default" className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div className="rounded-lg bg-teal-50 p-2 text-teal-700 dark:bg-teal-950/50 dark:text-teal-300">
          <IconGlyph className="h-6 w-6" />
        </div>
      </div>
      <div>
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</p>
        <p className="mt-1 text-2xl font-bold tabular-nums text-gray-900 dark:text-white">{value}</p>
      </div>
    </Card>
  )
}

function StatsSkeletonGrid() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i} padding="default" className="space-y-3">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-8 w-20" />
        </Card>
      ))}
    </div>
  )
}

export function AdminDashboardPage() {
  const statsQuery = useQuery({
    queryKey: queryKeys.admin.stats(),
    queryFn: () => getStats(),
    staleTime: CACHE_TIERS.dashboard.staleTime,
    gcTime: CACHE_TIERS.dashboard.gcTime,
  })

  const trendQuery = useQuery({
    queryKey: queryKeys.admin.statsTrend(),
    queryFn: () => getStatsTrend(),
    staleTime: CACHE_TIERS.dashboard.staleTime,
    gcTime: CACHE_TIERS.dashboard.gcTime,
  })

  const stats = statsQuery.data || {}
  const showSkeleton = statsQuery.isPending
  const trendSeries = trendQuery.data?.series ?? []
  const chartData = trendSeries.map((s) => ({
    month: formatChartMonth(s.month),
    users: s.users,
    jobs: s.jobs,
  }))

  return (
    <section className="space-y-8">
      <PageHeader
        label="Administration"
        title="Admin Dashboard"
        description="Manage users, jobs, companies, applications, and audit activity from one place."
      />

      <div className="rounded-xl bg-teal-700 px-5 py-6 shadow-md sm:px-8 dark:bg-teal-800">
        <p className="text-xs font-semibold uppercase tracking-wide text-teal-200">At a glance</p>
        <p className="mt-1 text-sm text-teal-100">
          Totals reflect live data from the API. Use the sections below to drill into each area.
        </p>
      </div>

      {statsQuery.isError && (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          Could not load platform statistics. Refresh the page or try again later.
        </p>
      )}

      {showSkeleton ? (
        <StatsSkeletonGrid />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard icon={IconUsers} label="Total users" value={formatStat(stats.totalUsers)} />
          <StatCard icon={IconBriefcase} label="Total jobs" value={formatStat(stats.totalJobs)} />
          <StatCard icon={IconBuilding} label="Total companies" value={formatStat(stats.totalCompanies)} />
          <StatCard icon={IconClipboard} label="Total applications" value={formatStat(stats.totalApplications)} />
          <StatCard icon={IconBolt} label="Active jobs" value={formatStat(stats.activeJobs)} />
          <StatCard icon={IconCalendar} label="New users this month" value={formatStat(stats.newUsersThisMonth)} />
        </div>
      )}

      <Card padding="default" className="space-y-3">
        <div>
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">New users & jobs (6 months)</h2>
          <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">Monthly counts from the platform.</p>
        </div>
        {trendQuery.isError && (
          <p className="text-sm text-red-600 dark:text-red-400" role="alert">
            Could not load trend data.
          </p>
        )}
        {trendQuery.isPending ? (
          <Skeleton className="h-64 w-full rounded-lg" />
        ) : chartData.length > 0 ? (
          <div className="h-64 w-full min-h-[16rem]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} className="text-gray-500" />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} className="text-gray-500" />
                <Tooltip
                  contentStyle={{
                    borderRadius: '0.5rem',
                    border: '1px solid rgb(229 231 235)',
                    fontSize: '0.75rem',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '0.75rem' }} />
                <Line type="monotone" dataKey="users" name="Users" stroke="#4f46e5" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="jobs" name="Jobs" stroke="#059669" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400">No trend data yet.</p>
        )}
      </Card>

      <div className="space-y-4">
        <PageHeader title="Admin sections" description="Jump to a management area." />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {adminNav.map((item) => (
            <Link key={item.to} to={item.to} className="group block min-w-0">
              <Card
                as="article"
                hover
                padding="default"
                className="flex h-full items-center justify-between gap-3 ring-gray-100 dark:ring-gray-700"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 dark:text-white">{item.label}</p>
                  <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{item.description}</p>
                </div>
                <IconChevron className="h-5 w-5 shrink-0 text-gray-400 transition-transform group-hover:translate-x-0.5 dark:text-gray-500" />
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
