import axios from 'axios'
import { toast } from 'sonner'
import {
  AUTH_KEYS,
  CSRF_COOKIE_NAME,
  clearPersistedAuthKeys,
  isSessionIntentionallyEnded,
  setSessionEndedFlag,
} from '../lib/authConstants.js'
import { toPersistedSessionUser } from '../lib/sessionUser.js'
import { emitSessionExpired } from '../lib/authEvents.js'
import { createAuthRefreshCoordinator, REFRESH_TIMEOUT_MS, LOG_PREFIX } from './authRefreshCoordinator.js'

const CSRF_HEADER = 'X-CSRF-Token'

const isDev = import.meta.env.DEV

function authDebugLog(message, ...rest) {
  if (!isDev) return
  console.debug(`${LOG_PREFIX} ${message}`, ...rest)
}

/** Access token never touches localStorage (XSS). Survives until refresh or tab close. */
let accessTokenMemory = null

const stripTrailingSlash = (s) => s.replace(/\/$/, '')

function readCsrfCookie() {
  if (typeof document === 'undefined') return ''
  const escaped = CSRF_COOKIE_NAME.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const m = document.cookie.match(new RegExp(`(?:^|; )${escaped}=([^;]*)`))
  return m ? decodeURIComponent(m[1]) : ''
}

/**
 * Resolves axios baseURL so requests never target the Vite dev server by mistake
 * and always include `/api/v1` for this backend.
 */
function resolveApiBase() {
  const raw = typeof import.meta.env.VITE_API_URL === 'string' ? import.meta.env.VITE_API_URL.trim() : ''
  if (!raw) {
    return '/api/v1'
  }

  const base = stripTrailingSlash(raw)

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

  return `${base}/v1`
}

const API_BASE = resolveApiBase()

/**
 * Blocks apiClient requests until restoreSessionFromCookie() finishes (success, fail, or session-ended).
 * `startBootstrap` is idempotent so concurrent callers share one gate.
 */
let bootstrapPromise = null
let resolveBootstrap = null

export function startBootstrap() {
  if (!bootstrapPromise) {
    bootstrapPromise = new Promise((resolve) => {
      resolveBootstrap = resolve
    })
  }
}

export function endBootstrap() {
  if (resolveBootstrap) {
    resolveBootstrap()
    resolveBootstrap = null
  }
  bootstrapPromise = null
}

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

function setCsrfHeader(config) {
  const method = (config.method || 'get').toLowerCase()
  if (!['post', 'put', 'patch', 'delete'].includes(method)) return
  const csrf = readCsrfCookie()
  if (!csrf) return
  const h = config.headers
  if (h && typeof h.set === 'function') {
    h.set(CSRF_HEADER, csrf, false)
  } else {
    config.headers = { ...(config.headers || {}), [CSRF_HEADER]: csrf }
  }
}

const apiClient = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
  withCredentials: true,
})

/**
 * Do not set a global Content-Type. Axios adds `application/json` automatically for plain-object
 * bodies; forcing JSON here breaks `FormData` uploads (multer sees no file → "Resume file is required").
 */
{
  const common = apiClient.defaults.headers.common
  if (common && typeof common.delete === 'function') {
    common.delete('Content-Type')
  } else if (common) {
    delete common['Content-Type']
    delete common['content-type']
  }
}

/** Sync default Authorization header with in-memory token. */
function setAccessToken(token) {
  accessTokenMemory = token
  const common = apiClient.defaults.headers.common
  if (token) {
    if (common && typeof common.set === 'function') {
      common.set('Authorization', `Bearer ${token}`, false)
    } else if (common) {
      common.Authorization = `Bearer ${token}`
    }
  } else if (common && typeof common.set === 'function') {
    common.delete('Authorization')
  } else if (common) {
    delete common.Authorization
  }
}

function getAccessToken() {
  return accessTokenMemory
}

function clearSession() {
  accessTokenMemory = null
  localStorage.removeItem(AUTH_KEYS.USER)
  localStorage.removeItem(AUTH_KEYS.ACCESS_TOKEN)
  const common = apiClient.defaults.headers.common
  if (common && typeof common.set === 'function') {
    common.delete('Authorization')
  } else if (common) {
    delete common.Authorization
  }
}

const refreshCoordinator = createAuthRefreshCoordinator({
  postRefreshRequest: () =>
    axios.post(`${API_BASE}/auth/refresh`, {}, { withCredentials: true, timeout: REFRESH_TIMEOUT_MS }),
  applySession: ({ accessToken, user }) => {
    setAccessToken(accessToken)
    if (user) {
      const minimal = toPersistedSessionUser(user)
      if (minimal) localStorage.setItem(AUTH_KEYS.USER, JSON.stringify(minimal))
    }
  },
  clearClientAuth: () => {
    clearSession()
    try {
      clearPersistedAuthKeys()
    } catch {
      /* ignore */
    }
  },
  markSessionEnded: setSessionEndedFlag,
  isSessionIntentionallyEnded,
  isDev,
})

function getRefreshPromise() {
  return refreshCoordinator.getRefreshPromise()
}

/**
 * Test-only: reset in-flight refresh + cooldown (Vitest).
 * Do not use in production code.
 */
export function __resetRefreshStateForTests() {
  refreshCoordinator.resetForTests()
}

/** @internal Tests may spy on coordinator behavior via dynamic import of module. */
export function __getRefreshCoordinatorForTests() {
  return refreshCoordinator
}

apiClient.interceptors.request.use(
  async (config) => {
    if (bootstrapPromise && config.skipAuthBootstrapWait !== true) {
      await bootstrapPromise.catch(() => {})
    }
    // Wait for an in-flight refresh only — never call getRefreshPromise() here (would start refresh on every request).
    const flight = refreshCoordinator.peekInFlightRefresh()
    if (flight && config.skipAuthBootstrapWait !== true) {
      try {
        await flight
      } catch {
        /* refresh failed; proceed — likely 401 on this request */
      }
    }
    setCsrfHeader(config)
    setAuthorizationHeader(config, accessTokenMemory)

    /** Belt-and-suspenders: ensure multipart requests never inherit a JSON Content-Type. */
    if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
      const h = config.headers
      if (h && typeof h.delete === 'function') {
        h.delete('Content-Type')
      } else if (h && typeof h === 'object') {
        delete h['Content-Type']
        delete h['content-type']
      }
    }

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
  (err) => Promise.reject(err),
)

const isAuthUrl = (url) => {
  if (!url) return false
  const path = url.replace(apiClient.defaults.baseURL || '', '')
  return (
    path.startsWith('/auth/login') ||
    path.startsWith('/auth/register') ||
    path.startsWith('/auth/refresh') ||
    path.startsWith('/auth/logout') ||
    path.startsWith('/auth/forgot') ||
    path.startsWith('/auth/reset') ||
    path.startsWith('/auth/mfa/')
  )
}

function apiErrorMessage(error, fallback) {
  const msg = error?.response?.data?.message
  return typeof msg === 'string' && msg.trim() ? msg.trim() : fallback
}

function shouldSkipGlobalToast(config) {
  return Boolean(config?.skipGlobalErrorToast)
}

/**
 * Silent session restore after full page load using httpOnly refresh cookie.
 * Single-flight refresh + session gate so no apiClient traffic runs until restore completes.
 */
async function restoreSessionFromCookie() {
  startBootstrap()
  try {
    if (isSessionIntentionallyEnded()) {
      clearSession()
      try {
        clearPersistedAuthKeys()
      } catch {
        /* ignore */
      }
      return null
    }
    try {
      return await getRefreshPromise()
    } catch {
      return null
    }
  } finally {
    endBootstrap()
  }
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    const status = error.response?.status

    if (status === 401 && originalRequest) {
      /** After one refresh attempt, never enter refresh logic again (prevents loops). */
      if (originalRequest._retry) {
        clearSession()
        try {
          clearPersistedAuthKeys()
        } catch {
          /* ignore */
        }
        setSessionEndedFlag()
        if (!shouldSkipGlobalToast(originalRequest)) {
          toast.error(apiErrorMessage(error, 'Your session has expired. Please sign in again.'))
        }
        emitSessionExpired()
        authDebugLog('401 after refresh retry — session cleared')
        return Promise.reject(error)
      }

      const url = originalRequest.url || ''
      if (
        url.includes('/auth/refresh') ||
        url.includes('/auth/login') ||
        url.includes('/auth/register') ||
        url.includes('/auth/mfa/verify-login')
      ) {
        return Promise.reject(error)
      }

      if (isSessionIntentionallyEnded()) {
        clearSession()
        try {
          clearPersistedAuthKeys()
        } catch {
          /* ignore */
        }
        return Promise.reject(error)
      }

      if (bootstrapPromise) {
        await bootstrapPromise.catch(() => {})
      }

      // Leader already started refresh — wait for same promise, then retry once (no second POST /auth/refresh).
      const waitOn = refreshCoordinator.peekInFlightRefresh()
      if (waitOn) {
        try {
          await waitOn
        } catch {
          /* coordinator already cleared session + cooldown */
        }
        if (accessTokenMemory) {
          originalRequest._retry = true
          setAuthorizationHeader(originalRequest, accessTokenMemory)
          setCsrfHeader(originalRequest)
          authDebugLog('Retrying request', originalRequest.url)
          return apiClient(originalRequest)
        }
        if (!shouldSkipGlobalToast(originalRequest)) {
          toast.error(apiErrorMessage(error, 'Your session has expired. Please sign in again.'))
        }
        emitSessionExpired()
        return Promise.reject(error)
      }

      originalRequest._retry = true

      try {
        const { accessToken } = await getRefreshPromise()
        if (!accessToken) {
          throw new Error('No access token after refresh')
        }
        setAuthorizationHeader(originalRequest, accessToken)
        setCsrfHeader(originalRequest)
        authDebugLog('Retrying request', originalRequest.url)
        return apiClient(originalRequest)
      } catch (refreshErr) {
        if (!shouldSkipGlobalToast(originalRequest)) {
          toast.error(apiErrorMessage(refreshErr, 'Your session has expired. Please sign in again.'))
        }
        emitSessionExpired()
        authDebugLog('Refresh path failed — session ended')
        return Promise.reject(refreshErr)
      }
    }

    if (error.code === 'ECONNABORTED') {
      error.message = 'Request timed out. Please try again.'
    }

    const cfg = error.config
    const st = error.response?.status
    if (!shouldSkipGlobalToast(cfg) && !isAuthUrl(cfg?.url)) {
      if (st === 401) {
        toast.error(apiErrorMessage(error, 'Your session has expired. Please sign in again.'))
      } else if (st === 403) {
        toast.error(apiErrorMessage(error, "You don't have permission to do that."))
      } else if (st >= 500 && st < 600) {
        toast.error(apiErrorMessage(error, 'Server error. Please try again later.'))
      }
    }

    return Promise.reject(error)
  },
)

export {
  apiClient,
  API_BASE,
  setAccessToken,
  getAccessToken,
  clearSession,
  restoreSessionFromCookie,
}
