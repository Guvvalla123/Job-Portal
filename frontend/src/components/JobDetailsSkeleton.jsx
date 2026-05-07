import { Skeleton } from './ui/Skeleton.jsx'

export function JobDetailsSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <section className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100 dark:bg-gray-900 dark:ring-gray-800 sm:p-8">
          {/* Title + company + salary */}
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              <Skeleton className="h-8 w-4/5 sm:w-3/4" />
              <Skeleton className="h-4 w-2/3 sm:w-1/2" />
            </div>
            <Skeleton className="h-10 w-28 shrink-0 rounded-lg" />
          </div>
          {/* Meta badges */}
          <div className="mt-5 flex flex-wrap gap-2">
            <Skeleton className="h-7 w-24 rounded-full" />
            <Skeleton className="h-7 w-28 rounded-full" />
            <Skeleton className="h-7 w-32 rounded-full" />
          </div>
          {/* Skills block */}
          <div className="mt-6 space-y-2">
            <Skeleton className="h-4 w-32" />
            <div className="flex flex-wrap gap-2">
              <Skeleton className="h-6 w-16 rounded-md" />
              <Skeleton className="h-6 w-20 rounded-md" />
              <Skeleton className="h-6 w-14 rounded-md" />
              <Skeleton className="h-6 w-[4.5rem] rounded-md" />
            </div>
          </div>
          {/* Description */}
          <div className="mt-6 space-y-3 border-t border-gray-100 pt-6 dark:border-gray-800">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-[92%]" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
          {/* About company (optional on real page) */}
          <div className="mt-6 space-y-3 border-t border-gray-100 pt-6 dark:border-gray-800">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-5/6" />
          </div>
        </section>
      </div>
      <div className="lg:col-span-1">
        <div className="sticky top-6 space-y-4">
          {/* Apply card */}
          <div className="space-y-4 rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100 dark:bg-gray-900 dark:ring-gray-800">
            <div className="flex justify-end">
              <Skeleton className="h-9 w-28 rounded-lg" />
            </div>
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-12 w-full rounded-lg" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-4/5" />
          </div>
          {/* Company sidebar */}
          <div className="space-y-3 rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100 dark:bg-gray-900 dark:ring-gray-800">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-36 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  )
}
