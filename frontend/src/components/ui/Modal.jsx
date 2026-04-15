/* frontend/src/components/ui/Modal.jsx */
import { useEffect, useRef } from 'react'
import PropTypes from 'prop-types'

/**
 * Accessible modal — premium surface, strong focus affordance.
 */
export function Modal({ open, onClose, title, children, size = 'md' }) {
  const ref = useRef(null)
  const previousActive = useRef(null)

  useEffect(() => {
    if (!open) return
    previousActive.current = document.activeElement
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleEscape)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
      if (previousActive.current?.focus) previousActive.current.focus()
    }
  }, [open, onClose])

  useEffect(() => {
    if (open && ref.current) {
      const focusable = ref.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      )
      const first = focusable[0]
      if (first) first.focus()
    }
  }, [open])

  if (!open) return null

  const sizeStyles = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className="absolute inset-0 bg-gray-950/75 backdrop-blur-md transition-opacity duration-300 dark:bg-black/85"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={ref}
        className={`relative mb-0 w-full ${sizeStyles[size]} max-h-[90dvh] overflow-y-auto rounded-t-3xl border border-gray-200/80 bg-white shadow-xl ring-1 ring-gray-200/50 opacity-0 motion-safe:animate-[modalIn_0.25s_cubic-bezier(0.16,1,0.3,1)_forwards] dark:border-gray-700 dark:bg-gray-900 dark:ring-gray-700/80 dark:shadow-2xl sm:mb-auto sm:rounded-3xl motion-reduce:animate-[fadeIn_0.2s_ease-out_forwards] motion-reduce:scale-100`}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-5 py-4 sm:px-6 dark:border-gray-800">
            <h2 id="modal-title" className="text-lg font-semibold tracking-tight text-gray-900 dark:text-white">
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="tap-target shrink-0 rounded-xl text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 dark:hover:bg-gray-800 dark:hover:text-gray-200"
              aria-label="Close modal"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        <div className="p-5 sm:p-6">{children}</div>
      </div>
    </div>
  )
}

Modal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string,
  children: PropTypes.node,
  size: PropTypes.oneOf(['sm', 'md', 'lg', 'xl']),
}
