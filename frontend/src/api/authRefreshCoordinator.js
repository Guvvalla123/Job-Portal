/**
 * Single-flight OAuth-style refresh: one in-flight POST /auth/refresh globally.
 * Testable in isolation; apiClient wires axios + storage callbacks.
 */

const REFRESH_TIMEOUT_MS = 10_000
/** After a failed refresh, reject new refresh attempts briefly to avoid hammering the API. */
const REFRESH_FAILURE_COOLDOWN_MS = 3000

const LOG_PREFIX = '[AUTH]'

function createDebugLogger(isDev) {
  return (message, ...rest) => {
    if (!isDev) return
    console.debug(`${LOG_PREFIX} ${message}`, ...rest)
  }
}

/**
 * @param {object} deps
 * @param {() => Promise<import('axios').AxiosResponse>} deps.postRefreshRequest - Must use withCredentials; returns axios response
 * @param {(payload: { accessToken?: string, user?: object }) => void} deps.applySession - Persist access token + optional user snapshot
 * @param {() => void} deps.clearClientAuth - Clear memory + local auth keys (no SESSION_ENDED unless failure path calls it)
 * @param {() => void} deps.markSessionEnded - setSessionEndedFlag (refresh / reuse failure)
 * @param {() => boolean} deps.isSessionIntentionallyEnded
 * @param {boolean} [deps.isDev] - import.meta.env.DEV
 */
export function createAuthRefreshCoordinator(deps) {
  const {
    postRefreshRequest,
    applySession,
    clearClientAuth,
    markSessionEnded,
    isSessionIntentionallyEnded,
    isDev = false,
  } = deps

  const debugLog = createDebugLogger(isDev)

  let inFlightRefresh = null
  let refreshCooldownUntil = 0

  function failRefresh(reason, err) {
    debugLog('Refresh failed', reason, err)
    refreshCooldownUntil = Date.now() + REFRESH_FAILURE_COOLDOWN_MS
    clearClientAuth()
    markSessionEnded()
    const e = err instanceof Error ? err : new Error(String(reason))
    return Promise.reject(e)
  }

  /**
   * In-flight refresh only — does NOT start a refresh. Used by request interceptors
   * so normal traffic waits for an ongoing refresh without calling POST /auth/refresh.
   */
  function peekInFlightRefresh() {
    return inFlightRefresh
  }

  function getRefreshPromise() {
    if (isSessionIntentionallyEnded()) {
      debugLog('Refresh skipped: session intentionally ended')
      return failRefresh('session_ended', new Error('Session ended'))
    }

    const now = Date.now()
    if (now < refreshCooldownUntil && !inFlightRefresh) {
      debugLog('Refresh skipped: failure cooldown active')
      return failRefresh('cooldown', new Error('Refresh cooldown'))
    }

    if (inFlightRefresh) {
      debugLog('Refresh reused existing promise')
      return inFlightRefresh
    }

    debugLog('Refresh started')

    inFlightRefresh = postRefreshRequest()
      .then((res) => {
        const status = res?.status
        if (status === 401 || status === 403) {
          return failRefresh(`refresh_http_${status}`, res)
        }

        const payload = res?.data?.data
        const accessToken = payload?.accessToken
        if (!accessToken || typeof accessToken !== 'string') {
          return failRefresh('missing_access_token', new Error('Invalid refresh response'))
        }

        applySession({ accessToken, user: payload?.user })
        debugLog('Refresh success')
        return { accessToken, user: payload?.user }
      })
      .catch((err) => {
        const status = err?.response?.status
        if (status === 401 || status === 403) {
          return failRefresh('refresh_unauthorized', err)
        }
        if (err?.code === 'ECONNABORTED' || err?.message?.includes('timeout')) {
          return failRefresh('refresh_timeout', err)
        }
        return failRefresh('refresh_error', err)
      })
      .finally(() => {
        inFlightRefresh = null
      })

    return inFlightRefresh
  }

  function resetForTests() {
    inFlightRefresh = null
    refreshCooldownUntil = 0
  }

  return {
    getRefreshPromise,
    peekInFlightRefresh,
    resetForTests,
    /** @internal */
    _constants: { REFRESH_TIMEOUT_MS, REFRESH_FAILURE_COOLDOWN_MS },
  }
}

export { REFRESH_TIMEOUT_MS, REFRESH_FAILURE_COOLDOWN_MS, LOG_PREFIX }
