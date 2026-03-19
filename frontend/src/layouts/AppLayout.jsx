import { useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../context/useAuth.jsx'
import { NotificationDropdown } from '../components/NotificationDropdown.jsx'
import { ProfileDropdown } from '../components/ProfileDropdown.jsx'
import { Footer } from '../components/Footer.jsx'

const linkBase = 'px-3 py-1.5 rounded-md text-sm font-medium transition-colors'
const activeStyle = ({ isActive }) =>
  `${linkBase} ${isActive ? 'bg-white/20 text-white' : 'text-blue-100 hover:bg-white/10 hover:text-white'}`

const mobileLinkBase = 'block px-3 py-2 rounded-md text-sm font-medium transition-colors'
const mobileActiveStyle = ({ isActive }) =>
  `${mobileLinkBase} ${isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-100'}`

export function AppLayout() {
  const { user, logout } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex min-h-screen flex-col">
      <header className="bg-gradient-to-r from-blue-700 via-blue-600 to-blue-500 shadow-lg">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20 text-sm font-bold text-white">
              JP
            </div>
            <span className="text-lg font-bold tracking-tight text-white">JobPortal</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-1 md:flex">
            <NavLink to="/jobs" className={activeStyle}>Browse Jobs</NavLink>
            <NavLink to="/companies" className={activeStyle}>Companies</NavLink>
            {user?.role === 'candidate' && (
              <NavLink to="/candidate/dashboard" className={activeStyle}>My Dashboard</NavLink>
            )}
            {user?.role === 'recruiter' && (
              <NavLink to="/recruiter/dashboard" className={activeStyle}>Recruiter Panel</NavLink>
            )}
            {user?.role === 'admin' && (
              <NavLink to="/admin/dashboard" className={activeStyle}>Admin Panel</NavLink>
            )}

            <div className="ml-3 h-5 w-px bg-white/30" />

            {!user ? (
              <div className="ml-2 flex items-center gap-1">
                <NavLink to="/login" className={`${linkBase} text-blue-100 hover:text-white`}>
                  Sign In
                </NavLink>
                <NavLink
                  to="/register"
                  className="rounded-md bg-white px-4 py-1.5 text-sm font-semibold text-blue-700 shadow-sm transition-colors hover:bg-blue-50"
                >
                  Get Started
                </NavLink>
              </div>
            ) : (
              <div className="ml-2 flex items-center gap-2">
                <NotificationDropdown />
                <ProfileDropdown />
              </div>
            )}
          </nav>

          {/* Mobile hamburger */}
          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            className="inline-flex items-center justify-center rounded-md p-2 text-white hover:bg-white/10 md:hidden"
            aria-label="Toggle menu"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              {mobileOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile dropdown */}
        {mobileOpen && (
          <nav className="border-t border-white/20 bg-white px-4 py-3 shadow-lg md:hidden">
            <div className="space-y-1">
              <NavLink to="/jobs" onClick={() => setMobileOpen(false)} className={mobileActiveStyle}>
                Browse Jobs
              </NavLink>
              <NavLink to="/companies" onClick={() => setMobileOpen(false)} className={mobileActiveStyle}>
                Companies
              </NavLink>
              {user?.role === 'candidate' && (
                <NavLink to="/candidate/dashboard" onClick={() => setMobileOpen(false)} className={mobileActiveStyle}>
                  My Dashboard
                </NavLink>
              )}
              {user?.role === 'recruiter' && (
                <NavLink to="/recruiter/dashboard" onClick={() => setMobileOpen(false)} className={mobileActiveStyle}>
                  Recruiter Panel
                </NavLink>
              )}
              {user?.role === 'admin' && (
                <NavLink to="/admin/dashboard" onClick={() => setMobileOpen(false)} className={mobileActiveStyle}>
                  Admin Panel
                </NavLink>
              )}
            </div>
            <div className="mt-3 border-t border-gray-200 pt-3">
              {!user ? (
                <div className="space-y-2">
                  <NavLink
                    to="/login"
                    onClick={() => setMobileOpen(false)}
                    className="block rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
                  >
                    Sign In
                  </NavLink>
                  <NavLink
                    to="/register"
                    onClick={() => setMobileOpen(false)}
                    className="block rounded-md bg-blue-600 px-3 py-2 text-center text-sm font-semibold text-white hover:bg-blue-700"
                  >
                    Get Started
                  </NavLink>
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <ProfileDropdown compact onNavigate={() => setMobileOpen(false)} />
                </div>
              )}
            </div>
          </nav>
        )}
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 text-gray-900 dark:text-gray-100">
        <Outlet />
      </main>

      <Footer />
    </div>
  )
}
