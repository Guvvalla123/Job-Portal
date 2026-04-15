import PropTypes from 'prop-types'

/**
 * Responsive data table shell — use with TableHead, TableBody, TableRow, TableCell.
 */
export function Table({ children, className = '' }) {
  return (
    <div className="overflow-x-auto rounded-2xl ring-1 ring-gray-200/90 dark:ring-gray-700/80">
      <table className={`w-full min-w-[32rem] border-collapse text-left text-sm ${className}`}>{children}</table>
    </div>
  )
}

export function TableHead({ children, className = '' }) {
  return (
    <thead
      className={`border-b border-gray-100 bg-gray-50/90 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:border-gray-800 dark:bg-gray-900/60 dark:text-gray-400 ${className}`}
    >
      {children}
    </thead>
  )
}

export function TableBody({ children, className = '' }) {
  return <tbody className={`divide-y divide-gray-100 dark:divide-gray-800 ${className}`}>{children}</tbody>
}

export function TableRow({ children, className = '' }) {
  return (
    <tr
      className={`transition-colors hover:bg-gray-50/80 dark:hover:bg-gray-800/40 ${className}`}
    >
      {children}
    </tr>
  )
}

export function TableCell({ as: Tag = 'td', children, className = '', ...rest }) {
  return (
    <Tag
      className={`px-4 py-3.5 align-middle sm:px-5 ${Tag === 'th' ? 'font-semibold text-gray-600 dark:text-gray-300' : 'text-gray-800 dark:text-gray-200'} ${className}`}
      {...rest}
    >
      {children}
    </Tag>
  )
}

Table.propTypes = { children: PropTypes.node, className: PropTypes.string }
TableHead.propTypes = { children: PropTypes.node, className: PropTypes.string }
TableBody.propTypes = { children: PropTypes.node, className: PropTypes.string }
TableRow.propTypes = { children: PropTypes.node, className: PropTypes.string }
TableCell.propTypes = {
  as: PropTypes.oneOf(['td', 'th']),
  children: PropTypes.node,
  className: PropTypes.string,
}
