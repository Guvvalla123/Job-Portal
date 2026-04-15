/* frontend/src/components/ui/Card.jsx */
import { createElement } from 'react'
import PropTypes from 'prop-types'

/**
 * Card — surfaces use design tokens (shadow-soft, rings) for light/dark.
 */
const paddingStyles = {
  none: '',
  sm: 'p-4 sm:p-5',
  default: 'p-5 sm:p-6',
  lg: 'p-6 sm:p-8',
}

const variants = {
  default:
    'rounded-2xl bg-white/95 shadow-soft ring-1 ring-gray-200/80 backdrop-blur-[2px] dark:bg-gray-900/90 dark:ring-gray-700/70',
  elevated:
    'rounded-2xl bg-white/95 shadow-lg shadow-gray-900/5 ring-1 ring-gray-200/70 dark:bg-gray-900/95 dark:shadow-black/40 dark:ring-gray-700/60',
  bordered:
    'rounded-2xl bg-white ring-1 ring-gray-200 dark:bg-gray-900 dark:ring-gray-700',
  flat: 'rounded-2xl bg-white dark:bg-gray-900',
  glass:
    'rounded-2xl bg-white/85 backdrop-blur-md shadow-soft ring-1 ring-gray-200/70 dark:bg-gray-900/80 dark:ring-gray-700/70',
  premium:
    'rounded-2xl bg-white shadow-md ring-1 ring-teal-100/80 dark:bg-gray-900/95 dark:ring-teal-900/40 dark:shadow-glow-primary',
}

export function Card({
  children,
  className = '',
  hover = false,
  padding = 'default',
  variant = 'default',
  as = 'div',
  ...props
}) {
  const hoverStyles = hover
    ? 'cursor-pointer transition-[transform,box-shadow] duration-200 ease-out motion-reduce:transition-none hover:-translate-y-0.5 hover:shadow-lg motion-reduce:hover:translate-y-0 dark:hover:shadow-xl/30'
    : ''
  const mergedClass = `${variants[variant]} ${paddingStyles[padding]} ${hoverStyles} ${className}`
  return createElement(as, { className: mergedClass, ...props }, children)
}

export function CardHeader({ title, subtitle, action, className = '' }) {
  return (
    <div className={`flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4 ${className}`}>
      <div className="min-w-0 flex-1">
        <h2 className="text-base font-semibold tracking-tight text-gray-900 dark:text-white">{title}</h2>
        {subtitle && (
          <p className="mt-0.5 text-sm font-normal leading-relaxed text-gray-600 dark:text-gray-400">
            {subtitle}
          </p>
        )}
      </div>
      {action && <div className="shrink-0 sm:self-center">{action}</div>}
    </div>
  )
}

Card.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string,
  hover: PropTypes.bool,
  padding: PropTypes.oneOf(['none', 'sm', 'default', 'lg']),
  variant: PropTypes.oneOf(['default', 'elevated', 'bordered', 'flat', 'glass', 'premium']),
  as: PropTypes.oneOfType([PropTypes.string, PropTypes.elementType]),
}

CardHeader.propTypes = {
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  action: PropTypes.node,
  className: PropTypes.string,
}
