import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { deleteJob, getJobs, updateJobStatus } from '../../api/adminApi.js'
import { queryKeys } from '../../lib/queryKeys.js'
import { CACHE_TIERS } from '../../lib/queryOptions.js'
import { useDebouncedValue } from '../../hooks/useDebouncedValue.js'
import { getApiErrorMessage } from '../../utils/getApiErrorMessage.js'
import { toast } from 'sonner'
import { PageHeader } from '../../components/ui/PageHeader.jsx'
import { Card } from '../../components/ui/Card.jsx'
import { Input } from '../../components/ui/Input.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { Badge } from '../../components/ui/Badge.jsx'
import { Modal } from '../../components/ui/Modal.jsx'
import { Skeleton } from '../../components/ui/Skeleton.jsx'
import { EmptyState, EmptyStateIcons } from '../../components/ui/EmptyState.jsx'

const LIMIT = 15

function isJobActive(job) {
  return job.isActive !== false
}

export function AdminJobsPage() {
  const [page, setPage] = useState(1)
  const [searchInput, setSearchInput] = useState('')
  const debouncedSearch = useDebouncedValue(searchInput, 360)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const queryClient = useQueryClient()

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch])

  const jobsQuery = useQuery({
    queryKey: queryKeys.admin.jobs(page, debouncedSearch),
    queryFn: () => getJobs(page, LIMIT, debouncedSearch),
    staleTime: CACHE_TIERS.dashboard.staleTime,
    gcTime: CACHE_TIERS.dashboard.gcTime,
  })

  const statusMutation = useMutation({
    mutationFn: ({ jobId, isActive }) => updateJobStatus(jobId, isActive),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'jobs'] })
      await queryClient.invalidateQueries({ queryKey: queryKeys.admin.stats() })
      toast.success('Job status updated.')
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Could not update job status.')),
  })

  const deleteMutation = useMutation({
    mutationFn: (jobId) => deleteJob(jobId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'jobs'] })
      await queryClient.invalidateQueries({ queryKey: queryKeys.admin.stats() })
      toast.success('Job deactivated.')
      setDeleteTarget(null)
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Could not deactivate job.')),
  })

  const { jobs = [], pagination = {} } = jobsQuery.data || {}
  const busy = statusMutation.isPending || deleteMutation.isPending

  return (
    <section className="space-y-6">
      <div className="min-w-0">
        <Link
          to="/admin/dashboard"
          className="text-sm font-medium text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
        >
          ← Admin overview
        </Link>
        <PageHeader
          className="mt-2"
          title="Jobs"
          description="Search by title, toggle whether a job is live, or deactivate listings."
        />
      </div>

      <Card padding="default">
        <Input
          type="search"
          placeholder="Search by job title…"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          icon={<EmptyStateIcons.search className="h-5 w-5 text-gray-400" />}
          containerClassName="max-w-md"
          aria-label="Search jobs"
        />
      </Card>

      {jobsQuery.isError && (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          Could not load jobs.
        </p>
      )}

      {jobsQuery.isPending ? (
        <Card padding="default">
          <div className="space-y-3">
            <Skeleton className="h-10 w-full" />
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </Card>
      ) : jobs.length === 0 ? (
        <Card padding="none">
          <EmptyState
            icon={EmptyStateIcons.jobs}
            title="No jobs found"
            description={
              debouncedSearch.trim()
                ? 'Try a different search term.'
                : 'No jobs match the current filters.'
            }
          />
        </Card>
      ) : (
        <Card padding="default" className="overflow-hidden p-0 sm:p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/80 text-xs uppercase tracking-wide text-gray-500 dark:border-gray-700 dark:bg-gray-800/50 dark:text-gray-400">
                  <th className="px-4 py-3 font-semibold">Title</th>
                  <th className="px-4 py-3 font-semibold">Company</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Applications</th>
                  <th className="px-4 py-3 font-semibold">Posted</th>
                  <th className="px-4 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => {
                  const active = isJobActive(job)
                  return (
                    <tr
                      key={job._id}
                      className="border-b border-gray-100 transition-colors hover:bg-gray-50/80 dark:border-gray-800 dark:hover:bg-gray-800/40"
                    >
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                        <Link
                          to={`/jobs/${job._id}`}
                          className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
                        >
                          {job.title}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                        {job.company?.name || '—'}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={active ? 'success' : 'danger'} size="sm">
                          {active ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 tabular-nums text-gray-700 dark:text-gray-200">
                        {job.applicationCount ?? 0}
                      </td>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                        {job.createdAt ? new Date(job.createdAt).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            disabled={busy}
                            onClick={() =>
                              statusMutation.mutate({ jobId: job._id, isActive: !active })
                            }
                          >
                            {active ? 'Deactivate' : 'Activate'}
                          </Button>
                          <Button
                            type="button"
                            variant="danger"
                            size="sm"
                            disabled={busy || !active}
                            onClick={() => setDeleteTarget(job)}
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {!jobsQuery.isPending && pagination.totalPages > 1 && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Page {pagination.page} of {pagination.totalPages} ({pagination.total} jobs)
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={page <= 1 || busy}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={page >= pagination.totalPages || busy}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      <Modal
        open={Boolean(deleteTarget)}
        onClose={() => !deleteMutation.isPending && setDeleteTarget(null)}
        title="Deactivate job"
        size="md"
      >
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Deactivate <strong className="text-gray-900 dark:text-white">{deleteTarget?.title}</strong>? It will
          no longer appear in public listings. Applications are kept.
        </p>
        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <Button
            type="button"
            variant="secondary"
            disabled={deleteMutation.isPending}
            onClick={() => setDeleteTarget(null)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="danger"
            loading={deleteMutation.isPending}
            onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget._id)}
          >
            Deactivate job
          </Button>
        </div>
      </Modal>
    </section>
  )
}
