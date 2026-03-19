import { useEffect, useRef } from 'react'

/**
 * Slide-in panel (drawer) for mobile filters, etc.
 */
export function Sheet({ open, onClose, title, children, side = 'right' }) {
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleEscape)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  const sideStyles = {
    right: 'right-0 translate-x-0',
    left: 'left-0 -translate-x-0',
  }

  return (
    <div
      className="fixed inset-0 z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'sheet-title' : undefined}
    >
      <div
        className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={ref}
        className={`absolute top-0 bottom-0 w-full max-w-sm bg-white shadow-2xl ${sideStyles[side]} animate-[slideInRight_0.25s_ease-out_forwards]`}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-4">
            <h2 id="sheet-title" className="text-lg font-semibold text-gray-900">
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
              aria-label="Close"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        <div className="overflow-y-auto p-4 max-h-[calc(100vh-4rem)]">{children}</div>
      </div>
    </div>
  )
}
