import { Link } from 'react-router-dom'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { listUpcomingInterviews } from '../../api/applicationsApi.js'
import { queryKeys } from '../../lib/queryKeys.js'
import { entityId } from '../../features/recruiter/recruiterSchemas.js'

export function RecruiterInterviewsPage() {
  const upcomingInterviewsQuery = useQuery({
    queryKey: queryKeys.recruiter.upcomingInterviews(),
    queryFn: async () => {
      const d = await listUpcomingInterviews()
      return d.interviews ?? []
    },
    placeholderData: keepPreviousData,
  })

  const upcoming = upcomingInterviewsQuery.data || []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Interviews</h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Scheduled interviews across your open roles. Manage candidates from{' '}
          <Link to="/recruiter/jobs" className="font-medium text-indigo-600 hover:underline dark:text-indigo-400">
            Jobs & applicants
          </Link>
          .
        </p>
      </div>

      {upcomingInterviewsQuery.isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-gray-200 dark:bg-gray-800" />
          ))}
        </div>
      )}
      {upcomingInterviewsQuery.isError && (
        <p className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-200">
          Could not load interviews. Try again later.
        </p>
      )}
      {!upcomingInterviewsQuery.isLoading && !upcomingInterviewsQuery.isError && upcoming.length === 0 && (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-10 text-center dark:border-gray-700 dark:bg-gray-900">
          <p className="text-sm font-medium text-gray-900 dark:text-white">No upcoming interviews</p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            When you schedule interviews from an application, they will appear here.
          </p>
          <Link
            to="/recruiter/jobs"
            className="mt-4 inline-flex rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500"
          >
            Go to jobs
          </Link>
        </div>
      )}

      <ul className="space-y-3">
        {upcoming.map((row) => {
          const jobId = entityId(row.job)
          return (
            <li
              key={row._id}
              className="flex flex-col gap-3 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:border-gray-800 dark:bg-gray-900 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="text-base font-semibold text-gray-900 dark:text-white">
                  {row.job?.title || 'Job'}
                  {jobId ? (
                    <Link
                      to={`/jobs/${jobId}`}
                      className="ml-2 text-sm font-normal text-indigo-600 hover:underline dark:text-indigo-400"
                    >
                      View listing
                    </Link>
                  ) : null}
                </p>
                <p className="mt-0.5 text-sm text-gray-600 dark:text-gray-400">{row.candidate?.fullName || 'Candidate'}</p>
                <p className="mt-2 inline-flex items-center gap-2 text-sm font-medium text-indigo-700 dark:text-indigo-300">
                  <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {row.interview?.scheduledAt
                    ? new Date(row.interview.scheduledAt).toLocaleString(undefined, {
                        weekday: 'short',
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })
                    : '—'}
                </p>
                {row.interview?.timezone ? (
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Timezone: {row.interview.timezone}</p>
                ) : null}
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
