import { useCallback, useEffect, useMemo, useState, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link } from 'react-router-dom'
import { SaveJobButton } from '../../components/SaveJobButton.jsx'
import { ResumeSection } from '../../components/ResumeSection.jsx'
import { CandidateDashboardSkeleton } from '../../components/CandidateDashboardSkeleton.jsx'
import {
  Tabs,
  EmptyState,
  EmptyStateIcons,
  ApplicationRowSkeleton,
  Button,
  Card,
  JobCardSkeleton,
  Skeleton,
} from '../../components/ui/index.js'
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
import { getAtsUsage } from '../../api/atsApi.js'
import { getSubscriptionStatus } from '../../api/subscriptionApi.js'
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
  screening: {
    label: 'Screening',
    color:
      'bg-amber-50 text-amber-700 ring-1 ring-amber-600/20 dark:bg-blue-900/30 dark:text-blue-300 dark:ring-blue-600/30',
    dot: 'bg-amber-500',
  },
  /** Legacy API responses before DB migration */
  shortlisted: {
    label: 'Screening',
    color:
      'bg-amber-50 text-amber-700 ring-1 ring-amber-600/20 dark:bg-blue-900/30 dark:text-blue-300 dark:ring-blue-600/30',
    dot: 'bg-amber-500',
  },
  interview: {
    label: 'Interview',
    color:
      'bg-sky-50 text-sky-700 ring-1 ring-sky-600/20 dark:bg-green-900/30 dark:text-green-300 dark:ring-green-600/30',
    dot: 'bg-sky-500',
  },
  offer: {
    label: 'Offer',
    color: 'bg-teal-50 text-teal-700 ring-1 ring-teal-600/20 dark:bg-teal-950/50 dark:text-teal-300',
    dot: 'bg-teal-500',
  },
  rejected: {
    label: 'Rejected',
    color: 'bg-red-50 text-red-700 ring-1 ring-red-600/20 dark:bg-red-900/30 dark:text-red-300',
    dot: 'bg-red-500',
  },
  hired: {
    label: 'Hired',
    color:
      'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20 dark:bg-emerald-900/30 dark:text-emerald-300',
    dot: 'bg-emerald-500',
  },
}

const TYPE_COLORS = {
  'full-time': 'bg-emerald-50 text-emerald-700',
  'part-time': 'bg-teal-50 text-teal-700 dark:bg-teal-950/50 dark:text-teal-300',
  contract: 'bg-amber-50 text-amber-700',
  internship: 'bg-purple-50 text-purple-700',
}

const EMPLOYMENT_TYPES = ['full-time', 'part-time', 'contract', 'internship']

const CANDIDATE_TAB_IDS = ['overview', 'saved', 'alerts', 'applications', 'profile', 'subscription']

/** Resume on file — API may expose resumeUrl, hasResume, or resumeFileName. */
function hasUserResume(user) {
  if (!user) return false
  return Boolean(
    (typeof user.resumeUrl === 'string' && user.resumeUrl.trim()) ||
      user.hasResume === true ||
      (typeof user.resumeFileName === 'string' && user.resumeFileName.trim()),
  )
}

const PROFILE_COMPLETION_ROWS = [
  { check: (u) => !!u?.fullName, missing: 'Add your full name to complete your profile' },
  { check: (u) => !!u?.headline, missing: 'Add headline to improve your profile' },
  { check: (u) => !!u?.location, missing: 'Add your location so employers can find you' },
  { check: (u) => !!u?.phone, missing: 'Add a phone number for recruiters' },
  { check: (u) => !!u?.about, missing: 'Add an about section to tell your story' },
  { check: (u) => u?.skills?.length > 0, missing: 'Add skills to show what you bring' },
  { check: (u) => u?.experience?.length > 0, missing: 'Add work experience to strengthen your profile' },
  { check: (u) => u?.education?.length > 0, missing: 'Add education to round out your profile' },
  { check: (u) => !!u?.resumeUrl, missing: 'Upload resume to stand out' },
  { check: (u) => !!u?.profileImageUrl, missing: 'Add a profile photo to build trust' },
]

function calculateCompletion(user) {
  if (!user) return 0
  const checks = PROFILE_COMPLETION_ROWS.map((row) => row.check(user))
  const completed = checks.filter(Boolean).length
  return Math.round((completed / checks.length) * 100)
}

function getCompletionMissingMessages(user) {
  if (!user) return []
  return PROFILE_COMPLETION_ROWS.filter((row) => !row.check(user)).map((row) => row.missing)
}

function savedJobDaysUntilExpiry(expiresAt) {
  if (expiresAt == null || expiresAt === '') return null
  const t = new Date(expiresAt).getTime()
  if (Number.isNaN(t)) return null
  return Math.ceil((t - Date.now()) / (1000 * 60 * 60 * 24))
}

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

function IconNavHome({ className = '', ...rest }) {
  return (
    <svg
      className={`h-5 w-5 shrink-0 ${className}`.trim()}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden
      {...rest}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
      />
    </svg>
  )
}

function IconNavBookmark({ className = '', ...rest }) {
  return (
    <svg
      className={`h-5 w-5 shrink-0 ${className}`.trim()}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden
      {...rest}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-8-4-8 4V5z" />
    </svg>
  )
}

function IconNavBell({ className = '', ...rest }) {
  return (
    <svg
      className={`h-5 w-5 shrink-0 ${className}`.trim()}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden
      {...rest}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
      />
    </svg>
  )
}

function IconNavBriefcase({ className = '', ...rest }) {
  return (
    <svg
      className={`h-5 w-5 shrink-0 ${className}`.trim()}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden
      {...rest}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
      />
    </svg>
  )
}

function IconNavUser({ className = '', ...rest }) {
  return (
    <svg
      className={`h-5 w-5 shrink-0 ${className}`.trim()}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden
      {...rest}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  )
}

function IconNavCreditCard({ className = '', ...rest }) {
  return (
    <svg
      className={`h-5 w-5 shrink-0 ${className}`.trim()}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden
      {...rest}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
      />
    </svg>
  )
}

function IconStatBriefcase(props) {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden {...props}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.184 2.675-.394.633-1.163 1.085-2.086 1.085H7.02c-.923 0-1.692-.452-2.086-1.085-.397-.639-1.184-1.581-1.184-2.675v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 009 3h-.75a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0M12 12.75h.008v.008H12v-.008Z"
      />
    </svg>
  )
}

const CANDIDATE_NAV = [
  { id: 'overview', label: 'Overview', description: 'Jobs and activity', Icon: IconNavHome },
  { id: 'saved', label: 'Saved Jobs', description: 'Your saved listings', Icon: IconNavBookmark },
  { id: 'alerts', label: 'Job Alerts', description: 'Search alerts', Icon: IconNavBell },
  { id: 'applications', label: 'My Applications', description: 'Track applications', Icon: IconNavBriefcase },
  { id: 'profile', label: 'Edit Profile', description: 'Your information', Icon: IconNavUser },
  { id: 'subscription', label: 'Subscription', description: 'Plan and billing', Icon: IconNavCreditCard },
]

const navItemClass =
  'flex w-full cursor-pointer items-center gap-3 rounded-lg border-l-2 border-transparent px-4 py-2.5 text-left text-sm transition-colors'
const navItemInactive = 'text-gray-400 hover:bg-gray-800 hover:text-white'
const navItemActive = 'border-teal-500 bg-teal-600/10 text-teal-400'

export function CandidateDashboardPage() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const tabFromUrl = searchParams.get('tab')
  const { user, updateUser, logout } = useAuth()
  const [activeTab, setActiveTab] = useState(
    tabFromUrl && CANDIDATE_TAB_IDS.includes(tabFromUrl) ? tabFromUrl : 'overview',
  )
  const imageInputRef = useRef(null)
  const profilePhotoInputRef = useRef(null)
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
    if (tabFromUrl && CANDIDATE_TAB_IDS.includes(tabFromUrl)) {
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

  const atsUsageQuery = useQuery({
    queryKey: queryKeys.ats.usage(),
    queryFn: () => getAtsUsage(),
    staleTime: CACHE_TIERS.userActivity.staleTime,
    gcTime: CACHE_TIERS.userActivity.gcTime,
    enabled: Boolean(meQuery.data || user),
  })

  const subscriptionQuery = useQuery({
    queryKey: queryKeys.subscription.status(),
    queryFn: () => getSubscriptionStatus(),
    staleTime: CACHE_TIERS.userActivity.staleTime,
    gcTime: CACHE_TIERS.userActivity.gcTime,
    enabled: Boolean(meQuery.data || user),
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
  const profileCompletionPercent = useMemo(() => calculateCompletion(me), [me])
  const profileCompletionMissing = useMemo(() => getCompletionMissingMessages(me), [me])
  const applications = applicationsQuery.data || []
  const appliedIds = new Set(applications.map((a) => a.job?._id || a.job))

  const savedJobs = savedJobsQuery.data || []
  const jobAlerts = jobAlertsQuery.data || []
  const tabs = CANDIDATE_NAV.map((t) => ({
    id: t.id,
    label: t.label,
    count:
      t.id === 'saved'
        ? savedJobs.length || undefined
        : t.id === 'alerts'
          ? jobAlerts.length || undefined
          : t.id === 'applications'
            ? applications.length || undefined
            : undefined,
  }))

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
    return (
      <div className="min-h-[calc(100dvh-3.5rem)] bg-gray-950">
        <CandidateDashboardSkeleton />
      </div>
    )
  }

  return (
    <div className="flex min-h-[calc(100dvh-3.5rem)] w-full min-w-0 bg-gray-950">
      <aside
        className="hidden min-h-0 w-72 shrink-0 flex-col border-r border-gray-800 bg-gray-900 dark:bg-gray-900 lg:flex"
        aria-label="Dashboard sections"
      >
        <div className="shrink-0 pt-5">
          <p className="mb-2 px-4 text-xs font-semibold uppercase tracking-wider text-gray-400">MY ACCOUNT</p>
          <div className="mb-4 border-b border-gray-800 px-4 py-3">
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="ghost"
                className="group relative !h-auto !min-h-0 rounded-full p-0 focus-visible:ring-2 focus-visible:ring-teal-500/80 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
                onClick={() => imageInputRef.current?.click()}
                title="Change photo"
              >
                {me?.profileImageUrl ? (
                  <img
                    key={`${me.profileImageUrl}-${profilePhotoKey}`}
                    src={me.profileImageUrl}
                    alt={me.fullName}
                    className="h-8 w-8 rounded-full object-cover ring-2 ring-gray-700"
                  />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-700 text-xs font-semibold text-white ring-2 ring-gray-700">
                    {me?.fullName?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                )}
                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                  <svg className="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
              </Button>
              <input
                ref={imageInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) uploadImageMutation.mutate(file)
                }}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-white">{me?.fullName || 'Your Name'}</p>
                <p className="text-xs text-gray-500">Candidate</p>
              </div>
            </div>
          </div>
        </div>
        <nav className="flex flex-1 flex-col gap-0.5 px-2 pb-2" aria-label="Candidate dashboard tabs">
          {CANDIDATE_NAV.map((item) => {
            const Icon = item.Icon
            const isActive = activeTab === item.id
            const count =
              item.id === 'saved'
                ? savedJobs.length
                : item.id === 'alerts'
                  ? jobAlerts.length
                  : item.id === 'applications'
                    ? applications.length
                    : null
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleTabChange(item.id)}
                className={`${navItemClass} ${isActive ? navItemActive : navItemInactive}`}
              >
                <Icon className={isActive ? 'text-teal-400' : 'text-gray-500'} />
                <div className="min-w-0 flex-1 text-left">
                  <p className={`font-medium ${isActive ? 'text-teal-400' : 'text-gray-200'}`}>{item.label}</p>
                  <p className="text-xs text-gray-500">{item.description}</p>
                </div>
                {count != null && count > 0 ? (
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${
                      isActive ? 'bg-teal-500/20 text-teal-300' : 'bg-gray-800 text-gray-400'
                    }`}
                  >
                    {count}
                  </span>
                ) : null}
              </button>
            )
          })}
        </nav>
        <div className="shrink-0 border-t border-gray-800 p-3">
          <Link
            to="/jobs"
            className={`${navItemClass} ${navItemInactive} no-underline`}
          >
            <svg className="h-5 w-5 shrink-0 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            <div className="min-w-0 flex-1">
              <p className="font-medium text-gray-200">Back to site</p>
              <p className="text-xs text-gray-500">Browse open roles</p>
            </div>
          </Link>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col bg-gray-950">
        <div className="shrink-0 border-b border-gray-800 bg-gray-900/80 px-4 py-3 lg:hidden">
          <Tabs tabs={tabs} activeTab={activeTab} onChange={handleTabChange} variant="pills" className="!rounded-xl !bg-gray-800/80 !p-1 !ring-gray-700" />
        </div>

        <div className="mx-auto w-full max-w-7xl flex-1 space-y-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="mb-6">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-teal-400">CANDIDATE</p>
            <h1 className="text-2xl font-bold text-white">My Dashboard</h1>
            <p className="text-sm text-gray-400">Track your job search and manage your career profile.</p>
          </div>

      {/* === OVERVIEW TAB === */}
      {activeTab === 'overview' && (
        <div className="space-y-5">
          <div className="rounded-xl border border-teal-500/20 bg-teal-600/10 px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-teal-300">At a glance</p>
            <p className="mt-1 text-sm text-teal-200/90">
              Your applications, saved roles, alerts, and profile completion in one place.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <button
              type="button"
              onClick={() => handleTabChange('applications')}
              className="relative rounded-xl border border-gray-700 bg-gray-800/50 p-4 text-left transition hover:border-teal-500/30 hover:bg-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
            >
              <span className="absolute right-3 top-3 text-teal-400">
                <IconStatBriefcase />
              </span>
              <p className="text-2xl font-bold tabular-nums text-white">{applications.length}</p>
              <p className="mt-1 text-sm text-gray-400">Applications</p>
            </button>
            <button
              type="button"
              onClick={() => handleTabChange('saved')}
              className="relative rounded-xl border border-gray-700 bg-gray-800/50 p-4 text-left transition hover:border-teal-500/30 hover:bg-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
            >
              <span className="absolute right-3 top-3 text-teal-400">
                <IconNavBookmark />
              </span>
              <p className="text-2xl font-bold tabular-nums text-white">{savedJobs.length}</p>
              <p className="mt-1 text-sm text-gray-400">Saved Jobs</p>
            </button>
            <button
              type="button"
              onClick={() => handleTabChange('alerts')}
              className="relative rounded-xl border border-gray-700 bg-gray-800/50 p-4 text-left transition hover:border-teal-500/30 hover:bg-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
            >
              <span className="absolute right-3 top-3 text-teal-400">
                <IconNavBell />
              </span>
              <p className="text-2xl font-bold tabular-nums text-white">{jobAlerts.length}</p>
              <p className="mt-1 text-sm text-gray-400">Job Alerts</p>
            </button>
            <button
              type="button"
              onClick={() => handleTabChange('profile')}
              className="relative rounded-xl border border-gray-700 bg-gray-800/50 p-4 text-left transition hover:border-teal-500/30 hover:bg-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
            >
              <span className="absolute right-3 top-3 text-teal-400">
                <IconNavUser />
              </span>
              <p className="text-2xl font-bold tabular-nums text-white">{me ? profileCompletionPercent : 0}%</p>
              <p className="mt-1 text-sm text-gray-400">Profile</p>
            </button>
          </div>

          <div className="rounded-xl border border-gray-700/50 bg-gray-800/50 p-5 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-base font-semibold text-white">Profile completion</h2>
                <p className="mt-0.5 text-sm text-gray-500">Complete your profile to get noticed by recruiters</p>
              </div>
              <p className="text-5xl font-bold tabular-nums leading-none text-teal-400 sm:text-right">
                {me ? profileCompletionPercent : 0}
                <span className="text-2xl font-semibold text-gray-400">%</span>
              </p>
            </div>
            <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-gray-700">
              <div
                className="h-full rounded-full bg-teal-500 transition-[width] duration-300"
                style={{ width: `${me ? profileCompletionPercent : 0}%` }}
                role="progressbar"
                aria-valuenow={me ? profileCompletionPercent : 0}
                aria-valuemin={0}
                aria-valuemax={100}
              />
            </div>
            {me && profileCompletionMissing.length > 0 ? (
              <ul className="mt-4 space-y-2 border-t border-gray-700/50 pt-4 text-sm text-gray-300">
                {profileCompletionMissing.map((msg) => (
                  <li key={msg} className="flex gap-2">
                    <span className="mt-0.5 shrink-0 text-amber-400" aria-hidden>
                      •
                    </span>
                    <span>{msg}</span>
                  </li>
                ))}
              </ul>
            ) : me ? (
              <p className="mt-4 border-t border-gray-700/50 pt-4 text-sm text-emerald-400/90">Your profile is fully complete for this checklist.</p>
            ) : null}
          </div>

          <div className="rounded-xl border border-gray-700/50 bg-gray-800/50 p-5 sm:p-6">
            <h2 className="text-base font-semibold text-white">Check Your ATS Score</h2>
            <p className="mt-1 text-sm text-gray-400">See how well your resume matches job descriptions</p>
            <div className="mt-4 flex flex-wrap gap-3">
              {hasUserResume(me) ? (
                <Button
                  type="button"
                  variant="primary"
                  size="lg"
                  className="!bg-emerald-600 hover:!bg-emerald-500"
                  onClick={() => navigate('/ats-checker')}
                >
                  Check Now
                </Button>
              ) : (
                <Button type="button" variant="primary" size="lg" onClick={() => handleTabChange('profile')}>
                  Upload Resume first
                </Button>
              )}
            </div>
            {atsUsageQuery.data?.isPremium ? (
              <p className="mt-4 text-sm text-gray-400">Premium: unlimited ATS checks this month.</p>
            ) : (
              <>
                <p className="mt-4 text-sm text-gray-400">
                  {typeof atsUsageQuery.data?.atsChecksLimit === 'number'
                    ? `${atsUsageQuery.data.atsChecksLimit} free checks per month`
                    : '3 free checks per month'}
                </p>
                <p className="mt-1 text-sm font-medium text-gray-200">
                  {typeof atsUsageQuery.data?.atsChecksLimit === 'number'
                    ? `${atsUsageQuery.data?.atsChecksUsed ?? 0} of ${atsUsageQuery.data.atsChecksLimit} used this month`
                    : `${atsUsageQuery.data?.atsChecksUsed ?? 0} of 3 used this month`}
                </p>
              </>
            )}
            {atsUsageQuery.isError && (
              <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">Could not load ATS usage. Try again later.</p>
            )}
          </div>

          {(me?.email || me?.skills?.length > 0 || me?.about) && (
            <div className="rounded-xl border border-gray-700/50 bg-gray-800/50 p-4">
              {me?.email ? <p className="text-xs text-gray-400">{me.email}</p> : null}
              {me?.location ? (
                <p className="mt-1 flex items-center gap-1 text-xs text-gray-500">
                  <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {me.location}
                </p>
              ) : null}
              {me?.skills?.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {me.skills.map((skill) => (
                    <span key={skill} className="rounded-full bg-teal-500/15 px-2.5 py-0.5 text-xs font-medium text-teal-300">
                      {skill}
                    </span>
                  ))}
                </div>
              )}
              {me?.about ? (
                <p className="mt-3 border-t border-gray-700/50 pt-3 text-sm leading-relaxed text-gray-300">
                  {me.about.length > 280 ? `${me.about.slice(0, 280)}…` : me.about}
                </p>
              ) : null}
            </div>
          )}

          {(me?.experience?.length > 0 || me?.projects?.length > 0) && (
            <div className="grid gap-4 lg:grid-cols-2">
              {me.experience?.length > 0 && (
                <div className="rounded-xl border border-gray-700/50 bg-gray-800/50">
                  <div className="flex items-center justify-between border-b border-gray-700/50 px-5 py-4">
                    <h2 className="text-base font-semibold text-white">Experience</h2>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="!h-auto !min-h-0 py-0 text-sm font-medium text-teal-400 hover:text-teal-300"
                      onClick={() => handleTabChange('profile')}
                    >
                      Add or edit
                    </Button>
                  </div>
                  <div className="px-5 py-4">
                    <div className="relative border-l-2 border-gray-700 pl-6">
                      {me.experience.map((exp, i) => (
                        <div key={exp._id || `exp-${i}`} className="relative pb-8 last:pb-0">
                          <div className="absolute -left-[25px] top-1 flex h-4 w-4 items-center justify-center rounded-full border-2 border-gray-800 bg-teal-700 ring-1 ring-gray-600" aria-hidden />
                          <div className="flex gap-3">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-gray-700 text-sm font-bold uppercase text-gray-200">
                              {(exp.company || '?').charAt(0)}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold text-white">{exp.title || 'Role'}</p>
                              <p className="text-sm text-gray-400">{exp.company || 'Company'}{exp.location ? ` · ${exp.location}` : ''}</p>
                              <p className="mt-0.5 text-xs text-gray-500">{formatExperienceDateRange(exp)}</p>
                              {exp.description && (
                                <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-gray-300">{exp.description}</p>
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
                <div className="rounded-xl border border-gray-700/50 bg-gray-800/50">
                  <div className="flex items-center justify-between border-b border-gray-700/50 px-5 py-4">
                    <h2 className="text-base font-semibold text-white">Projects</h2>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="!h-auto !min-h-0 py-0 text-sm font-medium text-teal-400 hover:text-teal-300"
                      onClick={() => handleTabChange('profile')}
                    >
                      Add or edit
                    </Button>
                  </div>
                  <ul className="divide-y divide-gray-700/50 px-5 py-2">
                    {me.projects.map((proj, i) => (
                      <li key={proj._id || `proj-${i}`} className="flex gap-3 py-4 first:pt-2">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-500/15 text-teal-300">
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                          </svg>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                            <span className="text-sm font-semibold text-white">{proj.title || 'Project'}</span>
                            {proj.url && (
                              <a href={proj.url} target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-teal-400 hover:text-teal-300">
                                Link
                              </a>
                            )}
                          </div>
                          {Array.isArray(proj.technologies) && proj.technologies.length > 0 && (
                            <div className="mt-1.5 flex flex-wrap gap-1">
                              {proj.technologies.slice(0, 8).map((t) => (
                                <span key={t} className="rounded bg-gray-800 px-2 py-0.5 text-xs text-gray-300">
                                  {t}
                                </span>
                              ))}
                            </div>
                          )}
                          {proj.description && <p className="mt-2 line-clamp-3 text-sm text-gray-400">{proj.description}</p>}
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
            <div className="rounded-xl border border-gray-700/50 bg-gray-800/50">
              <div className="flex items-center justify-between border-b border-gray-700/50 px-5 py-4">
                <h2 className="text-base font-semibold text-white">Recommended for you</h2>
                <Link to="/jobs" className="text-sm font-medium text-teal-400 hover:text-teal-300">See all jobs &rarr;</Link>
              </div>
              <div className="divide-y divide-gray-700/50">
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
                    <div key={job._id} className="flex flex-col gap-3 px-5 py-4 transition-colors hover:bg-gray-800/40 sm:flex-row sm:items-start sm:gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-500/15 text-sm font-semibold text-teal-300">
                        {job.company?.name?.charAt(0)?.toUpperCase() || 'C'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <Link to={`/jobs/${job._id}`} className="font-medium text-white hover:text-teal-400">{job.title}</Link>
                        <p className="mt-0.5 text-sm text-gray-500">{job.company?.name} &middot; {job.location}</p>
                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                          {job.employmentType && (
                            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${TYPE_COLORS[job.employmentType] || 'bg-gray-800 text-gray-300'}`}>{job.employmentType}</span>
                          )}
                          {(job.minSalary > 0 || job.maxSalary > 0) && (
                            <span className="text-xs font-medium text-emerald-600">{formatSalaryRange(job.minSalary, job.maxSalary)}</span>
                          )}
                          {job.skills?.slice(0, 3).map((s) => (
                            <span key={s} className="rounded bg-gray-800 px-1.5 py-0.5 text-xs text-gray-400">{s}</span>
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

          {/* Right column — activity and documents */}
          <div className="space-y-5 md:col-span-2 xl:col-span-1">
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-1">
              {/* Recent activity */}
              <div className="rounded-xl border border-gray-700/50 bg-gray-800/50">
                <div className="border-b border-gray-700/50 px-5 py-4">
                  <h2 className="text-base font-semibold text-white">Recent Activity</h2>
                </div>
                <div className="divide-y divide-gray-700/50">
                  {applications.slice(0, 5).map((app) => {
                    const cfg = STATUS_CONFIG[app.status] || STATUS_CONFIG.applied
                    return (
                      <div key={app._id} className="flex items-center gap-3 px-5 py-3">
                        <div className={`h-2.5 w-2.5 shrink-0 rounded-full ${cfg.dot}`} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-white">{app.job?.title}</p>
                          <p className="truncate text-xs text-gray-500">{app.job?.company?.name}</p>
                        </div>
                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${cfg.color}`}>{cfg.label}</span>
                      </div>
                    )
                  })}
                  {applications.length === 0 && (
                    <div className="px-5 py-6">
                      <p className="text-center text-sm text-gray-500">No applications yet</p>
                      <Link to="/jobs" className="mt-2 block text-center text-sm font-semibold text-teal-400 hover:text-teal-300">Browse jobs &rarr;</Link>
                    </div>
                  )}
                  {applications.length > 5 && (
                    <div className="px-5 py-3">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="!h-auto !min-h-0 py-0 text-sm font-medium text-teal-400 hover:text-teal-300"
                        onClick={() => handleTabChange('applications')}
                      >
                        View all {applications.length} applications &rarr;
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Documents */}
              <div className="rounded-xl border border-gray-700/50 bg-gray-800/50 p-5">
                <h2 className="text-base font-semibold text-white">Documents</h2>
                <div className="mt-3">
                  <ResumeSection user={me} onUserUpdate={updateUser} compact />
                </div>
                <Link to="/candidate/dashboard?tab=profile" className="mt-2 block text-xs font-medium text-teal-400 hover:text-teal-300">
                  Manage resume &rarr;
                </Link>
              </div>
            </div>
          </div>
        </div>
        </div>
      )}

      {activeTab === 'saved' && (
        <div className="rounded-xl border border-gray-700/50 bg-gray-800/50">
          <div className="border-b border-gray-700/50 px-5 py-4 sm:px-6">
            <h2 className="text-base font-semibold text-white">Saved Jobs</h2>
            <p className="mt-0.5 text-sm text-gray-500">Jobs you&apos;ve bookmarked for later</p>
          </div>
          {savedJobsQuery.isError && (
            <div className="p-5">
              <Card padding="default" className="border border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-950/40">
                <p className="text-center text-sm text-red-700 dark:text-red-300" role="alert">
                  Could not load saved jobs. Please try again.
                </p>
                <div className="mt-4 flex justify-center">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => savedJobsQuery.refetch()}
                    disabled={savedJobsQuery.isFetching}
                  >
                    {savedJobsQuery.isFetching ? 'Retrying…' : 'Try again'}
                  </Button>
                </div>
              </Card>
            </div>
          )}
          {savedJobsQuery.isLoading && (
            <div className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <JobCardSkeleton key={i} />
              ))}
            </div>
          )}
          {!savedJobsQuery.isError && savedJobs.length > 0 && (
            <div className="divide-y divide-gray-700/50">
              {savedJobs.map((job) => (
                <div key={job._id} className="flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-gray-800/40">
                  <div className="min-w-0 flex-1">
                    <Link to={`/jobs/${job._id}`} className="font-medium text-white hover:text-teal-400">{job.title}</Link>
                    <p className="mt-0.5 text-sm text-gray-500">{job.company?.name} &middot; {job.location}</p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {job.employmentType && (
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${TYPE_COLORS[job.employmentType] || 'bg-gray-800 text-gray-300'}`}>{job.employmentType}</span>
                      )}
                      {(job.minSalary > 0 || job.maxSalary > 0) && (
                        <span className="text-xs font-medium text-emerald-600">{formatSalaryRange(job.minSalary, job.maxSalary)}</span>
                      )}
                      {(() => {
                        const daysLeft = savedJobDaysUntilExpiry(job.expiresAt)
                        if (daysLeft == null || daysLeft <= 0) return null
                        if (daysLeft <= 2) {
                          return (
                            <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-600 dark:bg-red-900/30 dark:text-red-400">
                              Expires in {daysLeft} day(s)
                            </span>
                          )
                        }
                        if (daysLeft <= 7) {
                          return (
                            <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400">
                              {daysLeft} days left
                            </span>
                          )
                        }
                        return null
                      })()}
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
          {savedJobs.length === 0 && !savedJobsQuery.isLoading && !savedJobsQuery.isError && (
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
        <div className="rounded-xl border border-gray-700/50 bg-gray-800/50">
          <div className="border-b border-gray-700/50 px-5 py-4 sm:px-6">
            <h2 className="text-base font-semibold text-white">Job Alerts</h2>
            <p className="mt-0.5 text-sm text-gray-500">Get emailed when new jobs match your criteria</p>
          </div>
          <div className="p-5">
            <form
              className="mb-6 rounded-lg border border-gray-700/50 bg-gray-900/50 p-4"
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
                  <label htmlFor="alert-keywords" className="mb-1 block text-xs font-medium text-gray-400">
                    Keywords
                  </label>
                  <input
                    id="alert-keywords"
                    name="keywords"
                    placeholder="e.g. React, Node.js"
                    className="w-full rounded-lg border border-gray-600 bg-gray-900 px-3 py-2 text-sm text-white placeholder:text-gray-500"
                  />
                </div>
                <div>
                  <label htmlFor="alert-location" className="mb-1 block text-xs font-medium text-gray-400">
                    Location
                  </label>
                  <input
                    id="alert-location"
                    name="location"
                    placeholder="e.g. Remote, Bangalore"
                    className="w-full rounded-lg border border-gray-600 bg-gray-900 px-3 py-2 text-sm text-white placeholder:text-gray-500"
                  />
                </div>
                <div>
                  <label htmlFor="alert-type" className="mb-1 block text-xs font-medium text-gray-400">
                    Job type
                  </label>
                  <select
                    id="alert-type"
                    name="employmentType"
                    className="w-full rounded-lg border border-gray-600 bg-gray-900 px-3 py-2 text-sm text-white"
                  >
                    <option value="">Any</option>
                    {EMPLOYMENT_TYPES.map((t) => (
                      <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                    ))}
                  </select>
                </div>
              </div>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                className="mt-3"
                loading={createAlertMutation.isPending}
                loadingText="Creating..."
              >
                + Create alert
              </Button>
            </form>
            {jobAlertsQuery.isError && (
              <Card padding="default" className="mb-4 border border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-950/40">
                <p className="text-center text-sm text-red-700 dark:text-red-300" role="alert">
                  Could not load job alerts. Please try again.
                </p>
                <div className="mt-4 flex justify-center">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => jobAlertsQuery.refetch()}
                    disabled={jobAlertsQuery.isFetching}
                  >
                    {jobAlertsQuery.isFetching ? 'Retrying…' : 'Try again'}
                  </Button>
                </div>
              </Card>
            )}
            {jobAlertsQuery.isLoading && (
              <div className="space-y-3 py-2">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between gap-4 rounded-lg border border-gray-700 bg-gray-900/50 p-4"
                  >
                    <div className="min-w-0 flex-1 space-y-2">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-64" />
                    </div>
                    <Skeleton className="h-8 w-16 shrink-0 rounded-lg" />
                  </div>
                ))}
              </div>
            )}
            {!jobAlertsQuery.isError && jobAlerts.length > 0 && (
              <div className="space-y-3">
                {jobAlerts.map((alert) => (
                  <div key={alert._id} className="flex items-center justify-between rounded-lg border border-gray-700/50 bg-gray-900/40 p-4">
                    <div>
                      <p className="text-sm font-medium text-white">{alert.keywords || 'Any keywords'}</p>
                      <p className="text-xs text-gray-500">{alert.location || 'Any location'} &middot; {alert.employmentType || 'Any type'}</p>
                    </div>
                    <Button
                      type="button"
                      variant="danger"
                      size="sm"
                      onClick={() => deleteAlertMutation.mutate(alert._id)}
                      disabled={deleteAlertMutation.isPending}
                    >
                      Delete
                    </Button>
                  </div>
                ))}
              </div>
            )}
            {!jobAlertsQuery.isError && jobAlerts.length === 0 && !jobAlertsQuery.isLoading && (
              <p className="py-8 text-center text-sm text-gray-500">No alerts yet. Create one above to get notified of new jobs.</p>
            )}
          </div>
        </div>
      )}

      {activeTab === 'applications' && (
        <div className="rounded-xl border border-gray-700/50 bg-gray-800/50">
          <div className="border-b border-gray-700/50 px-5 py-4 sm:px-6">
            <h2 className="text-base font-semibold text-white">All Applications</h2>
            <p className="mt-0.5 text-sm text-gray-500">Track the status of all your job applications</p>
          </div>
          {applicationsQuery.isError && (
            <div className="p-5">
              <Card padding="default" className="border border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-950/40">
                <p className="text-center text-sm text-red-700 dark:text-red-300" role="alert">
                  Could not load applications. Please try again.
                </p>
                <div className="mt-4 flex justify-center">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => applicationsQuery.refetch()}
                    disabled={applicationsQuery.isFetching}
                  >
                    {applicationsQuery.isFetching ? 'Retrying…' : 'Try again'}
                  </Button>
                </div>
              </Card>
            </div>
          )}
          {applicationsQuery.isLoading && (
            <div className="divide-y divide-gray-700/50">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <ApplicationRowSkeleton key={i} />
              ))}
            </div>
          )}

          {/* Desktop table */}
          {!applicationsQuery.isError && applications.length > 0 && (
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-700/50 text-xs uppercase tracking-wider text-gray-500">
                    <th className="px-5 py-3 font-medium">Job</th>
                    <th className="px-5 py-3 font-medium">Company</th>
                    <th className="px-5 py-3 font-medium">Applied On</th>
                    <th className="px-5 py-3 font-medium text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700/50">
                  {applications.map((app) => {
                    const cfg = STATUS_CONFIG[app.status] || STATUS_CONFIG.applied
                    return (
                      <tr key={app._id} className="transition-colors hover:bg-gray-800/40">
                        <td className="px-5 py-3.5">
                          <Link to={`/jobs/${app.job?._id}`} className="font-medium text-white hover:text-teal-400">{app.job?.title}</Link>
                        </td>
                        <td className="px-5 py-3.5 text-gray-400">{app.job?.company?.name}</td>
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
          <div className="divide-y divide-gray-700/50 md:hidden">
            {!applicationsQuery.isError &&
              !applicationsQuery.isLoading &&
              applications.map((app) => {
              const cfg = STATUS_CONFIG[app.status] || STATUS_CONFIG.applied
              return (
                <div key={app._id} className="flex items-center gap-3 px-4 py-3.5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-500/15 text-xs font-semibold text-teal-300">
                    {app.job?.company?.name?.charAt(0)?.toUpperCase() || 'C'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link to={`/jobs/${app.job?._id}`} className="text-sm font-medium text-white hover:text-teal-400">{app.job?.title}</Link>
                    <p className="text-xs text-gray-500">{app.job?.company?.name}</p>
                    {app.createdAt && <p className="text-xs text-gray-400">Applied {new Date(app.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>}
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${cfg.color}`}>{cfg.label}</span>
                </div>
              )
            })}
          </div>

          {applications.length === 0 && !applicationsQuery.isLoading && !applicationsQuery.isError && (
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

      {activeTab === 'subscription' && (
        <div className="space-y-5">
          {subscriptionQuery.isError ? (
            <Card padding="default" className="border border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-950/40">
              <p className="text-center text-sm text-red-700 dark:text-red-300" role="alert">
                Could not load subscription status. Please try again.
              </p>
              <div className="mt-4 flex justify-center">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => subscriptionQuery.refetch()}
                  disabled={subscriptionQuery.isFetching}
                >
                  {subscriptionQuery.isFetching ? 'Retrying…' : 'Try again'}
                </Button>
              </div>
            </Card>
          ) : (
            <div className="rounded-xl border border-gray-700/50 bg-gray-800/50 p-5 sm:p-6">
              {subscriptionQuery.isLoading && !subscriptionQuery.data ? (
                <div className="space-y-3">
                  <Skeleton className="h-6 w-40" />
                  <Skeleton className="h-4 w-full max-w-md" />
                  <Skeleton className="h-24 w-full" />
                </div>
              ) : subscriptionQuery.data?.isPremium ? (
                <>
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-lg font-semibold text-white">Premium Plan</h2>
                    <span className="rounded-full bg-teal-500/20 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-teal-300">
                      Premium
                    </span>
                  </div>
                  {(() => {
                    const raw = me?.premiumExpiresAt || subscriptionQuery.data?.subscription?.currentPeriodEnd
                    const d = raw ? new Date(raw) : null
                    const ok = d && !Number.isNaN(d.getTime())
                    return ok ? (
                      <p className="mt-2 text-sm text-gray-400">
                        Valid until{' '}
                        {d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                      </p>
                    ) : null
                  })()}
                  <ul className="mt-6 space-y-2 text-sm text-gray-200">
                    <li className="flex gap-2">
                      <span aria-hidden>✅</span>
                      <span>Browse all jobs</span>
                    </li>
                    <li className="flex gap-2">
                      <span aria-hidden>✅</span>
                      <span>Save up to 20 jobs</span>
                    </li>
                    <li className="flex gap-2">
                      <span aria-hidden>✅</span>
                      <span>3 ATS checks per month</span>
                    </li>
                    <li className="flex gap-2">
                      <span aria-hidden>✅</span>
                      <span>Unlimited ATS checks</span>
                    </li>
                    <li className="flex gap-2">
                      <span aria-hidden>✅</span>
                      <span>Resume Review tool</span>
                    </li>
                    <li className="flex gap-2">
                      <span aria-hidden>✅</span>
                      <span>Interview Questions</span>
                    </li>
                    <li className="flex gap-2">
                      <span aria-hidden>✅</span>
                      <span>Cover Letter Generator</span>
                    </li>
                  </ul>
                </>
              ) : (
                <>
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-lg font-semibold text-white">Free Plan</h2>
                    <span className="rounded-full bg-gray-700 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-gray-300">
                      Free
                    </span>
                  </div>
                  <ul className="mt-6 space-y-2 text-sm">
                    <li className="flex gap-2 text-gray-200">
                      <span aria-hidden>✅</span>
                      <span>Browse all jobs</span>
                    </li>
                    <li className="flex gap-2 text-gray-200">
                      <span aria-hidden>✅</span>
                      <span>Save up to 20 jobs</span>
                    </li>
                    <li className="flex gap-2 text-gray-200">
                      <span aria-hidden>✅</span>
                      <span>3 ATS checks per month</span>
                    </li>
                    <li className="flex gap-2 text-gray-500">
                      <span aria-hidden>❌</span>
                      <span>Unlimited ATS checks</span>
                    </li>
                    <li className="flex gap-2 text-gray-500">
                      <span aria-hidden>❌</span>
                      <span>Resume Review tool</span>
                    </li>
                    <li className="flex gap-2 text-gray-500">
                      <span aria-hidden>❌</span>
                      <span>Interview Questions</span>
                    </li>
                    <li className="flex gap-2 text-gray-500">
                      <span aria-hidden>❌</span>
                      <span>Cover Letter Generator</span>
                    </li>
                  </ul>
                  <Button
                    type="button"
                    variant="primary"
                    size="lg"
                    className="mt-6"
                    onClick={() => navigate('/pricing')}
                  >
                    Upgrade to Premium — ₹25/month
                  </Button>
                </>
              )}
            </div>
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
          {meQuery.isError && (
            <Card padding="default" className="border border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-950/40">
              <p className="text-center text-sm text-red-700 dark:text-red-300" role="alert">
                Could not load profile data. Please try again.
              </p>
              <div className="mt-4 flex justify-center">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => meQuery.refetch()}
                  disabled={meQuery.isFetching}
                >
                  {meQuery.isFetching ? 'Retrying…' : 'Try again'}
                </Button>
              </div>
            </Card>
          )}
          {/* Basic Info + Resume — LinkedIn-style order (basic first, resume below) */}
          <div className="rounded-xl border border-gray-700/50 bg-gray-800/50 p-5 md:col-span-2 xl:col-span-3">
            <h2 className="text-lg font-semibold text-white">Basic Information</h2>
            <p className="mt-0.5 text-sm text-gray-400">Your professional details visible to recruiters</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <label htmlFor="cd-fullName" className="mb-1 block text-xs font-medium text-gray-400 dark:text-gray-300">Full name *</label>
                  <input {...profileForm.register('fullName')} id="cd-fullName" placeholder="John Doe" className="w-full rounded-lg border border-gray-600 bg-gray-900 px-3 py-2 text-sm text-white shadow-sm placeholder:text-gray-500 focus:border-teal-500/40 focus:outline-none focus:ring-1 focus:ring-teal-500/30" />
                  {profileForm.formState.errors.fullName && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{profileForm.formState.errors.fullName.message}</p>}
                </div>
                <div>
                  <label htmlFor="cd-headline" className="mb-1 block text-xs font-medium text-gray-400 dark:text-gray-300">Headline</label>
                  <input {...profileForm.register('headline')} id="cd-headline" placeholder="Software Engineer at Google" className="w-full rounded-lg border border-gray-600 bg-gray-900 px-3 py-2 text-sm text-white shadow-sm placeholder:text-gray-500 focus:border-teal-500/40 focus:outline-none focus:ring-1 focus:ring-teal-500/30" />
                </div>
                <div>
                  <label htmlFor="cd-phone" className="mb-1 block text-xs font-medium text-gray-400 dark:text-gray-300">Phone</label>
                  <input {...profileForm.register('phone')} id="cd-phone" placeholder="+91 98765 43210" className="w-full rounded-lg border border-gray-600 bg-gray-900 px-3 py-2 text-sm text-white shadow-sm placeholder:text-gray-500 focus:border-teal-500/40 focus:outline-none focus:ring-1 focus:ring-teal-500/30" />
                </div>
                <div>
                  <label htmlFor="cd-location" className="mb-1 block text-xs font-medium text-gray-400 dark:text-gray-300">Location</label>
                  <input {...profileForm.register('location')} id="cd-location" placeholder="Hyderabad, India" className="w-full rounded-lg border border-gray-600 bg-gray-900 px-3 py-2 text-sm text-white shadow-sm placeholder:text-gray-500 focus:border-teal-500/40 focus:outline-none focus:ring-1 focus:ring-teal-500/30" />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="cd-website" className="mb-1 block text-xs font-medium text-gray-400 dark:text-gray-300">Portfolio / Website</label>
                  <input {...profileForm.register('website')} id="cd-website" placeholder="https://yourportfolio.com" className="w-full rounded-lg border border-gray-600 bg-gray-900 px-3 py-2 text-sm text-white shadow-sm placeholder:text-gray-500 focus:border-teal-500/40 focus:outline-none focus:ring-1 focus:ring-teal-500/30" />
                </div>
                <div className="sm:col-span-2 lg:col-span-3">
                  <label htmlFor="cd-skills" className="mb-1 block text-xs font-medium text-gray-400 dark:text-gray-300">Skills</label>
                  <input {...profileForm.register('skills')} id="cd-skills" placeholder="React, Node.js, MongoDB..." className="w-full rounded-lg border border-gray-600 bg-gray-900 px-3 py-2 text-sm text-white shadow-sm placeholder:text-gray-500 focus:border-teal-500/40 focus:outline-none focus:ring-1 focus:ring-teal-500/30" />
                  <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">Separate each skill with a comma</p>
                </div>
                <div className="sm:col-span-2 lg:col-span-3">
                  <label htmlFor="cd-about" className="mb-1 block text-xs font-medium text-gray-400 dark:text-gray-300">About</label>
                  <textarea {...profileForm.register('about')} id="cd-about" rows={3} placeholder="Write a brief summary about yourself and your experience..." className="w-full rounded-lg border border-gray-600 bg-gray-900 px-3 py-2 text-sm text-white shadow-sm placeholder:text-gray-500 focus:border-teal-500/40 focus:outline-none focus:ring-1 focus:ring-teal-500/30" />
                </div>
              </div>
            </div>
          <div className="space-y-5 md:col-span-1">
            <ResumeSection user={me} onUserUpdate={updateUser} />
          </div>

          {/* Experience + Projects — side-by-side on wide screens */}
          <div className="grid gap-5 xl:grid-cols-2">
            {/* Experience */}
            <div className="rounded-xl border border-gray-700/50 bg-gray-800/50 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-white">Work Experience</h2>
                  <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">Add your professional experience</p>
                </div>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  className="!text-xs"
                  onClick={() =>
                    setExperience((prev) => [
                      ...prev,
                      { title: '', company: '', location: '', startDate: '', endDate: '', current: false, description: '' },
                    ])
                  }
                >
                  + Add
                </Button>
              </div>
              {experience.length === 0 && (
                <p className="mt-3 rounded-lg bg-gray-900/80 p-3 text-center text-xs text-gray-500">No experience added yet. Add each role like on LinkedIn — most recent first.</p>
              )}
              {experience.length > 0 && (
              <div className="relative mt-4 ml-1 border-l-2 border-gray-700 pl-6 dark:border-gray-700">
                {experience.map((exp, i) => (
                  <div key={exp._id || i} className="relative pb-10 last:pb-2">
                    <div className="absolute -left-[25px] top-2 h-3.5 w-3.5 rounded-full border-2 border-gray-800 bg-teal-700 ring-1 ring-gray-600 dark:border-gray-900 dark:ring-gray-600" aria-hidden />
                    <div className="flex gap-3">
                      <div className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-gray-700 text-sm font-bold text-gray-200 sm:flex">
                        {(exp.company || '+').charAt(0).toUpperCase()}
                      </div>
                      <div className="rounded-xl border border-gray-700/50 bg-gray-900/40 p-4 shadow-sm">
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">Position {i + 1}</p>
                        {(exp.title || exp.company) && (
                          <p className="truncate text-sm font-semibold text-white">{exp.title || 'Title'}{exp.company ? ` · ${exp.company}` : ''}</p>
                        )}
                        {(exp.startDate || exp.endDate || exp.current) && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">{formatExperienceDateRange(exp)}</p>
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="danger"
                        size="sm"
                        className="!min-h-0 shrink-0 !px-2 !py-0.5 text-xs font-medium"
                        onClick={() => setExperience((prev) => prev.filter((_, j) => j !== i))}
                      >
                        Remove
                      </Button>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className="mb-0.5 block text-xs font-medium text-gray-400 dark:text-gray-300">Job Title *</label>
                        <input value={exp.title} onChange={(e) => setExperience((prev) => prev.map((x, j) => j === i ? { ...x, title: e.target.value } : x))} placeholder="Software Engineer" className="w-full rounded-lg border border-gray-600 bg-gray-900 px-3 py-2 text-sm text-white shadow-sm placeholder:text-gray-500 focus:border-teal-500/40 focus:outline-none focus:ring-1 focus:ring-teal-500/30" />
                      </div>
                      <div>
                        <label className="mb-0.5 block text-xs font-medium text-gray-400 dark:text-gray-300">Company *</label>
                        <input value={exp.company} onChange={(e) => setExperience((prev) => prev.map((x, j) => j === i ? { ...x, company: e.target.value } : x))} placeholder="Google" className="w-full rounded-lg border border-gray-600 bg-gray-900 px-3 py-2 text-sm text-white shadow-sm placeholder:text-gray-500 focus:border-teal-500/40 focus:outline-none focus:ring-1 focus:ring-teal-500/30" />
                      </div>
                      <div>
                        <label className="mb-0.5 block text-xs font-medium text-gray-400 dark:text-gray-300">Location</label>
                        <input value={exp.location} onChange={(e) => setExperience((prev) => prev.map((x, j) => j === i ? { ...x, location: e.target.value } : x))} placeholder="Bangalore, India" className="w-full rounded-lg border border-gray-600 bg-gray-900 px-3 py-2 text-sm text-white shadow-sm placeholder:text-gray-500 focus:border-teal-500/40 focus:outline-none focus:ring-1 focus:ring-teal-500/30" />
                      </div>
                      <div>
                        <label className="mb-0.5 block text-xs font-medium text-gray-400 dark:text-gray-300">Start *</label>
                        <input type="month" value={exp.startDate} onChange={(e) => setExperience((prev) => prev.map((x, j) => j === i ? { ...x, startDate: e.target.value } : x))} className="w-full rounded-lg border border-gray-600 bg-gray-900 px-3 py-2 text-sm text-white shadow-sm placeholder:text-gray-500 focus:border-teal-500/40 focus:outline-none focus:ring-1 focus:ring-teal-500/30" />
                      </div>
                      <div>
                        <label className="mb-0.5 block text-xs font-medium text-gray-400 dark:text-gray-300">End</label>
                        <input type="month" value={exp.endDate} disabled={exp.current} onChange={(e) => setExperience((prev) => prev.map((x, j) => j === i ? { ...x, endDate: e.target.value } : x))} className="w-full rounded-lg border border-gray-600 bg-gray-900 px-3 py-2 text-sm text-white shadow-sm disabled:bg-gray-800 disabled:text-gray-500" />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-300">
                          <input type="checkbox" checked={exp.current} onChange={(e) => setExperience((prev) => prev.map((x, j) => j === i ? { ...x, current: e.target.checked, endDate: e.target.checked ? '' : x.endDate } : x))} className="h-3.5 w-3.5 rounded border-gray-300 accent-teal-700 dark:border-gray-600" />
                          I currently work here
                        </label>
                      </div>
                      <div className="sm:col-span-2">
                        <label className="mb-0.5 block text-xs font-medium text-gray-400 dark:text-gray-300">Description</label>
                        <textarea value={exp.description} onChange={(e) => setExperience((prev) => prev.map((x, j) => j === i ? { ...x, description: e.target.value } : x))} rows={2} placeholder="Responsibilities and achievements..." className="w-full rounded-lg border border-gray-600 bg-gray-900 px-3 py-2 text-sm text-white shadow-sm placeholder:text-gray-500 focus:border-teal-500/40 focus:outline-none focus:ring-1 focus:ring-teal-500/30" />
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
            <div className="rounded-xl border border-gray-700/50 bg-gray-800/50 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-white">Projects</h2>
                  <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">Showcase your best work</p>
                </div>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  className="!text-xs"
                  onClick={() => setProjects((prev) => [...prev, { title: '', description: '', url: '', technologies: [] }])}
                >
                  + Add
                </Button>
              </div>
              {projects.length === 0 && (
                <p className="mt-3 rounded-lg bg-gray-900/80 p-3 text-center text-xs text-gray-500">No projects added yet. List apps, open source, or client work.</p>
              )}
              <div className="mt-3 space-y-4">
                {projects.map((proj, i) => (
                  <div key={proj._id || i} className="flex gap-3 rounded-xl border border-gray-700/50 bg-gray-900/40 p-4 shadow-sm ring-1 ring-gray-700/50">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-500/15 text-teal-300">
                      <span className="text-xs font-bold">{i + 1}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">Project</p>
                        {proj.title && <p className="truncate text-sm font-semibold text-white">{proj.title}</p>}
                      </div>
                      <Button
                        type="button"
                        variant="danger"
                        size="sm"
                        className="!min-h-0 shrink-0 !px-2 !py-0.5 text-xs font-medium"
                        onClick={() => setProjects((prev) => prev.filter((_, j) => j !== i))}
                      >
                        Remove
                      </Button>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className="mb-0.5 block text-xs font-medium text-gray-400 dark:text-gray-300">Title *</label>
                        <input value={proj.title} onChange={(e) => setProjects((prev) => prev.map((x, j) => j === i ? { ...x, title: e.target.value } : x))} placeholder="E-Commerce Platform" className="w-full rounded-lg border border-gray-600 bg-gray-900 px-3 py-2 text-sm text-white shadow-sm placeholder:text-gray-500 focus:border-teal-500/40 focus:outline-none focus:ring-1 focus:ring-teal-500/30" />
                      </div>
                      <div>
                        <label className="mb-0.5 block text-xs font-medium text-gray-400 dark:text-gray-300">URL</label>
                        <input value={proj.url} onChange={(e) => setProjects((prev) => prev.map((x, j) => j === i ? { ...x, url: e.target.value } : x))} placeholder="https://github.com/you/project" className="w-full rounded-lg border border-gray-600 bg-gray-900 px-3 py-2 text-sm text-white shadow-sm placeholder:text-gray-500 focus:border-teal-500/40 focus:outline-none focus:ring-1 focus:ring-teal-500/30" />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="mb-0.5 block text-xs font-medium text-gray-400 dark:text-gray-300">Technologies</label>
                        <input value={Array.isArray(proj.technologies) ? proj.technologies.join(', ') : ''} onChange={(e) => setProjects((prev) => prev.map((x, j) => j === i ? { ...x, technologies: e.target.value.split(',').map((t) => t.trim()).filter(Boolean) } : x))} placeholder="React, Node.js, MongoDB" className="w-full rounded-lg border border-gray-600 bg-gray-900 px-3 py-2 text-sm text-white shadow-sm placeholder:text-gray-500 focus:border-teal-500/40 focus:outline-none focus:ring-1 focus:ring-teal-500/30" />
                        <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">Comma separated</p>
                      </div>
                      <div className="sm:col-span-2">
                        <label className="mb-0.5 block text-xs font-medium text-gray-400 dark:text-gray-300">Description</label>
                        <textarea value={proj.description} onChange={(e) => setProjects((prev) => prev.map((x, j) => j === i ? { ...x, description: e.target.value } : x))} rows={2} placeholder="What does this project do?" className="w-full rounded-lg border border-gray-600 bg-gray-900 px-3 py-2 text-sm text-white shadow-sm placeholder:text-gray-500 focus:border-teal-500/40 focus:outline-none focus:ring-1 focus:ring-teal-500/30" />
                      </div>
                    </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Education — full width */}
          <div className="rounded-xl border border-gray-700/50 bg-gray-800/50 p-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-white">Education</h2>
                <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">Add your academic background</p>
              </div>
              <Button
                type="button"
                variant="primary"
                size="sm"
                className="!text-xs"
                onClick={() =>
                  setEducation((prev) => [
                    ...prev,
                    { degree: '', institution: '', fieldOfStudy: '', startYear: '', endYear: '', grade: '' },
                  ])
                }
              >
                + Add
              </Button>
            </div>
            {education.length === 0 && (
              <p className="mt-3 rounded-lg bg-gray-900/80 p-3 text-center text-xs text-gray-500">No education added yet.</p>
            )}
            <div className="mt-3 grid gap-3 xl:grid-cols-2">
              {education.map((edu, i) => (
                <div key={edu._id || i} className="rounded-lg border border-gray-700 bg-gray-900/50 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-400">Education #{i + 1}</span>
                    <Button
                      type="button"
                      variant="danger"
                      size="sm"
                      className="!min-h-0 !px-2 !py-0 text-xs"
                      onClick={() => setEducation((prev) => prev.filter((_, j) => j !== i))}
                    >
                      Remove
                    </Button>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    <div>
                      <label className="mb-0.5 block text-xs font-medium text-gray-400 dark:text-gray-300">Degree *</label>
                      <input value={edu.degree} onChange={(e) => setEducation((prev) => prev.map((x, j) => j === i ? { ...x, degree: e.target.value } : x))} placeholder="B.Tech in Computer Science" className="w-full rounded-lg border border-gray-600 bg-gray-900 px-3 py-2 text-sm text-white shadow-sm placeholder:text-gray-500 focus:border-teal-500/40 focus:outline-none focus:ring-1 focus:ring-teal-500/30" />
                    </div>
                    <div>
                      <label className="mb-0.5 block text-xs font-medium text-gray-400 dark:text-gray-300">Institution *</label>
                      <input value={edu.institution} onChange={(e) => setEducation((prev) => prev.map((x, j) => j === i ? { ...x, institution: e.target.value } : x))} placeholder="IIT Delhi" className="w-full rounded-lg border border-gray-600 bg-gray-900 px-3 py-2 text-sm text-white shadow-sm placeholder:text-gray-500 focus:border-teal-500/40 focus:outline-none focus:ring-1 focus:ring-teal-500/30" />
                    </div>
                    <div>
                      <label className="mb-0.5 block text-xs font-medium text-gray-400 dark:text-gray-300">Field of Study</label>
                      <input value={edu.fieldOfStudy} onChange={(e) => setEducation((prev) => prev.map((x, j) => j === i ? { ...x, fieldOfStudy: e.target.value } : x))} placeholder="Computer Science & Engineering" className="w-full rounded-lg border border-gray-600 bg-gray-900 px-3 py-2 text-sm text-white shadow-sm placeholder:text-gray-500 focus:border-teal-500/40 focus:outline-none focus:ring-1 focus:ring-teal-500/30" />
                    </div>
                    <div>
                      <label className="mb-0.5 block text-xs font-medium text-gray-400 dark:text-gray-300">Grade / CGPA</label>
                      <input value={edu.grade} onChange={(e) => setEducation((prev) => prev.map((x, j) => j === i ? { ...x, grade: e.target.value } : x))} placeholder="8.5 / 10" className="w-full rounded-lg border border-gray-600 bg-gray-900 px-3 py-2 text-sm text-white shadow-sm placeholder:text-gray-500 focus:border-teal-500/40 focus:outline-none focus:ring-1 focus:ring-teal-500/30" />
                    </div>
                    <div>
                      <label className="mb-0.5 block text-xs font-medium text-gray-400 dark:text-gray-300">Start Year</label>
                      <input value={edu.startYear} onChange={(e) => setEducation((prev) => prev.map((x, j) => j === i ? { ...x, startYear: e.target.value } : x))} placeholder="2018" className="w-full rounded-lg border border-gray-600 bg-gray-900 px-3 py-2 text-sm text-white shadow-sm placeholder:text-gray-500 focus:border-teal-500/40 focus:outline-none focus:ring-1 focus:ring-teal-500/30" />
                    </div>
                    <div>
                      <label className="mb-0.5 block text-xs font-medium text-gray-400 dark:text-gray-300">End Year</label>
                      <input value={edu.endYear} onChange={(e) => setEducation((prev) => prev.map((x, j) => j === i ? { ...x, endYear: e.target.value } : x))} placeholder="2022" className="w-full rounded-lg border border-gray-600 bg-gray-900 px-3 py-2 text-sm text-white shadow-sm placeholder:text-gray-500 focus:border-teal-500/40 focus:outline-none focus:ring-1 focus:ring-teal-500/30" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-gray-700/50 bg-gray-800/50 p-5">
            <h2 className="text-sm font-semibold text-white">Change password</h2>
            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">Use your current password to set a new one.</p>
            <div className="mt-4 grid max-w-md gap-3">
              <div>
                <label htmlFor="cd-old-pw" className="mb-1 block text-xs font-medium text-gray-400 dark:text-gray-300">
                  Current password
                </label>
                <input
                  id="cd-old-pw"
                  type="password"
                  autoComplete="current-password"
                  value={pwdForm.oldPassword}
                  onChange={(e) => setPwdForm((p) => ({ ...p, oldPassword: e.target.value }))}
                  className="w-full rounded-lg border border-gray-600 bg-gray-900 px-3 py-2 text-sm text-white shadow-sm focus:border-teal-500/40 focus:outline-none focus:ring-1 focus:ring-teal-500/30"
                />
              </div>
              <div>
                <label htmlFor="cd-new-pw" className="mb-1 block text-xs font-medium text-gray-400 dark:text-gray-300">
                  New password
                </label>
                <input
                  id="cd-new-pw"
                  type="password"
                  autoComplete="new-password"
                  value={pwdForm.newPassword}
                  onChange={(e) => setPwdForm((p) => ({ ...p, newPassword: e.target.value }))}
                  className="w-full rounded-lg border border-gray-600 bg-gray-900 px-3 py-2 text-sm text-white shadow-sm focus:border-teal-500/40 focus:outline-none focus:ring-1 focus:ring-teal-500/30"
                />
              </div>
              <div>
                <label htmlFor="cd-confirm-pw" className="mb-1 block text-xs font-medium text-gray-400 dark:text-gray-300">
                  Confirm new password
                </label>
                <input
                  id="cd-confirm-pw"
                  type="password"
                  autoComplete="new-password"
                  value={pwdForm.confirmPassword}
                  onChange={(e) => setPwdForm((p) => ({ ...p, confirmPassword: e.target.value }))}
                  className="w-full rounded-lg border border-gray-600 bg-gray-900 px-3 py-2 text-sm text-white shadow-sm focus:border-teal-500/40 focus:outline-none focus:ring-1 focus:ring-teal-500/30"
                />
              </div>
              <Button
                type="button"
                variant="primary"
                size="md"
                className="w-fit !bg-gray-900 !text-white hover:!bg-gray-800 dark:!bg-gray-100 dark:!text-gray-900 dark:hover:!bg-white"
                disabled={
                  !pwdForm.oldPassword ||
                  !pwdForm.newPassword ||
                  pwdForm.newPassword !== pwdForm.confirmPassword
                }
                loading={changePasswordMutation.isPending}
                loadingText="Updating…"
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
              >
                Update password
              </Button>
            </div>
          </div>

          {/* Data export */}
          <div className="rounded-xl border border-gray-700/50 bg-gray-900/50 p-5">
            <h2 className="text-sm font-semibold text-white">Your data</h2>
            <p className="mt-1 text-xs text-gray-400">
              Download a JSON copy of your profile, applications, alerts, and notifications (data portability).
            </p>
            <Button
              type="button"
              variant="secondary"
              size="md"
              className="mt-3"
              loading={dataExportMutation.isPending}
              loadingText="Preparing…"
              onClick={() => dataExportMutation.mutate()}
            >
              Download my data (JSON)
            </Button>
          </div>

          {/* Danger zone */}
          <div className="rounded-xl border border-red-200 bg-red-50/50 p-5">
            <h2 className="text-sm font-semibold text-red-800">Danger zone</h2>
            <p className="mt-1 text-xs text-red-600">Permanently delete your account and all associated data. This cannot be undone.</p>
            <Button
              type="button"
              variant="danger"
              size="md"
              className="mt-3"
              loading={deleteAccountMutation.isPending}
              loadingText="Deleting..."
              onClick={() =>
                window.confirm('Are you sure? This will permanently delete your account.') &&
                deleteAccountMutation.mutate()
              }
            >
              Delete account
            </Button>
          </div>

          {/* Save button */}
          <div className="sticky bottom-4 flex justify-end rounded-xl border border-gray-700/50 bg-gray-900/95 p-4 shadow-lg shadow-black/20 backdrop-blur-sm ring-1 ring-gray-700/50">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={updateProfileMutation.isPending}
              loadingText="Saving all changes..."
            >
              Save All Changes
            </Button>
          </div>
        </form>
      )}
        </div>
      </div>
    </div>
  )
}
