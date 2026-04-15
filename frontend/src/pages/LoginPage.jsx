import { useCallback, useEffect, useState } from 'react'
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
  const [mfaCtx, setMfaCtx] = useState(null)
  const [mfaCode, setMfaCode] = useState('')

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

  const finishLoginSession = useCallback(
    async (inner, message) => {
      const { user: userData, accessToken } = inner
      login({ user: userData, accessToken })
      toast.success(message || 'Login successful.')
      try {
        await apiClient.get('/auth/csrf-token')
      } catch {
        /* best-effort */
      }
      try {
        await prefetchDashboardForRole(queryClient, userData.role)
      } catch {
        /* prefetch is best-effort */
      }
      const fromPath = location.state?.from?.pathname
      const targetPath = getPostLoginPath(userData.role, fromPath)
      queueMicrotask(() => {
        navigate(targetPath, { replace: true })
      })
    },
    [login, queryClient, location.state?.from?.pathname, navigate],
  )

  const loginMutation = useMutation({
    mutationFn: (payload) => apiClient.post('/auth/login', payload, { skipGlobalErrorToast: true }),
    onSuccess: async (response) => {
      const inner = response.data?.data
      if (inner?.mfaRequired && inner?.mfaToken) {
        setMfaCtx({ mfaToken: inner.mfaToken })
        setMfaCode('')
        try {
          await apiClient.get('/auth/csrf-token')
        } catch {
          /* cookie may already be set by login response */
        }
        toast.info('Enter the code from your authenticator app.')
        return
      }
      await finishLoginSession(inner, response.data?.message)
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'Login failed.'))
    },
  })

  const mfaMutation = useMutation({
    mutationFn: (payload) =>
      apiClient.post('/auth/mfa/verify-login', payload, { skipGlobalErrorToast: true }),
    onSuccess: async (response) => {
      const inner = response.data?.data
      setMfaCtx(null)
      setMfaCode('')
      await finishLoginSession(inner, response.data?.message)
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'Invalid code or expired challenge.'))
    },
  })

  const onMfaSubmit = (e) => {
    e.preventDefault()
    if (!mfaCtx?.mfaToken) return
    const code = mfaCode.replace(/\s/g, '')
    if (code.length < 6) {
      toast.error('Enter the code from your authenticator app.')
      return
    }
    mfaMutation.mutate({ mfaToken: mfaCtx.mfaToken, code })
  }

  return (
    <AuthLayout
      title="Welcome back. Your next role is closer than you think."
      subtitle="Sign in to manage applications, saved jobs, and your profile—all in one calm, focused workspace."
      bullets={BULLETS}
    >
      <div className="text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-teal-700 text-lg font-semibold text-white shadow-md lg:hidden">
          {SITE_LOGO_MARK}
        </div>
        <h2 className="mt-4 text-2xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-3xl lg:mt-0">
          {mfaCtx ? 'Two-factor authentication' : 'Sign in'}
        </h2>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          {mfaCtx
            ? 'Enter the 6-digit code from your authenticator app.'
            : `Use your ${SITE_NAME} account credentials`}
        </p>
      </div>

      {mfaCtx ? (
        <form className="mt-8 space-y-5" onSubmit={onMfaSubmit}>
          <Input
            id="mfa-code"
            label="Authenticator code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="000000"
            value={mfaCode}
            onChange={(e) => setMfaCode(e.target.value)}
            aria-label="Authenticator code"
          />
          <Button
            type="submit"
            className="w-full"
            variant="gradient"
            size="lg"
            loading={mfaMutation.isPending}
            disabled={mfaMutation.isPending}
          >
            Verify and continue
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="w-full"
            onClick={() => {
              setMfaCtx(null)
              setMfaCode('')
            }}
          >
            Back to sign in
          </Button>
        </form>
      ) : (
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
                className="text-sm font-medium text-teal-700 transition-colors hover:text-[#0C5F5A] dark:text-teal-400 dark:hover:text-teal-300"
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
      )}

      {!mfaCtx ? (
        <p className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
          New user?{' '}
          <Link
            to="/register"
            className="font-semibold text-teal-700 transition-colors hover:text-[#0C5F5A] dark:text-teal-400"
          >
            Create an account
          </Link>
        </p>
      ) : null}
    </AuthLayout>
  )
}
