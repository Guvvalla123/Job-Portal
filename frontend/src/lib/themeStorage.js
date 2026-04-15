/**
 * DOM theme application (CareerSync).
 * Appearance follows system `prefers-color-scheme` only — kept in sync with index.html inline script.
 */

export function getSystemPrefersDark() {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

/** @param {boolean} isDark */
export function applyThemeToDocument(isDark) {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  if (isDark) {
    root.classList.add('dark')
    root.style.backgroundColor = '#0F172A'
    document.body.style.backgroundColor = '#0F172A'
  } else {
    root.classList.remove('dark')
    root.style.backgroundColor = '#F8FAFC'
    document.body.style.backgroundColor = '#F8FAFC'
  }

  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) {
    meta.setAttribute('content', '#0F766E')
  }
}
