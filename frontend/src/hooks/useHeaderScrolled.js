import { useEffect, useState } from 'react'

/** Sticky header elevation after scroll (LinkedIn-style). */
export function useHeaderScrolled(threshold = 6) {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > threshold)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [threshold])

  return scrolled
}
