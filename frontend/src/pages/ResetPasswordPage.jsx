import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { apiClient } from '../api/apiClient.js'
import { getApiErrorMessage } from '../utils/getApiErrorMessage.js'

const schema = z.object({
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

export function ResetPasswordPage() {
  const { token } = useParams()
  const navigate = useNavigate()
  const { register, handleSubmit, formState: { errors } } = useForm({
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
    <div className="flex min-h-[60vh] items-center justify-center">
      <section className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg ring-1 ring-gray-100">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-sm font-bold text-white">
            JP
          </div>
          <h1 className="mt-4 text-2xl font-bold text-gray-900">Set new password</h1>
          <p className="mt-1 text-sm text-gray-500">Enter your new password below.</p>
        </div>
        <form className="mt-8 space-y-5" onSubmit={handleSubmit((v) => mutation.mutate(v))}>
          <div>
            <label htmlFor="reset-password" className="mb-1.5 block text-sm font-medium text-gray-700">
              New password
            </label>
            <input
              {...register('password')}
              id="reset-password"
              type="password"
              placeholder="At least 6 characters"
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-sm transition-colors"
            />
            {errors.password && <p className="mt-1.5 text-sm text-red-600">{errors.password.message}</p>}
          </div>
          <div>
            <label htmlFor="reset-confirm" className="mb-1.5 block text-sm font-medium text-gray-700">
              Confirm password
            </label>
            <input
              {...register('confirmPassword')}
              id="reset-confirm"
              type="password"
              placeholder="Repeat password"
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-sm transition-colors"
            />
            {errors.confirmPassword && <p className="mt-1.5 text-sm text-red-600">{errors.confirmPassword.message}</p>}
          </div>
          <button
            type="submit"
            disabled={mutation.isPending}
            className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:opacity-60"
          >
            {mutation.isPending ? 'Resetting...' : 'Reset password'}
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
