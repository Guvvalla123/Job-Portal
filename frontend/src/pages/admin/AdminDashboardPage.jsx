import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '../../lib/queryKeys.js'
import { CACHE_TIERS } from '../../lib/queryOptions.js'
import { apiClient } from '../../api/apiClient.js'
import { toast } from 'sonner'
import { getApiErrorMessage } from '../../utils/getApiErrorMessage.js'

export function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState('users')

  const statsQuery = useQuery({
    queryKey: queryKeys.admin.stats(),
    queryFn: async () => {
      const response = await apiClient.get('/admin/stats')
      return response.data.data
    },
    staleTime: CACHE_TIERS.dashboard.staleTime,
    gcTime: CACHE_TIERS.dashboard.gcTime,
  })

  const stats = statsQuery.data || {}

  return (
    <section className="space-y-5">
      <div className="rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-600 px-5 py-6 shadow-lg sm:px-8">
        <h1 className="text-xl font-semibold text-white sm:text-2xl">Admin Dashboard</h1>
        <p className="mt-1 text-sm text-indigo-100">Manage users, jobs, and platform moderation.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
          <p className="text-sm font-medium text-gray-500">Total Users</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{stats.totalUsers ?? '—'}</p>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
          <p className="text-sm font-medium text-gray-500">Total Jobs</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{stats.totalJobs ?? '—'}</p>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
          <p className="text-sm font-medium text-gray-500">Total Applications</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{stats.totalApplications ?? '—'}</p>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
          <p className="text-sm font-medium text-gray-500">Total Companies</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{stats.totalCompanies ?? '—'}</p>
        </div>
      </div>

      <div className="flex gap-1 rounded-xl bg-white p-1 shadow-sm ring-1 ring-gray-100">
        {['users', 'jobs'].map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-medium capitalize transition-colors ${activeTab === tab ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'users' && <UsersPanel />}
      {activeTab === 'jobs' && <JobsPanel />}
    </section>
  )
}

function UsersPanel() {
  const [page, setPage] = useState(1)
  const queryClient = useQueryClient()

  const usersQuery = useQuery({
    queryKey: queryKeys.admin.users(page),
    queryFn: async () => {
      const response = await apiClient.get('/admin/users', { params: { page, limit: 15 } })
      return response.data.data
    },
    staleTime: CACHE_TIERS.dashboard.staleTime,
    gcTime: CACHE_TIERS.dashboard.gcTime,
  })

  const toggleMutation = useMutation({
    mutationFn: (userId) => apiClient.patch(`/admin/users/${userId}/toggle-status`),
    onSuccess: async (response) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.admin.users() })
      toast.success(response.data?.message || 'User status updated.')
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'Could not update user status.'))
    },
  })

  const { users = [], pagination = {} } = usersQuery.data || {}

  return (
    <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
      <h2 className="border-l-4 border-indigo-600 pl-4 text-lg font-semibold text-gray-900">All Users</h2>
      {usersQuery.isLoading && <p className="mt-3 text-sm text-gray-500">Loading users...</p>}
      {usersQuery.isError && <p className="mt-3 text-sm text-red-600">Could not load users.</p>}

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-500">
              <th className="px-3 py-3">Name</th>
              <th className="px-3 py-3">Email</th>
              <th className="px-3 py-3">Role</th>
              <th className="px-3 py-3">Status</th>
              <th className="px-3 py-3">Joined</th>
              <th className="px-3 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u._id} className="border-b border-gray-100 transition-colors hover:bg-gray-50">
                <td className="px-3 py-3 font-medium text-gray-900">{u.fullName}</td>
                <td className="px-3 py-3 text-gray-600">{u.email}</td>
                <td className="px-3 py-3">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    u.role === 'admin' ? 'bg-purple-50 text-purple-700 ring-1 ring-purple-600/20'
                    : u.role === 'recruiter' ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-600/20'
                    : 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20'
                  }`}>
                    {u.role}
                  </span>
                </td>
                <td className="px-3 py-3">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${u.isActive !== false ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20' : 'bg-red-50 text-red-700 ring-1 ring-red-600/20'}`}>
                    {u.isActive !== false ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-3 py-3 text-gray-500">{new Date(u.createdAt).toLocaleDateString()}</td>
                <td className="px-3 py-3">
                  <button
                    type="button"
                    disabled={toggleMutation.isPending}
                    onClick={() => toggleMutation.mutate(u._id)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium disabled:opacity-60 ${
                      u.isActive !== false
                        ? 'border border-red-300 text-red-600 hover:bg-red-50'
                        : 'border border-emerald-300 text-emerald-600 hover:bg-emerald-50'
                    }`}
                  >
                    {u.isActive !== false ? 'Deactivate' : 'Activate'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pagination.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Page {pagination.page} of {pagination.totalPages} ({pagination.total} users)
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={page >= pagination.totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function JobsPanel() {
  const [page, setPage] = useState(1)
  const queryClient = useQueryClient()

  const jobsQuery = useQuery({
    queryKey: queryKeys.admin.jobs(page),
    queryFn: async () => {
      const response = await apiClient.get('/admin/jobs', { params: { page, limit: 15 } })
      return response.data.data
    },
    staleTime: CACHE_TIERS.dashboard.staleTime,
    gcTime: CACHE_TIERS.dashboard.gcTime,
  })

  const toggleMutation = useMutation({
    mutationFn: (jobId) => apiClient.patch(`/admin/jobs/${jobId}/toggle-status`),
    onSuccess: async (response) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.admin.jobs() })
      toast.success(response.data?.message || 'Job status updated.')
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'Could not update job status.'))
    },
  })

  const { jobs = [], pagination = {} } = jobsQuery.data || {}

  return (
    <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
      <h2 className="border-l-4 border-indigo-600 pl-4 text-lg font-semibold text-gray-900">All Jobs</h2>
      {jobsQuery.isLoading && <p className="mt-3 text-sm text-gray-500">Loading jobs...</p>}
      {jobsQuery.isError && <p className="mt-3 text-sm text-red-600">Could not load jobs.</p>}

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-500">
              <th className="px-3 py-3">Title</th>
              <th className="px-3 py-3">Company</th>
              <th className="px-3 py-3">Posted By</th>
              <th className="px-3 py-3">Type</th>
              <th className="px-3 py-3">Status</th>
              <th className="px-3 py-3">Posted</th>
              <th className="px-3 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((job) => (
              <tr key={job._id} className="border-b border-gray-100 transition-colors hover:bg-gray-50">
                <td className="px-3 py-3 font-medium text-gray-900">{job.title}</td>
                <td className="px-3 py-3 text-gray-600">{job.company?.name || '—'}</td>
                <td className="px-3 py-3 text-gray-600">{job.postedBy?.fullName || '—'}</td>
                <td className="px-3 py-3 capitalize text-gray-600">{job.employmentType}</td>
                <td className="px-3 py-3">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${job.isActive ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20' : 'bg-red-50 text-red-700 ring-1 ring-red-600/20'}`}>
                    {job.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-3 py-3 text-gray-500">{new Date(job.createdAt).toLocaleDateString()}</td>
                <td className="px-3 py-3">
                  <button
                    type="button"
                    disabled={toggleMutation.isPending}
                    onClick={() => toggleMutation.mutate(job._id)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium disabled:opacity-60 ${
                      job.isActive
                        ? 'border border-red-300 text-red-600 hover:bg-red-50'
                        : 'border border-emerald-300 text-emerald-600 hover:bg-emerald-50'
                    }`}
                  >
                    {job.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pagination.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Page {pagination.page} of {pagination.totalPages} ({pagination.total} jobs)
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={page >= pagination.totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
