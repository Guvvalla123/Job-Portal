import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { applyThemeToDocument, getSystemPrefersDark } from '../lib/themeStorage.js'

const ThemeContext = createContext(null)

/**
 * Syncs `dark` class on `<html>` with system color scheme (no manual theme preference).
 */
export function ThemeProvider({ children }) {
  const [systemDark, setSystemDark] = useState(() =>
    typeof window !== 'undefined' ? getSystemPrefersDark() : false,
  )

  useEffect(() => {
    applyThemeToDocument(systemDark)
  }, [systemDark])

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => setSystemDark(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  const value = useMemo(
    () => ({
      preference: 'system',
      dark: systemDark,
      resolvedDark: systemDark,
      /** @deprecated No-op — theme toggle removed; reserved for API stability */
      setTheme() {},
      cycleTheme() {},
    }),
    [systemDark],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider')
  return ctx
}
