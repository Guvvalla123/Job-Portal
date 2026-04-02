import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/useAuth.jsx'
import { isAuthRoute } from '../lib/authRoutes.js'

/** Sticky FAB – LinkedIn-style “Post” affordance for recruiters */
export function FloatingRecruiterFab() {
  const { user, loading } = useAuth()
  const { pathname } = useLocation()
  const show = Boolean(user) && user?.role === 'recruiter' && !isAuthRoute(pathname) && !loading
  if (!show) return null

  return (
    <Link
      to="/recruiter/dashboard"
      className="fixed z-40 flex h-14 w-14 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-900/25 ring-2 ring-white/25 transition-[box-shadow,opacity] duration-200 hover:shadow-xl hover:shadow-indigo-900/30 active:opacity-90 max-md:bottom-[max(1.25rem,env(safe-area-inset-bottom,0px))] max-md:right-[max(1rem,env(safe-area-inset-right,0px))] md:bottom-8 md:right-8"
      aria-label="Open recruiter dashboard to post a job"
      title="Post a job"
    >
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
      </svg>
    </Link>
  )
}
