const AUTH_PREFIXES = ['/login', '/register', '/forgot-password', '/reset-password']

function isSafeReturnPath(pathname) {
  if (!pathname || typeof pathname !== 'string') return false
  if (!pathname.startsWith('/')) return false
  if (AUTH_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return false
  return true
}

/**
 * Where to send the user after login: deep-link `from` when allowed, else role dashboard.
 */
export function getPostLoginPath(role, fromPathname) {
  if (isSafeReturnPath(fromPathname)) {
    return fromPathname
  }
  if (role === 'recruiter') return '/recruiter/dashboard'
  if (role === 'admin') return '/admin/dashboard'
  return '/candidate/dashboard'
}
