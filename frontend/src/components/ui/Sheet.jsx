import { useEffect, useRef } from 'react'

/**
 * Slide-in panel — filters (right) or mobile nav (left, full-width).
 */
export function Sheet({ open, onClose, title, children, side = 'right', fullWidth = false }) {
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

  const isLeft = side === 'left'
  const panelAnim = isLeft
    ? 'animate-[slideInLeft_0.28s_cubic-bezier(0.22,1,0.36,1)_forwards]'
    : 'animate-[slideInRight_0.28s_cubic-bezier(0.22,1,0.36,1)_forwards]'

  const sideStyles = isLeft ? 'left-0' : 'right-0'

  const widthClass = fullWidth ? 'max-w-full w-full sm:max-w-md' : 'max-w-sm w-full'

  return (
    <div
      className="fixed inset-0 z-60"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'sheet-title' : undefined}
    >
      <div
        className="absolute inset-0 bg-gray-950/60 backdrop-blur-sm transition-opacity dark:bg-black/70"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={ref}
        className={`absolute top-0 bottom-0 ${widthClass} bg-white shadow-2xl dark:bg-gray-900 dark:shadow-black/40 ${sideStyles} ${panelAnim}`}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-4 pt-[max(1rem,env(safe-area-inset-top,0px))] dark:border-gray-800">
            <h2 id="sheet-title" className="text-lg font-semibold text-gray-900 dark:text-white">
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="tap-target rounded-xl text-gray-500 hover:bg-gray-100 hover:text-gray-800 dark:hover:bg-gray-800 dark:hover:text-gray-200"
              aria-label="Close"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        <div
          className={`overflow-y-auto p-4 pb-[max(1rem,env(safe-area-inset-bottom,0px))] ${title ? 'max-h-[calc(100dvh-4.5rem)]' : 'max-h-dvh'}`}
        >
          {children}
        </div>
      </div>
    </div>
  )
}
