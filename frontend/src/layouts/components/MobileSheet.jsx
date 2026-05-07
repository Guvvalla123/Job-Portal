/* frontend/src/layouts/components/MobileSheet.jsx */
import { NavLink } from 'react-router-dom'
import { ProfileDropdown } from '../../components/ProfileDropdown.jsx'
import { Sheet } from '../../components/ui/Sheet.jsx'
import { Button } from '../../components/ui/index.js'
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
            <Button
              to="/login"
              variant="secondary"
              size="lg"
              className="w-full !rounded-xl"
              onClick={() => onClose()}
            >
              Sign In
            </Button>
            <Button
              to="/register"
              variant="primary"
              size="lg"
              className="w-full !rounded-xl"
              onClick={() => onClose()}
            >
              Get Started
            </Button>
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
