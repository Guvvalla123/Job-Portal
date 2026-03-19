import { useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '../lib/queryKeys.js'
import { toast } from 'sonner'
import { apiClient } from '../api/apiClient.js'
import { useAuth } from '../context/useAuth.jsx'
import { getApiErrorMessage } from '../utils/getApiErrorMessage.js'

export function SaveJobButton({ jobId, className = '' }) {
  const queryClient = useQueryClient()
  const { user, updateUser } = useAuth()
  const isCandidate = user?.role === 'candidate'
  const savedIds = (user?.savedJobs || []).map((j) => (typeof j === 'string' ? j : j?._id)).filter(Boolean)
  const isSaved = savedIds.includes(jobId)

  const mutation = useMutation({
    mutationFn: () => apiClient.post(`/users/saved-jobs/${jobId}`),
    onSuccess: async (response) => {
      const { savedJobs } = response.data.data
      updateUser({ ...user, savedJobs })
      await queryClient.invalidateQueries({ queryKey: queryKeys.user.savedJobs() })
      toast.success(response.data?.message || (isSaved ? 'Removed from saved' : 'Job saved'))
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'Could not update saved jobs.'))
    },
  })

  if (!isCandidate) return null

  return (
    <button
      type="button"
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); mutation.mutate() }}
      disabled={mutation.isPending}
      className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-60 ${className} ${
        isSaved
          ? 'border-indigo-300 bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
          : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
      }`}
      aria-label={isSaved ? 'Remove from saved' : 'Save job'}
      title={isSaved ? 'Remove from saved' : 'Save job'}
    >
      {isSaved ? (
        <>
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z" /></svg>
          Saved
        </>
      ) : (
        <>
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
          Save
        </>
      )}
    </button>
  )
}
