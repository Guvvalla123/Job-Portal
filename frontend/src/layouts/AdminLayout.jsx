import { Suspense, useState } from 'react'
import { NavLink, Outlet, Link } from 'react-router-dom'
import { adminNav } from '../lib/adminNav.js'
import { RouteFallback } from '../components/layout/RouteFallback.jsx'

const navItemClass =
  'group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-teal-500/80 focus-visible:ring-offset-2 focus-visible:ring-offset-white min-h-12 dark:focus-visible:ring-offset-gray-900 sm:py-2.5 sm:min-h-0'

function NavIcon({ children, active }) {
  return (
    <span
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors sm:h-9 sm:w-9 ${
        active
          ? 'bg-teal-700 text-white shadow-md shadow-teal-900/20 dark:bg-teal-600'
          : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300'
      }`}
    >
      {children}
    </span>
  )
}

function IconOverview() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
  )
}

const ROUTE_ICONS = {
  '/admin/dashboard': IconOverview,
  '/admin/users': () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0z"
      />
    </svg>
  ),
  '/admin/jobs': () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 13.255A23.193 23.193 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
      />
    </svg>
  ),
  '/admin/companies': () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
      />
    </svg>
  ),
  '/admin/applications': () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    </svg>
  ),
  '/admin/audit-logs': () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  '/admin/security': () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
      />
    </svg>
  ),
}

function SidebarNav({ onNavigate }) {
  return (
    <nav className="flex flex-1 flex-col gap-0.5 p-3" aria-label="Admin console">
      {adminNav.map(({ to, label, description }) => {
        const Icon = ROUTE_ICONS[to] || IconOverview
        return (
          <NavLink key={to} to={to} onClick={onNavigate}>
            {({ isActive }) => (
              <span
                className={`${navItemClass} ${
                  isActive
                    ? 'bg-teal-50 text-teal-900 dark:bg-teal-950/60 dark:text-teal-100'
                    : 'text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800/80'
                }`}
              >
                <NavIcon active={isActive}>
                  <Icon />
                </NavIcon>
                <span className="min-w-0 flex-1">
                  <span className="block truncate">{label}</span>
                  <span className="mt-0.5 block truncate text-xs font-normal text-gray-500 dark:text-gray-400">
                    {description}
                  </span>
                </span>
              </span>
            )}
          </NavLink>
        )
      })}
      <div className="my-3 border-t border-gray-200 dark:border-gray-700" />
      <Link
        to="/"
        onClick={onNavigate}
        className={`${navItemClass} text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800/80`}
      >
        <NavIcon active={false}>
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        </NavIcon>
        Back to site
      </Link>
    </nav>
  )
}

export function AdminLayout() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  return (
    <div className="flex min-h-[calc(100dvh-3.5rem)] w-full min-w-0 bg-gradient-to-b from-gray-50/95 to-gray-50 dark:from-gray-950 dark:to-gray-950">
      {mobileNavOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/45 backdrop-blur-sm md:hidden"
          aria-label="Close menu"
          onClick={() => setMobileNavOpen(false)}
        />
      ) : null}

      <aside
        className={`fixed bottom-0 left-0 top-14 z-50 flex w-[min(20rem,88vw)] max-w-[85vw] flex-col border-r border-gray-200/90 bg-white/95 shadow-2xl shadow-gray-900/10 backdrop-blur-xl motion-safe:transition-transform dark:border-gray-800 dark:bg-gray-900/95 dark:shadow-black/40 md:static md:top-auto md:z-0 md:h-auto md:min-h-[calc(100dvh-3.5rem)] md:w-72 md:max-w-none md:translate-x-0 md:shadow-none ${
          mobileNavOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
        aria-label="Admin sidebar"
      >
        <div className="hidden border-b border-gray-100 px-4 py-5 dark:border-gray-800 md:block">
          <p className="text-xs font-semibold uppercase tracking-wider text-teal-700 dark:text-teal-400">Console</p>
          <p className="mt-0.5 text-sm font-semibold text-gray-900 dark:text-white">Administration</p>
          <p className="mt-1 text-xs leading-relaxed text-gray-500 dark:text-gray-400">
            Platform-wide users, listings, and security.
          </p>
        </div>
        <SidebarNav onNavigate={() => setMobileNavOpen(false)} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="sticky top-14 z-30 flex items-center gap-3 border-b border-gray-200/90 bg-white/90 px-4 py-3.5 backdrop-blur-md dark:border-gray-800 dark:bg-gray-900/90 md:hidden">
          <button
            type="button"
            className="tap-target rounded-xl border border-gray-200 p-2 text-gray-700 transition-colors active:scale-[0.98] dark:border-gray-700 dark:text-gray-200"
            aria-expanded={mobileNavOpen}
            aria-controls="admin-sidebar"
            onClick={() => setMobileNavOpen((o) => !o)}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="text-sm font-semibold text-gray-900 dark:text-white">Admin</span>
        </div>

        <div id="admin-sidebar" className="sr-only md:hidden" aria-hidden />

        <div className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <Suspense fallback={<RouteFallback />}>
            <Outlet />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
