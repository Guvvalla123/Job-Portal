import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/useAuth.jsx'
import { LoadingState } from './ui/LoadingState.jsx'

export function ProtectedRoute({ roles = [], children }) {
  const { user, isAuthenticated, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return <LoadingState label="Checking authentication…" size="sm" className="min-h-[40dvh]" />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: { pathname: location.pathname } }} />
  }

  if (roles.length > 0 && !roles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />
  }

  return children
}
