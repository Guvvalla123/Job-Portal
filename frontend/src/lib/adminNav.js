/** Shared admin console navigation (sidebar cards on Overview + Security page). */
export const adminNav = [
  { to: '/admin/dashboard', label: 'Overview', description: 'Platform statistics' },
  { to: '/admin/users', label: 'Users', description: 'Roles, status, and accounts' },
  { to: '/admin/jobs', label: 'Jobs', description: 'Listings and activation' },
  { to: '/admin/companies', label: 'Companies', description: 'Recruiter organizations' },
  { to: '/admin/applications', label: 'Applications', description: 'Candidate applications' },
  {
    to: '/admin/subscriptions',
    label: 'Subscriptions',
    description: 'Manage premium users',
    dashboardIcon: 'crown',
  },
  {
    to: '/admin/job-reports',
    label: 'Job Reports',
    description: 'Review reported jobs',
    dashboardIcon: 'flag',
  },
  {
    to: '/admin/revenue',
    label: 'Revenue',
    description: 'View payment stats',
    dashboardIcon: 'chart',
  },
  { to: '/admin/audit-logs', label: 'Audit log', description: 'Security and activity' },
  { to: '/admin/security', label: 'Security', description: 'Authenticator (MFA) for admins' },
]
