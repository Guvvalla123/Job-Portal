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
        className={`flex items-center gap-2 rounded-lg p-1.5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
          compact
            ? 'text-gray-700 hover:bg-gray-100 focus-visible:ring-indigo-500'
            : 'text-indigo-100 hover:bg-white/10 focus-visible:ring-white/50'
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
                ? 'bg-indigo-100 text-indigo-700 ring-indigo-200'
                : 'bg-white/20 text-white ring-white/30'
            }`}
          >
            {user?.fullName?.charAt(0)?.toUpperCase() || 'U'}
          </div>
        )}
        <span
          className={
            compact
              ? 'text-sm font-medium text-gray-900'
              : 'hidden text-sm font-medium sm:inline text-indigo-100'
          }
        >
          {user?.fullName}
        </span>
        <svg
          className={`h-4 w-4 shrink-0 ${compact ? 'text-gray-500' : 'text-indigo-200'}`}
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
        <p className="text-sm font-semibold text-gray-900">{user?.fullName}</p>
        <p className="mt-0.5 truncate text-xs text-gray-500">{user?.email}</p>
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
