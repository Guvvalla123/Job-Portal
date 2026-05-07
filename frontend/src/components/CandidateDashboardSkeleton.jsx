import { Skeleton } from './ui/Skeleton.jsx'

export function CandidateDashboardSkeleton() {
  return (
    <div className="flex min-h-[calc(100dvh-3.5rem)] w-full bg-gray-950">
      <aside className="hidden w-72 shrink-0 flex-col border-r border-gray-800 bg-gray-900 lg:flex" aria-hidden>
        <div className="border-b border-gray-800 px-4 py-5">
          <Skeleton className="h-3 w-24" />
          <div className="mt-4 flex gap-3">
            <Skeleton className="h-11 w-11 shrink-0 rounded-full" />
            <div className="min-w-0 flex-1 space-y-2 pt-0.5">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
        </div>
        <div className="flex-1 space-y-2 p-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-14 w-full rounded-lg" />
          ))}
        </div>
        <div className="border-t border-gray-800 p-3">
          <Skeleton className="h-12 w-full rounded-lg" />
        </div>
      </aside>
      <div className="min-w-0 flex-1 space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <div className="space-y-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-8 w-56 max-w-full" />
          <Skeleton className="h-4 w-full max-w-md" />
        </div>
        <div className="rounded-xl border border-teal-500/20 bg-teal-600/10 p-4">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="mt-2 h-4 w-full max-w-lg" />
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 rounded-xl border border-gray-800 bg-gray-900/40" />
          ))}
        </div>
        <Skeleton className="h-48 w-full rounded-xl border border-gray-800" />
      </div>
    </div>
  )
}
