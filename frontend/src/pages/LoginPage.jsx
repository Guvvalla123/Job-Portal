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

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

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
    mutationFn: (payload) => apiClient.post('/auth/login', payload),
    onSuccess: async (response) => {
      const { user: userData, accessToken, refreshToken } = response.data.data
      login({ user: userData, accessToken, refreshToken })
      toast.success(response.data?.message || 'Login successful.')

      await prefetchDashboardForRole(queryClient, userData.role)

      const targetPath = location.state?.from?.pathname || '/dashboard'
      navigate(targetPath, { replace: true })
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'Login failed.'))
    },
  })

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-12">
      <section className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl ring-1 ring-gray-200/80 sm:p-10">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-700 text-lg font-bold text-white shadow-lg shadow-indigo-500/25">
            JP
          </div>
          <h1 className="mt-6 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">Welcome back</h1>
          <p className="mt-2 text-sm text-gray-500">Sign in to your JobPortal account</p>
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
              <Link to="/forgot-password" className="text-sm font-medium text-indigo-600 hover:text-indigo-500 transition-colors">
                Forgot password?
              </Link>
            </p>
          </div>
          <Button
            type="submit"
            className="w-full"
            loading={loginMutation.isPending}
            disabled={loginMutation.isPending}
          >
            Sign In
          </Button>
        </form>
        <p className="mt-8 text-center text-sm text-gray-500">
          New user?{' '}
          <Link to="/register" className="font-semibold text-indigo-600 hover:text-indigo-500 transition-colors">
            Create an account
          </Link>
        </p>
      </section>
    </div>
  )
}
