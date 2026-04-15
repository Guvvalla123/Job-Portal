/* frontend/src/layouts/components/DesktopNav.jsx */
import { NavLink } from 'react-router-dom'
import { NotificationBell } from '../../components/notifications/NotificationBell.jsx'
import { ProfileDropdown } from '../../components/ProfileDropdown.jsx'
import { DesktopNavLinks } from './NavLinks.jsx'
import { linkBase } from './layoutNavStyles.js'

export function DesktopNav({ showAuthenticatedNav, user }) {
  return (
    <nav className="hidden min-h-0 items-center gap-1 md:flex" aria-label="Main">
      <DesktopNavLinks showAuthenticatedNav={showAuthenticatedNav} user={user} />

      <div className="ml-2 h-5 w-px shrink-0 bg-white/30" aria-hidden />

      <div className="ml-2 flex items-center gap-2">
        {!showAuthenticatedNav ? (
          <>
            <NavLink to="/login" className={`${linkBase} text-teal-100 hover:text-white`}>
              Sign In
            </NavLink>
            <NavLink
              to="/register"
              className="inline-flex min-h-10 items-center rounded-xl bg-white px-4 py-2 text-sm font-semibold text-teal-800 shadow-soft transition-[background-color,box-shadow] duration-200 hover:bg-teal-50 hover:shadow-md dark:bg-white dark:text-teal-900"
            >
              Get Started
            </NavLink>
          </>
        ) : (
          <>
            <NotificationBell />
            <ProfileDropdown />
          </>
        )}
      </div>
    </nav>
  )
}
