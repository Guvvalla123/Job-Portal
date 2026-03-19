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
  default: 'bg-white shadow-sm ring-1 ring-gray-100',
  elevated: 'bg-white shadow-md ring-1 ring-gray-100',
  bordered: 'bg-white ring-1 ring-gray-200',
  flat: 'bg-white',
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
    ? 'transition-all duration-200 hover:shadow-md hover:ring-gray-200 cursor-pointer'
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
        <h2 className="text-base font-semibold text-gray-900">{title}</h2>
        {subtitle && (
          <p className="mt-0.5 text-sm text-gray-500">{subtitle}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}
