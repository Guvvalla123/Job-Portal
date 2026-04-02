import { apiClient } from './apiClient.js'

/**
 * Admin API — base path `/admin` (apiClient already uses `/api/v1`).
 * Each method returns the API `data` payload: `{ ... }` or `{ items, pagination }` per endpoint.
 */

export async function getStats() {
  const { data } = await apiClient.get('/admin/stats')
  return data.data
}

export async function getStatsTrend() {
  const { data } = await apiClient.get('/admin/stats/trend')
  return data.data
}

export async function getUsers(page = 1, limit = 20, search = '') {
  const { data } = await apiClient.get('/admin/users', {
    params: {
      page,
      limit,
      ...(search ? { search } : {}),
    },
  })
  return data.data
}

export async function updateUserRole(userId, role) {
  const { data } = await apiClient.patch(`/admin/users/${userId}/role`, { role })
  return data.data
}

export async function toggleUserStatus(userId) {
  const { data } = await apiClient.patch(`/admin/users/${userId}/toggle-status`)
  return data.data
}

export async function deleteUser(userId) {
  const { data } = await apiClient.delete(`/admin/users/${userId}`)
  return data.data
}

export async function getJobs(page = 1, limit = 20, search = '') {
  const { data } = await apiClient.get('/admin/jobs', {
    params: {
      page,
      limit,
      ...(search ? { search } : {}),
    },
  })
  return data.data
}

export async function updateJobStatus(jobId, isActive) {
  const { data } = await apiClient.patch(`/admin/jobs/${jobId}/status`, { isActive })
  return data.data
}

export async function toggleJobStatus(jobId) {
  const { data } = await apiClient.patch(`/admin/jobs/${jobId}/toggle-status`)
  return data.data
}

export async function deleteJob(jobId) {
  const { data } = await apiClient.delete(`/admin/jobs/${jobId}`)
  return data.data
}

export async function getCompanies(page = 1, limit = 20, search = '') {
  const { data } = await apiClient.get('/admin/companies', {
    params: {
      page,
      limit,
      ...(search ? { search } : {}),
    },
  })
  return data.data
}

export async function deleteCompany(companyId) {
  const { data } = await apiClient.delete(`/admin/companies/${companyId}`)
  return data.data
}

export async function getApplications(page = 1, limit = 20, status = '') {
  const { data } = await apiClient.get('/admin/applications', {
    params: {
      page,
      limit,
      ...(status ? { status } : {}),
    },
  })
  return data.data
}

/**
 * Get paginated audit logs.
 * @param {number} page
 * @param {number} [limit=50]
 * @param {string} [action] — filter: create | update | delete | login | logout | register | resume_viewed
 * @param {object} [opts]
 * @param {string} [opts.userId] — actor (Mongo id)
 * @param {string} [opts.dateFrom] — ISO date
 * @param {string} [opts.dateTo] — ISO date
 * @returns {Promise<object>}
 */
export async function getAuditLogs(page = 1, limit = 50, action = '', opts = {}) {
  const { userId, dateFrom, dateTo } = opts
  const { data } = await apiClient.get('/admin/audit-logs', {
    params: {
      page,
      limit,
      ...(action ? { action } : {}),
      ...(userId ? { userId } : {}),
      ...(dateFrom ? { dateFrom } : {}),
      ...(dateTo ? { dateTo } : {}),
    },
  })
  return data.data
}
