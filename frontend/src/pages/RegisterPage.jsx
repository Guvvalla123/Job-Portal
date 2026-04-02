import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { apiClient } from '../api/apiClient.js'
import { useAuth } from '../context/useAuth.jsx'
import { getApiErrorMessage } from '../utils/getApiErrorMessage.js'
import { trackUserRegistration } from '../lib/analytics.js'
import { prefetchDashboardForRole } from '../lib/prefetchDashboard.js'
import { getPostLoginPath } from '../lib/postLoginRedirect.js'
import { Button, Input } from '../components/ui/index.js'
import { AuthLayout } from '../components/layout/AuthLayout.jsx'
import { SITE_LOGO_MARK, SITE_NAME } from '../config/site.js'

const registerSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9]).+$/,
      'Include one uppercase letter, one number, and one special character',
    ),
  role: z.enum(['candidate', 'recruiter'], { required_error: 'Please select a role' }),
})

const BULLETS = [
  'Candidates: search, save, and apply with a polished profile.',
  'Recruiters: post jobs and manage applicants in one place.',
  'Built for clarity—no clutter, just the tools you need.',
]

const PASSWORD_RULES = [
  { id: 'len', label: '8+ characters', test: (p) => p.length >= 8 },
  { id: 'upper', label: 'One uppercase letter', test: (p) => /[A-Z]/.test(p) },
  { id: 'num', label: 'One number', test: (p) => /[0-9]/.test(p) },
  { id: 'special', label: 'One special character', test: (p) => /[^A-Za-z0-9]/.test(p) },
]

function PasswordRequirements({ password }) {
  const checks = PASSWORD_RULES.map((r) => ({ ...r, ok: r.test(password || '') }))
  const passed = checks.filter((c) => c.ok).length
  const allPass = passed === PASSWORD_RULES.length

  const barWidths = ['w-0', 'w-1/4', 'w-2/4', 'w-3/4', 'w-full']
  const barColors = [
    'bg-gray-300 dark:bg-gray-600',
    'bg-red-500',
    'bg-amber-500',
    'bg-yellow-500',
    'bg-emerald-500',
  ]

  return (
    <div className="mt-2 space-y-2">
      <div className="flex h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
        <div
          className={`h-full rounded-full transition-all duration-300 ease-out ${barWidths[passed]} ${allPass ? 'bg-emerald-500' : barColors[passed]}`}
          role="progressbar"
          aria-valuenow={passed}
          aria-valuemin={0}
          aria-valuemax={4}
        />
      </div>
      <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
        {allPass ? (
          <span className="text-emerald-600 dark:text-emerald-400">Strong password</span>
        ) : passed >= 3 ? (
          <span className="text-amber-600 dark:text-amber-400">Almost there</span>
        ) : passed >= 1 ? (
          <span className="text-amber-700 dark:text-amber-500">Keep going</span>
        ) : (
          <span>Password strength</span>
        )}
      </p>
      <ul className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
        {checks.map((c) => (
          <li key={c.id} className="flex items-center gap-2">
            <span className="w-4 shrink-0 tabular-nums" aria-hidden>
              {c.ok ? '✅' : '❌'}
            </span>
            <span className={c.ok ? 'text-emerald-700 dark:text-emerald-400' : ''}>{c.label}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function RegisterPage() {
  const {
    register,
    watch,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: { fullName: '', email: '', password: '', role: 'candidate' },
    resolver: zodResolver(registerSchema),
  })
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { login } = useAuth()
  const password = watch('password', '')

  const registerMutation = useMutation({
    mutationFn: (payload) => apiClient.post('/auth/register', payload, { skipGlobalErrorToast: true }),
    onSuccess: async (response, payload) => {
      const { user: userData, accessToken } = response.data.data
      login({ user: userData, accessToken })
      toast.success(response.data?.message || 'Welcome! Your account is ready.')
      trackUserRegistration(payload?.role || 'candidate')
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
      const targetPath = getPostLoginPath(userData.role, null)
      queueMicrotask(() => navigate(targetPath, { replace: true }))
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'Registration failed.'))
    },
  })

  return (
    <AuthLayout
      title="Join thousands building their careers here."
      subtitle="Create your account in seconds—whether you’re hiring or job hunting, we keep the experience focused and fast."
      bullets={BULLETS}
    >
      <div className="text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-indigo-600 text-lg font-semibold text-white shadow-md lg:hidden">
          {SITE_LOGO_MARK}
        </div>
        <h2 className="mt-4 text-2xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-3xl lg:mt-0">
          Create your account
        </h2>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Start your journey with {SITE_NAME}</p>
      </div>
      <form className="mt-8 space-y-5" onSubmit={handleSubmit((v) => registerMutation.mutate(v))}>
        <Input
          id="reg-fullName"
          label="Full name"
          placeholder="John Doe"
          error={errors.fullName?.message}
          {...register('fullName')}
        />
        <Input
          id="reg-email"
          label="Email address"
          type="email"
          placeholder="you@example.com"
          error={errors.email?.message}
          {...register('email')}
        />
        <div>
          <Input
            id="reg-password"
            label="Password"
            type="password"
            placeholder="8+ characters, upper, number, symbol"
            error={errors.password?.message}
            hint="8+ characters with uppercase, number, and special character"
            {...register('password')}
          />
          <PasswordRequirements password={password} />
        </div>
        <div>
          <label htmlFor="reg-role" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
            I want to
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex cursor-pointer items-center gap-2 rounded-xl border-2 border-gray-200 bg-white/50 px-4 py-3 text-sm font-medium transition-all duration-200 hover:border-indigo-200 hover:shadow-md has-checked:border-indigo-600 has-checked:bg-indigo-50 has-checked:shadow-md has-checked:ring-2 has-checked:ring-indigo-500/20 dark:border-gray-600 dark:bg-gray-800/50 dark:hover:border-indigo-500/50 dark:has-checked:bg-indigo-950/50 dark:has-checked:border-indigo-500">
              <input {...register('role')} type="radio" value="candidate" className="accent-indigo-600" />
              <span className="text-gray-700 dark:text-gray-200">Find a job</span>
            </label>
            <label className="flex cursor-pointer items-center gap-2 rounded-xl border-2 border-gray-200 bg-white/50 px-4 py-3 text-sm font-medium transition-all duration-200 hover:border-indigo-200 hover:shadow-md has-checked:border-indigo-600 has-checked:bg-indigo-50 has-checked:shadow-md has-checked:ring-2 has-checked:ring-indigo-500/20 dark:border-gray-600 dark:bg-gray-800/50 dark:hover:border-indigo-500/50 dark:has-checked:bg-indigo-950/50 dark:has-checked:border-indigo-500">
              <input {...register('role')} type="radio" value="recruiter" className="accent-indigo-600" />
              <span className="text-gray-700 dark:text-gray-200">Hire talent</span>
            </label>
          </div>
          {errors.role && (
            <p className="mt-1.5 text-sm text-red-600 dark:text-red-400" role="alert">
              {errors.role.message}
            </p>
          )}
        </div>
        <Button
          type="submit"
          className="w-full"
          variant="gradient"
          size="lg"
          loading={registerMutation.isPending}
          disabled={registerMutation.isPending}
        >
          Create Account
        </Button>
      </form>
      <p className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
        Already have an account?{' '}
        <Link to="/login" className="font-semibold text-indigo-600 transition-colors hover:text-indigo-500 dark:text-indigo-400">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  )
}
