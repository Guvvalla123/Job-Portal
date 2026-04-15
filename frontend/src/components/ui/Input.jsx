/* frontend/src/components/ui/Input.jsx */
import PropTypes from 'prop-types'

/**
 * Input — touch-friendly height on mobile, token-aligned focus rings.
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
    'min-h-12 w-full rounded-xl border bg-white px-4 py-3 text-base text-slate-900 shadow-xs transition-all duration-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-offset-0 focus:shadow-soft disabled:cursor-not-allowed disabled:opacity-70 sm:min-h-10 sm:py-2.5 sm:text-sm dark:bg-slate-900/85 dark:text-slate-100 dark:placeholder:text-slate-400 dark:disabled:bg-slate-900/50'
  const errorStyles = error
    ? 'border-red-400 focus:border-red-500 focus:ring-red-500/35 dark:border-red-500/50'
    : ''
  const successStyles = success
    ? 'border-emerald-400 focus:border-emerald-500 focus:ring-emerald-500/35'
    : ''
  const defaultStyles =
    !error && !success
      ? 'border-slate-300 focus:border-teal-600 focus:ring-teal-500/35 dark:border-slate-600 dark:focus:border-teal-400 dark:focus:ring-teal-400/30'
      : ''

  const paddingWithIcon =
    icon && iconPosition === 'left'
      ? 'pl-11'
      : icon && iconPosition === 'right'
        ? 'pr-11'
        : ''

  return (
    <div className={containerClassName}>
      {label && (
        <label
          htmlFor={id}
          className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          {label}
        </label>
      )}
      <div className="relative">
        {icon && iconPosition === 'left' && (
          <div className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 [&>svg]:h-[1.125rem] [&>svg]:w-[1.125rem] sm:[&>svg]:h-4 sm:[&>svg]:w-4">
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
          <div className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 [&>svg]:h-[1.125rem] [&>svg]:w-[1.125rem] sm:[&>svg]:h-4 sm:[&>svg]:w-4">
            {icon}
          </div>
        )}
      </div>
      {error && (
        <p
          id={`${id}-error`}
          className="mt-2 text-sm text-red-600 dark:text-red-400"
          role="alert"
        >
          {error}
        </p>
      )}
      {hint && !error && (
        <p id={`${id}-hint`} className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
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
