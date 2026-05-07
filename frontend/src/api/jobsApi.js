import { apiClient } from './apiClient.js'

/**
 * Public job list — returns `{ jobs, pagination }`.
 * @param {object} params — `page`, `limit`, `sort`, filters (see backend `listJobsQuerySchema`)
 */
export async function listPublicJobs(params = {}) {
  const {
    page,
    limit,
    sort,
    q,
    location,
    employmentType,
    experienceLevel,
    category,
    postedWithin,
    isVerified,
  } = params
  const apiParams = {
    page,
    limit,
    sort,
    q,
    location,
    employmentType,
    experienceLevel,
  }
  if (category) apiParams.category = category
  if (postedWithin) apiParams.postedWithin = postedWithin
  if (isVerified === true) apiParams.isVerified = true

  const { data } = await apiClient.get('/jobs', {
    params: apiParams,
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

/** Public — increments click count; no response body (204). */
export async function trackJobClick(jobId) {
  await apiClient.patch(`/jobs/${jobId}/click`)
}

/**
 * Auth + CSRF — submit abuse report.
 * @param {string} jobId
 * @param {string} reason
 * @param {string} [description]
 */
export async function reportJob(jobId, reason, description) {
  const { data } = await apiClient.post(`/jobs/${jobId}/report`, {
    reason,
    ...(description != null && description !== '' ? { description } : {}),
  })
  return data.data.report
}

/**
 * Recently posted jobs — public.
 * @param {object} [params]
 * @param {number} [params.limit]
 */
export async function getFreshJobs(params = {}) {
  const { limit } = params
  const { data } = await apiClient.get('/jobs/fresh', {
    params: limit != null ? { limit } : {},
  })
  return data.data
}
