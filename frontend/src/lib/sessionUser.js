/**
 * Minimal user persisted to localStorage (XSS surface reduction).
 * Full profile comes from GET /auth/me and lives in React state only.
 * Shape: { id, role, name } per security guidelines (name mirrors fullName).
 */
export function toPersistedSessionUser(user) {
  if (!user || typeof user !== 'object') return null
  const id = user.id ?? user._id
  if (id == null || id === '') return null
  return {
    id: String(id),
    role: typeof user.role === 'string' ? user.role : '',
    name: typeof user.fullName === 'string' ? user.fullName : typeof user.name === 'string' ? user.name : '',
  }
}
