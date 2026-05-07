import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getRevenueStats } from '../../api/adminApi.js'
import { queryKeys } from '../../lib/queryKeys.js'
import { CACHE_TIERS } from '../../lib/queryOptions.js'
import { PageHeader } from '../../components/ui/PageHeader.jsx'
import { Card } from '../../components/ui/Card.jsx'
import { Skeleton } from '../../components/ui/Skeleton.jsx'

function formatStat(n) {
  if (n == null || Number.isNaN(Number(n))) return '—'
  return Number(n).toLocaleString()
}

function formatINR(n) {
  if (n == null || Number.isNaN(Number(n))) return '—'
  const num = Number(n)
  return `Rs ${num.toLocaleString('en-IN', {
    minimumFractionDigits: Number.isInteger(num) ? 0 : 2,
    maximumFractionDigits: 2,
  })}`
}

export function AdminRevenuePage() {
  const query = useQuery({
    queryKey: queryKeys.admin.revenueStats(),
    queryFn: () => getRevenueStats(),
    staleTime: CACHE_TIERS.dashboard.staleTime,
    gcTime: CACHE_TIERS.dashboard.gcTime,
  })

  const d = query.data

  return (
    <section className="space-y-6">
      <div className="min-w-0">
        <Link
          to="/admin/dashboard"
          className="text-sm font-medium text-teal-700 hover:text-teal-800 dark:text-teal-400 dark:hover:text-teal-300"
        >
          ← Admin overview
        </Link>
        <PageHeader
          className="mt-2"
          title="Revenue"
          description="Payment and subscription revenue aggregates."
        />
      </div>

      {query.isError && (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          Could not load revenue stats.
        </p>
      )}

      {query.isPending ? (
        <Card padding="default">
          <Skeleton className="h-32 w-full rounded-lg" />
        </Card>
      ) : d ? (
        <Card padding="default" className="space-y-4">
          <h2 className="text-base font-semibold text-teal-700 dark:text-teal-300">Summary</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Total revenue (all time)
              </p>
              <p className="mt-1 text-lg font-semibold tabular-nums text-gray-900 dark:text-white">
                {formatINR(d.totalRevenueINR ?? 0)}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                This month
              </p>
              <p className="mt-1 text-lg font-semibold tabular-nums text-gray-900 dark:text-white">
                {formatINR(d.revenueThisMonthINR ?? 0)}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Premium users (active)
              </p>
              <p className="mt-1 text-lg font-semibold tabular-nums text-gray-900 dark:text-white">
                {formatStat(d.totalPremiumUsers ?? 0)}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Active subscriptions
              </p>
              <p className="mt-1 text-lg font-semibold tabular-nums text-gray-900 dark:text-white">
                {formatStat(d.activeSubscriptions ?? 0)}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Cancelled this month
              </p>
              <p className="mt-1 text-lg font-semibold tabular-nums text-gray-900 dark:text-white">
                {formatStat(d.cancelledThisMonth ?? 0)}
              </p>
            </div>
          </div>
        </Card>
      ) : null}
    </section>
  )
}
