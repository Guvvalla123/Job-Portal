import { createElement } from 'react'
import PropTypes from 'prop-types'

/**
 * Card — default elevation; glass/premium map to default/elevated for API stability.
 */
const paddingStyles = {
  none: '',
  sm: 'p-4',
  default: 'p-5 sm:p-6',
  lg: 'p-6 sm:p-8',
}

const variants = {
  default:
    'bg-white shadow-sm ring-1 ring-gray-200/80 dark:bg-gray-800/90 dark:ring-gray-700/80',
  elevated:
    'bg-white shadow-md ring-1 ring-gray-200/80 dark:bg-gray-800/90 dark:ring-gray-700/80',
  bordered: 'bg-white ring-1 ring-gray-200 dark:bg-gray-800 dark:ring-gray-600',
  flat: 'bg-white dark:bg-gray-800',
  glass:
    'bg-white/80 backdrop-blur-md shadow-sm ring-1 ring-gray-200/80 dark:bg-gray-800/80 dark:ring-gray-700/80',
  premium:
    'bg-white shadow-md ring-1 ring-gray-200/80 dark:bg-gray-800/95 dark:ring-gray-700/80',
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
    ? 'transition-[transform,box-shadow] duration-200 ease-out motion-reduce:transition-none hover:-translate-y-0.5 hover:shadow-md dark:hover:shadow-lg/20 motion-reduce:hover:translate-y-0 cursor-pointer'
    : ''
  const mergedClass = `rounded-xl ${variants[variant]} ${paddingStyles[padding]} ${hoverStyles} ${className}`
  return createElement(as, { className: mergedClass, ...props }, children)
}

export function CardHeader({ title, subtitle, action, className = '' }) {
  return (
    <div className={`flex items-start justify-between gap-4 ${className}`}>
      <div className="min-w-0 flex-1">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">{title}</h2>
        {subtitle && (
          <p className="mt-0.5 text-sm font-normal text-gray-600 dark:text-gray-400">{subtitle}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
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
