import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { deleteCompany, getCompanies } from '../../api/adminApi.js'
import { queryKeys } from '../../lib/queryKeys.js'
import { CACHE_TIERS } from '../../lib/queryOptions.js'
import { useDebouncedValue } from '../../hooks/useDebouncedValue.js'
import { getApiErrorMessage } from '../../utils/getApiErrorMessage.js'
import { toast } from 'sonner'
import { PageHeader } from '../../components/ui/PageHeader.jsx'
import { Card } from '../../components/ui/Card.jsx'
import { Input } from '../../components/ui/Input.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { Modal } from '../../components/ui/Modal.jsx'
import { Skeleton } from '../../components/ui/Skeleton.jsx'
import { EmptyState, EmptyStateIcons } from '../../components/ui/EmptyState.jsx'

const LIMIT = 15

export function AdminCompaniesPage() {
  const [page, setPage] = useState(1)
  const [searchInput, setSearchInput] = useState('')
  const debouncedSearch = useDebouncedValue(searchInput, 360)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const queryClient = useQueryClient()

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch])

  const companiesQuery = useQuery({
    queryKey: queryKeys.admin.companies(page, debouncedSearch),
    queryFn: () => getCompanies(page, LIMIT, debouncedSearch),
    staleTime: CACHE_TIERS.dashboard.staleTime,
    gcTime: CACHE_TIERS.dashboard.gcTime,
  })

  const deleteMutation = useMutation({
    mutationFn: (companyId) => deleteCompany(companyId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'companies'] })
      await queryClient.invalidateQueries({ queryKey: ['admin', 'jobs'] })
      await queryClient.invalidateQueries({ queryKey: queryKeys.admin.stats() })
      await queryClient.invalidateQueries({ queryKey: ['companies'] })
      toast.success('Company deleted.')
      setDeleteTarget(null)
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Could not delete company.')),
  })

  const { companies = [], pagination = {} } = companiesQuery.data || {}

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
          title="Companies"
          description="Search organizations, review job counts, and remove companies that have no active jobs."
        />
      </div>

      <Card padding="default">
        <Input
          type="search"
          placeholder="Search by company name…"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          icon={<EmptyStateIcons.search className="h-5 w-5 text-gray-400" />}
          containerClassName="max-w-md"
          aria-label="Search companies"
        />
      </Card>

      {companiesQuery.isError && (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          Could not load companies.
        </p>
      )}

      {companiesQuery.isPending ? (
        <Card padding="default">
          <div className="space-y-3">
            <Skeleton className="h-10 w-full" />
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        </Card>
      ) : companies.length === 0 ? (
        <Card padding="none">
          <EmptyState
            icon={EmptyStateIcons.jobs}
            title="No companies found"
            description={
              debouncedSearch.trim()
                ? 'Try a different search term.'
                : 'No companies match the current filters.'
            }
          />
        </Card>
      ) : (
        <Card padding="default" className="overflow-hidden p-0 sm:p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/80 text-xs uppercase tracking-wide text-gray-500 dark:border-gray-700 dark:bg-gray-800/50 dark:text-gray-400">
                  <th className="px-4 py-3 font-semibold">Logo</th>
                  <th className="px-4 py-3 font-semibold">Name</th>
                  <th className="px-4 py-3 font-semibold">Jobs</th>
                  <th className="px-4 py-3 font-semibold">Recruiter</th>
                  <th className="px-4 py-3 font-semibold">Created</th>
                  <th className="px-4 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {companies.map((c) => (
                  <tr
                    key={c._id}
                    className="border-b border-gray-100 transition-colors hover:bg-gray-50/80 dark:border-gray-800 dark:hover:bg-gray-800/40"
                  >
                    <td className="px-4 py-3">
                      {c.logoUrl ? (
                        <img
                          src={c.logoUrl}
                          alt=""
                          className="h-10 w-10 rounded-lg object-cover ring-1 ring-gray-200 dark:ring-gray-600"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-xs font-semibold text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                          {c.name?.slice(0, 2).toUpperCase() || '—'}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                      <Link
                        to={`/companies/${c._id}`}
                        className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
                      >
                        {c.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 tabular-nums text-gray-700 dark:text-gray-200">{c.jobsCount ?? 0}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                      <div className="max-w-48">
                        <p className="truncate font-medium text-gray-900 dark:text-white">
                          {c.recruiter?.fullName || '—'}
                        </p>
                        <p className="truncate text-xs text-gray-500 dark:text-gray-400">{c.recruiter?.email || ''}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                      {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        type="button"
                        variant="danger"
                        size="sm"
                        disabled={deleteMutation.isPending}
                        onClick={() => setDeleteTarget(c)}
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {!companiesQuery.isPending && pagination.totalPages > 1 && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Page {pagination.page} of {pagination.totalPages} ({pagination.total} companies)
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={page <= 1 || deleteMutation.isPending}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={page >= pagination.totalPages || deleteMutation.isPending}
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
        title="Delete company"
        size="md"
      >
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Delete <strong className="text-gray-900 dark:text-white">{deleteTarget?.name}</strong>? You can only
          remove companies that have no jobs. This cannot be undone.
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
            Delete company
          </Button>
        </div>
      </Modal>
    </section>
  )
}
