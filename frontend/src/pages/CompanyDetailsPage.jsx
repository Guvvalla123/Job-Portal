import { Helmet } from 'react-helmet-async'
import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '../lib/queryKeys.js'
import { CACHE_TIERS } from '../lib/queryOptions.js'
import { useParams, Link } from 'react-router-dom'
import { apiClient } from '../api/apiClient.js'
import { SaveJobButton } from '../components/SaveJobButton.jsx'
import { formatSalaryRange } from '../utils/formatSalary.js'

const TYPE_COLORS = {
  'full-time': 'bg-emerald-50 text-emerald-700',
  'part-time': 'bg-teal-50 text-teal-700 dark:bg-teal-950/50 dark:text-teal-300',
  contract: 'bg-amber-50 text-amber-700',
  internship: 'bg-purple-50 text-purple-700',
}

export function CompanyDetailsPage() {
  const { id } = useParams()

  const query = useQuery({
    queryKey: queryKeys.companies.detail(id),
    queryFn: async () => {
      const response = await apiClient.get(`/companies/${id}`)
      return response.data.data
    },
    staleTime: CACHE_TIERS.detail.staleTime,
    gcTime: CACHE_TIERS.detail.gcTime,
  })

  if (query.isLoading) return <div className="py-12 text-center text-gray-500">Loading company...</div>
  if (query.isError) return <div className="rounded-lg bg-red-50 p-6 text-center text-red-600">Company not found.</div>

  const { company, jobs } = query.data || {}

  return (
    <>
      <Helmet>
        <title>{company?.name} | CareerSync</title>
        <meta name="description" content={company?.description?.slice(0, 160) || `Jobs at ${company?.name}`} />
      </Helmet>
    <div className="space-y-6">
      <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          {company?.logoUrl ? (
            <img src={company.logoUrl} alt="" className="h-20 w-20 rounded-xl object-cover" loading="lazy" />
          ) : (
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-teal-100 text-2xl font-bold text-teal-700">
              {company?.name?.charAt(0)?.toUpperCase() || 'C'}
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{company?.name}</h1>
            {company?.location && <p className="mt-1 text-gray-500">{company.location}</p>}
            {company?.website && (
              <a href={company.website} target="_blank" rel="noreferrer" className="mt-2 inline-block text-sm font-medium text-teal-700 hover:text-[#0C5F5A]">
                Visit website &rarr;
              </a>
            )}
            {company?.description && (
              <p className="mt-4 text-sm leading-relaxed text-gray-600">{company.description}</p>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-xl bg-white shadow-sm ring-1 ring-gray-100">
        <div className="border-b border-gray-100 px-6 py-4">
          <h2 className="font-semibold text-gray-900">Open positions ({jobs?.length || 0})</h2>
        </div>
        {jobs?.length > 0 ? (
          <div className="divide-y divide-gray-50">
            {jobs.map((job) => (
              <div key={job._id} className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 flex-1">
                  <Link to={`/jobs/${job._id}`} className="font-medium text-gray-900 hover:text-teal-700">{job.title}</Link>
                  <p className="mt-0.5 text-sm text-gray-500">{job.location}</p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {job.employmentType && (
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${TYPE_COLORS[job.employmentType] || 'bg-gray-100 text-gray-600'}`}>{job.employmentType}</span>
                    )}
                    {(job.minSalary > 0 || job.maxSalary > 0) && (
                      <span className="text-xs font-medium text-emerald-600">{formatSalaryRange(job.minSalary, job.maxSalary)}</span>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <SaveJobButton jobId={job._id} />
                  <Link to={`/jobs/${job._id}`} className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-[#0C5F5A]">View & Apply</Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-6 py-12 text-center text-sm text-gray-500">No open positions at the moment.</div>
        )}
      </div>
    </div>
    </>
  )
}
