import { apiClient } from './apiClient.js'

/**
 * Public job list — returns `{ jobs, pagination }`.
 * @param {object} params — `page`, `limit`, `sort` (`newest`|`oldest`|`salary_high`|`salary_low`), filters
 */
export async function listPublicJobs(params = {}) {
  const { page, limit, sort, q, location, employmentType, experienceLevel } = params
  const { data } = await apiClient.get('/jobs', {
    params: { page, limit, sort, q, location, employmentType, experienceLevel },
  })
  return data.data
}

export async function getJobById(id) {
  const { data } = await apiClient.get(`/jobs/${id}`)
  return data.data.job
}

export async function listMyJobs() {
  const { data } = await apiClient.get('/jobs/me')
  return data.data.jobs
}

export async function getRecruiterAnalytics() {
  const { data } = await apiClient.get('/jobs/analytics')
  return data.data
}

export async function getRecruiterApplicationTrend(months = 6) {
  const { data } = await apiClient.get('/jobs/analytics/trend', {
    params: { months },
  })
  return data.data
}

export async function createJob(payload) {
  const { data } = await apiClient.post('/jobs', payload)
  return data.data
}

export async function updateJob(id, payload) {
  const { data } = await apiClient.put(`/jobs/${id}`, payload)
  return data.data
}

export async function deleteJob(id) {
  const { data } = await apiClient.delete(`/jobs/${id}`)
  return data.data
}
