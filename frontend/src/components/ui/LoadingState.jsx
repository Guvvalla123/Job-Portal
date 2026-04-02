/**
 * Centered loading indicator for Suspense fallbacks and full-width placeholders.
 */
export function LoadingState({
  label = 'Loading…',
  className = '',
  size = 'md',
}) {
  const spinner =
    size === 'sm'
      ? 'h-8 w-8 border-[3px]'
      : size === 'lg'
        ? 'h-12 w-12 border-4'
        : 'h-10 w-10 border-4'
  return (
    <div
      className={`flex w-full flex-col items-center justify-center gap-3 py-16 ${className}`}
      role="status"
      aria-label={label}
    >
      <div
        className={`${spinner} animate-spin rounded-full border-indigo-200 border-t-indigo-600 dark:border-indigo-900 dark:border-t-indigo-400`}
        aria-hidden
      />
      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</span>
    </div>
  )
}
