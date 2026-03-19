import { Navigate, useLocation } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuth } from '../context/useAuth.jsx'

export function ProtectedRoute({ roles = [], children }) {
  const { user, isAuthenticated, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center" role="status" aria-live="polite">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" aria-hidden="true" />
          <p className="text-sm text-gray-500">Checking authentication...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if (roles.length > 0 && !roles.includes(user.role)) {
    toast.error('You do not have permission to access that page.')
    return <Navigate to="/" replace />
  }

  return children
}
