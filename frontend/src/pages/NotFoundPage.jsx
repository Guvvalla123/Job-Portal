import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <p
        className="text-8xl font-extrabold text-blue-600 dark:text-blue-400"
        aria-hidden="true"
      >
        404
      </p>
      <h1 className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">
        Page not found
      </h1>
      <p className="mt-2 max-w-md text-gray-600 dark:text-gray-400">
        Sorry, we couldn&apos;t find the page you&apos;re looking for. It may have been moved or doesn&apos;t exist.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-4">
        <Link
          to="/"
          className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Back to home
        </Link>
        <Link
          to="/jobs"
          className="rounded-xl border-2 border-gray-300 px-6 py-3 text-sm font-semibold text-gray-700 transition-colors hover:border-gray-400 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          Browse jobs
        </Link>
      </div>
    </div>
  )
}
