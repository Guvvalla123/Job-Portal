import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getJobReports } from '../../api/adminApi.js'
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
  { value: 'pending', label: 'Pending' },
  { value: 'reviewed', label: 'Reviewed' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'dismissed', label: 'Dismissed' },
]

function statusVariant(status) {
  if (status === 'pending') return 'warning'
  if (status === 'resolved') return 'success'
  if (status === 'dismissed') return 'default'
  if (status === 'reviewed') return 'info'
  return 'default'
}

export function AdminJobReportsPage() {
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')

  useEffect(() => {
    setPage(1)
  }, [statusFilter])

  const query = useQuery({
    queryKey: queryKeys.admin.jobReports(page, statusFilter),
    queryFn: () => getJobReports({ page, limit: LIMIT, status: statusFilter }),
    staleTime: CACHE_TIERS.dashboard.staleTime,
    gcTime: CACHE_TIERS.dashboard.gcTime,
  })

  const { reports = [], pagination = {} } = query.data || {}
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
          title="Job reports"
          description="Review jobs reported by candidates and moderators."
        />
      </div>

      <Card padding="default">
        <Select
          id="admin-report-status"
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
          Could not load job reports.
        </p>
      )}

      {query.isPending ? (
        <Card padding="default">
          <Skeleton className="h-40 w-full rounded-lg" />
        </Card>
      ) : reports.length === 0 ? (
        <EmptyState
          icon={EmptyStateIcons.jobs}
          title="No reports"
          description="There are no job reports for this filter."
        />
      ) : (
        <Card padding="none" className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800/80">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-white">Job</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-white">Reason</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-white">Status</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-white">Reported</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {reports.map((r) => {
                  const job = r.job
                  const title = job?.title || '—'
                  return (
                    <tr key={r._id || r.id} className="bg-white dark:bg-gray-900/40">
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">{title}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{r.reason || '—'}</td>
                      <td className="px-4 py-3">
                        <Badge variant={statusVariant(r.status)}>{r.status || '—'}</Badge>
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                        {r.createdAt ? new Date(r.createdAt).toLocaleString() : '—'}
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
