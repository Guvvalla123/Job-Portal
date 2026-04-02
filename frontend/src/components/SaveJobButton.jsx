import { useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '../lib/queryKeys.js'
import { toast } from 'sonner'
import { toggleSavedJob as toggleSavedJobRequest } from '../api/userApi.js'
import { useAuth } from '../context/useAuth.jsx'
import { getApiErrorMessage } from '../utils/getApiErrorMessage.js'

export function SaveJobButton({ jobId, className = '', variant = 'default' }) {
  const queryClient = useQueryClient()
  const { user, updateUser } = useAuth()
  const isCandidate = user?.role === 'candidate'
  const savedIds = (user?.savedJobs || []).map((j) => (typeof j === 'string' ? j : j?._id)).filter(Boolean)
  const isSaved = savedIds.includes(String(jobId))

  const mutation = useMutation({
    mutationFn: () => toggleSavedJobRequest(jobId),
    onMutate: () => {
      const prevUser = { ...user, savedJobs: [...(user?.savedJobs || [])] }
      const ids = savedIds
      const nextIds = isSaved ? ids.filter((x) => String(x) !== String(jobId)) : [...ids, jobId]
      updateUser({
        ...user,
        savedJobs: nextIds.map((id) => ({ _id: id })),
      })
      return { prevUser }
    },
    onSuccess: async (payload, _vars, ctx) => {
      const { savedJobs } = payload
      updateUser({ ...ctx.prevUser, savedJobs })
      await queryClient.invalidateQueries({ queryKey: queryKeys.user.savedJobs() })
      toast.success('Saved jobs updated')
    },
    onError: (error, _vars, ctx) => {
      if (ctx?.prevUser) updateUser(ctx.prevUser)
      toast.error(getApiErrorMessage(error, 'Could not update saved jobs.'))
    },
  })

  if (!isCandidate) return null

  const iconFilled = (
    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z" />
    </svg>
  )
  const iconOutline = (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
    </svg>
  )

  if (variant === 'icon') {
    return (
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          mutation.mutate()
        }}
        disabled={mutation.isPending}
        className={`inline-flex shrink-0 items-center justify-center rounded-full p-2 transition-colors disabled:opacity-60 dark:focus:outline-none dark:focus-visible:ring-2 dark:focus-visible:ring-indigo-400 ${className} ${
          isSaved
            ? 'bg-indigo-100 text-indigo-700 ring-1 ring-indigo-200 hover:bg-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-200 dark:ring-indigo-800'
            : 'bg-gray-100/80 text-gray-600 ring-1 ring-gray-200/80 hover:bg-gray-200/80 hover:text-gray-800 dark:bg-gray-800/80 dark:text-gray-300 dark:ring-gray-600'
        }`}
        aria-label={isSaved ? 'Remove bookmark' : 'Bookmark job'}
        title={isSaved ? 'Saved' : 'Bookmark'}
      >
        {isSaved ? iconFilled : iconOutline}
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        mutation.mutate()
      }}
      disabled={mutation.isPending}
      className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-60 ${className} ${
        isSaved
          ? 'border-indigo-300 bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
          : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
      }`}
      aria-label={isSaved ? 'Remove bookmark' : 'Bookmark job'}
      title={isSaved ? 'Remove bookmark' : 'Bookmark job'}
    >
      {isSaved ? (
        <>
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z" />
          </svg>
          Saved
        </>
      ) : (
        <>
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
          Save
        </>
      )}
    </button>
  )
}
