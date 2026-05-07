import { useEffect, useMemo, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { getJobById } from '../api/jobsApi.js'
import { listMyApplications, applyToJob } from '../api/applicationsApi.js'
import { useAuth } from '../context/useAuth.jsx'
import { getApiErrorMessage } from '../utils/getApiErrorMessage.js'
import { SaveJobButton } from '../components/SaveJobButton.jsx'
import { SITE_URL } from '../config/site.js'
import { JobDetailsSkeleton } from '../components/JobDetailsSkeleton.jsx'
import { Modal, Button, Skeleton, Card, EmptyState, EmptyStateIcons } from '../components/ui/index.js'
import { queryKeys } from '../lib/queryKeys.js'
import { CACHE_TIERS } from '../lib/queryOptions.js'
import { trackJobApplication } from '../lib/analytics.js'
import { formatSalaryRange } from '../utils/formatSalary.js'
import { shareJobListing } from '../utils/shareJobListing.js'
import { LazyResumeViewer } from '../components/resume/LazyResumeViewer.jsx'

/** Classify axios/react-query errors for copy only (no fetch logic changes). */
function classifyJobDetailsQueryError(error) {
  const status = error?.response?.status
  const code = error?.code
  const msg = String(error?.message || '').toLowerCase()
  if (status === 404) return 'not_found'
  if (status != null && status >= 500) return 'server'
  if (!error?.response && (code === 'ERR_NETWORK' || code === 'ECONNABORTED' || msg.includes('network')))
    return 'network'
  return 'generic'
}

function JobDetailsErrorCard({ kind, onRetry, isFetching }) {
  const copy = {
    server: {
      description: 'Our servers are having issues. Please try again in a moment.',
    },
    network: {
      description: 'Check your internet connection and try again.',
    },
    generic: {
      description: 'Something went wrong. Please try again.',
    },
  }[kind] || { description: 'Something went wrong. Please try again.' }

  return (
    <Card
      padding="lg"
      className="border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20"
    >
      <div className="flex flex-col items-center text-center">
        <div
          className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600 ring-1 ring-red-200/80 dark:bg-red-950/60 dark:text-red-400 dark:ring-red-800/60"
          aria-hidden
        >
          <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 9l-6 6M9 9l6 6" />
          </svg>
        </div>
        <h2 className="mt-4 text-lg font-semibold text-red-900 dark:text-red-100" id="job-details-error-title">
          Failed to load job details
        </h2>
        <p className="mt-2 max-w-md text-sm text-red-800/90 dark:text-red-200/90" role="alert" aria-labelledby="job-details-error-title">
          {copy.description}
        </p>
        <div className="mt-6">
          <Button
            type="button"
            variant="primary"
            size="md"
            loading={isFetching}
            loadingText="Retrying..."
            onClick={onRetry}
          >
            Retry
          </Button>
        </div>
      </div>
    </Card>
  )
}

const JOB_DESCRIPTION_WORD_LIMIT = 300

function JobShareIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.935-2.186 2.25 2.25 0 00-3.935 2.186z"
      />
    </svg>
  )
}

function TrustApplyShieldIcon() {
  return (
    <svg className="h-4 w-4 shrink-0 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
      />
    </svg>
  )
}

function parseDescriptionParagraphs(text) {
  if (!text || typeof text !== 'string') return []
  const trimmed = text.trim()
  if (!trimmed) return []
  return trimmed
    .split(/\n\s*\n/)
    .flatMap((chunk) =>
      chunk
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean),
    )
}

function countWordsInParagraphs(paragraphs) {
  return paragraphs.reduce((n, p) => n + p.split(/\s+/).filter(Boolean).length, 0)
}

function truncateParagraphsToWords(paragraphs, maxWords) {
  const result = []
  let count = 0
  for (const p of paragraphs) {
    const words = p.split(/\s+/).filter(Boolean)
    if (words.length === 0) continue
    if (count + words.length <= maxWords) {
      result.push(p)
      count += words.length
    } else {
      const take = maxWords - count
      if (take > 0) {
        result.push(`${words.slice(0, take).join(' ')}…`)
      }
      break
    }
  }
  return result
}

export function JobDetailsPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user, isAuthenticated } = useAuth()
  const [coverLetter, setCoverLetter] = useState('')
  const [applyModalOpen, setApplyModalOpen] = useState(false)
  const [resumePreviewOpen, setResumePreviewOpen] = useState(false)
  const [descriptionExpanded, setDescriptionExpanded] = useState(false)

  const requireLoginForApply = () => {
    if (user) return true
    toast.info('Please login in order to apply for this job')
    return false
  }

  const detailsQuery = useQuery({
    queryKey: queryKeys.jobs.detail(id),
    queryFn: () => getJobById(id),
    staleTime: CACHE_TIERS.detail.staleTime,
    gcTime: CACHE_TIERS.detail.gcTime,
  })

  const myApplicationsQuery = useQuery({
    queryKey: queryKeys.user.applications(),
    queryFn: async () => {
      const d = await listMyApplications({ page: 1, limit: 50 })
      return d.applications ?? []
    },
    enabled: isAuthenticated && user?.role === 'candidate',
  })

  const applyMutation = useMutation({
    mutationFn: () => applyToJob({ jobId: id, coverLetter }),
    onSuccess: async () => {
      toast.success('Application submitted successfully!')
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

  const rawJobDescription = detailsQuery.data?.description
  const descriptionParagraphs = useMemo(
    () => parseDescriptionParagraphs(rawJobDescription),
    [rawJobDescription],
  )
  const descriptionWordCount = useMemo(
    () => countWordsInParagraphs(descriptionParagraphs),
    [descriptionParagraphs],
  )

  useEffect(() => {
    setDescriptionExpanded(false)
  }, [id])

  if (detailsQuery.isPending) {
    return <JobDetailsSkeleton />
  }

  const loadErrorKind = detailsQuery.isError ? classifyJobDetailsQueryError(detailsQuery.error) : null

  if (detailsQuery.isError && loadErrorKind === 'not_found') {
    return (
      <>
        <Helmet>
          <title>Job not found | CareerSync</title>
          <meta name="robots" content="noindex" />
        </Helmet>
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm ring-1 ring-gray-100 dark:border-gray-800 dark:bg-gray-900 dark:ring-gray-800">
          <EmptyState
            icon={EmptyStateIcons.jobs}
            title="Job not found"
            description="This job may have expired or been removed by the company."
            actionLabel="Browse all jobs"
            actionHref="/jobs"
          />
        </div>
      </>
    )
  }

  if (detailsQuery.isError) {
    return (
      <>
        <Helmet>
          <title>Could not load job | CareerSync</title>
        </Helmet>
        <JobDetailsErrorCard
          kind={loadErrorKind}
          onRetry={() => detailsQuery.refetch()}
          isFetching={detailsQuery.isFetching}
        />
      </>
    )
  }

  const job = detailsQuery.data
  const displayDescriptionParagraphs =
    descriptionExpanded || descriptionWordCount <= JOB_DESCRIPTION_WORD_LIMIT
      ? descriptionParagraphs
      : truncateParagraphsToWords(descriptionParagraphs, JOB_DESCRIPTION_WORD_LIMIT)

  if (!job) {
    return (
      <>
        <Helmet>
          <title>Job not found | CareerSync</title>
          <meta name="robots" content="noindex" />
        </Helmet>
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm ring-1 ring-gray-100 dark:border-gray-800 dark:bg-gray-900 dark:ring-gray-800">
          <EmptyState
            icon={EmptyStateIcons.jobs}
            title="Job not found"
            description="This job may have expired or been removed by the company."
            actionLabel="Browse all jobs"
            actionHref="/jobs"
          />
        </div>
      </>
    )
  }
  /** `resumeUrl` is omitted from API JSON; rely on `hasResume` / filename (stream uses `/users/profile/resume/file`). */
  const candidateHasResume = Boolean(
    user?.hasResume || user?.resumeFileName?.trim() || user?.resumeUrl,
  )
  const applicationRecord = useMemo(
    () => (myApplicationsQuery.data || []).find((app) => app.job?._id === id || app.job === id),
    [myApplicationsQuery.data, id],
  )
  const alreadyApplied = Boolean(applicationRecord)
  const appliedOnLabel = applicationRecord?.createdAt
    ? new Date(applicationRecord.createdAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : null

  const shareThisJob = () => {
    void shareJobListing({
      title: job.title,
      companyName: job.company?.name,
      url: typeof window !== 'undefined' ? window.location.href : '',
    })
  }

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
            currency: 'INR',
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
        <title>{job.title} at {job.company?.name} | CareerSync</title>
        <meta name="description" content={job.description?.slice(0, 160) || `${job.title} - ${job.company?.name}`} />
        <meta property="og:title" content={`${job.title} at ${job.company?.name}`} />
        <meta property="og:description" content={job.description?.slice(0, 160)} />
        <meta property="og:url" content={`${SITE_URL.replace(/\/$/, '')}/jobs/${id}`} />
        <script type="application/ld+json">{JSON.stringify(jobPostingSchema)}</script>
      </Helmet>
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Main content */}
      <div className="lg:col-span-2">
        <section className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100 dark:bg-gray-900 dark:ring-gray-800 sm:p-8">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="mb-4 block w-fit cursor-pointer border-0 bg-transparent p-0 text-left font-inherit text-sm text-gray-500 hover:text-teal-600 dark:text-gray-400 dark:hover:text-teal-400"
          >
            ← Back to Jobs
          </button>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{job.title}</h1>
              <p className="mt-1 text-gray-500 dark:text-gray-400">
                {job.company?.name} &middot; {job.location}
              </p>
            </div>
            {(job.minSalary > 0 || job.maxSalary > 0) && (
              <span className="rounded-lg bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                {formatSalaryRange(job.minSalary, job.maxSalary)}
              </span>
            )}
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {job.employmentType && (
              <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700 dark:bg-teal-900/30 dark:text-teal-300">
                {job.employmentType}
              </span>
            )}
            {job.experienceLevel && (
              <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                {job.experienceLevel}
              </span>
            )}
            {job.createdAt && (
              <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                Posted {new Date(job.createdAt).toLocaleDateString()}
              </span>
            )}
          </div>

          {job.skills?.length > 0 && (
            <div className="mt-5">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-white">Required Skills</h3>
              <div className="mt-2 flex flex-wrap gap-2">
                {job.skills.map((skill) => (
                  <span
                    key={skill}
                    className="rounded-md bg-teal-50 px-3 py-1 text-xs font-medium text-teal-700 dark:bg-teal-900/30 dark:text-teal-300"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6 border-t border-gray-100 pt-6 dark:border-gray-800">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-white">Job Description</h3>
            <div className="mt-3 max-w-none space-y-4">
              {displayDescriptionParagraphs.map((para, idx) => (
                <p key={idx} className="text-sm leading-relaxed text-gray-600 dark:text-gray-300">
                  {para}
                </p>
              ))}
            </div>
            {descriptionWordCount > JOB_DESCRIPTION_WORD_LIMIT ? (
              <button
                type="button"
                onClick={() => setDescriptionExpanded((v) => !v)}
                className="mt-3 border-0 bg-transparent p-0 text-sm font-medium text-teal-600 hover:underline dark:text-teal-400"
              >
                {descriptionExpanded ? 'Read less' : 'Read more'}
              </button>
            ) : null}
          </div>

          {job.company?.description && (
            <div className="mt-6 border-t border-gray-100 pt-6 dark:border-gray-800">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-white">About {job.company.name}</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-500 dark:text-gray-400">{job.company.description}</p>
            </div>
          )}
        </section>
      </div>

      {/* Sidebar */}
      <div className="lg:col-span-1">
        <div className="sticky top-6 space-y-4">
          {/* Apply card */}
          <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100 dark:bg-gray-900 dark:ring-gray-800">
            <div className="mb-4 flex justify-end gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                icon={<JobShareIcon />}
                onClick={() => shareThisJob()}
                aria-label="Share this job"
              >
                Share
              </Button>
              {isAuthenticated && user?.role === 'candidate' && !myApplicationsQuery.isPending && (
                <SaveJobButton jobId={job._id} variant="icon" />
              )}
            </div>
            {isAuthenticated && user?.role === 'candidate' && myApplicationsQuery.isPending && (
              <div className="space-y-4" aria-busy="true">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-12 w-full rounded-lg" />
              </div>
            )}

            {isAuthenticated && user?.role === 'candidate' && !myApplicationsQuery.isPending && (
              <>
                {alreadyApplied && (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 ring-1 ring-emerald-100/90 dark:border-emerald-800/70 dark:bg-emerald-900/25 dark:ring-emerald-800/40">
                    <div className="flex gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-800/60 dark:text-emerald-300">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </div>
                      <div className="min-w-0 text-left">
                        <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">
                          You have already applied for this job
                        </p>
                        {appliedOnLabel && (
                          <p className="mt-1 text-sm text-emerald-800/90 dark:text-emerald-300/90">
                            Applied on {appliedOnLabel}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {!alreadyApplied && (
                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white">Apply for this position</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Add a cover letter to stand out from other applicants.</p>
                    <Button
                      className="w-full"
                      size="lg"
                      onClick={() => {
                        if (!requireLoginForApply()) return
                        setApplyModalOpen(true)
                      }}
                    >
                      Apply Now
                    </Button>
                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-2">
                      <TrustApplyShieldIcon />
                      <span>
                        You will be redirected to the company&apos;s official career page to complete your application.
                        CareerSync does not store your application data.
                      </span>
                    </div>
                  </div>
                )}
              </>
            )}

            {!isAuthenticated && (
              <div className="space-y-3 text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">Sign in to apply for this job</p>
                <Button to="/login" variant="primary" size="lg" className="w-full">
                  Sign In to Apply
                </Button>
                <Button to="/register" variant="secondary" size="lg" className="w-full">
                  Create Account
                </Button>
              </div>
            )}
          </div>

          {/* Company info */}
          {job.company && (
            <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100 dark:bg-gray-900 dark:ring-gray-800">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-white">Company Info</h3>
              <p className="mt-2 font-medium text-gray-900 dark:text-white">{job.company.name}</p>
              {job.company.location && (
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{job.company.location}</p>
              )}
              {job.company.website && (
                <a
                  href={job.company.website}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-block text-sm font-medium text-teal-700 hover:text-[#0C5F5A] dark:text-teal-400 dark:hover:text-teal-300"
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
          <div className="rounded-lg border border-gray-200 bg-gray-50/50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Resume</p>
            {user?.resumeUrl ? (
              <div className="mt-2 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <svg className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="truncate text-sm font-medium text-gray-900 dark:text-white">
                    {user?.resumeFileName || 'Resume attached'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setResumePreviewOpen(true)}
                  className="shrink-0 text-sm font-semibold text-teal-700 hover:text-[#0C5F5A] dark:text-teal-400 dark:hover:text-teal-300"
                >
                  View
                </button>
              </div>
            ) : (
              <div className="mt-2 flex items-start gap-2">
                <svg className="h-5 w-5 shrink-0 text-amber-500 mt-0.5 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-300">No resume uploaded</p>
                  <p className="text-xs text-amber-700 mt-0.5 dark:text-amber-300">Upload a resume in your profile to apply.</p>
                  <Link
                    to="/candidate/dashboard?tab=profile"
                    className="mt-2 inline-block text-sm font-semibold text-teal-700 hover:text-[#0C5F5A] dark:text-teal-400 dark:hover:text-teal-300"
                    onClick={() => setApplyModalOpen(false)}
                  >
                    Go to Profile &rarr;
                  </Link>
                </div>
              </div>
            )}
          </div>

          <div>
            <label htmlFor="jd-coverLetter" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-200">
              Cover letter (optional)
            </label>
            <textarea
              id="jd-coverLetter"
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              placeholder="Why are you a good fit for this role? Highlight your relevant experience and skills..."
              rows={5}
              disabled={applyMutation.isPending}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-sm transition-colors placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500 disabled:bg-gray-50 disabled:cursor-not-allowed dark:border-gray-600 dark:bg-gray-900 dark:text-white dark:placeholder:text-gray-500 dark:disabled:bg-gray-800 dark:focus:border-teal-400"
              aria-describedby="coverLetter-hint"
            />
            <p id="coverLetter-hint" className="mt-1 text-xs text-gray-500 dark:text-gray-400">A cover letter can help you stand out from other applicants.</p>
          </div>

          <div className="flex flex-col gap-3 pt-2 sm:flex-row">
            <Button
              variant="secondary"
              size="md"
              className="flex-1"
              onClick={() => setApplyModalOpen(false)}
              disabled={applyMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              size="lg"
              loading={applyMutation.isPending}
              loadingText="Submitting..."
              disabled={!candidateHasResume || applyMutation.isPending}
              onClick={() => {
                if (!requireLoginForApply()) return
                applyMutation.mutate()
              }}
            >
              Submit Application
            </Button>
          </div>

          {candidateHasResume && (
            <p className="text-center text-xs text-gray-500 dark:text-gray-400">
              <Link to="/candidate/dashboard?tab=applications" className="font-medium text-teal-700 hover:text-[#0C5F5A] dark:text-teal-400 dark:hover:text-teal-300" onClick={() => setApplyModalOpen(false)}>
                View my applications
              </Link>
            </p>
          )}
        </div>
      </Modal>

      <Modal
        open={resumePreviewOpen}
        onClose={() => setResumePreviewOpen(false)}
        title={user?.resumeFileName ? `Resume — ${user.resumeFileName}` : 'Your resume'}
        size="xl"
      >
        {resumePreviewOpen && candidateHasResume ? (
          <LazyResumeViewer path="/users/profile/resume/file" title={user?.resumeFileName || 'Resume'} />
        ) : null}
      </Modal>
    </div>
    </>
  )
}
