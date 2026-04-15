/* frontend/src/components/ProfileDropdown.jsx */
import { toast } from 'sonner'
import { useAuth } from '../context/useAuth.jsx'
import { Dropdown, DropdownItem, DropdownDivider, Tooltip } from './ui/index.js'

export function ProfileDropdown({ onNavigate, compact = false } = {}) {
  const { user, logout } = useAuth()

  const handleLogout = () => {
    logout()
    toast.success('Logged out successfully.')
  }

  const dashboardPath =
    user?.role === 'candidate'
      ? '/candidate/dashboard'
      : user?.role === 'recruiter'
        ? '/recruiter/dashboard'
        : user?.role === 'admin'
          ? '/admin/dashboard'
          : '/'

  const trigger = (
    <Tooltip content="Account" placement="bottom">
      <button
        type="button"
        className={`flex min-h-11 min-w-0 items-center gap-2 rounded-xl p-1.5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 sm:min-h-10 ${
          compact
            ? 'text-gray-700 hover:bg-gray-100 focus-visible:ring-teal-600 dark:text-gray-200 dark:hover:bg-gray-800'
            : 'text-teal-100 hover:bg-white/10 focus-visible:ring-white/50 focus-visible:ring-offset-transparent'
        }`}
        aria-expanded="false"
        aria-haspopup="true"
        aria-label="Account menu"
      >
        {user?.profileImageUrl ? (
          <img
            src={user.profileImageUrl}
            alt=""
            className="h-8 w-8 rounded-full object-cover ring-2 ring-white/30"
            loading="lazy"
          />
        ) : (
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ring-2 ${
              compact
                ? 'bg-teal-100 text-teal-800 ring-teal-200 dark:bg-teal-900/60 dark:text-teal-200 dark:ring-teal-700'
                : 'bg-white/20 text-white ring-white/30'
            }`}
          >
            {user?.fullName?.charAt(0)?.toUpperCase() || 'U'}
          </div>
        )}
        <span
          className={
            compact
              ? 'text-sm font-medium text-gray-900 dark:text-gray-100'
              : 'hidden text-sm font-medium text-teal-100 sm:inline'
          }
        >
          {user?.fullName}
        </span>
        <svg
          className={`h-4 w-4 shrink-0 ${compact ? 'text-gray-500 dark:text-gray-400' : 'text-teal-200'}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
    </Tooltip>
  )

  return (
    <Dropdown trigger={trigger} align={compact ? 'left' : 'right'}>
      <div className="px-4 py-3">
        <p className="text-sm font-semibold text-gray-900 dark:text-white">{user?.fullName}</p>
        <p className="mt-0.5 truncate text-xs text-gray-500 dark:text-gray-400">{user?.email}</p>
      </div>
      <DropdownDivider />
      <DropdownItem to={dashboardPath} onClick={onNavigate}>
        My Dashboard
      </DropdownItem>
      <DropdownItem to="/jobs" onClick={onNavigate}>
        Browse Jobs
      </DropdownItem>
      <DropdownDivider />
      <DropdownItem onClick={handleLogout} danger>
        Sign out
      </DropdownItem>
    </Dropdown>
  )
}
