/**
 * Optional Core Web Vitals logging (LCP, INP, CLS, …). Enable with VITE_ENABLE_WEB_VITALS=true.
 * Logs to console in dev; in production use for RUM by extending `send` (e.g. beacon to your analytics).
 */
export function initWebVitalsReport() {
  if (import.meta.env.VITE_ENABLE_WEB_VITALS !== 'true') return

  import('web-vitals')
    .then(({ onCLS, onINP, onFCP, onLCP, onTTFB }) => {
      const send = (metric) => {
        if (import.meta.env.DEV) {
          // eslint-disable-next-line no-console
          console.debug('[web-vitals]', metric.name, Math.round(metric.value * 1000) / 1000, metric.rating)
        }
      }
      onCLS(send)
      onINP(send)
      onFCP(send)
      onLCP(send)
      onTTFB(send)
    })
    .catch(() => {})
}
