import { useEffect, useState } from 'react'

function getPrefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Animates from 0 to target over duration (ms). Respects prefers-reduced-motion.
 */
export function useCountUp(target, { duration = 1400, enabled = true, skip = false } = {}) {
  const [value, setValue] = useState(() => {
    const prefersReduced = getPrefersReducedMotion()
    return prefersReduced || skip || !enabled ? target : 0
  })

  useEffect(() => {
    const prefersReduced = getPrefersReducedMotion()
    if (skip || prefersReduced || !enabled) {
      setValue(target)
      return
    }
    if (target <= 0) {
      setValue(0)
      return
    }
    let frame
    const start = performance.now()
    const tick = (now) => {
      const t = Math.min((now - start) / duration, 1)
      const eased = 1 - (1 - t) ** 3
      setValue(Math.round(eased * target))
      if (t < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [target, duration, enabled, skip])

  return value
}
