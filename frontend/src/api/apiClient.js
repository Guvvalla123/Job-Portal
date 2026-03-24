import axios from 'axios'
import { AUTH_KEYS } from '../lib/authConstants.js'
import { emitSessionExpired } from '../lib/authEvents.js'

const stripTrailingSlash = (s) => s.replace(/\/$/, '')

/**
 * Resolves axios baseURL so requests never target the Vite dev server by mistake
 * and always include `/api/v1` for this backend.
 *
 * - Dev (no env): `/api/v1` → Vite proxy → backend
 * - VITE_API_URL=/api → `/api/v1`
 * - VITE_API_URL=http://localhost:5000 → `http://localhost:5000/api/v1`
 * - VITE_API_URL=http://localhost:5000/api → `http://localhost:5000/api/v1`
 */
function resolveApiBase() {
  const raw = typeof import.meta.env.VITE_API_URL === 'string' ? import.meta.env.VITE_API_URL.trim() : ''
  if (!raw) {
    return '/api/v1'
  }

  const base = stripTrailingSlash(raw)

  // Misconfiguration: API must not point at the Vite dev server (causes 404 from 5173)
  if (/localhost:5173\b/i.test(base) || /127\.0\.0\.1:5173\b/i.test(base)) {
    return '/api/v1'
  }

  if (base.endsWith('/v1')) {
    return base
  }

  if (base.startsWith('http://') || base.startsWith('https://')) {
    if (base.endsWith('/api')) {
      return `${base}/v1`
    }
    return `${base}/api/v1`
  }

  // Relative e.g. /api
  return `${base}/v1`
}

const API_BASE = resolveApiBase()

/** Ensures Bearer token is set on config.headers (Axios 1.x AxiosHeaders-safe). */
function setAuthorizationHeader(config, token) {
  if (!token || !config) return
  const h = config.headers
  if (h && typeof h.set === 'function') {
    h.set('Authorization', `Bearer ${token}`, false)
  } else {
    config.headers = { ...(config.headers || {}), Authorization: `Bearer ${token}` }
  }
}

const apiClient = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

let isRefreshing = false
let refreshSubscribers = []

const onRefreshed = (token) => {
  refreshSubscribers.forEach((cb) => cb(token))
  refreshSubscribers = []
}

const addRefreshSubscriber = (cb) => {
  refreshSubscribers.push(cb)
}

const clearAuthStorage = () => {
  localStorage.removeItem(AUTH_KEYS.USER)
  localStorage.removeItem(AUTH_KEYS.ACCESS_TOKEN)
  localStorage.removeItem(AUTH_KEYS.REFRESH_TOKEN)
  if (apiClient.defaults.headers.common) {
    delete apiClient.defaults.headers.common.Authorization
  }
}

const isAuthUrl = (url) => {
  if (!url) return false
  const path = url.replace(apiClient.defaults.baseURL || '', '')
  return (
    path.startsWith('/auth/login') ||
    path.startsWith('/auth/register') ||
    path.startsWith('/auth/refresh') ||
    path.startsWith('/auth/forgot') ||
    path.startsWith('/auth/reset')
  )
}

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(AUTH_KEYS.ACCESS_TOKEN)
    setAuthorizationHeader(config, token)

    if (config.responseType === 'blob') {
      if (config.headers && typeof config.headers.set === 'function') {
        if (!config.headers.get('Accept')) {
          config.headers.set('Accept', 'application/pdf,*/*', false)
        }
      } else {
        config.headers = config.headers || {}
        config.headers.Accept = config.headers.Accept || 'application/pdf,*/*'
      }
      if (config.method?.toLowerCase() === 'get') {
        if (config.headers && typeof config.headers.delete === 'function') {
          config.headers.delete('Content-Type')
        } else {
          delete config.headers['Content-Type']
        }
      }
    }

    return config
  },
  (err) => Promise.reject(err)
)

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    const status = error.response?.status

    if (status === 401 && originalRequest && !originalRequest._retry && !isAuthUrl(originalRequest.url)) {
      const refreshToken = localStorage.getItem(AUTH_KEYS.REFRESH_TOKEN)

      if (refreshToken) {
        if (isRefreshing) {
          return new Promise((resolve) => {
            addRefreshSubscriber((token) => {
              if (token) {
                setAuthorizationHeader(originalRequest, token)
                resolve(apiClient(originalRequest))
              } else {
                resolve(Promise.reject(error))
              }
            })
          })
        }

        originalRequest._retry = true
        isRefreshing = true

        try {
          const { data } = await axios.post(`${API_BASE}/auth/refresh`, { refreshToken }, { timeout: 10000 })

          const { accessToken, refreshToken: newRefresh, user } = data.data
          localStorage.setItem(AUTH_KEYS.ACCESS_TOKEN, accessToken)
          if (newRefresh) localStorage.setItem(AUTH_KEYS.REFRESH_TOKEN, newRefresh)
          localStorage.setItem(AUTH_KEYS.USER, JSON.stringify(user))
          const common = apiClient.defaults.headers.common
          if (common && typeof common.set === 'function') {
            common.set('Authorization', `Bearer ${accessToken}`, false)
          } else if (common) {
            common.Authorization = `Bearer ${accessToken}`
          }

          isRefreshing = false
          onRefreshed(accessToken)
          setAuthorizationHeader(originalRequest, accessToken)
          return apiClient(originalRequest)
        } catch (refreshErr) {
          isRefreshing = false
          onRefreshed(null)
          clearAuthStorage()
          emitSessionExpired()
          return Promise.reject(refreshErr)
        }
      }

      clearAuthStorage()
      emitSessionExpired()
    }

    if (error.code === 'ECONNABORTED') {
      error.message = 'Request timed out. Please try again.'
    }

    return Promise.reject(error)
  }
)

export { apiClient, API_BASE }
