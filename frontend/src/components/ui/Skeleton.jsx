import PropTypes from 'prop-types'

/**
 * Skeleton loaders for consistent loading states
 */
export function Skeleton({ className = '' }) {
  return (
    <div
      className={`relative overflow-hidden rounded bg-gray-200 dark:bg-gray-700 ${className}`}
      aria-hidden="true"
    >
      <div className="animate-shimmer absolute inset-0 bg-linear-to-r from-transparent via-white/50 to-transparent dark:via-white/15" />
    </div>
  )
}

Skeleton.propTypes = {
  className: PropTypes.string,
}

export function JobCardSkeleton() {
  return (
    <div className="flex flex-col rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200/80 dark:bg-gray-800 dark:ring-gray-700/80">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
        <Skeleton className="h-8 w-20 rounded-lg" />
      </div>
      <div className="mt-3 flex gap-2">
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-5 w-14 rounded-full" />
        <Skeleton className="h-5 w-20 rounded-full" />
      </div>
      <div className="mt-3 flex flex-wrap gap-1">
        <Skeleton className="h-5 w-12 rounded" />
        <Skeleton className="h-5 w-14 rounded" />
        <Skeleton className="h-5 w-16 rounded" />
      </div>
      <div className="mt-4 flex justify-between">
        <Skeleton className="h-4 w-24 rounded" />
        <Skeleton className="h-8 w-20 rounded-lg" />
      </div>
    </div>
  )
}

export function ApplicationRowSkeleton() {
  return (
    <div className="flex items-center gap-3 px-5 py-3">
      <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
      <div className="min-w-0 flex-1 space-y-1">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-3 w-32" />
      </div>
      <Skeleton className="h-6 w-20 rounded-full shrink-0" />
    </div>
  )
}
