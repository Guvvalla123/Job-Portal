/* frontend/src/components/FloatingRecruiterFab.jsx */
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/useAuth.jsx'
import { isAuthRoute } from '../lib/authRoutes.js'

/** Sticky FAB – LinkedIn Affordance for recruiters; clears mobile bottom nav on /recruiter */
export function FloatingRecruiterFab() {
  const { user, loading } = useAuth()
  const { pathname } = useLocation()
  const show = Boolean(user) && user?.role === 'recruiter' && !isAuthRoute(pathname) && !loading
  if (!show) return null

  const onRecruiterDashboard = pathname.startsWith('/recruiter')

  return (
    <Link
      to="/recruiter/dashboard"
      className={`fixed z-40 flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-700 text-white shadow-glow-primary ring-2 ring-white/30 transition-[box-shadow,opacity,transform] duration-200 hover:bg-[#0C5F5A] hover:shadow-lg active:scale-[0.98] active:opacity-95 dark:bg-teal-700 dark:ring-teal-950/50 max-md:right-[max(1rem,env(safe-area-inset-right,0px))] md:bottom-8 md:right-8 ${
        onRecruiterDashboard
          ? 'max-md:bottom-[calc(5.75rem+env(safe-area-inset-bottom,0px))]'
          : 'max-md:bottom-[max(1.25rem,env(safe-area-inset-bottom,0px))]'
      }`}
      aria-label="Open recruiter dashboard to post a job"
      title="Post a job"
    >
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
      </svg>
    </Link>
  )
}
