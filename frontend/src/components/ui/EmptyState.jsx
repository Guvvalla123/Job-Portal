import { Link } from 'react-router-dom'
import PropTypes from 'prop-types'
import { Button } from './Button.jsx'

const primaryLinkClass =
  'inline-flex items-center justify-center rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-[background-color,box-shadow] duration-200 hover:bg-indigo-700 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-950'

/**
 * Empty state with icon, message, and optional CTA
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  className = '',
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center px-6 py-14 text-center sm:py-16 ${className}`}
    >
      {Icon && (
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-gray-500 ring-1 ring-gray-200/80 dark:bg-gray-800 dark:text-gray-400 dark:ring-gray-700">
          <Icon className="h-7 w-7" aria-hidden />
        </div>
      )}
      <h3 className="mt-4 text-base font-semibold text-gray-900 dark:text-white">{title}</h3>
      <p className="type-body-sm mt-2 max-w-sm text-gray-600 dark:text-gray-400">{description}</p>
      {actionLabel && (actionHref || onAction) && (
        <div className="mt-8">
          {actionHref ? (
            <Link to={actionHref} className={primaryLinkClass}>
              {actionLabel}
            </Link>
          ) : (
            <Button type="button" onClick={onAction}>
              {actionLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

EmptyState.propTypes = {
  icon: PropTypes.elementType,
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  actionLabel: PropTypes.string,
  actionHref: PropTypes.string,
  onAction: PropTypes.func,
  className: PropTypes.string,
}

const icons = {
  jobs: (props) => (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.193 23.193 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
  saved: (props) => (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1} {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
    </svg>
  ),
  applications: (props) => (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1} {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  search: (props) => (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1} {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  ),
}

export { icons as EmptyStateIcons }
