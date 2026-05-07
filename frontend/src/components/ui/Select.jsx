/**
 * frontend/src/components/ui/Select.jsx
 * Styled select for filters and forms — full light/dark contrast aligned with Input.
 */
export function Select({
  id,
  label,
  error,
  options = [],
  placeholder = 'Select...',
  className = '',
  containerClassName = '',
  ...props
}) {
  const base =
    'w-full min-h-12 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-normal text-gray-900 shadow-xs transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-600 disabled:cursor-not-allowed disabled:opacity-60 sm:min-h-10 sm:px-4 sm:py-2.5 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:shadow-none dark:focus:border-teal-400 dark:focus:ring-teal-400/35 dark:disabled:bg-gray-800/80 [&>option]:bg-white [&>option]:text-gray-900 dark:[&>option]:bg-gray-800 dark:[&>option]:text-white'
  const errorStyles = error
    ? 'border-red-400 focus:ring-red-500/40 dark:border-red-500/50'
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
      <select
        id={id}
        className={`${base} ${errorStyles} ${className}`}
        aria-invalid={error ? 'true' : undefined}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="mt-1.5 text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
