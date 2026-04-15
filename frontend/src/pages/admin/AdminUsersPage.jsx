import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  deleteUser,
  getUsers,
  toggleUserStatus,
  updateUserRole,
} from '../../api/adminApi.js'
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

const ROLE_OPTIONS = [
  { value: 'candidate', label: 'Candidate' },
  { value: 'recruiter', label: 'Recruiter' },
  { value: 'admin', label: 'Admin' },
]

export function AdminUsersPage() {
  const [page, setPage] = useState(1)
  const [searchInput, setSearchInput] = useState('')
  const debouncedSearch = useDebouncedValue(searchInput, 360)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const queryClient = useQueryClient()

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch])

  const usersQuery = useQuery({
    queryKey: queryKeys.admin.users(page, debouncedSearch),
    queryFn: () => getUsers(page, LIMIT, debouncedSearch),
    staleTime: CACHE_TIERS.dashboard.staleTime,
    gcTime: CACHE_TIERS.dashboard.gcTime,
  })

  const roleMutation = useMutation({
    mutationFn: ({ userId, role }) => updateUserRole(userId, role),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
      toast.success('Role updated.')
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Could not update role.')),
  })

  const toggleMutation = useMutation({
    mutationFn: (userId) => toggleUserStatus(userId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
      toast.success('User status updated.')
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Could not update status.')),
  })

  const deleteMutation = useMutation({
    mutationFn: (userId) => deleteUser(userId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
      await queryClient.invalidateQueries({ queryKey: queryKeys.admin.stats() })
      toast.success('User deleted.')
      setDeleteTarget(null)
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Could not delete user.')),
  })

  const { users = [], pagination = {} } = usersQuery.data || {}
  const busy = roleMutation.isPending || toggleMutation.isPending || deleteMutation.isPending

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <Link
            to="/admin/dashboard"
            className="text-sm font-medium text-teal-700 hover:text-teal-800 dark:text-teal-400 dark:hover:text-teal-300"
          >
            ← Admin overview
          </Link>
          <PageHeader
            className="mt-2"
            title="Users"
            description="Search by name or email, change roles, toggle account status, or remove users."
          />
        </div>
      </div>

      <Card padding="default">
        <Input
          type="search"
          placeholder="Search by name or email…"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          icon={<EmptyStateIcons.search className="h-5 w-5 text-gray-400" />}
          containerClassName="max-w-md"
          aria-label="Search users"
        />
      </Card>

      {usersQuery.isError && (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          Could not load users.
        </p>
      )}

      {usersQuery.isPending ? (
        <Card padding="default">
          <div className="space-y-3">
            <Skeleton className="h-10 w-full" />
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </Card>
      ) : users.length === 0 ? (
        <Card padding="none">
          <EmptyState
            icon={EmptyStateIcons.search}
            title="No users found"
            description={
              debouncedSearch.trim()
                ? 'Try a different search term.'
                : 'No users match the current filters.'
            }
          />
        </Card>
      ) : (
        <Card padding="default" className="overflow-hidden p-0 sm:p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/80 text-xs uppercase tracking-wide text-gray-500 dark:border-gray-700 dark:bg-gray-800/50 dark:text-gray-400">
                  <th className="px-4 py-3 font-semibold">Name</th>
                  <th className="px-4 py-3 font-semibold">Email</th>
                  <th className="px-4 py-3 font-semibold">Role</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Joined</th>
                  <th className="px-4 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr
                    key={u._id}
                    className="border-b border-gray-100 transition-colors hover:bg-gray-50/80 dark:border-gray-800 dark:hover:bg-gray-800/40"
                  >
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{u.fullName}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{u.email}</td>
                    <td className="px-4 py-3">
                      <select
                        aria-label={`Role for ${u.fullName}`}
                        className="max-w-[9rem] rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-xs font-medium shadow-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 disabled:opacity-60 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
                        value={u.role}
                        disabled={busy}
                        onChange={(e) => {
                          const next = e.target.value
                          if (next === u.role) return
                          roleMutation.mutate({ userId: u._id, role: next })
                        }}
                      >
                        {ROLE_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={u.isActive !== false ? 'success' : 'danger'} size="sm">
                        {u.isActive !== false ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          disabled={busy}
                          onClick={() => toggleMutation.mutate(u._id)}
                        >
                          {u.isActive !== false ? 'Deactivate' : 'Activate'}
                        </Button>
                        <Button
                          type="button"
                          variant="danger"
                          size="sm"
                          disabled={busy}
                          onClick={() => setDeleteTarget(u)}
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {!usersQuery.isPending && pagination.totalPages > 1 && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Page {pagination.page} of {pagination.totalPages} ({pagination.total} users)
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
        title="Delete user"
        size="md"
      >
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Permanently delete <strong className="text-gray-900 dark:text-white">{deleteTarget?.fullName}</strong>{' '}
          ({deleteTarget?.email})? This cannot be undone.
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
            Delete user
          </Button>
        </div>
      </Modal>
    </section>
  )
}
