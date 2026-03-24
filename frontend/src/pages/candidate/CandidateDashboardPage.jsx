import { useEffect, useState, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link } from 'react-router-dom'
import { SaveJobButton } from '../../components/SaveJobButton.jsx'
import { ProfileCompletion } from '../../components/ProfileCompletion.jsx'
import { ResumeSection } from '../../components/ResumeSection.jsx'
import { CandidateDashboardSkeleton } from '../../components/CandidateDashboardSkeleton.jsx'
import { Tabs, EmptyState, EmptyStateIcons, ApplicationRowSkeleton } from '../../components/ui/index.js'
import { toast } from 'sonner'
import { apiClient } from '../../api/apiClient.js'
import { useAuth } from '../../context/useAuth.jsx'
import { getApiErrorMessage } from '../../utils/getApiErrorMessage.js'
import { queryKeys } from '../../lib/queryKeys.js'
import { CACHE_TIERS } from '../../lib/queryOptions.js'
import { formatSalaryRange } from '../../utils/formatSalary.js'

const profileSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  headline: z.string().optional(),
  about: z.string().optional(),
  phone: z.string().optional(),
  location: z.string().optional(),
  website: z.string().optional(),
  skills: z.string().optional(),
})

const STATUS_CONFIG = {
  applied: { label: 'Applied', color: 'bg-blue-50 text-blue-700 ring-1 ring-blue-600/20', dot: 'bg-blue-500' },
  shortlisted: { label: 'Shortlisted', color: 'bg-amber-50 text-amber-700 ring-1 ring-amber-600/20', dot: 'bg-amber-500' },
  rejected: { label: 'Rejected', color: 'bg-red-50 text-red-700 ring-1 ring-red-600/20', dot: 'bg-red-500' },
  hired: { label: 'Hired', color: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20', dot: 'bg-emerald-500' },
}

const TYPE_COLORS = {
  'full-time': 'bg-emerald-50 text-emerald-700',
  'part-time': 'bg-blue-50 text-blue-700',
  contract: 'bg-amber-50 text-amber-700',
  internship: 'bg-purple-50 text-purple-700',
}

const EMPLOYMENT_TYPES = ['full-time', 'part-time', 'contract', 'internship']

export function CandidateDashboardPage() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const tabFromUrl = searchParams.get('tab')
  const { user, updateUser, logout } = useAuth()
  const [activeTab, setActiveTab] = useState(
    tabFromUrl && ['overview', 'saved', 'alerts', 'applications', 'profile'].includes(tabFromUrl)
      ? tabFromUrl
      : 'overview'
  )
  const imageInputRef = useRef(null)
  const [experience, setExperience] = useState([])
  const [projects, setProjects] = useState([])
  const [education, setEducation] = useState([])

  const profileForm = useForm({
    defaultValues: {
      fullName: user?.fullName || '',
      headline: user?.headline || '',
      about: user?.about || '',
      phone: user?.phone || '',
      location: user?.location || '',
      website: user?.website || '',
      skills: Array.isArray(user?.skills) ? user.skills.join(', ') : '',
    },
    resolver: zodResolver(profileSchema),
  })

  const meQuery = useQuery({
    queryKey: queryKeys.auth.me(),
    queryFn: async () => {
      const response = await apiClient.get('/auth/me')
      return response.data.data.user
    },
    staleTime: CACHE_TIERS.auth.staleTime,
    gcTime: CACHE_TIERS.auth.gcTime,
  })

  useEffect(() => {
    if (tabFromUrl && ['overview', 'saved', 'alerts', 'applications', 'profile'].includes(tabFromUrl)) {
      setActiveTab(tabFromUrl)
    }
  }, [tabFromUrl])

  useEffect(() => {
    if (meQuery.data) {
      profileForm.reset({
        fullName: meQuery.data.fullName || '',
        headline: meQuery.data.headline || '',
        about: meQuery.data.about || '',
        phone: meQuery.data.phone || '',
        location: meQuery.data.location || '',
        website: meQuery.data.website || '',
        skills: Array.isArray(meQuery.data.skills) ? meQuery.data.skills.join(', ') : '',
      })
      setExperience(meQuery.data.experience || [])
      setProjects(meQuery.data.projects || [])
      setEducation(meQuery.data.education || [])
    }
  }, [meQuery.data])

  const applicationsQuery = useQuery({
    queryKey: queryKeys.user.applications(),
    queryFn: async () => {
      const response = await apiClient.get('/applications/me')
      return response.data.data.applications
    },
    staleTime: CACHE_TIERS.userActivity.staleTime,
    gcTime: CACHE_TIERS.userActivity.gcTime,
  })

  const recommendedJobsQuery = useQuery({
    queryKey: queryKeys.jobs.recommended(6),
    queryFn: async () => {
      const response = await apiClient.get('/jobs', { params: { limit: 6 } })
      return response.data.data.jobs
    },
    staleTime: CACHE_TIERS.public.staleTime,
    gcTime: CACHE_TIERS.public.gcTime,
  })

  const savedJobsQuery = useQuery({
    queryKey: queryKeys.user.savedJobs(),
    queryFn: async () => {
      const response = await apiClient.get('/users/saved-jobs')
      return response.data.data.jobs || []
    },
    staleTime: CACHE_TIERS.userActivity.staleTime,
    gcTime: CACHE_TIERS.userActivity.gcTime,
  })

  const jobAlertsQuery = useQuery({
    queryKey: queryKeys.user.jobAlerts(),
    queryFn: async () => {
      const response = await apiClient.get('/job-alerts')
      return response.data.data.alerts || []
    },
    staleTime: CACHE_TIERS.userActivity.staleTime,
    gcTime: CACHE_TIERS.userActivity.gcTime,
  })

  const updateProfileMutation = useMutation({
    mutationFn: (payload) => apiClient.patch('/users/profile', payload),
    onSuccess: async (response) => {
      updateUser(response.data.data.user)
      await queryClient.invalidateQueries({ queryKey: queryKeys.auth.me() })
      toast.success('Profile updated successfully.')
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'Could not update profile.'))
    },
  })

  const uploadImageMutation = useMutation({
    mutationFn: async (file) => {
      const formData = new FormData()
      formData.append('image', file)
      const response = await apiClient.post('/users/profile/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      return response.data.data.user
    },
    onSuccess: async (nextUser) => {
      updateUser(nextUser)
      await queryClient.invalidateQueries({ queryKey: queryKeys.auth.me() })
      toast.success('Profile photo updated.')
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'Image upload failed.'))
    },
  })

  const createAlertMutation = useMutation({
    mutationFn: (payload) => apiClient.post('/job-alerts', payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.user.jobAlerts() })
      toast.success('Job alert created. You\'ll get emails when matching jobs are posted.')
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Could not create alert.')),
  })

  const deleteAlertMutation = useMutation({
    mutationFn: (id) => apiClient.delete(`/job-alerts/${id}`),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.user.jobAlerts() })
      toast.success('Alert deleted.')
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Could not delete alert.')),
  })

  const deleteAccountMutation = useMutation({
    mutationFn: () => apiClient.delete('/users/account'),
    onSuccess: () => {
      logout()
      toast.success('Your account has been deleted.')
      navigate('/')
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'Could not delete account.'))
    },
  })

  const me = meQuery.data || user
  const applications = applicationsQuery.data || []
  const appliedIds = new Set(applications.map((a) => a.job?._id || a.job))

  const savedJobs = savedJobsQuery.data || []
  const jobAlerts = jobAlertsQuery.data || []
  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'saved', label: 'Saved Jobs', count: savedJobs.length || undefined },
    { id: 'alerts', label: 'Job Alerts', count: jobAlerts.length || undefined },
    { id: 'applications', label: 'My Applications', count: applications.length || undefined },
    { id: 'profile', label: 'Edit Profile' },
  ]

  if (meQuery.isLoading && !user) {
    return <CandidateDashboardSkeleton />
  }

  return (
    <div className="space-y-5">
      {/* Profile banner — full width */}
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100">
        <div className="h-28 bg-gradient-to-r from-indigo-600 via-indigo-500 to-blue-500 sm:h-36" />
        <div className="relative px-4 pb-5 sm:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:gap-5">
            <div className="-mt-12 sm:-mt-14">
              <button type="button" onClick={() => imageInputRef.current?.click()} className="group relative" title="Change photo">
                {me?.profileImageUrl ? (
                  <img src={me.profileImageUrl} alt={me.fullName} className="h-24 w-24 rounded-full border-4 border-white object-cover shadow-md sm:h-28 sm:w-28" />
                ) : (
                  <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-white bg-gradient-to-br from-indigo-400 to-indigo-600 text-2xl font-bold text-white shadow-md sm:h-28 sm:w-28 sm:text-3xl">
                    {me?.fullName?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                )}
                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                  <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <input ref={imageInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) uploadImageMutation.mutate(file) }} />
              </button>
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">{me?.fullName || 'Your Name'}</h1>
              <p className="text-sm text-gray-500 sm:text-base">{me?.headline || 'Add a headline to stand out'}</p>
              <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-gray-400 sm:text-sm">
                <span>{me?.email}</span>
                {me?.location && (
                  <span className="flex items-center gap-1">
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    {me.location}
                  </span>
                )}
              </div>
            </div>
          </div>
          {me?.skills?.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {me.skills.map((skill) => (
                <span key={skill} className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700">{skill}</span>
              ))}
            </div>
          )}
          {me?.about && (
            <p className="mt-3 border-t border-gray-100 pt-3 text-sm leading-relaxed text-gray-600">
              {me.about.length > 250 ? `${me.about.slice(0, 250)}...` : me.about}
            </p>
          )}
        </div>
      </div>

      {/* Tabs — full width, scroll on mobile */}
      <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-100">
        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} variant="pills" />
      </div>

      {/* === OVERVIEW TAB === */}
      {activeTab === 'overview' && (
        <div className="space-y-5">
          {/* Activity overview — stat cards */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <button
              type="button"
              onClick={() => setActiveTab('applications')}
              className="flex flex-col items-center gap-1 rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-100 transition-all hover:shadow-md hover:ring-indigo-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              <span className="text-2xl font-bold text-indigo-600">{applications.length}</span>
              <span className="text-xs font-medium text-gray-500">Applications</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('saved')}
              className="flex flex-col items-center gap-1 rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-100 transition-all hover:shadow-md hover:ring-indigo-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              <span className="text-2xl font-bold text-indigo-600">{savedJobs.length}</span>
              <span className="text-xs font-medium text-gray-500">Saved Jobs</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('alerts')}
              className="flex flex-col items-center gap-1 rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-100 transition-all hover:shadow-md hover:ring-indigo-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              <span className="text-2xl font-bold text-indigo-600">{jobAlerts.length}</span>
              <span className="text-xs font-medium text-gray-500">Job Alerts</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('profile')}
              className="flex flex-col items-center gap-1 rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-100 transition-all hover:shadow-md hover:ring-indigo-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              <span className="text-2xl font-bold text-emerald-600">
                {me ? Math.round(
                  ([
                    Boolean(me.headline?.trim()),
                    Boolean(me.about?.trim()),
                    Boolean(me.phone?.trim()),
                    Boolean(me.location?.trim()),
                    Array.isArray(me.skills) && me.skills.length > 0,
                    Array.isArray(me.experience) && me.experience.length > 0,
                    Array.isArray(me.education) && me.education.length > 0,
                    Boolean(me.resumeUrl),
                    Boolean(me.profileImageUrl),
                  ].filter(Boolean).length / 9) * 100
                ) : 0}%
              </span>
              <span className="text-xs font-medium text-gray-500">Profile</span>
            </button>
          </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {/* Recommended jobs — spans 2 cols on xl */}
          <div className="md:col-span-2 xl:col-span-2">
            <div className="rounded-xl bg-white shadow-sm ring-1 ring-gray-100">
              <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
                <h2 className="font-semibold text-gray-900">Recommended for you</h2>
                <Link to="/jobs" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">See all jobs &rarr;</Link>
              </div>
              <div className="divide-y divide-gray-50">
                {recommendedJobsQuery.isLoading && (
                  <>
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <ApplicationRowSkeleton key={i} />
                    ))}
                  </>
                )}
                {(recommendedJobsQuery.data || []).map((job) => {
                  const isApplied = appliedIds.has(job._id)
                  return (
                    <div key={job._id} className="flex flex-col gap-3 px-5 py-4 transition-colors hover:bg-gray-50/50 sm:flex-row sm:items-start sm:gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-100 to-blue-100 text-sm font-bold text-indigo-600">
                        {job.company?.name?.charAt(0)?.toUpperCase() || 'C'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <Link to={`/jobs/${job._id}`} className="font-medium text-gray-900 hover:text-indigo-600">{job.title}</Link>
                        <p className="mt-0.5 text-sm text-gray-500">{job.company?.name} &middot; {job.location}</p>
                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                          {job.employmentType && (
                            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${TYPE_COLORS[job.employmentType] || 'bg-gray-100 text-gray-600'}`}>{job.employmentType}</span>
                          )}
                          {(job.minSalary > 0 || job.maxSalary > 0) && (
                            <span className="text-xs font-medium text-emerald-600">{formatSalaryRange(job.minSalary, job.maxSalary)}</span>
                          )}
                          {job.skills?.slice(0, 3).map((s) => (
                            <span key={s} className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-500">{s}</span>
                          ))}
                        </div>
                      </div>
                      <div className="shrink-0 self-start sm:self-center">
                        {isApplied ? (
                          <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">Applied</span>
                        ) : (
                          <Link to={`/jobs/${job._id}`} className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-indigo-700">Apply</Link>
                        )}
                      </div>
                    </div>
                  )
                })}
                {recommendedJobsQuery.data?.length === 0 && !recommendedJobsQuery.isLoading && (
                  <EmptyState
                    icon={EmptyStateIcons.jobs}
                    title="No jobs available"
                    description="Check back later for new opportunities."
                    actionLabel="Browse all jobs"
                    actionHref="/jobs"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Right column — profile completion, activity, documents */}
          <div className="space-y-5 md:col-span-2 xl:col-span-1">
            <ProfileCompletion user={me} />
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-1">
              {/* Recent activity */}
              <div className="rounded-xl bg-white shadow-sm ring-1 ring-gray-100">
                <div className="border-b border-gray-100 px-5 py-4">
                  <h2 className="font-semibold text-gray-900">Recent Activity</h2>
                </div>
                <div className="divide-y divide-gray-50">
                  {applications.slice(0, 5).map((app) => {
                    const cfg = STATUS_CONFIG[app.status] || STATUS_CONFIG.applied
                    return (
                      <div key={app._id} className="flex items-center gap-3 px-5 py-3">
                        <div className={`h-2.5 w-2.5 shrink-0 rounded-full ${cfg.dot}`} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-gray-900">{app.job?.title}</p>
                          <p className="truncate text-xs text-gray-500">{app.job?.company?.name}</p>
                        </div>
                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${cfg.color}`}>{cfg.label}</span>
                      </div>
                    )
                  })}
                  {applications.length === 0 && (
                    <div className="px-5 py-6">
                      <p className="text-center text-sm text-gray-500">No applications yet</p>
                      <Link to="/jobs" className="mt-2 block text-center text-sm font-semibold text-indigo-600 hover:text-indigo-500">Browse jobs &rarr;</Link>
                    </div>
                  )}
                  {applications.length > 5 && (
                    <div className="px-5 py-3">
                      <button type="button" onClick={() => setActiveTab('applications')} className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
                        View all {applications.length} applications &rarr;
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Documents */}
              <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
                <h2 className="font-semibold text-gray-900">Documents</h2>
                <div className="mt-3">
                  <ResumeSection user={me} onUserUpdate={updateUser} compact />
                </div>
                <Link to="/candidate/dashboard?tab=profile" className="mt-2 block text-xs font-medium text-indigo-600 hover:text-indigo-500">
                  Manage resume &rarr;
                </Link>
              </div>
            </div>
          </div>
        </div>
        </div>
      )}

      {activeTab === 'saved' && (
        <div className="rounded-xl bg-white shadow-sm ring-1 ring-gray-100">
          <div className="border-b border-gray-100 px-5 py-4 sm:px-6">
            <h2 className="font-semibold text-gray-900">Saved Jobs</h2>
            <p className="mt-0.5 text-sm text-gray-500">Jobs you&apos;ve bookmarked for later</p>
          </div>
          {savedJobsQuery.isLoading && (
            <div className="px-5 py-12 text-center text-sm text-gray-400">Loading saved jobs...</div>
          )}
          {savedJobs.length > 0 && (
            <div className="divide-y divide-gray-50">
              {savedJobs.map((job) => (
                <div key={job._id} className="flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-gray-50/50">
                  <div className="min-w-0 flex-1">
                    <Link to={`/jobs/${job._id}`} className="font-medium text-gray-900 hover:text-indigo-600">{job.title}</Link>
                    <p className="mt-0.5 text-sm text-gray-500">{job.company?.name} &middot; {job.location}</p>
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
                    <Link to={`/jobs/${job._id}`} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-700">Apply</Link>
                  </div>
                </div>
              ))}
            </div>
          )}
          {savedJobs.length === 0 && !savedJobsQuery.isLoading && (
            <EmptyState
              icon={EmptyStateIcons.saved}
              title="No saved jobs yet"
              description="Save jobs while browsing to view them here."
              actionLabel="Browse Jobs"
              actionHref="/jobs"
            />
          )}
        </div>
      )}

      {activeTab === 'alerts' && (
        <div className="rounded-xl bg-white shadow-sm ring-1 ring-gray-100">
          <div className="border-b border-gray-100 px-5 py-4 sm:px-6">
            <h2 className="font-semibold text-gray-900">Job Alerts</h2>
            <p className="mt-0.5 text-sm text-gray-500">Get emailed when new jobs match your criteria</p>
          </div>
          <div className="p-5">
            <form
              className="mb-6 rounded-lg border border-gray-200 bg-gray-50/50 p-4"
              onSubmit={(e) => {
                e.preventDefault()
                const form = e.target
                const keywords = form.keywords?.value?.trim() || ''
                const location = form.location?.value?.trim() || ''
                const employmentType = form.employmentType?.value || ''
                createAlertMutation.mutate({ keywords, location, employmentType })
                form.reset()
              }}
            >
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <label htmlFor="alert-keywords" className="mb-1 block text-xs font-medium text-gray-600">Keywords</label>
                  <input id="alert-keywords" name="keywords" placeholder="e.g. React, Node.js" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                </div>
                <div>
                  <label htmlFor="alert-location" className="mb-1 block text-xs font-medium text-gray-600">Location</label>
                  <input id="alert-location" name="location" placeholder="e.g. Remote, Bangalore" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                </div>
                <div>
                  <label htmlFor="alert-type" className="mb-1 block text-xs font-medium text-gray-600">Job type</label>
                  <select id="alert-type" name="employmentType" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                    <option value="">Any</option>
                    {EMPLOYMENT_TYPES.map((t) => (
                      <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                    ))}
                  </select>
                </div>
              </div>
              <button type="submit" disabled={createAlertMutation.isPending} className="mt-3 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60">
                {createAlertMutation.isPending ? 'Creating...' : '+ Create alert'}
              </button>
            </form>
            {jobAlertsQuery.isLoading && <div className="py-8 text-center text-sm text-gray-400">Loading alerts...</div>}
            {jobAlerts.length > 0 && (
              <div className="space-y-3">
                {jobAlerts.map((alert) => (
                  <div key={alert._id} className="flex items-center justify-between rounded-lg border border-gray-200 p-4">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{alert.keywords || 'Any keywords'}</p>
                      <p className="text-xs text-gray-500">{alert.location || 'Any location'} &middot; {alert.employmentType || 'Any type'}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => deleteAlertMutation.mutate(alert._id)}
                      disabled={deleteAlertMutation.isPending}
                      className="rounded-lg border border-red-300 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-60"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            )}
            {jobAlerts.length === 0 && !jobAlertsQuery.isLoading && (
              <p className="py-8 text-center text-sm text-gray-500">No alerts yet. Create one above to get notified of new jobs.</p>
            )}
          </div>
        </div>
      )}

      {activeTab === 'applications' && (
        <div className="rounded-xl bg-white shadow-sm ring-1 ring-gray-100">
          <div className="border-b border-gray-100 px-5 py-4 sm:px-6">
            <h2 className="font-semibold text-gray-900">All Applications</h2>
            <p className="mt-0.5 text-sm text-gray-500">Track the status of all your job applications</p>
          </div>
          {applicationsQuery.isLoading && (
            <div className="px-5 py-12 text-center text-sm text-gray-400">Loading applications...</div>
          )}

          {/* Desktop table */}
          {applications.length > 0 && (
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-xs uppercase tracking-wider text-gray-500">
                    <th className="px-5 py-3 font-medium">Job</th>
                    <th className="px-5 py-3 font-medium">Company</th>
                    <th className="px-5 py-3 font-medium">Applied On</th>
                    <th className="px-5 py-3 font-medium text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {applications.map((app) => {
                    const cfg = STATUS_CONFIG[app.status] || STATUS_CONFIG.applied
                    return (
                      <tr key={app._id} className="transition-colors hover:bg-gray-50/50">
                        <td className="px-5 py-3.5">
                          <Link to={`/jobs/${app.job?._id}`} className="font-medium text-gray-900 hover:text-indigo-600">{app.job?.title}</Link>
                        </td>
                        <td className="px-5 py-3.5 text-gray-600">{app.job?.company?.name}</td>
                        <td className="px-5 py-3.5 text-gray-500">
                          {app.createdAt ? new Date(app.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${cfg.color}`}>{cfg.label}</span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Mobile list */}
          <div className="divide-y divide-gray-50 md:hidden">
            {applications.map((app) => {
              const cfg = STATUS_CONFIG[app.status] || STATUS_CONFIG.applied
              return (
                <div key={app._id} className="flex items-center gap-3 px-4 py-3.5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-100 to-blue-100 text-xs font-bold text-indigo-600">
                    {app.job?.company?.name?.charAt(0)?.toUpperCase() || 'C'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link to={`/jobs/${app.job?._id}`} className="text-sm font-medium text-gray-900 hover:text-indigo-600">{app.job?.title}</Link>
                    <p className="text-xs text-gray-500">{app.job?.company?.name}</p>
                    {app.createdAt && <p className="text-xs text-gray-400">Applied {new Date(app.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>}
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${cfg.color}`}>{cfg.label}</span>
                </div>
              )
            })}
          </div>

          {applications.length === 0 && !applicationsQuery.isLoading && (
            <EmptyState
              icon={EmptyStateIcons.applications}
              title="No applications yet"
              description="Start exploring jobs and apply to your first one."
              actionLabel="Browse Jobs"
              actionHref="/jobs"
            />
          )}
        </div>
      )}

      {activeTab === 'profile' && (
        <form
          onSubmit={profileForm.handleSubmit((values) =>
            updateProfileMutation.mutate({
              fullName: values.fullName,
              headline: values.headline,
              about: values.about,
              phone: values.phone,
              location: values.location,
              website: values.website,
              skills: (values.skills || '').split(',').map((s) => s.trim()).filter(Boolean),
              experience,
              projects,
              education,
            }),
          )}
          className="space-y-5"
        >
          {/* Photo + Resume + Basic Info — responsive row */}
          <div className="grid gap-5 md:grid-cols-3 xl:grid-cols-4">
            <div className="space-y-5 md:col-span-1">
              <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
                <h2 className="text-sm font-semibold text-gray-900">Profile Photo</h2>
                <div className="mt-3 flex flex-col items-center gap-3">
                  {me?.profileImageUrl ? (
                    <img src={me.profileImageUrl} alt={me.fullName} className="h-20 w-20 rounded-full object-cover ring-2 ring-indigo-100" />
                  ) : (
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 text-2xl font-bold text-white">{me?.fullName?.charAt(0)?.toUpperCase() || 'U'}</div>
                  )}
                  <label className="cursor-pointer rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50">
                    {uploadImageMutation.isPending ? 'Uploading...' : 'Change photo'}
                    <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) uploadImageMutation.mutate(file) }} />
                  </label>
                </div>
              </div>
              <ResumeSection user={me} onUserUpdate={updateUser} />
            </div>

            <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-100 md:col-span-2 xl:col-span-3">
              <h2 className="text-sm font-semibold text-gray-900">Basic Information</h2>
              <p className="mt-0.5 text-xs text-gray-500">Your professional details visible to recruiters</p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <label htmlFor="cd-fullName" className="mb-1 block text-xs font-medium text-gray-600">Full name *</label>
                  <input {...profileForm.register('fullName')} id="cd-fullName" placeholder="Your full name" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm" />
                  {profileForm.formState.errors.fullName && <p className="mt-1 text-xs text-red-600">{profileForm.formState.errors.fullName.message}</p>}
                </div>
                <div>
                  <label htmlFor="cd-headline" className="mb-1 block text-xs font-medium text-gray-600">Headline</label>
                  <input {...profileForm.register('headline')} id="cd-headline" placeholder="e.g. Full-Stack Developer" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm" />
                </div>
                <div>
                  <label htmlFor="cd-phone" className="mb-1 block text-xs font-medium text-gray-600">Phone</label>
                  <input {...profileForm.register('phone')} id="cd-phone" placeholder="+91 98765 43210" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm" />
                </div>
                <div>
                  <label htmlFor="cd-location" className="mb-1 block text-xs font-medium text-gray-600">Location</label>
                  <input {...profileForm.register('location')} id="cd-location" placeholder="Bangalore, India" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm" />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="cd-website" className="mb-1 block text-xs font-medium text-gray-600">Portfolio / Website</label>
                  <input {...profileForm.register('website')} id="cd-website" placeholder="https://yourportfolio.com" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm" />
                </div>
                <div className="sm:col-span-2 lg:col-span-3">
                  <label htmlFor="cd-skills" className="mb-1 block text-xs font-medium text-gray-600">Skills</label>
                  <input {...profileForm.register('skills')} id="cd-skills" placeholder="React, Node.js, MongoDB, TypeScript" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm" />
                  <p className="mt-0.5 text-xs text-gray-400">Separate each skill with a comma</p>
                </div>
                <div className="sm:col-span-2 lg:col-span-3">
                  <label htmlFor="cd-about" className="mb-1 block text-xs font-medium text-gray-600">About</label>
                  <textarea {...profileForm.register('about')} id="cd-about" rows={3} placeholder="Write a brief summary about yourself, your experience, and what you're looking for..." className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm" />
                </div>
              </div>
            </div>
          </div>

          {/* Experience + Projects — side-by-side on wide screens */}
          <div className="grid gap-5 xl:grid-cols-2">
            {/* Experience */}
            <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-gray-900">Work Experience</h2>
                  <p className="mt-0.5 text-xs text-gray-500">Add your professional experience</p>
                </div>
                <button type="button" onClick={() => setExperience((prev) => [...prev, { title: '', company: '', location: '', startDate: '', endDate: '', current: false, description: '' }])} className="rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-600 transition-colors hover:bg-indigo-100">+ Add</button>
              </div>
              {experience.length === 0 && (
                <p className="mt-3 rounded-lg bg-gray-50 p-3 text-center text-xs text-gray-400">No experience added yet.</p>
              )}
              <div className="mt-3 space-y-3">
                {experience.map((exp, i) => (
                  <div key={exp._id || i} className="rounded-lg border border-gray-200 p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-xs font-semibold text-gray-700">Experience #{i + 1}</span>
                      <button type="button" onClick={() => setExperience((prev) => prev.filter((_, j) => j !== i))} className="text-xs text-red-500 hover:text-red-700">Remove</button>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className="mb-0.5 block text-xs font-medium text-gray-600">Job Title *</label>
                        <input value={exp.title} onChange={(e) => setExperience((prev) => prev.map((x, j) => j === i ? { ...x, title: e.target.value } : x))} placeholder="Software Engineer" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm" />
                      </div>
                      <div>
                        <label className="mb-0.5 block text-xs font-medium text-gray-600">Company *</label>
                        <input value={exp.company} onChange={(e) => setExperience((prev) => prev.map((x, j) => j === i ? { ...x, company: e.target.value } : x))} placeholder="Google" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm" />
                      </div>
                      <div>
                        <label className="mb-0.5 block text-xs font-medium text-gray-600">Location</label>
                        <input value={exp.location} onChange={(e) => setExperience((prev) => prev.map((x, j) => j === i ? { ...x, location: e.target.value } : x))} placeholder="Bangalore, India" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm" />
                      </div>
                      <div>
                        <label className="mb-0.5 block text-xs font-medium text-gray-600">Start *</label>
                        <input type="month" value={exp.startDate} onChange={(e) => setExperience((prev) => prev.map((x, j) => j === i ? { ...x, startDate: e.target.value } : x))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm" />
                      </div>
                      <div>
                        <label className="mb-0.5 block text-xs font-medium text-gray-600">End</label>
                        <input type="month" value={exp.endDate} disabled={exp.current} onChange={(e) => setExperience((prev) => prev.map((x, j) => j === i ? { ...x, endDate: e.target.value } : x))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm disabled:bg-gray-100" />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="flex items-center gap-2 text-xs text-gray-600">
                          <input type="checkbox" checked={exp.current} onChange={(e) => setExperience((prev) => prev.map((x, j) => j === i ? { ...x, current: e.target.checked, endDate: e.target.checked ? '' : x.endDate } : x))} className="h-3.5 w-3.5 rounded border-gray-300 accent-indigo-600" />
                          I currently work here
                        </label>
                      </div>
                      <div className="sm:col-span-2">
                        <label className="mb-0.5 block text-xs font-medium text-gray-600">Description</label>
                        <textarea value={exp.description} onChange={(e) => setExperience((prev) => prev.map((x, j) => j === i ? { ...x, description: e.target.value } : x))} rows={2} placeholder="Responsibilities and achievements..." className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Projects */}
            <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-gray-900">Projects</h2>
                  <p className="mt-0.5 text-xs text-gray-500">Showcase your best work</p>
                </div>
                <button type="button" onClick={() => setProjects((prev) => [...prev, { title: '', description: '', url: '', technologies: [] }])} className="rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-600 transition-colors hover:bg-indigo-100">+ Add</button>
              </div>
              {projects.length === 0 && (
                <p className="mt-3 rounded-lg bg-gray-50 p-3 text-center text-xs text-gray-400">No projects added yet.</p>
              )}
              <div className="mt-3 space-y-3">
                {projects.map((proj, i) => (
                  <div key={proj._id || i} className="rounded-lg border border-gray-200 p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-xs font-semibold text-gray-700">Project #{i + 1}</span>
                      <button type="button" onClick={() => setProjects((prev) => prev.filter((_, j) => j !== i))} className="text-xs text-red-500 hover:text-red-700">Remove</button>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className="mb-0.5 block text-xs font-medium text-gray-600">Title *</label>
                        <input value={proj.title} onChange={(e) => setProjects((prev) => prev.map((x, j) => j === i ? { ...x, title: e.target.value } : x))} placeholder="E-Commerce Platform" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm" />
                      </div>
                      <div>
                        <label className="mb-0.5 block text-xs font-medium text-gray-600">URL</label>
                        <input value={proj.url} onChange={(e) => setProjects((prev) => prev.map((x, j) => j === i ? { ...x, url: e.target.value } : x))} placeholder="https://github.com/you/project" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm" />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="mb-0.5 block text-xs font-medium text-gray-600">Technologies</label>
                        <input value={Array.isArray(proj.technologies) ? proj.technologies.join(', ') : ''} onChange={(e) => setProjects((prev) => prev.map((x, j) => j === i ? { ...x, technologies: e.target.value.split(',').map((t) => t.trim()).filter(Boolean) } : x))} placeholder="React, Node.js, MongoDB" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm" />
                        <p className="mt-0.5 text-xs text-gray-400">Comma separated</p>
                      </div>
                      <div className="sm:col-span-2">
                        <label className="mb-0.5 block text-xs font-medium text-gray-600">Description</label>
                        <textarea value={proj.description} onChange={(e) => setProjects((prev) => prev.map((x, j) => j === i ? { ...x, description: e.target.value } : x))} rows={2} placeholder="What does this project do?" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Education — full width */}
          <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-gray-900">Education</h2>
                <p className="mt-0.5 text-xs text-gray-500">Add your academic background</p>
              </div>
              <button type="button" onClick={() => setEducation((prev) => [...prev, { degree: '', institution: '', fieldOfStudy: '', startYear: '', endYear: '', grade: '' }])} className="rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-600 transition-colors hover:bg-indigo-100">+ Add</button>
            </div>
            {education.length === 0 && (
              <p className="mt-3 rounded-lg bg-gray-50 p-3 text-center text-xs text-gray-400">No education added yet.</p>
            )}
            <div className="mt-3 grid gap-3 xl:grid-cols-2">
              {education.map((edu, i) => (
                <div key={edu._id || i} className="rounded-lg border border-gray-200 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-700">Education #{i + 1}</span>
                    <button type="button" onClick={() => setEducation((prev) => prev.filter((_, j) => j !== i))} className="text-xs text-red-500 hover:text-red-700">Remove</button>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    <div>
                      <label className="mb-0.5 block text-xs font-medium text-gray-600">Degree *</label>
                      <input value={edu.degree} onChange={(e) => setEducation((prev) => prev.map((x, j) => j === i ? { ...x, degree: e.target.value } : x))} placeholder="B.Tech in Computer Science" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm" />
                    </div>
                    <div>
                      <label className="mb-0.5 block text-xs font-medium text-gray-600">Institution *</label>
                      <input value={edu.institution} onChange={(e) => setEducation((prev) => prev.map((x, j) => j === i ? { ...x, institution: e.target.value } : x))} placeholder="IIT Delhi" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm" />
                    </div>
                    <div>
                      <label className="mb-0.5 block text-xs font-medium text-gray-600">Field of Study</label>
                      <input value={edu.fieldOfStudy} onChange={(e) => setEducation((prev) => prev.map((x, j) => j === i ? { ...x, fieldOfStudy: e.target.value } : x))} placeholder="Computer Science & Engineering" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm" />
                    </div>
                    <div>
                      <label className="mb-0.5 block text-xs font-medium text-gray-600">Grade / CGPA</label>
                      <input value={edu.grade} onChange={(e) => setEducation((prev) => prev.map((x, j) => j === i ? { ...x, grade: e.target.value } : x))} placeholder="8.5 / 10" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm" />
                    </div>
                    <div>
                      <label className="mb-0.5 block text-xs font-medium text-gray-600">Start Year</label>
                      <input value={edu.startYear} onChange={(e) => setEducation((prev) => prev.map((x, j) => j === i ? { ...x, startYear: e.target.value } : x))} placeholder="2018" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm" />
                    </div>
                    <div>
                      <label className="mb-0.5 block text-xs font-medium text-gray-600">End Year</label>
                      <input value={edu.endYear} onChange={(e) => setEducation((prev) => prev.map((x, j) => j === i ? { ...x, endYear: e.target.value } : x))} placeholder="2022" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Danger zone */}
          <div className="rounded-xl border border-red-200 bg-red-50/50 p-5">
            <h2 className="text-sm font-semibold text-red-800">Danger zone</h2>
            <p className="mt-1 text-xs text-red-600">Permanently delete your account and all associated data. This cannot be undone.</p>
            <button
              type="button"
              onClick={() => window.confirm('Are you sure? This will permanently delete your account.') && deleteAccountMutation.mutate()}
              disabled={deleteAccountMutation.isPending}
              className="mt-3 rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100 disabled:opacity-60"
            >
              {deleteAccountMutation.isPending ? 'Deleting...' : 'Delete account'}
            </button>
          </div>

          {/* Save button */}
          <div className="sticky bottom-4 flex justify-end rounded-xl bg-white/90 p-4 shadow-lg ring-1 ring-gray-100 backdrop-blur-sm">
            <button type="submit" disabled={updateProfileMutation.isPending} className="rounded-lg bg-indigo-600 px-8 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:opacity-60">
              {updateProfileMutation.isPending ? 'Saving all changes...' : 'Save All Changes'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
