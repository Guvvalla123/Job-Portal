import { NavLink } from 'react-router-dom'
import { ProfileDropdown } from '../../components/ProfileDropdown.jsx'
import { Sheet } from '../../components/ui/Sheet.jsx'
import { MobileNavLinks } from './NavLinks.jsx'

export function MobileSheet({ open, onClose, showAuthenticatedNav, user }) {
  return (
    <Sheet open={open} onClose={onClose} title="Menu" side="left" fullWidth>
      <nav id="mobile-navigation" className="flex flex-col gap-1 pb-8" aria-label="Mobile">
        <MobileNavLinks
          showAuthenticatedNav={showAuthenticatedNav}
          user={user}
          onNavigate={() => onClose()}
        />
        <div className="my-4 border-t border-gray-200 dark:border-gray-700" />
        {!showAuthenticatedNav ? (
          <div className="flex flex-col gap-2">
            <NavLink
              to="/login"
              onClick={() => onClose()}
              className="flex min-h-12 items-center justify-center rounded-xl border border-gray-200 px-4 font-semibold text-gray-800 dark:border-gray-600 dark:text-gray-200"
            >
              Sign In
            </NavLink>
            <NavLink
              to="/register"
              onClick={() => onClose()}
              className="flex min-h-12 items-center justify-center rounded-lg bg-indigo-600 px-4 font-semibold text-white shadow-sm"
            >
              Get Started
            </NavLink>
          </div>
        ) : (
          <div className="flex justify-center py-2">
            <ProfileDropdown compact onNavigate={() => onClose()} />
          </div>
        )}
      </nav>
    </Sheet>
  )
}
