/* frontend/src/layouts/AppLayout.jsx */
import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/useAuth.jsx'
import { Footer } from '../components/Footer.jsx'
import { FloatingRecruiterFab } from '../components/FloatingRecruiterFab.jsx'
import { PageShell, AnimatedPage } from '../components/layout/PageShell.jsx'
import { DashboardBottomNav } from '../components/navigation/DashboardBottomNav.jsx'
import { useHeaderScrolled } from '../hooks/useHeaderScrolled.js'
import { isAuthRoute } from '../lib/authRoutes.js'
import { SITE_LOGO_MARK, SITE_NAME } from '../config/site.js'
import { DesktopNav } from './components/DesktopNav.jsx'
import { MobileSheet } from './components/MobileSheet.jsx'

function useShowMobileDashboardNav(user, pathname, authPage, loading) {
  return useMemo(() => {
    if (!user || loading || authPage) return false
    const role = user.role
    if (role === 'candidate' && pathname.startsWith('/candidate/dashboard')) return true
    if (role === 'recruiter' && pathname.startsWith('/recruiter')) return true
    if (role === 'admin' && pathname.startsWith('/admin')) return true
    return false
  }, [user, pathname, authPage, loading])
}

export function AppLayout() {
  const { user, loading } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)
  const { pathname } = useLocation()
  const headerScrolled = useHeaderScrolled(8)
  const authPage = isAuthRoute(pathname)
  const showAuthenticatedNav = Boolean(user) && !authPage && !loading
  const showMobileDashboardNav = useShowMobileDashboardNav(user, pathname, authPage, loading)

  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  const mainPadBottom = showMobileDashboardNav
    ? 'max-md:pb-[calc(4.85rem+env(safe-area-inset-bottom,0px))]'
    : ''

  return (
    <div className="flex min-h-dvh flex-col">
      <header
        className={`sticky top-0 z-50 border-b border-white/10 bg-[#0F766E]/95 shadow-md backdrop-blur-xl transition-[box-shadow,background-color] duration-200 dark:bg-[#0C5F5A]/95 ${
          headerScrolled ? 'shadow-lg shadow-teal-950/25' : ''
        }`}
      >
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
          <Link
            to="/"
            className="flex min-h-11 min-w-0 shrink-0 items-center gap-2 rounded-lg pr-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/20 text-sm font-bold text-white sm:h-8 sm:w-8">
              {SITE_LOGO_MARK}
            </div>
            <span className="truncate text-lg font-bold tracking-tight text-white">{SITE_NAME}</span>
          </Link>

          <DesktopNav showAuthenticatedNav={showAuthenticatedNav} user={user} />

          <div className="flex items-center gap-1 md:hidden">
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

      <MobileSheet
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        showAuthenticatedNav={showAuthenticatedNav}
        user={user}
      />

      <main
        className={
          authPage
            ? `flex min-w-0 flex-1 flex-col bg-slate-950 dark:bg-gray-950 ${mainPadBottom}`
            : `flex min-w-0 flex-1 flex-col bg-gray-50 dark:bg-gray-950 ${mainPadBottom}`
        }
      >
        <PageShell>
          <AnimatedPage />
        </PageShell>
      </main>

      <Footer />
      <FloatingRecruiterFab />
      <DashboardBottomNav />
    </div>
  )
}
