/* frontend/src/components/ui/Badge.jsx */
import PropTypes from 'prop-types'

/**
 * Badge — pill labels with refined contrast in dark mode.
 */
const variants = {
  default:
    'bg-gray-100 text-gray-800 ring-1 ring-gray-200/80 dark:bg-gray-800 dark:text-gray-200 dark:ring-gray-600/80',
  primary:
    'bg-teal-50 text-teal-800 ring-1 ring-teal-200/60 dark:bg-teal-950/70 dark:text-teal-200 dark:ring-teal-800/50',
  success:
    'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200/60 dark:bg-emerald-950/45 dark:text-emerald-200 dark:ring-emerald-800/40',
  warning:
    'bg-amber-50 text-amber-900 ring-1 ring-amber-200/70 dark:bg-amber-950/40 dark:text-amber-200 dark:ring-amber-800/40',
  danger:
    'bg-red-50 text-red-800 ring-1 ring-red-200/70 dark:bg-red-950/40 dark:text-red-200 dark:ring-red-800/40',
  info: 'bg-sky-50 text-sky-900 ring-1 ring-sky-200/70 dark:bg-sky-950/40 dark:text-sky-200 dark:ring-sky-800/40',
}

const sizes = {
  sm: 'px-2 py-0.5 text-[0.6875rem] min-h-6 sm:text-xs',
  md: 'px-2.5 py-1 text-xs min-h-7',
}

export function Badge({
  children,
  variant = 'default',
  size = 'md',
  className = '',
  ...props
}) {
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full font-semibold ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </span>
  )
}

Badge.propTypes = {
  children: PropTypes.node,
  variant: PropTypes.oneOf(['default', 'primary', 'success', 'warning', 'danger', 'info']),
  size: PropTypes.oneOf(['sm', 'md']),
  className: PropTypes.string,
}
