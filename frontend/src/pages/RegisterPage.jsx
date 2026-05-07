import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { apiClient } from '../api/apiClient.js'
import { getApiErrorMessage } from '../utils/getApiErrorMessage.js'
import { trackUserRegistration } from '../lib/analytics.js'
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

function PasswordRequirementMetIcon() {
  return (
    <svg className="h-4 w-4 text-green-500" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
        clipRule="evenodd"
      />
    </svg>
  )
}

function PasswordRequirementUnmetIcon() {
  return (
    <svg
      className="h-4 w-4 text-gray-300 dark:text-gray-600"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden
    >
      <circle cx="12" cy="12" r="9" />
      <path strokeLinecap="round" d="M9 12h6" />
    </svg>
  )
}

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
      <ul className="space-y-1">
        {checks.map((c) => (
          <li key={c.id} className="flex items-center gap-2 text-sm">
            <span className="shrink-0" aria-hidden>
              {c.ok ? <PasswordRequirementMetIcon /> : <PasswordRequirementUnmetIcon />}
            </span>
            <span
              className={
                c.ok ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400 dark:text-gray-500'
              }
            >
              {c.label}
            </span>
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
    defaultValues: { fullName: '', email: '', password: '' },
    resolver: zodResolver(registerSchema),
  })
  const navigate = useNavigate()
  const password = watch('password', '')

  const registerMutation = useMutation({
    mutationFn: (payload) => apiClient.post('/auth/register', payload, { skipGlobalErrorToast: true }),
    onSuccess: (_response, payload) => {
      toast.success('Account created successfully! Please sign in to continue.')
      trackUserRegistration(payload?.role || 'candidate')
      queueMicrotask(() => navigate('/login', { replace: true }))
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
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-teal-700 text-lg font-semibold text-white shadow-md lg:hidden">
          {SITE_LOGO_MARK}
        </div>
        <h2 className="mt-4 text-2xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-3xl lg:mt-0">
          Create your account
        </h2>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Start your journey with {SITE_NAME}</p>
      </div>
      <form
        className="mt-8 space-y-5"
        onSubmit={handleSubmit((v) => registerMutation.mutate({ ...v, role: 'candidate' }))}
      >
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
        <Button
          type="submit"
          className="w-full"
          variant="gradient"
          size="lg"
          loading={registerMutation.isPending}
          loadingText="Creating account…"
          disabled={registerMutation.isPending}
        >
          Create Account
        </Button>
      </form>
      <p className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
        Already have an account?{' '}
        <Link to="/login" className="font-semibold text-teal-700 transition-colors hover:text-[#0C5F5A] dark:text-teal-400">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  )
}
