import { Skeleton } from './ui/Skeleton.jsx'

export function CandidateDashboardSkeleton() {
  return (
    <div className="space-y-5">
      {/* Banner skeleton */}
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100">
        <Skeleton className="h-28 sm:h-36" />
        <div className="relative px-4 pb-5 sm:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:gap-5">
            <Skeleton className="-mt-12 h-24 w-24 rounded-full sm:-mt-14 sm:h-28 sm:w-28" />
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-7 w-48" />
              <Skeleton className="h-4 w-64" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-6 w-14 rounded-full" />
          </div>
        </div>
      </div>

      {/* Tabs skeleton */}
      <div className="flex gap-2 rounded-xl bg-white p-2 shadow-sm ring-1 ring-gray-100">
        <Skeleton className="h-9 w-24 rounded-lg" />
        <Skeleton className="h-9 w-28 rounded-lg" />
        <Skeleton className="h-9 w-24 rounded-lg" />
      </div>

      {/* Overview content skeleton */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        <div className="md:col-span-2 space-y-4">
          <Skeleton className="h-10 w-48" />
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-20 rounded-lg" />
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-40 rounded-xl" />
        </div>
      </div>
    </div>
  )
}
