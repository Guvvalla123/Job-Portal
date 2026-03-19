export function JobCardSkeleton() {
  return (
    <div className="flex flex-col rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-100 animate-pulse">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="h-5 w-3/4 rounded bg-gray-200" />
          <div className="mt-2 h-4 w-1/2 rounded bg-gray-100" />
        </div>
        <div className="h-8 w-20 rounded-lg bg-gray-200" />
      </div>
      <div className="mt-3 flex gap-2">
        <div className="h-5 w-16 rounded-full bg-gray-100" />
        <div className="h-5 w-14 rounded-full bg-gray-100" />
        <div className="h-5 w-20 rounded bg-gray-100" />
      </div>
      <div className="mt-3 flex gap-1">
        <div className="h-5 w-12 rounded bg-gray-100" />
        <div className="h-5 w-14 rounded bg-gray-100" />
        <div className="h-5 w-16 rounded bg-gray-100" />
      </div>
      <div className="mt-4 h-4 w-24 rounded bg-gray-100" />
    </div>
  )
}
