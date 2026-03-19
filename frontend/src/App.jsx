import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from './layouts/AppLayout.jsx'
import { ProtectedRoute } from './components/ProtectedRoute.jsx'
import { useAuth } from './context/useAuth.jsx'

const HomePage = lazy(() => import('./pages/HomePage.jsx').then((m) => ({ default: m.HomePage })))
const LoginPage = lazy(() => import('./pages/LoginPage.jsx').then((m) => ({ default: m.LoginPage })))
const RegisterPage = lazy(() => import('./pages/RegisterPage.jsx').then((m) => ({ default: m.RegisterPage })))
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage.jsx').then((m) => ({ default: m.ForgotPasswordPage })))
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage.jsx').then((m) => ({ default: m.ResetPasswordPage })))
const JobsPage = lazy(() => import('./pages/JobsPage.jsx').then((m) => ({ default: m.JobsPage })))
const JobDetailsPage = lazy(() => import('./pages/JobDetailsPage.jsx').then((m) => ({ default: m.JobDetailsPage })))
const CompaniesPage = lazy(() => import('./pages/CompaniesPage.jsx').then((m) => ({ default: m.CompaniesPage })))
const CompanyDetailsPage = lazy(() => import('./pages/CompanyDetailsPage.jsx').then((m) => ({ default: m.CompanyDetailsPage })))
const CandidateDashboardPage = lazy(() => import('./pages/candidate/CandidateDashboardPage.jsx').then((m) => ({ default: m.CandidateDashboardPage })))
const RecruiterDashboardPage = lazy(() => import('./pages/recruiter/RecruiterDashboardPage.jsx').then((m) => ({ default: m.RecruiterDashboardPage })))
const AdminDashboardPage = lazy(() => import('./pages/admin/AdminDashboardPage.jsx').then((m) => ({ default: m.AdminDashboardPage })))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage.jsx').then((m) => ({ default: m.NotFoundPage })))
const ServerErrorPage = lazy(() => import('./pages/ServerErrorPage.jsx').then((m) => ({ default: m.ServerErrorPage })))
const PlaceholderPage = lazy(() => import('./pages/PlaceholderPage.jsx').then((m) => ({ default: m.PlaceholderPage })))

function PageLoader() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
    </div>
  )
}

function DashboardRedirect() {
  const { user, loading } = useAuth()
  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
      </div>
    )
  }
  if (!user) return <Navigate to="/login" replace state={{ from: { pathname: '/dashboard' } }} />
  if (user.role === 'recruiter') return <Navigate to="/recruiter/dashboard" replace />
  if (user.role === 'admin') return <Navigate to="/admin/dashboard" replace />
  return <Navigate to="/candidate/dashboard" replace />
}

function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
          <Route path="/jobs" element={<JobsPage />} />
          <Route path="/jobs/:id" element={<JobDetailsPage />} />
          <Route path="/companies" element={<CompaniesPage />} />
          <Route path="/companies/:id" element={<CompanyDetailsPage />} />
          <Route
            path="/candidate/dashboard"
            element={
              <ProtectedRoute roles={['candidate']}>
                <CandidateDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/recruiter/dashboard"
            element={
              <ProtectedRoute roles={['recruiter']}>
                <RecruiterDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute roles={['admin']}>
                <AdminDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route path="/dashboard" element={<DashboardRedirect />} />
          <Route path="/500" element={<ServerErrorPage />} />
          <Route path="/about" element={<PlaceholderPage />} />
          <Route path="/careers" element={<PlaceholderPage />} />
          <Route path="/contact" element={<PlaceholderPage />} />
          <Route path="/press" element={<PlaceholderPage />} />
          <Route path="/privacy" element={<PlaceholderPage />} />
          <Route path="/terms" element={<PlaceholderPage />} />
          <Route path="/cookies" element={<PlaceholderPage />} />
          <Route path="/resources/career-tips" element={<PlaceholderPage />} />
          <Route path="/resources/resume" element={<PlaceholderPage />} />
          <Route path="/resources/interview" element={<PlaceholderPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </Suspense>
  )
}
export default App
