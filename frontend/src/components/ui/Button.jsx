/**
 * Production-grade Button with variants, sizes, and states.
 * LinkedIn/Naukri style - clear hierarchy and feedback.
 */
const variants = {
  primary:
    'bg-indigo-600 text-white shadow-md shadow-indigo-900/10 hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-500/20 active:scale-[0.98] active:bg-indigo-800 focus-visible:ring-indigo-500 motion-reduce:active:scale-100 motion-reduce:hover:shadow-md',
  gradient:
    'bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-600 text-white shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/30 hover:scale-[1.02] active:scale-[0.98] focus-visible:ring-indigo-500 motion-reduce:hover:scale-100 motion-reduce:active:scale-100',
  secondary:
    'border border-gray-300 bg-white text-gray-700 shadow-sm hover:bg-gray-50 hover:border-gray-400 hover:shadow-md active:scale-[0.98] active:bg-gray-100 focus-visible:ring-gray-400 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700 motion-reduce:active:scale-100',
  ghost:
    'text-gray-700 hover:bg-gray-100 active:scale-[0.98] active:bg-gray-200 focus-visible:ring-gray-400 dark:text-gray-200 dark:hover:bg-gray-800 motion-reduce:active:scale-100',
  danger:
    'bg-red-600 text-white shadow-sm hover:bg-red-700 hover:shadow-md active:scale-[0.98] active:bg-red-800 focus-visible:ring-red-500 motion-reduce:active:scale-100',
  'primary-outline':
    'border-2 border-indigo-600 text-indigo-600 bg-transparent hover:bg-indigo-50 active:scale-[0.98] active:bg-indigo-100 focus-visible:ring-indigo-500 dark:text-indigo-400 dark:hover:bg-indigo-950/50 motion-reduce:active:scale-100',
  success:
    'bg-emerald-600 text-white shadow-sm hover:bg-emerald-700 hover:shadow-md active:scale-[0.98] active:bg-emerald-800 focus-visible:ring-emerald-500 motion-reduce:active:scale-100',
}

const sizes = {
  sm: 'px-3 py-1.5 text-xs font-semibold rounded-lg gap-1.5',
  md: 'px-4 py-2.5 text-sm font-semibold rounded-lg gap-2',
  lg: 'px-6 py-3 text-sm font-semibold rounded-xl gap-2',
  icon: 'p-2 rounded-lg',
  'icon-sm': 'p-1.5 rounded-md',
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
    'inline-flex items-center justify-center transition-all duration-200 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none'

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
