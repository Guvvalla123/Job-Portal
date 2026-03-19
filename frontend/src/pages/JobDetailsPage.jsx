import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useParams, Link } from 'react-router-dom'
import { toast } from 'sonner'
import { apiClient } from '../api/apiClient.js'
import { useAuth } from '../context/useAuth.jsx'
import { getApiErrorMessage } from '../utils/getApiErrorMessage.js'
import { SaveJobButton } from '../components/SaveJobButton.jsx'
import { SITE_URL } from '../config/site.js'
import { JobDetailsSkeleton } from '../components/JobDetailsSkeleton.jsx'
import { Modal, Button } from '../components/ui/index.js'
import { queryKeys } from '../lib/queryKeys.js'
import { CACHE_TIERS } from '../lib/queryOptions.js'
import { trackJobApplication } from '../lib/analytics.js'

export function JobDetailsPage() {
  const { id } = useParams()
  const queryClient = useQueryClient()
  const { user, isAuthenticated } = useAuth()
  const [coverLetter, setCoverLetter] = useState('')
  const [applyModalOpen, setApplyModalOpen] = useState(false)

  const detailsQuery = useQuery({
    queryKey: queryKeys.jobs.detail(id),
    queryFn: async () => {
      const response = await apiClient.get(`/jobs/${id}`)
      return response.data.data.job
    },
    staleTime: CACHE_TIERS.detail.staleTime,
    gcTime: CACHE_TIERS.detail.gcTime,
  })

  const myApplicationsQuery = useQuery({
    queryKey: queryKeys.user.applications(),
    queryFn: async () => {
      const response = await apiClient.get('/applications/me')
      return response.data.data.applications
    },
    enabled: isAuthenticated && user?.role === 'candidate',
  })

  const applyMutation = useMutation({
    mutationFn: () => apiClient.post('/applications', { jobId: id, coverLetter }),
    onSuccess: async (response) => {
      toast.success(response.data?.message || 'Application submitted successfully!')
      setApplyModalOpen(false)
      setCoverLetter('')
      const job = detailsQuery.data
      if (job) trackJobApplication(job._id, job.title, job.company?.name)
      await queryClient.invalidateQueries({ queryKey: queryKeys.user.applications() })
      await queryClient.invalidateQueries({ queryKey: queryKeys.jobs.detail(id) })
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'Could not apply to this job.'))
    },
  })

  if (detailsQuery.isLoading) {
    return <JobDetailsSkeleton />
  }
  if (detailsQuery.isError) {
    return <div className="rounded-lg bg-red-50 p-6 text-center text-red-600">Failed to load job details.</div>
  }

  const job = detailsQuery.data
  const alreadyApplied = (myApplicationsQuery.data || []).some(
    (app) => app.job?._id === id || app.job === id,
  )

  const jobPostingSchema = {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    url: `${SITE_URL.replace(/\/$/, '')}/jobs/${id}`,
    title: job.title,
    description: job.description?.slice(0, 500) || job.title,
    datePosted: job.createdAt,
    employmentType: job.employmentType || 'FULL_TIME',
    hiringOrganization: {
      '@type': 'Organization',
      name: job.company?.name,
      sameAs: job.company?.website || undefined,
    },
    jobLocation: {
      '@type': 'Place',
      address: {
        '@type': 'PostalAddress',
        addressLocality: job.location,
      },
    },
    ...(job.minSalary > 0 || job.maxSalary > 0
      ? {
          baseSalary: {
            '@type': 'MonetaryAmount',
            currency: 'USD',
            value: {
              '@type': 'QuantitativeValue',
              minValue: job.minSalary || 0,
              maxValue: job.maxSalary || 0,
              unitText: 'YEAR',
            },
          },
        }
      : {}),
  }

  return (
    <>
      <Helmet>
        <title>{job.title} at {job.company?.name} | JobPortal</title>
        <meta name="description" content={job.description?.slice(0, 160) || `${job.title} - ${job.company?.name}`} />
        <meta property="og:title" content={`${job.title} at ${job.company?.name}`} />
        <meta property="og:description" content={job.description?.slice(0, 160)} />
        <meta property="og:url" content={`${SITE_URL.replace(/\/$/, '')}/jobs/${id}`} />
        <script type="application/ld+json">{JSON.stringify(jobPostingSchema)}</script>
      </Helmet>
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Main content */}
      <div className="lg:col-span-2">
        <section className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{job.title}</h1>
              <p className="mt-1 text-gray-500">
                {job.company?.name} &middot; {job.location}
              </p>
            </div>
            {(job.minSalary > 0 || job.maxSalary > 0) && (
              <span className="rounded-lg bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-700">
                ${job.minSalary?.toLocaleString()} - ${job.maxSalary?.toLocaleString()}
              </span>
            )}
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {job.employmentType && (
              <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                {job.employmentType}
              </span>
            )}
            {job.experienceLevel && (
              <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                {job.experienceLevel}
              </span>
            )}
            {job.createdAt && (
              <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-500">
                Posted {new Date(job.createdAt).toLocaleDateString()}
              </span>
            )}
          </div>

          {job.skills?.length > 0 && (
            <div className="mt-5">
              <h3 className="text-sm font-semibold text-gray-700">Required Skills</h3>
              <div className="mt-2 flex flex-wrap gap-2">
                {job.skills.map((skill) => (
                  <span
                    key={skill}
                    className="rounded-md bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-600"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6 border-t border-gray-100 pt-6">
            <h3 className="text-sm font-semibold text-gray-700">Job Description</h3>
            <p className="mt-3 whitespace-pre-line leading-relaxed text-gray-600">{job.description}</p>
          </div>

          {job.company?.description && (
            <div className="mt-6 border-t border-gray-100 pt-6">
              <h3 className="text-sm font-semibold text-gray-700">About {job.company.name}</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-500">{job.company.description}</p>
            </div>
          )}
        </section>
      </div>

      {/* Sidebar */}
      <div className="lg:col-span-1">
        <div className="sticky top-6 space-y-4">
          {/* Apply card */}
          <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
            {isAuthenticated && user?.role === 'candidate' && (
              <div className="mb-4 flex justify-end">
                <SaveJobButton jobId={job._id} />
              </div>
            )}
            {alreadyApplied && (
              <div className="flex items-center gap-2 rounded-lg bg-emerald-50 p-3">
                <svg className="h-5 w-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm font-semibold text-emerald-700">You've already applied</span>
              </div>
            )}

            {isAuthenticated && user?.role === 'candidate' && !alreadyApplied && (
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">Apply for this position</h3>
                <p className="text-sm text-gray-500">Add a cover letter to stand out from other applicants.</p>
                <Button
                  className="w-full"
                  size="lg"
                  onClick={() => setApplyModalOpen(true)}
                >
                  Apply Now
                </Button>
              </div>
            )}

            {!isAuthenticated && (
              <div className="space-y-3 text-center">
                <p className="text-sm text-gray-500">Sign in to apply for this job</p>
                <Link
                  to="/login"
                  className="block rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700"
                >
                  Sign In to Apply
                </Link>
                <Link
                  to="/register"
                  className="block rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                >
                  Create Account
                </Link>
              </div>
            )}
          </div>

          {/* Company info */}
          {job.company && (
            <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
              <h3 className="text-sm font-semibold text-gray-700">Company Info</h3>
              <p className="mt-2 font-medium text-gray-900">{job.company.name}</p>
              {job.company.location && (
                <p className="mt-1 text-sm text-gray-500">{job.company.location}</p>
              )}
              {job.company.website && (
                <a
                  href={job.company.website}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-block text-sm font-medium text-indigo-600 hover:text-indigo-500"
                >
                  Visit website &rarr;
                </a>
              )}
            </div>
          )}
        </div>
      </div>

      <Modal
        open={applyModalOpen}
        onClose={() => !applyMutation.isPending && setApplyModalOpen(false)}
        title={job ? `Apply for ${job.title}` : 'Apply'}
        size="md"
      >
        <div className="space-y-4">
          {/* Resume preview */}
          <div className="rounded-lg border border-gray-200 bg-gray-50/50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Resume</p>
            {user?.resumeUrl ? (
              <div className="mt-2 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <svg className="h-5 w-5 shrink-0 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="truncate text-sm font-medium text-gray-900">
                    {user?.resumeFileName || 'Resume attached'}
                  </span>
                </div>
                <a
                  href={user.resumeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 text-sm font-semibold text-indigo-600 hover:text-indigo-500"
                >
                  View
                </a>
              </div>
            ) : (
              <div className="mt-2 flex items-start gap-2">
                <svg className="h-5 w-5 shrink-0 text-amber-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-amber-800">No resume uploaded</p>
                  <p className="text-xs text-amber-700 mt-0.5">Upload a resume in your profile to apply.</p>
                  <Link
                    to="/candidate/dashboard?tab=profile"
                    className="mt-2 inline-block text-sm font-semibold text-indigo-600 hover:text-indigo-500"
                    onClick={() => setApplyModalOpen(false)}
                  >
                    Go to Profile &rarr;
                  </Link>
                </div>
              </div>
            )}
          </div>

          <div>
            <label htmlFor="jd-coverLetter" className="mb-1.5 block text-sm font-medium text-gray-700">
              Cover letter (optional)
            </label>
            <textarea
              id="jd-coverLetter"
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              placeholder="Why are you a good fit for this role? Highlight your relevant experience and skills..."
              rows={5}
              disabled={applyMutation.isPending}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-sm transition-colors placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 disabled:bg-gray-50 disabled:cursor-not-allowed"
              aria-describedby="coverLetter-hint"
            />
            <p id="coverLetter-hint" className="mt-1 text-xs text-gray-500">A cover letter can help you stand out from other applicants.</p>
          </div>

          <div className="flex flex-col gap-3 pt-2 sm:flex-row">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => setApplyModalOpen(false)}
              disabled={applyMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              loading={applyMutation.isPending}
              loadingText="Submitting..."
              disabled={!user?.resumeUrl || applyMutation.isPending}
              onClick={() => applyMutation.mutate()}
            >
              Submit Application
            </Button>
          </div>

          {user?.resumeUrl && (
            <p className="text-center text-xs text-gray-500">
              <Link to="/candidate/dashboard?tab=applications" className="font-medium text-indigo-600 hover:text-indigo-500" onClick={() => setApplyModalOpen(false)}>
                View my applications
              </Link>
            </p>
          )}
        </div>
      </Modal>
    </div>
    </>
  )
}
