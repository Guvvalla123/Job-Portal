import { NavLink } from 'react-router-dom'
import { activeStyle, mobileActiveStyle } from './layoutNavStyles.js'

export function DesktopNavLinks({ showAuthenticatedNav, user }) {
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
      {showAuthenticatedNav && user?.role === 'candidate' && (
        <NavLink to="/candidate/dashboard" className={activeStyle}>
          My Dashboard
        </NavLink>
      )}
      {showAuthenticatedNav && user?.role === 'recruiter' && (
        <NavLink to="/recruiter/dashboard" className={activeStyle}>
          Recruiter Panel
        </NavLink>
      )}
      {showAuthenticatedNav && user?.role === 'admin' && (
        <NavLink to="/admin/dashboard" className={activeStyle}>
          Admin Panel
        </NavLink>
      )}
    </>
  )
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
