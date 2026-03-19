/**
 * Auth event emitter - decouples apiClient from AuthContext.
 *
 * WHY: apiClient (axios) cannot import AuthContext (React) without circular deps.
 * When refresh fails, interceptor needs to trigger logout + cache clear.
 * AuthProvider subscribes; apiClient publishes on session expiry.
 */
const listeners = new Set()

export function subscribeToSessionExpiry(callback) {
  listeners.add(callback)
  return () => listeners.delete(callback)
}

export function emitSessionExpired() {
  listeners.forEach((cb) => {
    try {
      cb()
    } catch (e) {
      console.error('[authEvents] Session expiry handler error:', e)
    }
  })
}
