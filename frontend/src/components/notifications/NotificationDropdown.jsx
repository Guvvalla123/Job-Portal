import { useNavigate, useLocation } from 'react-router-dom'
import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '../../lib/queryKeys.js'
import { useAuth } from '../../context/useAuth.jsx'
import { isAuthRoute } from '../../lib/authRoutes.js'
import { Skeleton } from '../ui/Skeleton.jsx'
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from '../../api/notificationsApi.js'

const PAGE_SIZE = 20

/** @param {string | Date | undefined} input */
function formatRelativeTime(input) {
  if (!input) return ''
  const then = new Date(input).getTime()
  if (Number.isNaN(then)) return ''
  const sec = Math.floor((Date.now() - then) / 1000)
  if (sec < 45) return 'just now'
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min} minute${min === 1 ? '' : 's'} ago`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr} hour${hr === 1 ? '' : 's'} ago`
  const day = Math.floor(hr / 24)
  if (day < 7) return `${day} day${day === 1 ? '' : 's'} ago`
  const week = Math.floor(day / 7)
  if (week < 5) return `${week} week${week === 1 ? '' : 's'} ago`
  return new Date(input).toLocaleDateString()
}

function TypeIcon({ type, className }) {
  const cn = className || 'h-4 w-4 shrink-0'
  switch (type) {
    case 'APPLICATION_RECEIVED':
      return (
        <svg className={cn} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
      )
    case 'APPLICATION_STATUS_CHANGED':
      return (
        <svg className={cn} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
      )
    case 'INTERVIEW_SCHEDULED':
      return (
        <svg className={cn} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      )
    case 'JOB_ALERT_MATCH':
      return (
        <svg className={cn} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
      )
    case 'GENERAL':
    default:
      return (
        <svg className={cn} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      )
  }
}

/** @param {string} type */
function typeAccentClasses(type) {
  switch (type) {
    case 'APPLICATION_RECEIVED':
      return {
        border: 'border-l-blue-500 dark:border-l-blue-400',
        icon: 'text-blue-600 dark:text-blue-400',
      }
    case 'APPLICATION_STATUS_CHANGED':
      return {
        border: 'border-l-amber-500 dark:border-l-amber-400',
        icon: 'text-amber-600 dark:text-amber-400',
      }
    case 'INTERVIEW_SCHEDULED':
      return {
        border: 'border-l-emerald-500 dark:border-l-emerald-400',
        icon: 'text-emerald-600 dark:text-emerald-400',
      }
    case 'JOB_ALERT_MATCH':
      return {
        border: 'border-l-sky-500 dark:border-l-sky-400',
        icon: 'text-sky-600 dark:text-sky-400',
      }
    case 'GENERAL':
    default:
      return {
        border: 'border-l-gray-400 dark:border-l-gray-500',
        icon: 'text-gray-500 dark:text-gray-400',
      }
  }
}

function NotificationRowSkeleton() {
  return (
    <div className="flex gap-3 border-b border-gray-100 px-4 py-3 last:border-0 dark:border-gray-700/80">
      <Skeleton className="h-9 w-9 shrink-0 rounded-lg" />
      <div className="min-w-0 flex-1 space-y-2">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  )
}

/**
 * @param {{ onClose: () => void }} props
 */
export function NotificationDropdown({ onClose }) {
  const { isAuthenticated } = useAuth()
  const { pathname } = useLocation()
  const allowFetch = isAuthenticated && !isAuthRoute(pathname)
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: unreadPayload } = useQuery({
    queryKey: queryKeys.notifications.unreadCount(),
    queryFn: getUnreadCount,
    enabled: allowFetch,
    staleTime: 10_000,
  })

  const unreadCount = unreadPayload?.count ?? 0

  const {
    data: listData,
    fetchNextPage,
    hasNextPage,
    isPending,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: queryKeys.notifications.infiniteList(),
    queryFn: ({ pageParam }) => getNotifications(pageParam, PAGE_SIZE),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const p = lastPage?.page ?? 1
      const total = lastPage?.totalPages ?? 0
      if (p < total) return p + 1
      return undefined
    },
    staleTime: 30_000,
    enabled: allowFetch,
  })

  const notifications = listData?.pages.flatMap((p) => p.notifications ?? []) ?? []

  const invalidateNotifications = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all() })
  }

  const markReadMutation = useMutation({
    mutationFn: markAsRead,
    onSuccess: invalidateNotifications,
  })

  const markAllMutation = useMutation({
    mutationFn: markAllAsRead,
    onSuccess: invalidateNotifications,
  })

  const deleteMutation = useMutation({
    mutationFn: deleteNotification,
    onSuccess: invalidateNotifications,
  })

  const handleItemActivate = async (n) => {
    if (!n.read) {
      try {
        await markReadMutation.mutateAsync(n._id)
      } catch {
        return
      }
    }
    const link = typeof n.link === 'string' ? n.link.trim() : ''
    if (link && link !== '#') {
      navigate(link)
    }
    onClose()
  }

  const handleDelete = (e, id) => {
    e.stopPropagation()
    e.preventDefault()
    deleteMutation.mutate(id)
  }

  return (
    <div
      className="absolute right-0 top-full z-50 mt-1 w-[min(100vw-2rem,20rem)] rounded-lg border border-gray-200 bg-white py-2 shadow-lg ring-1 ring-gray-200/80 dark:border-gray-700 dark:bg-gray-900 dark:ring-gray-700/80 sm:w-80"
      role="dialog"
      aria-label="Notifications"
    >
      <div className="flex items-center justify-between gap-2 border-b border-gray-100 px-4 py-2 dark:border-gray-700/80">
        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">Notifications</span>
        <button
          type="button"
          disabled={unreadCount === 0 || markAllMutation.isPending}
          onClick={() => markAllMutation.mutate()}
          className="shrink-0 text-xs font-medium text-teal-700 hover:text-[#0C5F5A] disabled:cursor-not-allowed disabled:opacity-40 dark:text-teal-400 dark:hover:text-teal-300"
        >
          Mark all read
        </button>
      </div>

      <div className="max-h-72 overflow-y-auto overscroll-contain">
        {isPending && notifications.length === 0 ? (
          <>
            <NotificationRowSkeleton />
            <NotificationRowSkeleton />
            <NotificationRowSkeleton />
          </>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
            <svg
              className="h-10 w-10 text-gray-300 dark:text-gray-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
            <p className="text-sm text-gray-500 dark:text-gray-400">No notifications yet</p>
          </div>
        ) : (
          notifications.map((n) => {
            const accent = typeAccentClasses(n.type)
            const created = n.createdAt ?? n.updatedAt
            return (
              <div
                key={n._id}
                className={`group relative border-b border-gray-100 border-l-4 pl-3 pr-2 transition-colors last:border-b-0 dark:border-gray-700/80 ${accent.border} ${
                  !n.read ? 'bg-teal-50/40 dark:bg-teal-950/25' : 'bg-transparent hover:bg-gray-50/80 dark:hover:bg-gray-800/50'
                }`}
              >
                <div className="flex gap-2 py-3 pr-7">
                  <div className={`mt-0.5 ${accent.icon}`}>
                    <TypeIcon type={n.type} />
                  </div>
                  <button
                    type="button"
                    className="min-w-0 flex-1 text-left"
                    onClick={() => handleItemActivate(n)}
                    disabled={markReadMutation.isPending}
                  >
                    <div className="flex items-start gap-2">
                      {!n.read ? (
                        <span
                          className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-500 dark:bg-blue-400"
                          aria-hidden
                        />
                      ) : (
                        <span className="mt-1.5 h-2 w-2 shrink-0" aria-hidden />
                      )}
                      <div className="min-w-0 flex-1">
                        <p
                          className={`text-sm text-gray-900 dark:text-gray-100 ${!n.read ? 'font-semibold' : 'font-medium'}`}
                        >
                          {n.title}
                        </p>
                        {n.message ? (
                          <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-gray-600 dark:text-gray-400">
                            {n.message}
                          </p>
                        ) : null}
                        <p className="mt-1 text-[11px] text-gray-400 dark:text-gray-500">{formatRelativeTime(created)}</p>
                      </div>
                    </div>
                  </button>
                </div>
                <button
                  type="button"
                  className="absolute right-2 top-2 rounded-md p-1 text-gray-400 opacity-100 transition-opacity hover:bg-gray-200 hover:text-gray-700 sm:opacity-0 sm:group-hover:opacity-100 sm:focus:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 dark:hover:bg-gray-700 dark:hover:text-gray-200"
                  aria-label="Delete notification"
                  onClick={(e) => handleDelete(e, n._id)}
                  disabled={deleteMutation.isPending}
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )
          })
        )}
      </div>

      {hasNextPage && notifications.length > 0 ? (
        <div className="border-t border-gray-100 px-3 py-2 dark:border-gray-700/80">
          <button
            type="button"
            className="w-full rounded-lg py-2 text-center text-xs font-medium text-teal-700 hover:bg-teal-50 dark:text-teal-400 dark:hover:bg-teal-950/40"
            disabled={isFetchingNextPage}
            onClick={() => fetchNextPage()}
          >
            {isFetchingNextPage ? 'Loading…' : 'Load more'}
          </button>
        </div>
      ) : null}
    </div>
  )
}
