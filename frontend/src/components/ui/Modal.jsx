import { useEffect, useRef } from 'react'

/**
 * Accessible modal with backdrop, focus trap, and escape key
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
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className="absolute inset-0 bg-gray-950/70 backdrop-blur-md transition-opacity duration-300 dark:bg-black/80"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={ref}
        className={`relative w-full ${sizeStyles[size]} origin-center scale-95 rounded-2xl bg-white opacity-0 shadow-2xl ring-1 ring-gray-200 motion-safe:animate-[modalIn_0.25s_cubic-bezier(0.16,1,0.3,1)_forwards] dark:bg-gray-800 dark:ring-gray-600 motion-reduce:animate-[fadeIn_0.2s_ease-out_forwards] motion-reduce:scale-100`}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
            <h2 id="modal-title" className="text-lg font-semibold text-gray-900 dark:text-white">
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
              aria-label="Close modal"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        <div className={title ? 'p-6' : 'p-6'}>{children}</div>
      </div>
    </div>
  )
}
