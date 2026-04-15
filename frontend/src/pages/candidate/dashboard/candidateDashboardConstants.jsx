import { z } from 'zod'

export const profileSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  headline: z.string().optional(),
  about: z.string().optional(),
  phone: z.string().optional(),
  location: z.string().optional(),
  website: z.string().optional(),
  skills: z.string().optional(),
})

export const STATUS_CONFIG = {
  applied: {
    label: 'Applied',
    color:
      'bg-teal-50 text-teal-700 ring-1 ring-teal-600/20 dark:bg-teal-950/50 dark:text-teal-300',
    dot: 'bg-teal-500',
  },
  screening: {
    label: 'Screening',
    color: 'bg-amber-50 text-amber-700 ring-1 ring-amber-600/20 dark:bg-amber-950/40 dark:text-amber-200',
    dot: 'bg-amber-500',
  },
  shortlisted: {
    label: 'Screening',
    color: 'bg-amber-50 text-amber-700 ring-1 ring-amber-600/20 dark:bg-amber-950/40 dark:text-amber-200',
    dot: 'bg-amber-500',
  },
  interview: {
    label: 'Interview',
    color: 'bg-sky-50 text-sky-700 ring-1 ring-sky-600/20 dark:bg-sky-950/40 dark:text-sky-200',
    dot: 'bg-sky-500',
  },
  offer: {
    label: 'Offer',
    color: 'bg-teal-50 text-teal-700 ring-1 ring-teal-600/20 dark:bg-teal-950/40 dark:text-teal-200',
    dot: 'bg-teal-500',
  },
  rejected: {
    label: 'Rejected',
    color: 'bg-red-50 text-red-700 ring-1 ring-red-600/20 dark:bg-red-950/40 dark:text-red-200',
    dot: 'bg-red-500',
  },
  hired: {
    label: 'Hired',
    color: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20 dark:bg-emerald-950/40 dark:text-emerald-200',
    dot: 'bg-emerald-500',
  },
}

export const TYPE_COLORS = {
  'full-time': 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200',
  'part-time': 'bg-teal-50 text-teal-700 dark:bg-teal-950/50 dark:text-teal-300',
  contract: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-200',
  internship: 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-200',
}

export const EMPLOYMENT_TYPES = ['full-time', 'part-time', 'contract', 'internship']

export function formatMonthYear(ym) {
  if (!ym || typeof ym !== 'string') return ''
  const parts = ym.split('-').map((p) => parseInt(p, 10))
  const y = parts[0]
  const m = parts[1]
  if (!y || !m || m < 1 || m > 12) return ym
  return new Date(y, m - 1, 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

export function formatExperienceDateRange(exp) {
  const start = formatMonthYear(exp.startDate)
  if (exp.current) {
    return start ? `${start} – Present` : 'Present'
  }
  const end = formatMonthYear(exp.endDate)
  if (start && end) return `${start} – ${end}`
  return start || end || ''
}

export const DASHBOARD_TAB_ICONS = {
  overview: (
    <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
      />
    </svg>
  ),
  saved: (
    <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-8-4-8 4V5z"
      />
    </svg>
  ),
  alerts: (
    <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
      />
    </svg>
  ),
  applications: (
    <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
      />
    </svg>
  ),
  profile: (
    <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
      />
    </svg>
  ),
}
