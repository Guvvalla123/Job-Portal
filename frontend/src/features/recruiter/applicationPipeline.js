/** Recruiter pipeline — mirrors backend APPLICATION_STATUSES order for UI. */
export const PIPELINE_STATUSES = ['applied', 'screening', 'interview', 'offer', 'hired', 'rejected']

export const STATUS_LABELS = {
  applied: 'Applied',
  screening: 'Screening',
  interview: 'Interview',
  offer: 'Offer',
  hired: 'Hired',
  rejected: 'Rejected',
}

export const STATUS_BADGE_CLASSES = {
  applied: 'bg-teal-50 text-teal-700 ring-1 ring-teal-600/20 dark:bg-teal-950/50 dark:text-teal-300',
  screening: 'bg-amber-50 text-amber-700 ring-1 ring-amber-600/20',
  interview: 'bg-sky-50 text-sky-700 ring-1 ring-sky-600/20',
  offer: 'bg-teal-50 text-teal-700 ring-1 ring-teal-600/20',
  hired: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20',
  rejected: 'bg-red-50 text-red-700 ring-1 ring-red-600/20',
}

/** Funnel bar segments (teal primary + semantic accents). */
export const FUNNEL_SEGMENT_CLASSES = {
  applied: 'bg-teal-400',
  screening: 'bg-amber-400',
  interview: 'bg-sky-400',
  offer: 'bg-teal-400',
  hired: 'bg-emerald-500',
}

export const INTERVIEW_STATUS_LABELS = {
  scheduled: 'Scheduled',
  completed: 'Completed',
  cancelled: 'Cancelled',
  no_show: 'No-show',
}
