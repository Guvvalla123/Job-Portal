import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../context/useAuth.jsx'
import { NotificationDropdown } from '../components/NotificationDropdown.jsx'
import { ProfileDropdown } from '../components/ProfileDropdown.jsx'
import { Footer } from '../components/Footer.jsx'
import { ThemeToggle } from '../components/ThemeToggle.jsx'
import { FloatingRecruiterFab } from '../components/FloatingRecruiterFab.jsx'
import { Sheet } from '../components/ui/Sheet.jsx'
import { PageShell, AnimatedPage } from '../components/layout/PageShell.jsx'
import { useHeaderScrolled } from '../hooks/useHeaderScrolled.js'

const linkBase =
  'inline-flex min-h-10 items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors md:min-h-0 md:py-1.5'
const activeStyle = ({ isActive }) =>
  `${linkBase} ${isActive ? 'bg-white/20 text-white' : 'text-blue-100 hover:bg-white/10 hover:text-white'}`

const mobileLinkBase =
  'flex min-h-12 items-center rounded-xl px-4 py-3 text-base font-medium transition-colors active:scale-[0.99]'
const mobileActiveStyle = ({ isActive }) =>
  `${mobileLinkBase} ${isActive ? 'bg-indigo-50 text-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-200' : 'text-gray-800 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-800'}`

const AUTH_PATHS = ['/login', '/register', '/forgot-password']

function isAuthRoute(pathname) {
  return AUTH_PATHS.includes(pathname) || pathname.startsWith('/reset-password/')
}

export function AppLayout() {
  const { user } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)
  const { pathname } = useLocation()
  const headerScrolled = useHeaderScrolled(8)
  const authPage = isAuthRoute(pathname)

  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  return (
    <div className="flex min-h-screen min-h-[100dvh] flex-col">
      <header
        className={`sticky top-0 z-50 border-b transition-[box-shadow,background-color] duration-200 ${
          headerScrolled
            ? 'border-white/15 bg-gradient-to-r from-blue-900/95 via-blue-800/95 to-indigo-800/95 shadow-lg shadow-blue-950/25 backdrop-blur-xl'
            : 'border-white/10 bg-gradient-to-r from-blue-800/90 via-blue-700/90 to-indigo-700/90 shadow-md shadow-blue-900/15 backdrop-blur-xl supports-[backdrop-filter]:bg-blue-800/80'
        }`}
      >
        <div className="mx-auto flex h-14 min-h-[3.5rem] max-w-7xl items-center justify-between gap-3 px-4 sm:h-14 sm:px-6">
          <Link
            to="/"
            className="flex min-h-11 min-w-0 shrink-0 items-center gap-2 rounded-lg pr-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/20 text-sm font-bold text-white sm:h-8 sm:w-8">
              JP
            </div>
            <span className="truncate text-lg font-bold tracking-tight text-white">JobPortal</span>
          </Link>

          <nav className="hidden min-h-0 items-center gap-1 md:flex" aria-label="Main">
            <NavLink to="/jobs" className={activeStyle}>
              Browse Jobs
            </NavLink>
            <NavLink to="/companies" className={activeStyle}>
              Companies
            </NavLink>
            {user?.role === 'candidate' && (
              <NavLink to="/candidate/dashboard" className={activeStyle}>
                My Dashboard
              </NavLink>
            )}
            {user?.role === 'recruiter' && (
              <NavLink to="/recruiter/dashboard" className={activeStyle}>
                Recruiter Panel
              </NavLink>
            )}
            {user?.role === 'admin' && (
              <NavLink to="/admin/dashboard" className={activeStyle}>
                Admin Panel
              </NavLink>
            )}

            <div className="ml-2 h-5 w-px shrink-0 bg-white/30" aria-hidden />

            <div className="ml-2 flex items-center gap-2">
              <ThemeToggle />
              {!user ? (
                <>
                  <NavLink to="/login" className={`${linkBase} text-blue-100 hover:text-white`}>
                    Sign In
                  </NavLink>
                  <NavLink
                    to="/register"
                    className="inline-flex min-h-10 items-center rounded-xl bg-white px-4 py-2 text-sm font-semibold text-blue-700 shadow-md transition-all hover:scale-[1.02] hover:bg-blue-50 hover:shadow-lg active:scale-[0.98] motion-reduce:hover:scale-100"
                  >
                    Get Started
                  </NavLink>
                </>
              ) : (
                <>
                  <NotificationDropdown />
                  <ProfileDropdown />
                </>
              )}
            </div>
          </nav>

          <div className="flex items-center gap-1 md:hidden">
            <ThemeToggle />
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="tap-target rounded-xl text-white hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
              aria-expanded={mobileOpen}
              aria-controls="mobile-navigation"
              aria-label="Open menu"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <Sheet
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        title="Menu"
        side="left"
        fullWidth
      >
        <nav id="mobile-navigation" className="flex flex-col gap-1 pb-8" aria-label="Mobile">
          <NavLink to="/jobs" onClick={() => setMobileOpen(false)} className={mobileActiveStyle}>
            Browse Jobs
          </NavLink>
          <NavLink to="/companies" onClick={() => setMobileOpen(false)} className={mobileActiveStyle}>
            Companies
          </NavLink>
          {user?.role === 'candidate' && (
            <NavLink to="/candidate/dashboard" onClick={() => setMobileOpen(false)} className={mobileActiveStyle}>
              My Dashboard
            </NavLink>
          )}
          {user?.role === 'recruiter' && (
            <NavLink to="/recruiter/dashboard" onClick={() => setMobileOpen(false)} className={mobileActiveStyle}>
              Recruiter Panel
            </NavLink>
          )}
          {user?.role === 'admin' && (
            <NavLink to="/admin/dashboard" onClick={() => setMobileOpen(false)} className={mobileActiveStyle}>
              Admin Panel
            </NavLink>
          )}
          <div className="my-4 border-t border-gray-200 dark:border-gray-700" />
          {!user ? (
            <div className="flex flex-col gap-2">
              <NavLink
                to="/login"
                onClick={() => setMobileOpen(false)}
                className="flex min-h-12 items-center justify-center rounded-xl border border-gray-200 px-4 font-semibold text-gray-800 dark:border-gray-600 dark:text-gray-200"
              >
                Sign In
              </NavLink>
              <NavLink
                to="/register"
                onClick={() => setMobileOpen(false)}
                className="flex min-h-12 items-center justify-center rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 px-4 font-semibold text-white shadow-lg"
              >
                Get Started
              </NavLink>
            </div>
          ) : (
            <div className="flex justify-center py-2">
              <ProfileDropdown compact onNavigate={() => setMobileOpen(false)} />
            </div>
          )}
        </nav>
      </Sheet>

      <main
        className={
          authPage
            ? 'flex min-w-0 flex-1 flex-col bg-gradient-to-b from-slate-950 via-slate-900 to-indigo-950 dark:from-gray-950 dark:via-slate-950 dark:to-indigo-950'
            : 'flex min-w-0 flex-1 flex-col bg-gradient-to-b from-gray-50 via-slate-50/90 to-indigo-50/35 dark:from-gray-950 dark:via-gray-950 dark:to-indigo-950/25'
        }
      >
        <PageShell>
          <AnimatedPage />
        </PageShell>
      </main>

      <Footer />
      <FloatingRecruiterFab />
    </div>
  )
}
