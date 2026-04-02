import { lazy } from 'react'
import { ErrorBoundary } from 'react-error-boundary'
import { Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from './layouts/AppLayout.jsx'
import { RecruiterLayout } from './layouts/RecruiterLayout.jsx'
import { ProtectedRoute } from './components/ProtectedRoute.jsx'
import { useAuth } from './context/useAuth.jsx'
import { Button } from './components/ui/index.js'

const HomePage = lazy(() => import('./pages/HomePage.jsx').then((m) => ({ default: m.HomePage })))
const LoginPage = lazy(() => import('./pages/LoginPage.jsx').then((m) => ({ default: m.LoginPage })))
const RegisterPage = lazy(() => import('./pages/RegisterPage.jsx').then((m) => ({ default: m.RegisterPage })))
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage.jsx').then((m) => ({ default: m.ForgotPasswordPage })))
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage.jsx').then((m) => ({ default: m.ResetPasswordPage })))
const JobsPage = lazy(() => import('./pages/JobsPage.jsx').then((m) => ({ default: m.JobsPage })))
const JobDetailsPage = lazy(() => import('./pages/JobDetailsPage.jsx').then((m) => ({ default: m.JobDetailsPage })))
const CompaniesPage = lazy(() => import('./pages/CompaniesPage.jsx').then((m) => ({ default: m.CompaniesPage })))
const CompanyDetailsPage = lazy(() => import('./pages/CompanyDetailsPage.jsx').then((m) => ({ default: m.CompanyDetailsPage })))
const AboutPage = lazy(() => import('./pages/AboutPage.jsx').then((m) => ({ default: m.AboutPage })))
const ContactPage = lazy(() => import('./pages/ContactPage.jsx').then((m) => ({ default: m.ContactPage })))
const CandidateDashboardPage = lazy(() => import('./pages/candidate/CandidateDashboardPage.jsx').then((m) => ({ default: m.CandidateDashboardPage })))
const RecruiterOverviewPage = lazy(() =>
  import('./pages/recruiter/RecruiterOverviewPage.jsx').then((m) => ({ default: m.RecruiterOverviewPage })),
)
const RecruiterJobsPage = lazy(() =>
  import('./pages/recruiter/RecruiterJobsPage.jsx').then((m) => ({ default: m.RecruiterJobsPage })),
)
const RecruiterCompaniesPage = lazy(() =>
  import('./pages/recruiter/RecruiterCompaniesPage.jsx').then((m) => ({ default: m.RecruiterCompaniesPage })),
)
const RecruiterInterviewsPage = lazy(() =>
  import('./pages/recruiter/RecruiterInterviewsPage.jsx').then((m) => ({ default: m.RecruiterInterviewsPage })),
)
const AdminDashboardPage = lazy(() => import('./pages/admin/AdminDashboardPage.jsx').then((m) => ({ default: m.AdminDashboardPage })))
const AdminUsersPage = lazy(() => import('./pages/admin/AdminUsersPage.jsx').then((m) => ({ default: m.AdminUsersPage })))
const AdminJobsPage = lazy(() => import('./pages/admin/AdminJobsPage.jsx').then((m) => ({ default: m.AdminJobsPage })))
const AdminCompaniesPage = lazy(() => import('./pages/admin/AdminCompaniesPage.jsx').then((m) => ({ default: m.AdminCompaniesPage })))
const AdminApplicationsPage = lazy(() => import('./pages/admin/AdminApplicationsPage.jsx').then((m) => ({ default: m.AdminApplicationsPage })))
const AdminAuditLogPage = lazy(() => import('./pages/admin/AdminAuditLogPage.jsx').then((m) => ({ default: m.AdminAuditLogPage })))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage.jsx').then((m) => ({ default: m.NotFoundPage })))
const ServerErrorPage = lazy(() => import('./pages/ServerErrorPage.jsx').then((m) => ({ default: m.ServerErrorPage })))
const PlaceholderPage = lazy(() => import('./pages/PlaceholderPage.jsx').then((m) => ({ default: m.PlaceholderPage })))
const PrivacyPage = lazy(() => import('./pages/PrivacyPage.jsx').then((m) => ({ default: m.PrivacyPage })))
const TermsPage = lazy(() => import('./pages/TermsPage.jsx').then((m) => ({ default: m.TermsPage })))
const CookiesPage = lazy(() => import('./pages/CookiesPage.jsx').then((m) => ({ default: m.CookiesPage })))
const UnauthorizedPage = lazy(() => import('./pages/UnauthorizedPage.jsx').then((m) => ({ default: m.UnauthorizedPage })))

function SectionErrorFallback({ error, resetErrorBoundary }) {
  return (
    <div className="mx-auto max-w-md px-4 py-16 text-center">
      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Something went wrong in this area.</p>
      <p className="mt-1 wrap-break-word text-xs text-gray-500 dark:text-gray-400">{error?.message}</p>
      <Button type="button" variant="secondary" className="mt-4" onClick={resetErrorBoundary}>
        Try again
      </Button>
    </div>
  )
}

function RouteSegmentBoundary({ children }) {
  return (
    <ErrorBoundary FallbackComponent={SectionErrorFallback} onReset={() => window.location.reload()}>
      {children}
    </ErrorBoundary>
  )
}

function DashboardRedirect() {
  const { user, loading } = useAuth()
  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" />
          <div className="h-4 w-32 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" />
          <div className="h-3 w-24 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" />
        </div>
      </div>
    )
  }
  if (!user) return <Navigate to="/login" replace state={{ from: { pathname: '/dashboard' } }} />
  if (user.role === 'recruiter') return <Navigate to="/recruiter/dashboard" replace />
  if (user.role === 'admin') return <Navigate to="/admin/dashboard" replace />
  return <Navigate to="/candidate/dashboard" replace />
}

function App() {
  const { user } = useAuth()
  const sessionLayoutKey = String(user?.id ?? user?._id ?? 'guest')

  return (
    <Routes>
      <Route element={<AppLayout key={sessionLayoutKey} />}>
        <Route path="/" element={<RouteSegmentBoundary><HomePage /></RouteSegmentBoundary>} />
        <Route path="/login" element={<RouteSegmentBoundary><LoginPage /></RouteSegmentBoundary>} />
        <Route path="/register" element={<RouteSegmentBoundary><RegisterPage /></RouteSegmentBoundary>} />
        <Route path="/forgot-password" element={<RouteSegmentBoundary><ForgotPasswordPage /></RouteSegmentBoundary>} />
        <Route path="/reset-password/:token" element={<RouteSegmentBoundary><ResetPasswordPage /></RouteSegmentBoundary>} />
        <Route path="/jobs" element={<RouteSegmentBoundary><JobsPage /></RouteSegmentBoundary>} />
        <Route path="/jobs/:id" element={<RouteSegmentBoundary><JobDetailsPage /></RouteSegmentBoundary>} />
        <Route path="/companies" element={<RouteSegmentBoundary><CompaniesPage /></RouteSegmentBoundary>} />
        <Route path="/companies/:id" element={<RouteSegmentBoundary><CompanyDetailsPage /></RouteSegmentBoundary>} />
        <Route path="/about" element={<RouteSegmentBoundary><AboutPage /></RouteSegmentBoundary>} />
        <Route path="/contact" element={<RouteSegmentBoundary><ContactPage /></RouteSegmentBoundary>} />
        <Route
          path="/candidate/dashboard"
          element={
            <RouteSegmentBoundary>
              <ProtectedRoute roles={['candidate']}>
                <CandidateDashboardPage />
              </ProtectedRoute>
            </RouteSegmentBoundary>
          }
        />
        <Route
          path="/recruiter"
          element={
            <RouteSegmentBoundary>
              <ProtectedRoute roles={['recruiter']}>
                <RecruiterLayout />
              </ProtectedRoute>
            </RouteSegmentBoundary>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<RecruiterOverviewPage />} />
          <Route path="jobs" element={<RecruiterJobsPage />} />
          <Route path="companies" element={<RecruiterCompaniesPage />} />
          <Route path="interviews" element={<RecruiterInterviewsPage />} />
        </Route>
        <Route
          path="/admin/dashboard"
          element={
            <RouteSegmentBoundary>
              <ProtectedRoute roles={['admin']}>
                <AdminDashboardPage />
              </ProtectedRoute>
            </RouteSegmentBoundary>
          }
        />
        <Route
          path="/admin/users"
          element={
            <RouteSegmentBoundary>
              <ProtectedRoute roles={['admin']}>
                <AdminUsersPage />
              </ProtectedRoute>
            </RouteSegmentBoundary>
          }
        />
        <Route
          path="/admin/jobs"
          element={
            <RouteSegmentBoundary>
              <ProtectedRoute roles={['admin']}>
                <AdminJobsPage />
              </ProtectedRoute>
            </RouteSegmentBoundary>
          }
        />
        <Route
          path="/admin/companies"
          element={
            <RouteSegmentBoundary>
              <ProtectedRoute roles={['admin']}>
                <AdminCompaniesPage />
              </ProtectedRoute>
            </RouteSegmentBoundary>
          }
        />
        <Route
          path="/admin/applications"
          element={
            <RouteSegmentBoundary>
              <ProtectedRoute roles={['admin']}>
                <AdminApplicationsPage />
              </ProtectedRoute>
            </RouteSegmentBoundary>
          }
        />
        <Route
          path="/admin/audit-logs"
          element={
            <RouteSegmentBoundary>
              <ProtectedRoute roles={['admin']}>
                <AdminAuditLogPage />
              </ProtectedRoute>
            </RouteSegmentBoundary>
          }
        />
        <Route path="/dashboard" element={<RouteSegmentBoundary><DashboardRedirect /></RouteSegmentBoundary>} />
        <Route path="/500" element={<RouteSegmentBoundary><ServerErrorPage /></RouteSegmentBoundary>} />
        <Route
          path="/unauthorized"
          element={
            <RouteSegmentBoundary>
              <UnauthorizedPage />
            </RouteSegmentBoundary>
          }
        />
        <Route path="/careers" element={<RouteSegmentBoundary><PlaceholderPage /></RouteSegmentBoundary>} />
        <Route path="/press" element={<RouteSegmentBoundary><PlaceholderPage /></RouteSegmentBoundary>} />
        <Route path="/privacy" element={<RouteSegmentBoundary><PrivacyPage /></RouteSegmentBoundary>} />
        <Route path="/terms" element={<RouteSegmentBoundary><TermsPage /></RouteSegmentBoundary>} />
        <Route path="/cookies" element={<RouteSegmentBoundary><CookiesPage /></RouteSegmentBoundary>} />
        <Route path="/resources/career-tips" element={<RouteSegmentBoundary><PlaceholderPage /></RouteSegmentBoundary>} />
        <Route path="/resources/resume" element={<RouteSegmentBoundary><PlaceholderPage /></RouteSegmentBoundary>} />
        <Route path="/resources/interview" element={<RouteSegmentBoundary><PlaceholderPage /></RouteSegmentBoundary>} />
        <Route path="*" element={<RouteSegmentBoundary><NotFoundPage /></RouteSegmentBoundary>} />
      </Route>
    </Routes>
  )
}
export default App
