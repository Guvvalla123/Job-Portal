const AUTH_PATHS = ['/login', '/register', '/forgot-password']

/** True for login/register/forgot/reset-password — header must stay logged-out UI even if user lags in state. */
export function isAuthRoute(pathname) {
  return AUTH_PATHS.includes(pathname) || pathname.startsWith('/reset-password/')
}
