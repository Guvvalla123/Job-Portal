import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { apiClient } from '../api/apiClient.js'
import { useAuth } from '../context/useAuth.jsx'
import { getApiErrorMessage } from '../utils/getApiErrorMessage.js'
import { Button, Input } from '../components/ui/index.js'
import { prefetchDashboardForRole } from '../lib/prefetchDashboard.js'
import { getPostLoginPath } from '../lib/postLoginRedirect.js'
import { AuthLayout } from '../components/layout/AuthLayout.jsx'
import { SITE_LOGO_MARK, SITE_NAME } from '../config/site.js'

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

const BULLETS = [
  'Discover roles matched to your skills and location.',
  'One profile—apply faster with saved resume and history.',
  'Trusted by candidates and hiring teams every day.',
]

export function LoginPage() {
  const queryClient = useQueryClient()
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    if (location.state?.sessionExpired) {
      toast.info('Your session has expired. Please sign in again.')
      navigate(location.pathname, { replace: true, state: {} })
    }
  }, [location.state?.sessionExpired, location.pathname, navigate])

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    if (params.get('session') === 'expired') {
      toast.info('Your session has expired. Please sign in again.')
      params.delete('session')
      const next = params.toString()
      navigate(`${location.pathname}${next ? `?${next}` : ''}`, { replace: true })
    }
  }, [location.search, location.pathname, navigate])

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: { email: '', password: '' },
    resolver: zodResolver(loginSchema),
  })
  const { login } = useAuth()

  const loginMutation = useMutation({
    mutationFn: (payload) => apiClient.post('/auth/login', payload, { skipGlobalErrorToast: true }),
    onSuccess: async (response) => {
      const { user: userData, accessToken } = response.data.data
      login({ user: userData, accessToken })
      toast.success(response.data?.message || 'Login successful.')
      try {
        await apiClient.get('/auth/csrf-token')
      } catch {
        /* best-effort */
      }
      try {
        await prefetchDashboardForRole(queryClient, userData.role)
      } catch {
        /* prefetch is best-effort; redirect must still run */
      }

      const fromPath = location.state?.from?.pathname
      const targetPath = getPostLoginPath(userData.role, fromPath)
      queueMicrotask(() => {
        navigate(targetPath, { replace: true })
      })
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'Login failed.'))
    },
  })

  return (
    <AuthLayout
      title="Welcome back. Your next role is closer than you think."
      subtitle="Sign in to manage applications, saved jobs, and your profile—all in one calm, focused workspace."
      bullets={BULLETS}
    >
      <div className="text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-indigo-600 text-lg font-semibold text-white shadow-md lg:hidden">
          {SITE_LOGO_MARK}
        </div>
        <h2 className="mt-4 text-2xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-3xl lg:mt-0">
          Sign in
        </h2>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Use your {SITE_NAME} account credentials
        </p>
      </div>
      <form className="mt-8 space-y-5" onSubmit={handleSubmit((v) => loginMutation.mutate(v))}>
        <Input
          id="login-email"
          label="Email address"
          type="email"
          placeholder="you@example.com"
          error={errors.email?.message}
          {...register('email')}
        />
        <div>
          <Input
            id="login-password"
            label="Password"
            type="password"
            placeholder="Enter your password"
            error={errors.password?.message}
            {...register('password')}
          />
          <p className="mt-1.5 text-right">
            <Link
              to="/forgot-password"
              className="text-sm font-medium text-indigo-600 transition-colors hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
            >
              Forgot password?
            </Link>
          </p>
        </div>
        <Button
          type="submit"
          className="w-full"
          variant="gradient"
          size="lg"
          loading={loginMutation.isPending}
          disabled={loginMutation.isPending}
        >
          Sign In
        </Button>
      </form>
      <p className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
        New user?{' '}
        <Link
          to="/register"
          className="font-semibold text-indigo-600 transition-colors hover:text-indigo-500 dark:text-indigo-400"
        >
          Create an account
        </Link>
      </p>
    </AuthLayout>
  )
}
