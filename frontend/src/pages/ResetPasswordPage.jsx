import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { apiClient } from '../api/apiClient.js'
import { getApiErrorMessage } from '../utils/getApiErrorMessage.js'
import { Button, Input } from '../components/ui/index.js'
import { AuthLayout } from '../components/layout/AuthLayout.jsx'
import { SITE_LOGO_MARK } from '../config/site.js'

const schema = z
  .object({
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(
        /^(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9]).+$/,
        'Include one uppercase letter, one number, and one special character',
      ),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

const BULLETS = [
  'Choose a strong password you don’t use on other sites.',
  'You’ll be signed out elsewhere until you log in again.',
  'Need help? Contact support from the footer anytime.',
]

export function ResetPasswordPage() {
  const { token } = useParams()
  const navigate = useNavigate()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: { password: '', confirmPassword: '' },
    resolver: zodResolver(schema),
  })

  const mutation = useMutation({
    mutationFn: (payload) => apiClient.post(`/auth/reset-password/${token}`, { password: payload.password }),
    onSuccess: () => {
      toast.success('Password reset successful. You can now sign in.')
      navigate('/login')
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'Could not reset password.'))
    },
  })

  return (
    <AuthLayout
      title="Choose a fresh password."
      subtitle="Your reset link is valid for a limited time. Pick something memorable and unique to this account."
      bullets={BULLETS}
    >
      <div className="text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-teal-700 text-lg font-semibold text-white shadow-md lg:hidden">
          {SITE_LOGO_MARK}
        </div>
        <h2 className="mt-4 text-2xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-3xl lg:mt-0">
          Set new password
        </h2>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Enter your new password below.</p>
      </div>
      <form className="mt-8 space-y-5" onSubmit={handleSubmit((v) => mutation.mutate(v))}>
        <Input
          id="reset-password"
          label="New password"
          type="password"
          placeholder="At least 6 characters"
          error={errors.password?.message}
          {...register('password')}
        />
        <Input
          id="reset-confirm"
          label="Confirm password"
          type="password"
          placeholder="Repeat password"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />
        <Button
          type="submit"
          className="w-full"
          variant="gradient"
          size="lg"
          loading={mutation.isPending}
          disabled={mutation.isPending}
        >
          Reset password
        </Button>
      </form>
      <p className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
        <Link to="/login" className="font-semibold text-teal-700 transition-colors hover:text-[#0C5F5A] dark:text-teal-400">
          Back to sign in
        </Link>
      </p>
    </AuthLayout>
  )
}
