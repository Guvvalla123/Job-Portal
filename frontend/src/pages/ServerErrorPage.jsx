import { Link } from 'react-router-dom'

export function ServerErrorPage() {
  return (
    <div className="flex min-h-[60dvh] flex-col items-center justify-center px-4 text-center">
      <p className="text-8xl font-semibold text-indigo-600 dark:text-indigo-400" aria-hidden="true">
        500
      </p>
      <h1 className="type-page-title mt-4">Something went wrong</h1>
      <p className="type-body-sm mt-2 max-w-md">
        We&apos;re sorry, but something went wrong on our end. Please try again later.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link
          to="/"
          className="rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-950"
        >
          Back to home
        </Link>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="rounded-lg border border-gray-300 px-6 py-3 text-sm font-semibold text-gray-700 transition-colors hover:border-gray-400 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          Try again
        </button>
      </div>
    </div>
  )
}
