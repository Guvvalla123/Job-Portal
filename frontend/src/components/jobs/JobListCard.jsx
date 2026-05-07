import { memo, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { SaveJobButton } from '../SaveJobButton.jsx'
import { formatSalaryRange } from '../../utils/formatSalary.js'
import { shareJobListing } from '../../utils/shareJobListing.js'
import { Badge, Button, Card } from '../ui/index.js'

const TYPE_BADGE_VARIANT = {
  'full-time': 'success',
  'part-time': 'info',
  contract: 'warning',
  internship: 'primary',
}

const MS_DAY = 24 * 60 * 60 * 1000

function timeAgo(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return ''
  const hours = Math.floor((Date.now() - d.getTime()) / 3600000)
  if (hours < 1) return 'Just now'
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

function VerifiedBadge() {
  return (
    <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/20 dark:text-green-400">
      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
      Verified
    </span>
  )
}

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

export const JobListCard = memo(function JobListCard({ job }) {
  const handleShare = useCallback(
    (e) => {
      e.preventDefault()
      e.stopPropagation()
      const url =
        typeof window !== 'undefined' ? `${window.location.origin}/jobs/${job._id}` : `/jobs/${job._id}`
      void shareJobListing({
        title: job.title,
        companyName: job.postedByCompanyName || job.company?.name,
        url,
      })
    },
    [job._id, job.title, job.postedByCompanyName, job.company?.name],
  )

  const displayCompanyName = job.postedByCompanyName || job.company?.name || ''
  const companyInitial = (job.postedByCompanyName || job.company?.name)?.charAt(0)?.toUpperCase() || '?'
  const isNew = job.createdAt && Date.now() - new Date(job.createdAt).getTime() < MS_DAY
  const expiresAtMs = job.expiresAt ? new Date(job.expiresAt).getTime() : NaN
  const isExpiringSoon =
    Boolean(job.expiresAt) &&
    !Number.isNaN(expiresAtMs) &&
    expiresAtMs > Date.now() &&
    expiresAtMs - Date.now() < MS_DAY

  return (
    <Card hover padding="default" className="flex flex-col">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <Link
            to={`/jobs/${job._id}`}
            className="line-clamp-2 text-base font-semibold text-gray-900 transition-colors hover:text-teal-700 dark:text-white dark:hover:text-teal-400"
          >
            {job.title}
          </Link>
          <p className="mt-1 flex flex-wrap items-start gap-x-2 gap-y-1 text-sm text-gray-600 dark:text-gray-400">
            <span className="inline-flex min-w-0 max-w-full items-start gap-2">
              {job.postedByCompanyLogo ? (
                <img
                  src={job.postedByCompanyLogo}
                  alt={displayCompanyName}
                  className="h-8 w-8 shrink-0 rounded bg-white object-contain p-0.5 dark:bg-gray-100"
                  onError={(e) => {
                    e.target.style.display = 'none'
                  }}
                />
              ) : (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-teal-600 text-sm font-bold text-white">
                  {companyInitial}
                </div>
              )}
              <span className="flex min-w-0 flex-col gap-0.5">
                <span className="inline-flex min-w-0 flex-wrap items-center gap-2">
                  <span className="truncate font-medium text-gray-700 dark:text-gray-300">{displayCompanyName}</span>
                  <VerifiedBadge />
                  {isNew ? (
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                      New
                    </span>
                  ) : null}
                  {isExpiringSoon ? (
                    <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900/30 dark:text-red-400">
                      Expiring Soon
                    </span>
                  ) : null}
                </span>
                {job.createdAt ? (
                  <span className="text-xs text-gray-400 dark:text-gray-500">Posted {timeAgo(job.createdAt)}</span>
                ) : null}
                {job.clickCount > 10 ? (
                  <span className="text-xs text-gray-400 dark:text-gray-500">{job.clickCount} people viewed</span>
                ) : null}
              </span>
            </span>
            <span className="text-gray-400 dark:text-gray-500" aria-hidden>
              ·
            </span>
            <span className="min-w-0">{job.location}</span>
          </p>
        </div>
        <div className="flex shrink-0 items-start gap-2">
          {(job.minSalary > 0 || job.maxSalary > 0) && (
            <Badge variant="success" size="md" className="shrink-0">
              {formatSalaryRange(job.minSalary, job.maxSalary)}
            </Badge>
          )}
          <Button
            type="button"
            variant="secondary"
            size="sm"
            icon={<JobShareIcon />}
            onClick={handleShare}
            aria-label="Share this job"
          >
            Share
          </Button>
          <SaveJobButton jobId={job._id} variant="icon" />
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {job.employmentType && (
          <Badge variant={TYPE_BADGE_VARIANT[job.employmentType] || 'default'} size="sm">
            {job.employmentType}
          </Badge>
        )}
        {job.experienceLevel && (
          <Badge variant="default" size="sm">
            {job.experienceLevel}
          </Badge>
        )}
      </div>
      {job.skills?.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {job.skills.slice(0, 4).map((skill) => (
            <Badge key={skill} variant="primary" size="sm">
              {skill}
            </Badge>
          ))}
          {job.skills.length > 4 && (
            <span className="text-xs text-gray-500">+{job.skills.length - 4}</span>
          )}
        </div>
      )}
      <div className="mt-auto border-t border-gray-100 pt-4 dark:border-gray-700/80">
        <Link
          to={`/jobs/${job._id}`}
          className="text-sm font-semibold text-teal-700 transition-colors hover:text-[#0C5F5A] dark:text-teal-400"
        >
          View Details &rarr;
        </Link>
      </div>
    </Card>
  )
})
