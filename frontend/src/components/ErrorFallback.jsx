/** Used by react-error-boundary in `main.jsx`. */
export function ErrorFallback({ error, resetErrorBoundary }) {
  return (
    <div className="flex min-h-[60dvh] flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="type-page-title">Something went wrong</h1>
      <p className="max-w-md text-sm text-gray-600 dark:text-gray-400">{error?.message}</p>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={resetErrorBoundary}
          className="rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-950"
        >
          Try again
        </button>
        <a
          href="/"
          className="rounded-xl border-2 border-gray-300 px-6 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300"
        >
          Go home
        </a>
      </div>
    </div>
  )
}
