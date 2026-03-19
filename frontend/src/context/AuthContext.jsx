import { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { apiClient } from '../api/apiClient.js'
import { userScopedQueryKeyPrefixes } from '../lib/queryKeys.js'
import { AUTH_KEYS } from '../lib/authConstants.js'
import { subscribeToSessionExpiry } from '../lib/authEvents.js'

const AuthContext = createContext(null)

const clearAuthStorage = () => {
  localStorage.removeItem(AUTH_KEYS.USER)
  localStorage.removeItem(AUTH_KEYS.ACCESS_TOKEN)
  localStorage.removeItem(AUTH_KEYS.REFRESH_TOKEN)
  if (apiClient.defaults.headers.common) {
    delete apiClient.defaults.headers.common.Authorization
  }
}

export function AuthProvider({ children }) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const logoutInProgress = useRef(false)

  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem(AUTH_KEYS.USER)
    try {
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  })
  const [loading, setLoading] = useState(() => Boolean(localStorage.getItem(AUTH_KEYS.ACCESS_TOKEN)))

  const performLogout = useCallback(async (options = {}) => {
    if (logoutInProgress.current) return
    logoutInProgress.current = true

    const { clearCache = true, redirectToLogin = true } = options
    const token = localStorage.getItem(AUTH_KEYS.ACCESS_TOKEN)

    if (token && options.callServer !== false) {
      try {
        await apiClient.post('/auth/logout', {}, { headers: { Authorization: `Bearer ${token}` } })
      } catch {
        /* ignore - token may already be invalid */
      }
    }

    setUser(null)
    clearAuthStorage()

    if (clearCache) {
      await Promise.all(
        userScopedQueryKeyPrefixes.map((queryKey) => queryClient.removeQueries({ queryKey }))
      )
    }

    if (redirectToLogin) {
      navigate('/login', { replace: true, state: { from: { pathname: window.location.pathname } } })
    }

    logoutInProgress.current = false
  }, [queryClient, navigate])

  useEffect(() => {
    const unsubscribe = subscribeToSessionExpiry(() => {
      setUser(null)
      clearAuthStorage()
      Promise.all(
        userScopedQueryKeyPrefixes.map((queryKey) => queryClient.removeQueries({ queryKey }))
      ).then(() => {
        navigate('/login', { replace: true, state: { sessionExpired: true } })
      })
    })
    return unsubscribe
  }, [queryClient, navigate])

  useEffect(() => {
    const token = localStorage.getItem(AUTH_KEYS.ACCESS_TOKEN)
    if (!token) {
      setLoading(false)
      return
    }

    apiClient
      .get('/auth/me')
      .then((response) => {
        const validatedUser = response.data.data.user
        setUser(validatedUser)
        localStorage.setItem(AUTH_KEYS.USER, JSON.stringify(validatedUser))
      })
      .catch(() => {
        setUser(null)
        clearAuthStorage()
      })
      .finally(() => setLoading(false))
  }, [])

  const login = useCallback(({ user: userData, accessToken, refreshToken }) => {
    setUser(userData)
    localStorage.setItem(AUTH_KEYS.USER, JSON.stringify(userData))
    localStorage.setItem(AUTH_KEYS.ACCESS_TOKEN, accessToken)
    if (refreshToken) localStorage.setItem(AUTH_KEYS.REFRESH_TOKEN, refreshToken)
  }, [])

  const logout = useCallback(() => {
    performLogout({ callServer: true, clearCache: true, redirectToLogin: true })
  }, [performLogout])

  const updateUser = useCallback((nextUser) => {
    setUser(nextUser)
    localStorage.setItem(AUTH_KEYS.USER, JSON.stringify(nextUser))
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

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export { AuthContext }
