import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { initAnalytics, trackPageView } from '../lib/analytics.js'
import { SITE_NAME } from '../config/site.js'

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
    const title = document.title || SITE_NAME
    trackPageView(pathname, title)
  }, [pathname])

  return null
}
