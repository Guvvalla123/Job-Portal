export function CompanyCardSkeleton() {
  return (
    <div className="flex items-start gap-4 rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-100 animate-pulse">
      <div className="h-12 w-12 shrink-0 rounded-lg bg-gray-200" />
      <div className="min-w-0 flex-1">
        <div className="h-5 w-2/3 rounded bg-gray-200" />
        <div className="mt-2 h-4 w-1/2 rounded bg-gray-100" />
        <div className="mt-2 h-3 w-full rounded bg-gray-100" />
        <div className="mt-1 h-3 w-4/5 rounded bg-gray-100" />
      </div>
    </div>
  )
}
