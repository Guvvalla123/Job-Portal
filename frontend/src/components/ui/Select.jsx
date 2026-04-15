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
    'w-full min-h-12 rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 shadow-xs transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-600 disabled:cursor-not-allowed disabled:opacity-60 sm:min-h-10 sm:py-2.5 sm:text-sm dark:border-slate-600 dark:bg-slate-900/85 dark:text-slate-100 dark:shadow-none dark:focus:border-teal-400 dark:focus:ring-teal-400/35 dark:disabled:bg-slate-900/50 [&>option]:bg-white [&>option]:text-slate-900 dark:[&>option]:bg-slate-800 dark:[&>option]:text-slate-100'
  const errorStyles = error
    ? 'border-red-400 focus:ring-red-500/40 dark:border-red-500/50'
    : ''

  return (
    <div className={containerClassName}>
      {label && (
        <label
          htmlFor={id}
          className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200"
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
