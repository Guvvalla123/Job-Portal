/* frontend/src/components/ui/Button.jsx */
import PropTypes from 'prop-types'

/**
 * Button — primary / secondary / ghost hierarchy; gradient variant aliases to primary.
 * Mobile-first: comfortable min-height on touch; refines on sm+.
 */
const variants = {
  primary:
    'bg-teal-700 text-white shadow-soft hover:bg-[#0C5F5A] active:scale-[0.99] focus-visible:ring-teal-600 dark:bg-teal-700 dark:hover:bg-[#0C5F5A] dark:shadow-teal-950/40',
  gradient:
    'bg-teal-700 text-white shadow-soft hover:bg-[#0C5F5A] active:scale-[0.99] focus-visible:ring-teal-600 dark:bg-teal-700 dark:hover:bg-[#0C5F5A] dark:shadow-teal-950/40',
  secondary:
    'border border-gray-300/90 bg-white text-gray-800 shadow-xs hover:border-gray-400 hover:bg-gray-50 active:scale-[0.99] focus-visible:ring-gray-400 dark:border-gray-600 dark:bg-gray-800/90 dark:text-gray-100 dark:hover:bg-gray-700/90',
  ghost:
    'text-gray-700 hover:bg-gray-100 active:bg-gray-200/80 focus-visible:ring-gray-400 dark:text-gray-200 dark:hover:bg-gray-800 dark:active:bg-gray-700/80',
  danger:
    'bg-red-600 text-white shadow-soft hover:bg-red-500 active:scale-[0.99] focus-visible:ring-red-500 dark:bg-red-600 dark:hover:bg-red-500',
  'primary-outline':
    'border-2 border-teal-700 bg-transparent text-teal-700 hover:bg-teal-50 active:scale-[0.99] focus-visible:ring-teal-600 dark:border-teal-400 dark:text-teal-300 dark:hover:bg-teal-950/50',
  success:
    'bg-emerald-600 text-white shadow-soft hover:bg-emerald-500 active:scale-[0.99] focus-visible:ring-emerald-500 motion-reduce:active:scale-100',
}

const sizes = {
  sm: 'min-h-11 px-3 py-2 text-xs font-semibold rounded-xl gap-1.5 sm:min-h-9 sm:py-1.5 sm:rounded-lg',
  md: 'min-h-12 px-4 py-2.5 text-sm font-semibold rounded-xl gap-2 sm:min-h-10 sm:rounded-xl',
  lg: 'min-h-12 px-6 py-3 text-sm font-semibold rounded-xl gap-2 sm:min-h-11 md:px-7 md:text-[0.9375rem]',
  icon: 'min-h-11 min-w-11 p-0 rounded-xl sm:min-h-10 sm:min-w-10',
  'icon-sm': 'min-h-10 min-w-10 p-0 rounded-lg sm:min-h-9 sm:w-9',
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  loadingText = 'Loading...',
  type = 'button',
  className = '',
  icon,
  iconPosition = 'left',
  ...props
}) {
  const base =
    'motion-reduce:transform-none inline-flex items-center justify-center transition-[color,background-color,border-color,opacity,box-shadow,transform] duration-200 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-950 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none disabled:active:scale-100'

  const sizeClass = sizes[size] || sizes.md
  const variantClass = variants[variant] || variants.primary

  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`${base} ${variantClass} ${sizeClass} ${className}`}
      aria-busy={loading}
      aria-disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <>
          <svg
            className="h-4 w-4 animate-spin shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          <span>{loadingText}</span>
        </>
      ) : (
        <>
          {icon && iconPosition === 'left' && (
            <span className="shrink-0 [&>svg]:h-4 [&>svg]:w-4">{icon}</span>
          )}
          {children}
          {icon && iconPosition === 'right' && (
            <span className="shrink-0 [&>svg]:h-4 [&>svg]:w-4">{icon}</span>
          )}
        </>
      )}
    </button>
  )
}

Button.propTypes = {
  children: PropTypes.node,
  variant: PropTypes.oneOf([
    'primary',
    'gradient',
    'secondary',
    'ghost',
    'danger',
    'primary-outline',
    'success',
  ]),
  size: PropTypes.oneOf(['sm', 'md', 'lg', 'icon', 'icon-sm']),
  disabled: PropTypes.bool,
  loading: PropTypes.bool,
  loadingText: PropTypes.string,
  type: PropTypes.string,
  className: PropTypes.string,
  icon: PropTypes.node,
  iconPosition: PropTypes.oneOf(['left', 'right']),
  onClick: PropTypes.func,
}
