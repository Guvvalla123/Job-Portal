import { NavLink } from 'react-router-dom'
import { activeStyle, mobileActiveStyle } from './layoutNavStyles.js'

/** Public routes — same order as mobile: Browse Jobs → Companies → About → Contact */
export function PublicDesktopNavLinks() {
  return (
    <>
      <NavLink to="/jobs" className={activeStyle}>
        Browse Jobs
      </NavLink>
      <NavLink to="/companies" className={activeStyle}>
        Companies
      </NavLink>
      <NavLink to="/about" className={activeStyle}>
        About Us
      </NavLink>
      <NavLink to="/contact" className={activeStyle}>
        Contact
      </NavLink>
    </>
  )
}

/** Shown after the divider when logged in — before notification bell and profile */
export function DesktopDashboardNavLink({ user }) {
  if (!user) return null
  if (user.role === 'candidate') {
    return (
      <NavLink to="/candidate/dashboard" className={activeStyle}>
        My Dashboard
      </NavLink>
    )
  }
  if (user.role === 'recruiter') {
    return (
      <NavLink to="/recruiter/dashboard" className={activeStyle}>
        Recruiter Panel
      </NavLink>
    )
  }
  if (user.role === 'admin') {
    return (
      <NavLink to="/admin/dashboard" className={activeStyle}>
        Admin Panel
      </NavLink>
    )
  }
  return null
}

export function MobileNavLinks({ showAuthenticatedNav, user, onNavigate }) {
  return (
    <>
      <NavLink to="/jobs" onClick={onNavigate} className={mobileActiveStyle}>
        Browse Jobs
      </NavLink>
      <NavLink to="/companies" onClick={onNavigate} className={mobileActiveStyle}>
        Companies
      </NavLink>
      <NavLink to="/about" onClick={onNavigate} className={mobileActiveStyle}>
        About Us
      </NavLink>
      <NavLink to="/contact" onClick={onNavigate} className={mobileActiveStyle}>
        Contact
      </NavLink>
      {showAuthenticatedNav && user?.role === 'candidate' && (
        <NavLink to="/candidate/dashboard" onClick={onNavigate} className={mobileActiveStyle}>
          My Dashboard
        </NavLink>
      )}
      {showAuthenticatedNav && user?.role === 'recruiter' && (
        <NavLink to="/recruiter/dashboard" onClick={onNavigate} className={mobileActiveStyle}>
          Recruiter Panel
        </NavLink>
      )}
      {showAuthenticatedNav && user?.role === 'admin' && (
        <NavLink to="/admin/dashboard" onClick={onNavigate} className={mobileActiveStyle}>
          Admin Panel
        </NavLink>
      )}
    </>
  )
}
