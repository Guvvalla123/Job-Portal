import { Suspense, useState } from 'react'
import { NavLink, Outlet, Link } from 'react-router-dom'
import { RouteFallback } from '../components/layout/RouteFallback.jsx'

const navItemClass =
  'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-teal-500/80 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-gray-900'

function NavIcon({ children, active }) {
  return (
    <span
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors ${
        active
          ? 'bg-teal-700 text-white dark:bg-teal-600'
          : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300'
      }`}
    >
      {children}
    </span>
  )
}

const NAV = [
  {
    to: '/recruiter/dashboard',
    label: 'Overview',
    end: true,
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    ),
  },
  {
    to: '/recruiter/jobs',
    label: 'Jobs & applicants',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.193 23.193 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    to: '/recruiter/companies',
    label: 'Companies',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  },
  {
    to: '/recruiter/interviews',
    label: 'Interviews',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
]

function SidebarNav({ onNavigate }) {
  return (
    <nav className="flex flex-1 flex-col gap-0.5 p-3" aria-label="Recruiter workspace">
      {NAV.map(({ to, label, icon, end }) => (
        <NavLink key={to} to={to} end={Boolean(end)} onClick={onNavigate}>
          {({ isActive }) => (
            <span
              className={`${navItemClass} ${
                isActive
                  ? 'bg-teal-50 text-teal-900 dark:bg-teal-950/60 dark:text-teal-100'
                  : 'text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800/80'
              }`}
            >
              <NavIcon active={isActive}>{icon}</NavIcon>
              {label}
            </span>
          )}
        </NavLink>
      ))}
      <div className="my-3 border-t border-gray-200 dark:border-gray-700" />
      <Link
        to="/jobs"
        onClick={onNavigate}
        className={`${navItemClass} text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800/80`}
      >
        <NavIcon active={false}>
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </NavIcon>
        Browse public jobs
      </Link>
    </nav>
  )
}

export function RecruiterLayout() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  return (
    <div className="flex min-h-[calc(100dvh-3.5rem)] w-full min-w-0 bg-gray-50/80 dark:bg-gray-950">
      {/* Mobile drawer backdrop */}
      {mobileNavOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden"
          aria-label="Close menu"
          onClick={() => setMobileNavOpen(false)}
        />
      ) : null}

      {/* Sidebar */}
      <aside
        className={`fixed bottom-0 left-0 top-14 z-50 flex w-72 max-w-[85vw] flex-col border-r border-gray-200 bg-white shadow-xl motion-safe:transition-transform dark:border-gray-800 dark:bg-gray-900 md:static md:top-auto md:z-0 md:h-auto md:min-h-[calc(100dvh-3.5rem)] md:w-64 md:max-w-none md:translate-x-0 md:shadow-none ${
          mobileNavOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="hidden border-b border-gray-100 px-4 py-4 dark:border-gray-800 md:block">
          <p className="text-xs font-semibold uppercase tracking-wider text-teal-700 dark:text-teal-400">Workspace</p>
          <p className="mt-0.5 text-sm font-semibold text-gray-900 dark:text-white">Hiring</p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Post roles, review candidates, schedule interviews.</p>
        </div>
        <SidebarNav onNavigate={() => setMobileNavOpen(false)} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile workspace bar */}
        <div className="sticky top-14 z-30 flex items-center gap-3 border-b border-gray-200 bg-white/95 px-4 py-3 backdrop-blur-md dark:border-gray-800 dark:bg-gray-900/95 md:hidden">
          <button
            type="button"
            className="tap-target rounded-lg border border-gray-200 p-2 text-gray-700 dark:border-gray-700 dark:text-gray-200"
            aria-expanded={mobileNavOpen}
            aria-controls="recruiter-sidebar"
            onClick={() => setMobileNavOpen((o) => !o)}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="text-sm font-semibold text-gray-900 dark:text-white">Recruiter</span>
        </div>

        <div id="recruiter-sidebar" className="sr-only md:hidden" aria-hidden />

        <div className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <Suspense fallback={<RouteFallback />}>
            <Outlet />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
