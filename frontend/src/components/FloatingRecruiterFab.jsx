import { Link } from 'react-router-dom'
import { useAuth } from '../context/useAuth.jsx'

/** Sticky FAB – LinkedIn-style “Post” affordance for recruiters */
export function FloatingRecruiterFab() {
  const { user } = useAuth()
  if (user?.role !== 'recruiter') return null

  return (
    <Link
      to="/recruiter/dashboard"
      className="fixed z-40 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-600 text-white shadow-xl shadow-indigo-600/40 ring-2 ring-white/30 transition-all hover:scale-110 hover:shadow-2xl hover:shadow-indigo-600/50 active:scale-95 motion-reduce:hover:scale-100 max-md:bottom-[max(1.25rem,env(safe-area-inset-bottom,0px))] max-md:right-[max(1rem,env(safe-area-inset-right,0px))] md:bottom-8 md:right-8"
      aria-label="Open recruiter dashboard to post a job"
      title="Post a job"
    >
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
      </svg>
    </Link>
  )
}
