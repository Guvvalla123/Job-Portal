/**
 * Full-width shell shown while auth bootstrap runs (matches AppLayout chrome: h-14 indigo header).
 */
export function AppBootstrapSkeleton() {
  return (
    <div className="flex min-h-dvh flex-col bg-gray-50 dark:bg-gray-950">
      <header
        className="flex h-14 shrink-0 items-center gap-4 border-b border-white/10 bg-indigo-900/95 px-4 shadow-md backdrop-blur-xl dark:border-white/5 dark:bg-indigo-950/95 sm:px-6"
        aria-hidden
      >
        <div className="h-9 w-9 shrink-0 animate-pulse rounded-lg bg-white/20 sm:h-8 sm:w-8" />
        <div className="h-4 w-28 max-w-[40%] animate-pulse rounded-full bg-white/25" />
        <div className="ml-auto hidden items-center gap-3 md:flex">
          <div className="h-4 w-20 animate-pulse rounded-full bg-white/20" />
          <div className="h-4 w-24 animate-pulse rounded-full bg-white/20" />
        </div>
        <div className="ml-auto flex gap-2 md:ml-0">
          <div className="h-9 w-9 animate-pulse rounded-lg bg-white/15" />
          <div className="h-9 w-9 animate-pulse rounded-lg bg-white/15 md:hidden" />
        </div>
      </header>
      <div className="flex flex-1 flex-col items-center justify-center px-4">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600 dark:border-indigo-900 dark:border-t-indigo-400" />
          <div className="h-3 w-32 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" />
        </div>
      </div>
    </div>
  )
}
