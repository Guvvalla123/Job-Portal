import { useLocation } from 'react-router-dom'
import { Skeleton } from '../ui/Skeleton.jsx'

const AUTH_PREFIXES = ['/login', '/register', '/forgot-password']

function isAuthPath(pathname) {
  return AUTH_PREFIXES.includes(pathname) || pathname.startsWith('/reset-password/')
}

/**
 * In-layout Suspense fallback: matches app chrome (no white flash), structured skeleton.
 */
export function RouteFallback() {
  const { pathname } = useLocation()
  const auth = isAuthPath(pathname)

  if (auth) {
    return (
      <div
        className="mx-auto w-full max-w-md space-y-6 py-4"
        aria-busy="true"
        aria-label="Loading page"
      >
        <div className="space-y-2">
          <Skeleton className="mx-auto h-9 w-36 rounded-lg opacity-80" />
          <Skeleton className="h-4 w-full max-w-sm rounded-md opacity-60" />
        </div>
        <div className="space-y-3 rounded-xl border border-white/10 bg-white/5 p-5">
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-11 w-full rounded-lg opacity-90" />
        </div>
      </div>
    )
  }

  return (
    <div className="w-full space-y-8 py-1" aria-busy="true" aria-label="Loading page">
      <div className="space-y-2">
        <Skeleton className="h-8 w-56 max-w-[70%] rounded-lg" />
        <Skeleton className="h-4 w-full max-w-xl rounded-md" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Skeleton className="h-44 rounded-xl" />
        <Skeleton className="h-44 rounded-xl" />
        <Skeleton className="hidden h-44 rounded-xl lg:block" />
      </div>
      <Skeleton className="h-32 w-full max-w-3xl rounded-xl" />
    </div>
  )
}
