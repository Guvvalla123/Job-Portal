/* frontend/src/layouts/components/DesktopNav.jsx */
import { NavLink } from 'react-router-dom'
import { NotificationBell } from '../../components/notifications/NotificationBell.jsx'
import { ProfileDropdown } from '../../components/ProfileDropdown.jsx'
import { Button } from '../../components/ui/index.js'
import { PublicDesktopNavLinks, DesktopDashboardNavLink } from './NavLinks.jsx'
import { linkBase } from './layoutNavStyles.js'

export function DesktopNav({ showAuthenticatedNav, user }) {
  return (
    <nav
      className="hidden min-h-0 items-center md:flex md:gap-0"
      aria-label="Main"
    >
      <div className="flex flex-wrap items-center gap-x-1 gap-y-1">
        <PublicDesktopNavLinks />
      </div>

      <div className="mx-3 h-5 w-px shrink-0 bg-white/30" aria-hidden />

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        {!showAuthenticatedNav ? (
          <>
            <NavLink
              to="/login"
              className={`${linkBase} text-teal-100 hover:text-white`}
            >
              Sign In
            </NavLink>
            <Button
              to="/register"
              variant="secondary"
              size="md"
              className="!min-h-10 !rounded-xl !border-0 !bg-white !px-4 !py-2 !text-sm !font-semibold !text-teal-800 shadow-soft hover:!bg-teal-50 hover:!shadow-md dark:!border-transparent dark:!bg-white dark:!text-teal-900 dark:hover:!bg-teal-50"
            >
              Get Started
            </Button>
          </>
        ) : (
          <>
            <DesktopDashboardNavLink user={user} />
            <NotificationBell />
            <ProfileDropdown />
          </>
        )}
      </div>
    </nav>
  )
}
