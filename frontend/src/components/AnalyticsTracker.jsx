import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { initAnalytics, trackPageView } from '../lib/analytics.js'

export function AnalyticsTracker() {
  const { pathname } = useLocation()
  const initialized = useRef(false)

  useEffect(() => {
    if (!initialized.current) {
      initAnalytics()
      initialized.current = true
    }
  }, [])

  useEffect(() => {
    const title = document.title || 'JobPortal'
    trackPageView(pathname, title)
  }, [pathname])

  return null
}
