import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getAuditLogs } from '../../api/adminApi.js'
import { queryKeys } from '../../lib/queryKeys.js'
import { CACHE_TIERS } from '../../lib/queryOptions.js'
import { useDebouncedValue } from '../../hooks/useDebouncedValue.js'
import { PageHeader } from '../../components/ui/PageHeader.jsx'
import { Card } from '../../components/ui/Card.jsx'
import { Select } from '../../components/ui/Select.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { Badge } from '../../components/ui/Badge.jsx'
import { Skeleton } from '../../components/ui/Skeleton.jsx'
import { EmptyState, EmptyStateIcons } from '../../components/ui/EmptyState.jsx'
import { Input } from '../../components/ui/Input.jsx'

const LIMIT = 50

const ACTION_OPTIONS = [
  { value: '', label: 'All actions' },
  { value: 'create', label: 'Create' },
  { value: 'update', label: 'Update' },
  { value: 'delete', label: 'Delete' },
  { value: 'login', label: 'Login' },
  { value: 'logout', label: 'Logout' },
  { value: 'register', label: 'Register' },
]

function actionBadgeVariant(action) {
  if (action === 'delete') return 'danger'
  if (action === 'login' || action === 'register') return 'success'
  if (action === 'logout') return 'default'
  if (action === 'create') return 'primary'
  return 'warning'
}

export function AdminAuditLogPage() {
  const [page, setPage] = useState(1)
  const [actionFilter, setActionFilter] = useState('')
  const [actorUserId, setActorUserId] = useState('')
  const debouncedActorId = useDebouncedValue(actorUserId.trim(), 400)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  useEffect(() => {
    setPage(1)
  }, [actionFilter, debouncedActorId, dateFrom, dateTo])

  const auditOpts = {
    ...(debouncedActorId ? { userId: debouncedActorId } : {}),
    ...(dateFrom ? { dateFrom: `${dateFrom}T00:00:00.000Z` } : {}),
    ...(dateTo ? { dateTo: `${dateTo}T23:59:59.999Z` } : {}),
  }

  const logsQuery = useQuery({
    queryKey: queryKeys.admin.auditLogs(page, actionFilter, debouncedActorId || '', dateFrom, dateTo),
    queryFn: () => getAuditLogs(page, LIMIT, actionFilter, auditOpts),
    staleTime: CACHE_TIERS.dashboard.staleTime,
    gcTime: CACHE_TIERS.dashboard.gcTime,
  })

  const { logs = [], pagination = {} } = logsQuery.data || {}

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
          title="Audit log"
          description="Read-only record of platform actions. Entries may expire per retention policy."
        />
      </div>

      <Card padding="default">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Select
            id="admin-audit-action"
            label="Action type"
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            options={ACTION_OPTIONS}
            placeholder=""
            containerClassName="min-w-0"
          />
          <Input
            id="admin-audit-actor"
            label="Actor user ID"
            value={actorUserId}
            onChange={(e) => setActorUserId(e.target.value)}
            placeholder="MongoDB ObjectId"
            containerClassName="min-w-0"
          />
          <Input
            id="admin-audit-from"
            label="From date"
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            containerClassName="min-w-0"
          />
          <Input
            id="admin-audit-to"
            label="To date"
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            containerClassName="min-w-0"
          />
        </div>
      </Card>

      {logsQuery.isError && (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          Could not load audit logs.
        </p>
      )}

      {logsQuery.isPending ? (
        <Card padding="default">
          <div className="space-y-3">
            <Skeleton className="h-10 w-full" />
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        </Card>
      ) : logs.length === 0 ? (
        <Card padding="none">
          <EmptyState
            icon={EmptyStateIcons.applications}
            title="No log entries"
            description={
              actionFilter || debouncedActorId || dateFrom || dateTo
                ? 'Nothing matches these filters. Try broadening or clearing them.'
                : 'No audit entries are stored yet.'
            }
          />
        </Card>
      ) : (
        <Card padding="default" className="overflow-hidden p-0 sm:p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[880px] text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/80 text-xs uppercase tracking-wide text-gray-500 dark:border-gray-700 dark:bg-gray-800/50 dark:text-gray-400">
                  <th className="px-4 py-3 font-semibold">Actor</th>
                  <th className="px-4 py-3 font-semibold">Action</th>
                  <th className="px-4 py-3 font-semibold">Target</th>
                  <th className="px-4 py-3 font-semibold">IP</th>
                  <th className="px-4 py-3 font-semibold">Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((row) => (
                  <tr
                    key={row._id}
                    className="border-b border-gray-100 transition-colors hover:bg-gray-50/80 dark:border-gray-800 dark:hover:bg-gray-800/40"
                  >
                    <td className="px-4 py-3">
                      {row.actor ? (
                        <>
                          <p className="font-medium text-gray-900 dark:text-white">{row.actor.fullName || '—'}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{row.actor.email || ''}</p>
                        </>
                      ) : (
                        <span className="text-gray-400">System</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={actionBadgeVariant(row.action)} size="sm">
                        {row.action}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-200">
                      <span className="font-medium">{row.target?.type || '—'}</span>
                      {row.target?.id ? (
                        <span className="mt-0.5 block truncate font-mono text-xs text-gray-500 dark:text-gray-400">
                          {row.target.id}
                        </span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-600 dark:text-gray-300">{row.ip || '—'}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-gray-500 dark:text-gray-400">
                      {row.createdAt ? new Date(row.createdAt).toLocaleString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {!logsQuery.isPending && pagination.totalPages > 1 && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Page {pagination.page} of {pagination.totalPages} ({pagination.total} entries)
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
