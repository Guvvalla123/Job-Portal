/**
 * Shared auth storage keys - used by AuthContext and apiClient.
 * Single source of truth prevents mismatches (e.g. 'accessToken' vs 'AccessToken').
 */
export const AUTH_KEYS = {
  USER: 'currentUser',
  ACCESS_TOKEN: 'accessToken',
}

/** Remove only auth keys — never localStorage.clear() (preserves theme, etc.). */
export function clearPersistedAuthKeys() {
  for (const key of Object.values(AUTH_KEYS)) {
    try {
      localStorage.removeItem(key)
    } catch {
      /* ignore */
    }
  }
}

/** Readable CSRF cookie set by API (must match backend `constants/cookies.js`). */
export const CSRF_COOKIE_NAME = 'jid_csrf'

/** Set on explicit logout; blocks cookie restore until next login (localStorage = all tabs). */
export const SESSION_ENDED_KEY = 'session_ended'

/**
 * Tab-scoped "session active" flag. sessionStorage clears automatically when the
 * browser/tab closes, so the next visit starts logged-out and must re-authenticate.
 */
export const SESSION_ACTIVE_KEY = 'session_active'

export function setSessionActiveFlag() {
  try {
    sessionStorage.setItem(SESSION_ACTIVE_KEY, 'true')
  } catch {
    /* private mode / blocked */
  }
}

export function clearSessionActiveFlag() {
  try {
    sessionStorage.removeItem(SESSION_ACTIVE_KEY)
  } catch {
    /* ignore */
  }
}

export function isSessionActive() {
  if (typeof window === 'undefined') return false
  try {
    return sessionStorage.getItem(SESSION_ACTIVE_KEY) === 'true'
  } catch {
    return false
  }
}

export function isSessionIntentionallyEnded() {
  if (typeof window === 'undefined') return false
  try {
    return (
      localStorage.getItem(SESSION_ENDED_KEY) === 'true' ||
      sessionStorage.getItem(SESSION_ENDED_KEY) === 'true'
    )
  } catch {
    /* ignore */
  }
  return false
}

export function setSessionEndedFlag() {
  try {
    localStorage.setItem(SESSION_ENDED_KEY, 'true')
  } catch {
    /* ignore */
  }
}

export function clearSessionEndedFlag() {
  try {
    localStorage.removeItem(SESSION_ENDED_KEY)
  } catch {
    /* ignore */
  }
  try {
    sessionStorage.removeItem(SESSION_ENDED_KEY)
  } catch {
    /* ignore */
  }
}
