import { useCallback, useEffect, useMemo, useState, useRef } from 'react'
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
import {
  getMe,
  updateProfile,
  uploadProfileImage,
  getSavedJobs,
  deleteAccount,
  changePassword,
  fetchMyDataExport,
  triggerDownloadDataExport,
} from '../../api/userApi.js'
import { listMyApplications } from '../../api/applicationsApi.js'
import { listPublicJobs } from '../../api/jobsApi.js'
import { createJobAlert, deleteJobAlert, listJobAlerts } from '../../api/jobAlertsApi.js'
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
  applied: {
    label: 'Applied',
    color: 'bg-teal-50 text-teal-700 ring-1 ring-teal-600/20 dark:bg-teal-950/50 dark:text-teal-300',
    dot: 'bg-teal-500',
  },
  screening: { label: 'Screening', color: 'bg-amber-50 text-amber-700 ring-1 ring-amber-600/20', dot: 'bg-amber-500' },
  /** Legacy API responses before DB migration */
  shortlisted: { label: 'Screening', color: 'bg-amber-50 text-amber-700 ring-1 ring-amber-600/20', dot: 'bg-amber-500' },
  interview: { label: 'Interview', color: 'bg-sky-50 text-sky-700 ring-1 ring-sky-600/20', dot: 'bg-sky-500' },
  offer: { label: 'Offer', color: 'bg-teal-50 text-teal-700 ring-1 ring-teal-600/20', dot: 'bg-teal-500' },
  rejected: { label: 'Rejected', color: 'bg-red-50 text-red-700 ring-1 ring-red-600/20', dot: 'bg-red-500' },
  hired: { label: 'Hired', color: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20', dot: 'bg-emerald-500' },
}

const TYPE_COLORS = {
  'full-time': 'bg-emerald-50 text-emerald-700',
  'part-time': 'bg-teal-50 text-teal-700 dark:bg-teal-950/50 dark:text-teal-300',
  contract: 'bg-amber-50 text-amber-700',
  internship: 'bg-purple-50 text-purple-700',
}

const EMPLOYMENT_TYPES = ['full-time', 'part-time', 'contract', 'internship']

function formatMonthYear(ym) {
  if (!ym || typeof ym !== 'string') return ''
  const parts = ym.split('-').map((p) => parseInt(p, 10))
  const y = parts[0]
  const m = parts[1]
  if (!y || !m || m < 1 || m > 12) return ym
  return new Date(y, m - 1, 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

function formatExperienceDateRange(exp) {
  const start = formatMonthYear(exp.startDate)
  if (exp.current) {
    return start ? `${start} – Present` : 'Present'
  }
  const end = formatMonthYear(exp.endDate)
  if (start && end) return `${start} – ${end}`
  return start || end || ''
}

const DASHBOARD_TAB_ICONS = {
  overview: (
    <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  ),
  saved: (
    <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-8-4-8 4V5z" />
    </svg>
  ),
  alerts: (
    <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  ),
  applications: (
    <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
  profile: (
    <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
}

export function CandidateDashboardPage() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const tabFromUrl = searchParams.get('tab')
  const { user, updateUser, logout } = useAuth()
  const [activeTab, setActiveTab] = useState(
    tabFromUrl && ['overview', 'saved', 'alerts', 'applications', 'profile'].includes(tabFromUrl)
      ? tabFromUrl
      : 'overview'
  )
  const imageInputRef = useRef(null)
  /** Bumps when profile photo uploads so Cloudinary/browser cache shows the new image immediately. */
  const [profilePhotoKey, setProfilePhotoKey] = useState(0)
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
    queryFn: () => getMe(),
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
  }, [meQuery.data, profileForm])

  const applicationsQuery = useQuery({
    queryKey: queryKeys.user.applications(),
    queryFn: async () => {
      const d = await listMyApplications({ page: 1, limit: 50 })
      return d.applications ?? []
    },
    staleTime: CACHE_TIERS.userActivity.staleTime,
    gcTime: CACHE_TIERS.userActivity.gcTime,
  })

  const recommendedJobsQuery = useQuery({
    queryKey: queryKeys.jobs.recommended(6),
    queryFn: async () => {
      const data = await listPublicJobs({ limit: 6, page: 1 })
      return data.jobs ?? []
    },
    staleTime: CACHE_TIERS.public.staleTime,
    gcTime: CACHE_TIERS.public.gcTime,
  })

  const savedJobsQuery = useQuery({
    queryKey: queryKeys.user.savedJobs(),
    queryFn: async () => {
      const d = await getSavedJobs()
      return d.jobs || []
    },
    staleTime: CACHE_TIERS.userActivity.staleTime,
    gcTime: CACHE_TIERS.userActivity.gcTime,
  })

  const jobAlertsQuery = useQuery({
    queryKey: queryKeys.user.jobAlerts(),
    queryFn: () => listJobAlerts(),
    staleTime: CACHE_TIERS.userActivity.staleTime,
    gcTime: CACHE_TIERS.userActivity.gcTime,
  })

  const updateProfileMutation = useMutation({
    mutationFn: (payload) => updateProfile(payload),
    onSuccess: async (result) => {
      updateUser(result.user)
      await queryClient.invalidateQueries({ queryKey: queryKeys.auth.me() })
      toast.success('Profile updated successfully.')
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'Could not update profile.'))
    },
  })

  const uploadImageMutation = useMutation({
    mutationFn: async (file) => {
      const r = await uploadProfileImage(file)
      return r.user
    },
    onSuccess: async (nextUser) => {
      updateUser(nextUser)
      setProfilePhotoKey((k) => k + 1)
      await queryClient.invalidateQueries({ queryKey: queryKeys.auth.me() })
      await queryClient.refetchQueries({ queryKey: queryKeys.auth.me() })
      toast.success('Profile photo updated.')
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'Image upload failed.'))
    },
  })

  const createAlertMutation = useMutation({
    mutationFn: (payload) => createJobAlert(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.user.jobAlerts() })
      toast.success('Job alert created. You\'ll get emails when matching jobs are posted.')
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Could not create alert.')),
  })

  const deleteAlertMutation = useMutation({
    mutationFn: (id) => deleteJobAlert(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.user.jobAlerts() })
      toast.success('Alert deleted.')
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Could not delete alert.')),
  })

  const dataExportMutation = useMutation({
    mutationFn: fetchMyDataExport,
    onSuccess: (payload) => {
      triggerDownloadDataExport(payload)
      toast.success('Your data export download started.')
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Could not download your data export.')),
  })

  const deleteAccountMutation = useMutation({
    mutationFn: () => deleteAccount(),
    onSuccess: () => {
      logout()
      toast.success('Your account has been deleted.')
      navigate('/')
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'Could not delete account.'))
    },
  })

  const [pwdForm, setPwdForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' })

  const changePasswordMutation = useMutation({
    mutationFn: (body) => changePassword(body),
    onSuccess: () => {
      setPwdForm({ oldPassword: '', newPassword: '', confirmPassword: '' })
      toast.success('Password updated.')
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Could not update password.')),
  })

  /** Merge `/me` with auth context; overlay only defined fields so partial context never clears query data. */
  const me = useMemo(() => {
    const q = meQuery.data
    const u = user
    if (!q && !u) return undefined
    if (!q) return u
    if (!u) return q
    const next = { ...q }
    for (const [k, v] of Object.entries(u)) {
      if (v !== undefined) next[k] = v
    }
    return next
  }, [meQuery.data, user])
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

  const handleTabChange = useCallback(
    (id) => {
      setActiveTab(id)
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          if (id === 'overview') {
            next.delete('tab')
          } else {
            next.set('tab', id)
          }
          return next
        },
        { replace: true },
      )
    },
    [setSearchParams],
  )

  if (meQuery.isLoading && !user) {
    return <CandidateDashboardSkeleton />
  }

  return (
    <div className="space-y-5">
      {/* Profile banner — full width */}
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100">
        <div className="h-28 bg-teal-700 sm:h-36" />
        <div className="relative px-4 pb-5 sm:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:gap-5">
            <div className="-mt-12 sm:-mt-14">
              <button type="button" onClick={() => imageInputRef.current?.click()} className="group relative" title="Change photo">
                {me?.profileImageUrl ? (
                  <img
                    key={`${me.profileImageUrl}-${profilePhotoKey}`}
                    src={me.profileImageUrl}
                    alt={me.fullName}
                    className="h-24 w-24 rounded-full border-4 border-white object-cover shadow-md sm:h-28 sm:w-28"
                  />
                ) : (
                  <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-white bg-teal-700 text-2xl font-semibold text-white shadow-md sm:h-28 sm:w-28 sm:text-3xl">
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
                <span key={skill} className="rounded-full bg-teal-50 px-2.5 py-0.5 text-xs font-medium text-teal-700">{skill}</span>
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

      <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
        <aside className="hidden shrink-0 lg:block lg:w-56 xl:w-60" aria-label="Dashboard sections">
          <nav className="sticky top-24 space-y-1 rounded-xl bg-white p-2 shadow-sm ring-1 ring-gray-100">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabChange(tab.id)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-teal-50 text-teal-800 ring-1 ring-teal-100'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <span className={activeTab === tab.id ? 'text-teal-700' : 'text-gray-400'}>{DASHBOARD_TAB_ICONS[tab.id]}</span>
                <span className="min-w-0 flex-1 truncate">{tab.label}</span>
                {tab.count != null && (
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${
                      activeTab === tab.id ? 'bg-teal-200/80 text-teal-900' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </aside>

        <div className="min-w-0 flex-1 space-y-5">
          <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-100 lg:hidden">
            <Tabs tabs={tabs} activeTab={activeTab} onChange={handleTabChange} variant="pills" />
          </div>

      {/* === OVERVIEW TAB === */}
      {activeTab === 'overview' && (
        <div className="space-y-5">
          {/* Activity overview — stat cards */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <button
              type="button"
              onClick={() => handleTabChange('applications')}
              className="flex flex-col items-center gap-1 rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-100 transition-all hover:shadow-md hover:ring-teal-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
            >
              <span className="text-2xl font-bold text-teal-700">{applications.length}</span>
              <span className="text-xs font-medium text-gray-500">Applications</span>
            </button>
            <button
              type="button"
              onClick={() => handleTabChange('saved')}
              className="flex flex-col items-center gap-1 rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-100 transition-all hover:shadow-md hover:ring-teal-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
            >
              <span className="text-2xl font-bold text-teal-700">{savedJobs.length}</span>
              <span className="text-xs font-medium text-gray-500">Saved Jobs</span>
            </button>
            <button
              type="button"
              onClick={() => handleTabChange('alerts')}
              className="flex flex-col items-center gap-1 rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-100 transition-all hover:shadow-md hover:ring-teal-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
            >
              <span className="text-2xl font-bold text-teal-700">{jobAlerts.length}</span>
              <span className="text-xs font-medium text-gray-500">Job Alerts</span>
            </button>
            <button
              type="button"
              onClick={() => handleTabChange('profile')}
              className="flex flex-col items-center gap-1 rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-100 transition-all hover:shadow-md hover:ring-teal-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
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
                    Boolean(me.hasResume || me.resumeFileName?.trim()),
                    Boolean(me.profileImageUrl),
                  ].filter(Boolean).length / 9) * 100
                ) : 0}%
              </span>
              <span className="text-xs font-medium text-gray-500">Profile</span>
            </button>
          </div>

          {(me?.experience?.length > 0 || me?.projects?.length > 0) && (
            <div className="grid gap-4 lg:grid-cols-2">
              {me.experience?.length > 0 && (
                <div className="rounded-xl bg-white shadow-sm ring-1 ring-gray-100">
                  <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
                    <h2 className="font-semibold text-gray-900">Experience</h2>
                    <button type="button" onClick={() => handleTabChange('profile')} className="text-sm font-medium text-teal-700 hover:text-[#0C5F5A]">
                      Add or edit
                    </button>
                  </div>
                  <div className="px-5 py-4">
                    <div className="relative border-l-2 border-gray-200 pl-6">
                      {me.experience.map((exp, i) => (
                        <div key={exp._id || `exp-${i}`} className="relative pb-8 last:pb-0">
                          <div className="absolute -left-[25px] top-1 flex h-4 w-4 items-center justify-center rounded-full border-2 border-white bg-teal-700 ring-1 ring-gray-200" aria-hidden />
                          <div className="flex gap-3">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-sm font-bold uppercase text-gray-600">
                              {(exp.company || '?').charAt(0)}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold text-gray-900">{exp.title || 'Role'}</p>
                              <p className="text-sm text-gray-600">{exp.company || 'Company'}{exp.location ? ` · ${exp.location}` : ''}</p>
                              <p className="mt-0.5 text-xs text-gray-500">{formatExperienceDateRange(exp)}</p>
                              {exp.description && (
                                <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-gray-600">{exp.description}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              {me.projects?.length > 0 && (
                <div className="rounded-xl bg-white shadow-sm ring-1 ring-gray-100">
                  <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
                    <h2 className="font-semibold text-gray-900">Projects</h2>
                    <button type="button" onClick={() => handleTabChange('profile')} className="text-sm font-medium text-teal-700 hover:text-[#0C5F5A]">
                      Add or edit
                    </button>
                  </div>
                  <ul className="divide-y divide-gray-50 px-5 py-2">
                    {me.projects.map((proj, i) => (
                      <li key={proj._id || `proj-${i}`} className="flex gap-3 py-4 first:pt-2">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                          </svg>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                            <span className="font-semibold text-gray-900">{proj.title || 'Project'}</span>
                            {proj.url && (
                              <a href={proj.url} target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-teal-700 hover:text-[#0C5F5A]">
                                Link
                              </a>
                            )}
                          </div>
                          {Array.isArray(proj.technologies) && proj.technologies.length > 0 && (
                            <div className="mt-1.5 flex flex-wrap gap-1">
                              {proj.technologies.slice(0, 8).map((t) => (
                                <span key={t} className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                                  {t}
                                </span>
                              ))}
                            </div>
                          )}
                          {proj.description && <p className="mt-2 line-clamp-3 text-sm text-gray-600">{proj.description}</p>}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {/* Recommended jobs — spans 2 cols on xl */}
          <div className="md:col-span-2 xl:col-span-2">
            <div className="rounded-xl bg-white shadow-sm ring-1 ring-gray-100">
              <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
                <h2 className="font-semibold text-gray-900">Recommended for you</h2>
                <Link to="/jobs" className="text-sm font-medium text-teal-700 hover:text-[#0C5F5A]">See all jobs &rarr;</Link>
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
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-100 text-sm font-semibold text-teal-700">
                        {job.company?.name?.charAt(0)?.toUpperCase() || 'C'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <Link to={`/jobs/${job._id}`} className="font-medium text-gray-900 hover:text-teal-700">{job.title}</Link>
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
                          <Link to={`/jobs/${job._id}`} className="rounded-lg bg-teal-700 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#0C5F5A]">Apply</Link>
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
                      <Link to="/jobs" className="mt-2 block text-center text-sm font-semibold text-teal-700 hover:text-[#0C5F5A]">Browse jobs &rarr;</Link>
                    </div>
                  )}
                  {applications.length > 5 && (
                    <div className="px-5 py-3">
                      <button type="button" onClick={() => handleTabChange('applications')} className="text-sm font-medium text-teal-700 hover:text-[#0C5F5A]">
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
                <Link to="/candidate/dashboard?tab=profile" className="mt-2 block text-xs font-medium text-teal-700 hover:text-[#0C5F5A]">
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
                    <Link to={`/jobs/${job._id}`} className="font-medium text-gray-900 hover:text-teal-700">{job.title}</Link>
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
                    <Link to={`/jobs/${job._id}`} className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#0C5F5A]">Apply</Link>
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
              <button type="submit" disabled={createAlertMutation.isPending} className="mt-3 rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-[#0C5F5A] disabled:opacity-60">
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
                          <Link to={`/jobs/${app.job?._id}`} className="font-medium text-gray-900 hover:text-teal-700">{app.job?.title}</Link>
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
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-100 text-xs font-semibold text-teal-700">
                    {app.job?.company?.name?.charAt(0)?.toUpperCase() || 'C'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link to={`/jobs/${app.job?._id}`} className="text-sm font-medium text-gray-900 hover:text-teal-700">{app.job?.title}</Link>
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
                    <img
                      key={`${me.profileImageUrl}-p-${profilePhotoKey}`}
                      src={me.profileImageUrl}
                      alt={me.fullName}
                      className="h-20 w-20 rounded-full object-cover ring-2 ring-teal-100"
                    />
                  ) : (
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-teal-700 text-2xl font-semibold text-white">{me?.fullName?.charAt(0)?.toUpperCase() || 'U'}</div>
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
                <button type="button" onClick={() => setExperience((prev) => [...prev, { title: '', company: '', location: '', startDate: '', endDate: '', current: false, description: '' }])} className="rounded-lg bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-700 transition-colors hover:bg-teal-100">+ Add</button>
              </div>
              {experience.length === 0 && (
                <p className="mt-3 rounded-lg bg-gray-50 p-3 text-center text-xs text-gray-400">No experience added yet. Add each role like on LinkedIn — most recent first.</p>
              )}
              {experience.length > 0 && (
              <div className="relative mt-4 ml-1 border-l-2 border-gray-200 pl-6">
                {experience.map((exp, i) => (
                  <div key={exp._id || i} className="relative pb-10 last:pb-2">
                    <div className="absolute -left-[25px] top-2 h-3.5 w-3.5 rounded-full border-2 border-white bg-teal-700 ring-1 ring-gray-200" aria-hidden />
                    <div className="flex gap-3">
                      <div className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-gray-200 text-sm font-bold text-gray-600 sm:flex">
                        {(exp.company || '+').charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1 rounded-xl border border-gray-100 bg-gray-50/80 p-4 shadow-sm">
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-gray-500">Position {i + 1}</p>
                        {(exp.title || exp.company) && (
                          <p className="truncate text-sm font-semibold text-gray-900">{exp.title || 'Title'}{exp.company ? ` · ${exp.company}` : ''}</p>
                        )}
                        {(exp.startDate || exp.endDate || exp.current) && (
                          <p className="text-xs text-gray-500">{formatExperienceDateRange(exp)}</p>
                        )}
                      </div>
                      <button type="button" onClick={() => setExperience((prev) => prev.filter((_, j) => j !== i))} className="shrink-0 text-xs font-medium text-red-600 hover:text-red-800">Remove</button>
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
                          <input type="checkbox" checked={exp.current} onChange={(e) => setExperience((prev) => prev.map((x, j) => j === i ? { ...x, current: e.target.checked, endDate: e.target.checked ? '' : x.endDate } : x))} className="h-3.5 w-3.5 rounded border-gray-300 accent-teal-700" />
                          I currently work here
                        </label>
                      </div>
                      <div className="sm:col-span-2">
                        <label className="mb-0.5 block text-xs font-medium text-gray-600">Description</label>
                        <textarea value={exp.description} onChange={(e) => setExperience((prev) => prev.map((x, j) => j === i ? { ...x, description: e.target.value } : x))} rows={2} placeholder="Responsibilities and achievements..." className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm" />
                      </div>
                    </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              )}
            </div>

            {/* Projects */}
            <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-gray-900">Projects</h2>
                  <p className="mt-0.5 text-xs text-gray-500">Showcase your best work</p>
                </div>
                <button type="button" onClick={() => setProjects((prev) => [...prev, { title: '', description: '', url: '', technologies: [] }])} className="rounded-lg bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-700 transition-colors hover:bg-teal-100">+ Add</button>
              </div>
              {projects.length === 0 && (
                <p className="mt-3 rounded-lg bg-gray-50 p-3 text-center text-xs text-gray-400">No projects added yet. List apps, open source, or client work.</p>
              )}
              <div className="mt-3 space-y-4">
                {projects.map((proj, i) => (
                  <div key={proj._id || i} className="flex gap-3 rounded-xl border border-gray-100 bg-gray-50/80 p-4 shadow-sm ring-1 ring-gray-100/80">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-100 text-teal-700">
                      <span className="text-xs font-bold">{i + 1}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-gray-500">Project</p>
                        {proj.title && <p className="truncate text-sm font-semibold text-gray-900">{proj.title}</p>}
                      </div>
                      <button type="button" onClick={() => setProjects((prev) => prev.filter((_, j) => j !== i))} className="shrink-0 text-xs font-medium text-red-600 hover:text-red-800">Remove</button>
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
              <button type="button" onClick={() => setEducation((prev) => [...prev, { degree: '', institution: '', fieldOfStudy: '', startYear: '', endYear: '', grade: '' }])} className="rounded-lg bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-700 transition-colors hover:bg-teal-100">+ Add</button>
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

          <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-100 dark:bg-gray-900 dark:ring-gray-800">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Change password</h2>
            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">Use your current password to set a new one.</p>
            <div className="mt-4 grid max-w-md gap-3">
              <div>
                <label htmlFor="cd-old-pw" className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">
                  Current password
                </label>
                <input
                  id="cd-old-pw"
                  type="password"
                  autoComplete="current-password"
                  value={pwdForm.oldPassword}
                  onChange={(e) => setPwdForm((p) => ({ ...p, oldPassword: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm dark:border-gray-600 dark:bg-gray-950"
                />
              </div>
              <div>
                <label htmlFor="cd-new-pw" className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">
                  New password
                </label>
                <input
                  id="cd-new-pw"
                  type="password"
                  autoComplete="new-password"
                  value={pwdForm.newPassword}
                  onChange={(e) => setPwdForm((p) => ({ ...p, newPassword: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm dark:border-gray-600 dark:bg-gray-950"
                />
              </div>
              <div>
                <label htmlFor="cd-confirm-pw" className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">
                  Confirm new password
                </label>
                <input
                  id="cd-confirm-pw"
                  type="password"
                  autoComplete="new-password"
                  value={pwdForm.confirmPassword}
                  onChange={(e) => setPwdForm((p) => ({ ...p, confirmPassword: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm dark:border-gray-600 dark:bg-gray-950"
                />
              </div>
              <button
                type="button"
                disabled={
                  changePasswordMutation.isPending ||
                  !pwdForm.oldPassword ||
                  !pwdForm.newPassword ||
                  pwdForm.newPassword !== pwdForm.confirmPassword
                }
                onClick={() => {
                  if (pwdForm.newPassword !== pwdForm.confirmPassword) {
                    toast.error('New passwords do not match.')
                    return
                  }
                  changePasswordMutation.mutate({
                    oldPassword: pwdForm.oldPassword,
                    newPassword: pwdForm.newPassword,
                  })
                }}
                className="w-fit rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-white"
              >
                {changePasswordMutation.isPending ? 'Updating…' : 'Update password'}
              </button>
            </div>
          </div>

          {/* Data export */}
          <div className="rounded-xl border border-gray-200 bg-gray-50/80 p-5 dark:border-gray-700 dark:bg-gray-900/40">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Your data</h2>
            <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
              Download a JSON copy of your profile, applications, alerts, and notifications (data portability).
            </p>
            <button
              type="button"
              onClick={() => dataExportMutation.mutate()}
              disabled={dataExportMutation.isPending}
              className="mt-3 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50 disabled:opacity-60 dark:border-gray-600 dark:bg-gray-950 dark:text-gray-100 dark:hover:bg-gray-900"
            >
              {dataExportMutation.isPending ? 'Preparing…' : 'Download my data (JSON)'}
            </button>
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
            <button type="submit" disabled={updateProfileMutation.isPending} className="rounded-lg bg-teal-700 px-8 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#0C5F5A] disabled:opacity-60">
              {updateProfileMutation.isPending ? 'Saving all changes...' : 'Save All Changes'}
            </button>
          </div>
        </form>
      )}
        </div>
      </div>
    </div>
  )
}
