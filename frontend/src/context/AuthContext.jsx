import { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import {
  apiClient,
  clearSession,
  getAccessToken,
  restoreSessionFromCookie,
  setAccessToken,
} from '../api/apiClient.js'
import { getMe } from '../api/userApi.js'
import {
  AUTH_KEYS,
  clearPersistedAuthKeys,
  clearSessionEndedFlag,
  isSessionIntentionallyEnded,
  SESSION_ENDED_KEY,
  setSessionEndedFlag,
} from '../lib/authConstants.js'
import { toPersistedSessionUser } from '../lib/sessionUser.js'
import { subscribeToSessionExpiry } from '../lib/authEvents.js'
import { AppBootstrapSkeleton } from '../components/AppBootstrapSkeleton.jsx'

const AuthContext = createContext(null)

function parseStoredSessionUser(raw) {
  try {
    const o = JSON.parse(raw)
    if (!o?.id) return null
    return {
      id: o.id,
      role: o.role,
      fullName: typeof o.fullName === 'string' ? o.fullName : typeof o.name === 'string' ? o.name : '',
    }
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const queryClient = useQueryClient()
  const logoutInProgress = useRef(false)
  /** Bumps on login/logout so in-flight /auth/me cannot overwrite a newer session. */
  const authEpoch = useRef(0)

  const [user, setUser] = useState(() => {
    if (typeof window === 'undefined') return null
    if (isSessionIntentionallyEnded()) {
      try {
        localStorage.removeItem(AUTH_KEYS.USER)
        localStorage.removeItem(AUTH_KEYS.ACCESS_TOKEN)
      } catch {
        /* ignore */
      }
      return null
    }
    const raw = localStorage.getItem(AUTH_KEYS.USER)
    return raw ? parseStoredSessionUser(raw) : null
  })
  /** Until bootstrap finishes (cookie refresh + optional /me). */
  const [loading, setLoading] = useState(true)

  const performLogout = useCallback(async (options = {}) => {
    if (logoutInProgress.current) return
    logoutInProgress.current = true
    authEpoch.current += 1

    const { clearCache = true, redirectToLogin = true } = options
    const token = getAccessToken()

    if (options.callServer !== false) {
      try {
        await apiClient.post(
          '/auth/logout',
          {},
          {
            ...(token ? { headers: { Authorization: `Bearer ${token}` } } : {}),
            skipGlobalErrorToast: true,
          },
        )
      } catch {
        /* still clear client + block restore; server may still drop cookie */
      }
    }

    if (redirectToLogin) {
      setSessionEndedFlag()
    }

    clearSession()
    try {
      clearPersistedAuthKeys()
    } catch {
      /* ignore private mode / blocked storage */
    }

    setUser(null)
    if (clearCache) {
      queryClient.clear()
    }

    logoutInProgress.current = false

    if (redirectToLogin) {
      window.location.replace('/login')
    }
  }, [queryClient])

  useEffect(() => {
    const unsubscribe = subscribeToSessionExpiry(() => {
      authEpoch.current += 1
      setUser(null)
      clearSession()
      try {
        clearPersistedAuthKeys()
      } catch {
        /* ignore */
      }
      queryClient.clear()
      window.location.replace('/login?session=expired')
    })
    return unsubscribe
  }, [queryClient])

  useEffect(() => {
    function onStorage(event) {
      if (event.key !== SESSION_ENDED_KEY || event.newValue !== 'true') return
      if (event.storageArea !== localStorage) return
      authEpoch.current += 1
      setUser(null)
      clearSession()
      try {
        clearPersistedAuthKeys()
      } catch {
        /* ignore */
      }
      queryClient.clear()
      window.location.replace('/login')
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [queryClient])

  useEffect(() => {
    let cancelled = false
    const epochAtStart = authEpoch.current

    ;(async () => {
      const restored = await restoreSessionFromCookie()
      if (cancelled || epochAtStart !== authEpoch.current) return

      if (!restored?.accessToken) {
        setUser(null)
        clearSession()
        try {
          clearPersistedAuthKeys()
        } catch {
          /* ignore */
        }
        setLoading(false)
        return
      }

      if (restored.user) {
        setUser(restored.user)
        const minimal = toPersistedSessionUser(restored.user)
        if (minimal) localStorage.setItem(AUTH_KEYS.USER, JSON.stringify(minimal))
      }

      try {
        await apiClient.get('/auth/csrf-token')
      } catch {
        /* CSRF bootstrap best-effort */
      }

      try {
        const validatedUser = await getMe()
        if (cancelled || epochAtStart !== authEpoch.current) return
        setUser(validatedUser)
        const minimal = toPersistedSessionUser(validatedUser)
        if (minimal) localStorage.setItem(AUTH_KEYS.USER, JSON.stringify(minimal))
      } catch {
        if (cancelled || epochAtStart !== authEpoch.current) return
        setUser(null)
        clearSession()
        try {
          clearPersistedAuthKeys()
        } catch {
          /* ignore */
        }
      } finally {
        if (!cancelled && epochAtStart === authEpoch.current) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [])

  const login = useCallback(({ user: userData, accessToken }) => {
    authEpoch.current += 1
    clearSessionEndedFlag()
    setUser(userData)
    const minimal = toPersistedSessionUser(userData)
    if (minimal) localStorage.setItem(AUTH_KEYS.USER, JSON.stringify(minimal))
    setAccessToken(accessToken)
    setLoading(false)
  }, [])

  const logout = useCallback(() => {
    performLogout({ callServer: true, clearCache: true, redirectToLogin: true })
  }, [performLogout])

  const updateUser = useCallback((nextUser) => {
    setUser(nextUser)
    const minimal = toPersistedSessionUser(nextUser)
    if (minimal) localStorage.setItem(AUTH_KEYS.USER, JSON.stringify(minimal))
  }, [])

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: Boolean(user),
      login,
      logout,
      updateUser,
    }),
    [user, loading, login, logout, updateUser],
  )

  return (
    <AuthContext.Provider value={value}>
      {loading ? (
        <div className="fixed inset-0 z-[200] min-h-dvh bg-gray-50 dark:bg-gray-950" role="status" aria-busy="true" aria-label="Loading">
          <AppBootstrapSkeleton />
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  )
}

export { AuthContext }
