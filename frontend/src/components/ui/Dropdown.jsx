/* frontend/src/components/ui/Dropdown.jsx */
import { createContext, useContext, useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'

const DropdownContext = createContext(null)

/**
 * Dropdown menu — dark surfaces aligned with account menu.
 */
export function Dropdown({ trigger, children, align = 'right', className = '' }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const close = () => setOpen(false)

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) close()
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  const alignStyles = align === 'right' ? 'right-0' : align === 'left' ? 'left-0' : 'left-1/2 -translate-x-1/2'

  return (
    <DropdownContext.Provider value={{ close }}>
      <div className={`relative inline-block ${className}`} ref={ref}>
        <div onClick={() => setOpen((o) => !o)}>{trigger}</div>
        {open && (
          <div
            className={`absolute top-full z-50 mt-1.5 min-w-[min(18rem,calc(100vw-2rem))] max-w-[calc(100vw-2rem)] rounded-2xl border border-gray-200/90 bg-white py-1 shadow-lg shadow-gray-900/10 ring-1 ring-gray-200/60 animate-[slideDown_0.15s_ease-out] dark:border-gray-700 dark:bg-gray-900 dark:shadow-black/40 dark:ring-gray-700/80 ${alignStyles}`}
            role="menu"
          >
            {children}
          </div>
        )}
      </div>
    </DropdownContext.Provider>
  )
}

const itemBase =
  'block w-full min-h-11 px-4 py-3 text-left text-sm font-medium transition-colors first:rounded-t-xl last:rounded-b-xl focus:outline-none focus:bg-gray-50 sm:min-h-10 sm:py-2.5 dark:focus:bg-gray-800/80'

export function DropdownItem({ children, onClick, to, className = '', danger = false }) {
  const ctx = useContext(DropdownContext)
  const styles = `${itemBase} ${
    danger
      ? 'text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40'
      : 'text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-800'
  } ${className}`

  const handleClick = () => {
    ctx?.close()
    onClick?.()
  }

  if (to) {
    return (
      <Link to={to} role="menuitem" className={styles} onClick={handleClick}>
        {children}
      </Link>
    )
  }

  return (
    <button type="button" role="menuitem" onClick={handleClick} className={styles}>
      {children}
    </button>
  )
}

export function DropdownDivider() {
  return <div className="my-1 border-t border-gray-100 dark:border-gray-800" />
}
