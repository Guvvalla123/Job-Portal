import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getSubscriptions } from '../../api/adminApi.js'
import { queryKeys } from '../../lib/queryKeys.js'
import { CACHE_TIERS } from '../../lib/queryOptions.js'
import { PageHeader } from '../../components/ui/PageHeader.jsx'
import { Card } from '../../components/ui/Card.jsx'
import { Select } from '../../components/ui/Select.jsx'
import { Badge } from '../../components/ui/Badge.jsx'
import { Skeleton } from '../../components/ui/Skeleton.jsx'
import { EmptyState, EmptyStateIcons } from '../../components/ui/EmptyState.jsx'
import { Button } from '../../components/ui/Button.jsx'

const LIMIT = 20

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'active', label: 'Active' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'expired', label: 'Expired' },
  { value: 'trial', label: 'Trial' },
]

function statusVariant(status) {
  if (status === 'active') return 'success'
  if (status === 'cancelled') return 'danger'
  if (status === 'expired') return 'warning'
  if (status === 'trial') return 'info'
  return 'default'
}

export function AdminSubscriptionsPage() {
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')

  useEffect(() => {
    setPage(1)
  }, [statusFilter])

  const query = useQuery({
    queryKey: queryKeys.admin.subscriptions(page, statusFilter),
    queryFn: () => getSubscriptions(page, LIMIT, statusFilter),
    staleTime: CACHE_TIERS.dashboard.staleTime,
    gcTime: CACHE_TIERS.dashboard.gcTime,
  })

  const { subscriptions = [], pagination = {} } = query.data || {}
  const { totalPages = 0 } = pagination

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
          title="Subscriptions"
          description="Manage premium subscriptions and billing-related records."
        />
      </div>

      <Card padding="default">
        <Select
          id="admin-sub-status"
          label="Status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          options={STATUS_OPTIONS}
          placeholder=""
          containerClassName="max-w-xs"
        />
      </Card>

      {query.isError && (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          Could not load subscriptions.
        </p>
      )}

      {query.isPending ? (
        <Card padding="default">
          <Skeleton className="h-40 w-full rounded-lg" />
        </Card>
      ) : subscriptions.length === 0 ? (
        <EmptyState
          icon={EmptyStateIcons.applications}
          title="No subscriptions"
          description="There are no subscription records for this filter."
        />
      ) : (
        <Card padding="none" className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800/80">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-white">User</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-white">Status</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-white">Period end</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {subscriptions.map((sub) => {
                  const u = sub.user
                  const name = u?.fullName || u?.email || '—'
                  const email = u?.email && u?.fullName ? u.email : null
                  return (
                    <tr key={sub._id || sub.id} className="bg-white dark:bg-gray-900/40">
                      <td className="px-4 py-3 text-gray-900 dark:text-gray-100">
                        <span className="font-medium">{name}</span>
                        {email ? <span className="mt-0.5 block text-xs text-gray-500 dark:text-gray-400">{email}</span> : null}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={statusVariant(sub.status)}>{sub.status || '—'}</Badge>
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                        {sub.currentPeriodEnd
                          ? new Date(sub.currentPeriodEnd).toLocaleDateString()
                          : '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {!query.isPending && totalPages > 1 ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Page {pagination.page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      ) : null}
    </section>
  )
}
