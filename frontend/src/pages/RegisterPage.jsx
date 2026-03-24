import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { apiClient } from '../api/apiClient.js'
import { getApiErrorMessage } from '../utils/getApiErrorMessage.js'
import { trackUserRegistration } from '../lib/analytics.js'
import { PasswordStrength } from '../components/PasswordStrength.jsx'
import { Button, Input } from '../components/ui/index.js'
import { AuthLayout } from '../components/layout/AuthLayout.jsx'

const registerSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['candidate', 'recruiter'], { required_error: 'Please select a role' }),
})

const BULLETS = [
  'Candidates: search, save, and apply with a polished profile.',
  'Recruiters: post jobs and manage applicants in one place.',
  'Built for clarity—no clutter, just the tools you need.',
]

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
  const password = watch('password', '')

  const registerMutation = useMutation({
    mutationFn: (payload) => apiClient.post('/auth/register', payload),
    onSuccess: (response, payload) => {
      toast.success(response.data?.message || 'Registration successful! Please sign in.')
      trackUserRegistration(payload?.role || 'candidate')
      navigate('/login')
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
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-600 text-lg font-bold text-white shadow-lg shadow-indigo-500/30 lg:hidden">
          JP
        </div>
        <h2 className="mt-4 text-2xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-3xl lg:mt-0">
          Create your account
        </h2>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Start your journey with JobPortal</p>
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
            placeholder="At least 6 characters"
            error={errors.password?.message}
            hint="Minimum 6 characters"
            {...register('password')}
          />
          <PasswordStrength password={password} />
        </div>
        <div>
          <label htmlFor="reg-role" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
            I want to
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex cursor-pointer items-center gap-2 rounded-xl border-2 border-gray-200 bg-white/50 px-4 py-3 text-sm font-medium transition-all duration-200 hover:border-indigo-200 hover:shadow-md has-[:checked]:border-indigo-600 has-[:checked]:bg-indigo-50 has-[:checked]:shadow-md has-[:checked]:ring-2 has-[:checked]:ring-indigo-500/20 dark:border-gray-600 dark:bg-gray-800/50 dark:hover:border-indigo-500/50 dark:has-[:checked]:bg-indigo-950/50 dark:has-[:checked]:border-indigo-500">
              <input {...register('role')} type="radio" value="candidate" className="accent-indigo-600" />
              <span className="text-gray-700 dark:text-gray-200">Find a job</span>
            </label>
            <label className="flex cursor-pointer items-center gap-2 rounded-xl border-2 border-gray-200 bg-white/50 px-4 py-3 text-sm font-medium transition-all duration-200 hover:border-indigo-200 hover:shadow-md has-[:checked]:border-indigo-600 has-[:checked]:bg-indigo-50 has-[:checked]:shadow-md has-[:checked]:ring-2 has-[:checked]:ring-indigo-500/20 dark:border-gray-600 dark:bg-gray-800/50 dark:hover:border-indigo-500/50 dark:has-[:checked]:bg-indigo-950/50 dark:has-[:checked]:border-indigo-500">
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
