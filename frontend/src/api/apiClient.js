import axios from 'axios'
import { AUTH_KEYS } from '../lib/authConstants.js'
import { emitSessionExpired } from '../lib/authEvents.js'

const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL.replace(/\/$/, '')}/v1`
  : '/api/v1'

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
  return path.startsWith('/auth/login') || path.startsWith('/auth/register') ||
    path.startsWith('/auth/refresh') || path.startsWith('/auth/forgot') ||
    path.startsWith('/auth/reset')
}

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(AUTH_KEYS.ACCESS_TOKEN)
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  },
  (err) => Promise.reject(err)
)

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    const status = error.response?.status

    if (status === 401 && !originalRequest._retry && !isAuthUrl(originalRequest.url)) {
      const refreshToken = localStorage.getItem(AUTH_KEYS.REFRESH_TOKEN)

      if (refreshToken) {
        if (isRefreshing) {
          return new Promise((resolve) => {
            addRefreshSubscriber((token) => {
              if (token) {
                originalRequest.headers.Authorization = `Bearer ${token}`
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
          const { data } = await axios.post(
            `${API_BASE}/auth/refresh`,
            { refreshToken },
            { timeout: 10000 }
          )

          const { accessToken, refreshToken: newRefresh, user } = data.data
          localStorage.setItem(AUTH_KEYS.ACCESS_TOKEN, accessToken)
          if (newRefresh) localStorage.setItem(AUTH_KEYS.REFRESH_TOKEN, newRefresh)
          localStorage.setItem(AUTH_KEYS.USER, JSON.stringify(user))
          apiClient.defaults.headers.common.Authorization = `Bearer ${accessToken}`

          onRefreshed(accessToken)
          originalRequest.headers.Authorization = `Bearer ${accessToken}`
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

export { apiClient }
