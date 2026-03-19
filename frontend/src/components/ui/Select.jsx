/**
 * Styled select for filters and forms.
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
    'w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 disabled:bg-gray-50 disabled:cursor-not-allowed'
  const errorStyles = error ? 'border-red-300 focus:ring-red-500/40' : ''

  return (
    <div className={containerClassName}>
      {label && (
        <label
          htmlFor={id}
          className="mb-1.5 block text-sm font-medium text-gray-700"
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
        {placeholder && (
          <option value="">{placeholder}</option>
        )}
        {options.map((opt) => (
          <option
            key={opt.value}
            value={opt.value}
          >
            {opt.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="mt-1.5 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
