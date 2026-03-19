import { useState, useRef, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '../lib/queryKeys.js'
import { CACHE_TIERS } from '../lib/queryOptions.js'
import { Link } from 'react-router-dom'
import { apiClient } from '../api/apiClient.js'
import { useAuth } from '../context/useAuth.jsx'

export function NotificationDropdown() {
  const { isAuthenticated } = useAuth()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const queryClient = useQueryClient()

  const { data } = useQuery({
    queryKey: queryKeys.notifications.all(),
    queryFn: async () => {
      const response = await apiClient.get('/notifications')
      return response.data.data
    },
    enabled: isAuthenticated,
    staleTime: CACHE_TIERS.notifications.staleTime,
    gcTime: CACHE_TIERS.notifications.gcTime,
  })

  const notifications = data?.notifications || []
  const unreadCount = data?.unreadCount || 0

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  const markRead = async (id) => {
    await apiClient.patch(`/notifications/${id}/read`)
    queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all() })
  }

  const markAllRead = async () => {
    await apiClient.patch('/notifications/read-all')
    queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all() })
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="relative rounded-lg p-2 text-white transition-colors hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
        aria-expanded={open}
        aria-haspopup="true"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 w-80 rounded-lg bg-white py-2 shadow-lg ring-1 ring-gray-200">
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-2">
            <span className="text-sm font-semibold text-gray-900">Notifications</span>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="text-xs font-medium text-indigo-600 hover:text-indigo-500"
              >
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-72 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-gray-500">No notifications yet</p>
            ) : (
              notifications.map((n) => (
                <div
                  key={n._id}
                  className={`border-b border-gray-50 px-4 py-3 transition-colors last:border-0 hover:bg-gray-50/50 ${
                    !n.read ? 'bg-indigo-50/30' : ''
                  }`}
                >
                  <Link
                    to={n.link || '#'}
                    onClick={() => {
                      setOpen(false)
                      if (!n.read) markRead(n._id)
                    }}
                    className="block"
                  >
                    <p className="text-sm font-medium text-gray-900">{n.title}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-gray-600">{n.message}</p>
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
