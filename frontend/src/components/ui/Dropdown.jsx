import { createContext, useContext, useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'

const DropdownContext = createContext(null)

/**
 * Dropdown menu with click-outside and keyboard support
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
            className={`absolute top-full z-50 mt-1.5 min-w-40 rounded-xl bg-white py-1 shadow-lg ring-1 ring-gray-200 animate-[slideDown_0.15s_ease-out] ${alignStyles}`}
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
  'block w-full px-4 py-2.5 text-left text-sm font-medium transition-colors first:rounded-t-xl last:rounded-b-xl focus:outline-none focus:bg-gray-50'

export function DropdownItem({ children, onClick, to, className = '', danger = false }) {
  const ctx = useContext(DropdownContext)
  const styles = `${itemBase} ${danger ? 'text-red-600 hover:bg-red-50' : 'text-gray-700 hover:bg-gray-50'} ${className}`

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
  return <div className="my-1 border-t border-gray-100" />
}
