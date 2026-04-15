import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getApplications } from '../../api/adminApi.js'
import { queryKeys } from '../../lib/queryKeys.js'
import { CACHE_TIERS } from '../../lib/queryOptions.js'
import { PageHeader } from '../../components/ui/PageHeader.jsx'
import { Card } from '../../components/ui/Card.jsx'
import { Select } from '../../components/ui/Select.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { Badge } from '../../components/ui/Badge.jsx'
import { Skeleton } from '../../components/ui/Skeleton.jsx'
import { EmptyState, EmptyStateIcons } from '../../components/ui/EmptyState.jsx'
import { PIPELINE_STATUSES, STATUS_LABELS } from '../../features/recruiter/applicationPipeline.js'

const LIMIT = 20

function statusBadgeVariant(status) {
  if (status === 'hired') return 'success'
  if (status === 'rejected') return 'danger'
  if (status === 'interview') return 'primary'
  if (status === 'offer') return 'info'
  if (status === 'screening') return 'warning'
  return 'default'
}

export function AdminApplicationsPage() {
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')

  useEffect(() => {
    setPage(1)
  }, [statusFilter])

  const applicationsQuery = useQuery({
    queryKey: queryKeys.admin.applications(page, statusFilter),
    queryFn: () => getApplications(page, LIMIT, statusFilter),
    staleTime: CACHE_TIERS.dashboard.staleTime,
    gcTime: CACHE_TIERS.dashboard.gcTime,
  })

  const { applications = [], pagination = {} } = applicationsQuery.data || {}

  const statusOptions = [
    { value: '', label: 'All statuses' },
    ...PIPELINE_STATUSES.map((s) => ({ value: s, label: STATUS_LABELS[s] || s })),
  ]

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
          title="Applications"
          description="Review candidate applications across all jobs. Filter by pipeline status."
        />
      </div>

      <Card padding="default">
        <Select
          id="admin-app-status"
          label="Status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          options={statusOptions}
          placeholder=""
          containerClassName="max-w-xs"
        />
      </Card>

      {applicationsQuery.isError && (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          Could not load applications.
        </p>
      )}

      {applicationsQuery.isPending ? (
        <Card padding="default">
          <div className="space-y-3">
            <Skeleton className="h-10 w-full" />
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </Card>
      ) : applications.length === 0 ? (
        <Card padding="none">
          <EmptyState
            icon={EmptyStateIcons.applications}
            title="No applications"
            description={
              statusFilter
                ? 'No applications match this status. Try another filter.'
                : 'No applications have been submitted yet.'
            }
          />
        </Card>
      ) : (
        <Card padding="default" className="overflow-hidden p-0 sm:p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/80 text-xs uppercase tracking-wide text-gray-500 dark:border-gray-700 dark:bg-gray-800/50 dark:text-gray-400">
                  <th className="px-4 py-3 font-semibold">Candidate</th>
                  <th className="px-4 py-3 font-semibold">Job</th>
                  <th className="px-4 py-3 font-semibold">Company</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Applied</th>
                  <th className="px-4 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((app) => {
                  const jobId = app.job?._id || app.job
                  return (
                    <tr
                      key={app._id}
                      className="border-b border-gray-100 transition-colors hover:bg-gray-50/80 dark:border-gray-800 dark:hover:bg-gray-800/40"
                    >
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900 dark:text-white">
                          {app.candidate?.fullName || '—'}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{app.candidate?.email || ''}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-800 dark:text-gray-200">
                        {jobId ? (
                          <Link
                            to={`/jobs/${jobId}`}
                            className="font-medium text-teal-700 hover:text-teal-800 dark:text-teal-400"
                          >
                            {app.job?.title || 'Job'}
                          </Link>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                        {app.job?.company?.name || '—'}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={statusBadgeVariant(app.status)} size="sm">
                          {STATUS_LABELS[app.status] || app.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                        {app.createdAt ? new Date(app.createdAt).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-4 py-3">
                        {jobId ? (
                          <Link
                            to={`/jobs/${jobId}`}
                            className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700"
                          >
                            View job
                          </Link>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {!applicationsQuery.isPending && pagination.totalPages > 1 && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Page {pagination.page} of {pagination.totalPages} ({pagination.total} applications)
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={page >= pagination.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </section>
  )
}
