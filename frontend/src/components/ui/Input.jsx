import PropTypes from 'prop-types'

/**
 * Production-grade Input with error, success, and icon support.
 */
export function Input({
  id,
  label,
  error,
  success,
  hint,
  icon,
  iconPosition = 'left',
  className = '',
  containerClassName = '',
  disabled = false,
  ...props
}) {
  const base =
    'w-full rounded-lg border px-4 py-2.5 text-sm shadow-sm transition-all duration-200 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-0 focus:shadow-md focus:shadow-indigo-500/10 disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed dark:bg-gray-900/50 dark:text-gray-100 dark:placeholder:text-gray-500 dark:disabled:bg-gray-900'
  const errorStyles = error
    ? 'border-red-300 focus:border-red-500 focus:ring-red-500/40'
    : ''
  const successStyles = success
    ? 'border-emerald-300 focus:border-emerald-500 focus:ring-emerald-500/40'
    : ''
  const defaultStyles =
    !error && !success
      ? 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500/40 dark:border-gray-600 dark:focus:border-indigo-400 dark:focus:ring-indigo-400/35'
      : ''

  const paddingWithIcon =
    icon && iconPosition === 'left'
      ? 'pl-10'
      : icon && iconPosition === 'right'
        ? 'pr-10'
        : ''

  return (
    <div className={containerClassName}>
      {label && (
        <label
          htmlFor={id}
          className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          {label}
        </label>
      )}
      <div className="relative">
        {icon && iconPosition === 'left' && (
          <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 [&>svg]:h-4 [&>svg]:w-4">
            {icon}
          </div>
        )}
        <input
          id={id}
          disabled={disabled}
          className={`${base} ${errorStyles} ${successStyles} ${defaultStyles} ${paddingWithIcon} ${className}`}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={
            error ? `${id}-error` : hint ? `${id}-hint` : undefined
          }
          {...props}
        />
        {icon && iconPosition === 'right' && (
          <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 [&>svg]:h-4 [&>svg]:w-4">
            {icon}
          </div>
        )}
      </div>
      {error && (
        <p
          id={`${id}-error`}
          className="mt-1.5 text-sm text-red-600"
          role="alert"
        >
          {error}
        </p>
      )}
      {hint && !error && (
        <p id={`${id}-hint`} className="mt-1 text-xs text-gray-500">
          {hint}
        </p>
      )}
    </div>
  )
}

Input.propTypes = {
  id: PropTypes.string,
  label: PropTypes.string,
  error: PropTypes.string,
  success: PropTypes.bool,
  hint: PropTypes.string,
  icon: PropTypes.node,
  iconPosition: PropTypes.oneOf(['left', 'right']),
  className: PropTypes.string,
  containerClassName: PropTypes.string,
  disabled: PropTypes.bool,
}
