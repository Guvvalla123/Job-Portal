import { NavLink } from 'react-router-dom'
import { NotificationBell } from '../../components/notifications/NotificationBell.jsx'
import { ProfileDropdown } from '../../components/ProfileDropdown.jsx'
import { ThemeToggle } from '../../components/ThemeToggle.jsx'
import { DesktopNavLinks } from './NavLinks.jsx'
import { linkBase } from './layoutNavStyles.js'

export function DesktopNav({ showAuthenticatedNav, user }) {
  return (
    <nav className="hidden min-h-0 items-center gap-1 md:flex" aria-label="Main">
      <DesktopNavLinks showAuthenticatedNav={showAuthenticatedNav} user={user} />

      <div className="ml-2 h-5 w-px shrink-0 bg-white/30" aria-hidden />

      <div className="ml-2 flex items-center gap-2">
        <ThemeToggle />
        {!showAuthenticatedNav ? (
          <>
            <NavLink to="/login" className={`${linkBase} text-indigo-100 hover:text-white`}>
              Sign In
            </NavLink>
            <NavLink
              to="/register"
              className="inline-flex min-h-10 items-center rounded-lg bg-white px-4 py-2 text-sm font-semibold text-indigo-700 shadow-sm transition-[background-color,box-shadow] duration-200 hover:bg-indigo-50 hover:shadow-md"
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
