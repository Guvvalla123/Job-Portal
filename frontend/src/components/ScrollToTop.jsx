import { useLayoutEffect } from 'react'
import { useLocation, useNavigationType } from 'react-router-dom'

/**
 * Replaces ScrollRestoration (which only works with createBrowserRouter / data routers).
 * Scrolls to top on forward navigations; skips on POP so browser back/forward can restore scroll.
 */
export function ScrollToTop() {
  const { pathname } = useLocation()
  const navigationType = useNavigationType()

  useLayoutEffect(() => {
    if (navigationType === 'POP') return
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [pathname, navigationType])

  return null
}
