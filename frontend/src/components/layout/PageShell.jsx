import { useLocation, useOutlet } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'

const MotionDiv = motion.div

/**
 * Consistent horizontal rhythm + max width for all routes.
 * Home uses full-bleed sections inside; shell adds zero horizontal padding so hero can span edge-to-edge.
 */
export function PageShell({ children }) {
  const { pathname } = useLocation()
  const isHome = pathname === '/'

  if (isHome) {
    return <div className="w-full min-w-0 flex-1">{children}</div>
  }

  return (
    <div className="mx-auto w-full max-w-7xl min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      {children}
    </div>
  )
}

/**
 * Route transitions: fade + slide via Framer Motion + AnimatePresence (mode wait).
 * Uses useOutlet() so exit animations receive the correct subtree.
 */
export function AnimatedPage() {
  const { pathname } = useLocation()
  const outlet = useOutlet()
  const reduceMotion = useReducedMotion()

  const duration = reduceMotion ? 0 : 0.26
  const ease = [0.22, 1, 0.36, 1]

  return (
    <AnimatePresence mode="wait" initial={false}>
      <MotionDiv
        key={pathname}
        initial={reduceMotion ? false : { opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        exit={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: -10 }}
        transition={{ duration, ease }}
        className="min-h-[min(50vh,28rem)] w-full min-w-0"
      >
        {outlet}
      </MotionDiv>
    </AnimatePresence>
  )
}
