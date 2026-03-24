import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { apiClient } from '../api/apiClient.js'
import { getApiErrorMessage } from '../utils/getApiErrorMessage.js'
import { Button, Input } from '../components/ui/index.js'
import { AuthLayout } from '../components/layout/AuthLayout.jsx'

const schema = z.object({
  email: z.string().email('Please enter a valid email address'),
})

const BULLETS = [
  'Secure reset links expire automatically for your safety.',
  'We never show whether an email exists—privacy by design.',
  'Back to sign in anytime if you remember your password.',
]

export function ForgotPasswordPage() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: { email: '' },
    resolver: zodResolver(schema),
  })

  const mutation = useMutation({
    mutationFn: (payload) => apiClient.post('/auth/forgot-password', payload),
    onSuccess: () => {
      toast.success('If an account exists with this email, you will receive a reset link.')
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'Could not send reset email.'))
    },
  })

  return (
    <AuthLayout
      title="Reset your password with confidence."
      subtitle="Enter the email you used to register. If an account exists, we’ll send you a link to choose a new password."
      bullets={BULLETS}
    >
      <div className="text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-600 text-lg font-bold text-white shadow-lg shadow-indigo-500/30 lg:hidden">
          JP
        </div>
        <h2 className="mt-4 text-2xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-3xl lg:mt-0">
          Forgot password?
        </h2>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Enter your email and we&apos;ll send you a reset link.
        </p>
      </div>
      <form className="mt-8 space-y-5" onSubmit={handleSubmit((v) => mutation.mutate(v))}>
        <Input
          id="forgot-email"
          label="Email address"
          type="email"
          placeholder="you@example.com"
          error={errors.email?.message}
          {...register('email')}
        />
        <Button
          type="submit"
          className="w-full"
          variant="gradient"
          size="lg"
          loading={mutation.isPending}
          disabled={mutation.isPending}
        >
          Send reset link
        </Button>
      </form>
      <p className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
        <Link to="/login" className="font-semibold text-indigo-600 transition-colors hover:text-indigo-500 dark:text-indigo-400">
          Back to sign in
        </Link>
      </p>
    </AuthLayout>
  )
}
