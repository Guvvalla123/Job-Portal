import { memo } from 'react'
import { Link } from 'react-router-dom'
import { SaveJobButton } from '../SaveJobButton.jsx'
import { formatSalaryRange } from '../../utils/formatSalary.js'
import { Badge, Card } from '../ui/index.js'

const TYPE_BADGE_VARIANT = {
  'full-time': 'success',
  'part-time': 'info',
  contract: 'warning',
  internship: 'primary',
}

export const JobListCard = memo(function JobListCard({ job }) {
  return (
    <Card hover padding="default" className="flex flex-col">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <Link
            to={`/jobs/${job._id}`}
            className="line-clamp-2 text-base font-semibold text-gray-900 transition-colors hover:text-indigo-600 dark:text-white dark:hover:text-indigo-400"
          >
            {job.title}
          </Link>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            {job.company?.name} &middot; {job.location}
          </p>
        </div>
        <div className="flex shrink-0 items-start gap-2">
          {(job.minSalary > 0 || job.maxSalary > 0) && (
            <Badge variant="success" size="md" className="shrink-0">
              {formatSalaryRange(job.minSalary, job.maxSalary)}
            </Badge>
          )}
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
        {job.createdAt && (
          <span className="text-xs text-gray-500 dark:text-gray-500">
            Posted {new Date(job.createdAt).toLocaleDateString()}
          </span>
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
          className="text-sm font-semibold text-indigo-600 transition-colors hover:text-indigo-500 dark:text-indigo-400"
        >
          View Details &rarr;
        </Link>
      </div>
    </Card>
  )
})
