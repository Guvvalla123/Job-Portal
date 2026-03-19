import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { apiClient } from '../api/apiClient.js'
import { getApiErrorMessage } from '../utils/getApiErrorMessage.js'

const schema = z.object({
  email: z.string().email('Please enter a valid email address'),
})

export function ForgotPasswordPage() {
  const { register, handleSubmit, formState: { errors } } = useForm({
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
    <div className="flex min-h-[60vh] items-center justify-center">
      <section className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg ring-1 ring-gray-100">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-sm font-bold text-white">
            JP
          </div>
          <h1 className="mt-4 text-2xl font-bold text-gray-900">Forgot password?</h1>
          <p className="mt-1 text-sm text-gray-500">Enter your email and we&apos;ll send you a reset link.</p>
        </div>
        <form className="mt-8 space-y-5" onSubmit={handleSubmit((v) => mutation.mutate(v))}>
          <div>
            <label htmlFor="forgot-email" className="mb-1.5 block text-sm font-medium text-gray-700">
              Email address
            </label>
            <input
              {...register('email')}
              id="forgot-email"
              type="email"
              placeholder="you@example.com"
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-sm transition-colors"
            />
            {errors.email && <p className="mt-1.5 text-sm text-red-600">{errors.email.message}</p>}
          </div>
          <button
            type="submit"
            disabled={mutation.isPending}
            className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:opacity-60"
          >
            {mutation.isPending ? 'Sending...' : 'Send reset link'}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-gray-500">
          <Link to="/login" className="font-semibold text-indigo-600 hover:text-indigo-500">
            Back to sign in
          </Link>
        </p>
      </section>
    </div>
  )
}
