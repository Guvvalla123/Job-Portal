/**
 * Production-grade Card with variants and hover states.
 */
const paddingStyles = {
  none: '',
  sm: 'p-4',
  default: 'p-5 sm:p-6',
  lg: 'p-6 sm:p-8',
}

const variants = {
  default:
    'bg-white shadow-sm ring-1 ring-gray-100 dark:bg-gray-800/90 dark:ring-gray-700/80',
  elevated:
    'bg-white shadow-md ring-1 ring-gray-100 dark:bg-gray-800/90 dark:ring-gray-700/80',
  bordered: 'bg-white ring-1 ring-gray-200 dark:bg-gray-800 dark:ring-gray-600',
  flat: 'bg-white dark:bg-gray-800',
  /** Glass + depth – landing / marketing */
  glass:
    'bg-white/70 backdrop-blur-xl shadow-lg shadow-gray-200/40 ring-1 ring-white/80 dark:bg-gray-800/70 dark:shadow-black/20 dark:ring-gray-600/60',
  /** Premium job cards – hover glow */
  premium:
    'bg-white border border-gray-100/80 shadow-lg shadow-gray-200/50 ring-1 ring-gray-100/60 dark:border-gray-700/80 dark:bg-gray-800/95 dark:shadow-black/30 dark:ring-gray-700/50',
}

export function Card({
  children,
  className = '',
  hover = false,
  padding = 'default',
  variant = 'default',
  as: Component = 'div',
  ...props
}) {
  const hoverStyles = hover
    ? 'transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/10 hover:ring-indigo-200/60 dark:hover:shadow-indigo-900/20 dark:hover:ring-indigo-800/40 cursor-pointer motion-reduce:hover:translate-y-0'
    : ''
  return (
    <Component
      className={`rounded-xl ${variants[variant]} ${paddingStyles[padding]} ${hoverStyles} ${className}`}
      {...props}
    >
      {children}
    </Component>
  )
}

export function CardHeader({ title, subtitle, action, className = '' }) {
  return (
    <div className={`flex items-start justify-between gap-4 ${className}`}>
      <div className="min-w-0 flex-1">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">{title}</h2>
        {subtitle && (
          <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}
