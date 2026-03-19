/**
 * Analytics integration - Google Analytics 4
 * Tracks page views, custom events (applications, registrations)
 * Set VITE_GA_MEASUREMENT_ID to enable.
 */

import { GA_MEASUREMENT_ID } from '../config/site.js'

const isEnabled = () => Boolean(GA_MEASUREMENT_ID && typeof window !== 'undefined' && window.gtag)

export function initAnalytics() {
  if (!GA_MEASUREMENT_ID || typeof window === 'undefined') return

  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`
  document.head.appendChild(script)

  window.dataLayer = window.dataLayer || []
  window.gtag = function gtag() {
    window.dataLayer.push(arguments)
  }
  window.gtag('js', new Date())
  window.gtag('config', GA_MEASUREMENT_ID, {
    send_page_view: false, // We send manually for SPA
    anonymize_ip: true,
  })
}

export function trackPageView(path, title) {
  if (!isEnabled()) return
  window.gtag('event', 'page_view', {
    page_path: path,
    page_title: title,
  })
}

export function trackEvent(eventName, params = {}) {
  if (!isEnabled()) return
  window.gtag('event', eventName, params)
}

export function trackJobApplication(jobId, jobTitle, companyName) {
  trackEvent('job_application', {
    job_id: jobId,
    job_title: jobTitle,
    company_name: companyName,
  })
}

export function trackUserRegistration(role) {
  trackEvent('sign_up', { method: 'email', role })
}
