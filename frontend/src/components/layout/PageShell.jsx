import { Suspense } from 'react'
import { useLocation, useOutlet } from 'react-router-dom'
import { RouteFallback } from './RouteFallback.jsx'

/**
 * Consistent horizontal rhythm + max width for all routes.
 * Home uses full-bleed sections inside; shell adds zero horizontal padding so hero can span edge-to-edge.
 */
export function PageShell({ children }) {
  const { pathname } = useLocation()
  const isFullBleed = pathname === '/' || pathname.startsWith('/recruiter')

  if (isFullBleed) {
    return <div className="w-full min-w-0 flex-1">{children}</div>
  }

  return (
    <div className="mx-auto w-full max-w-7xl min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      {children}
    </div>
  )
}

/**
 * Route outlet with in-layout Suspense (layout + header/footer stay mounted).
 * Enter-only motion via CSS — avoids AnimatePresence "wait" blank gap between routes.
 */
export function AnimatedPage() {
  const { pathname } = useLocation()
  const outlet = useOutlet()

  return (
    <div
      key={pathname}
      className="motion-safe:animate-page-enter min-h-[min(50dvh,var(--container-md))] w-full min-w-0"
    >
      <Suspense fallback={<RouteFallback />}>{outlet}</Suspense>
    </div>
  )
}
