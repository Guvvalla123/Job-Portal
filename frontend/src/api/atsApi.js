import { apiClient } from './apiClient.js'

/**
 * ATS resume checks — base path `/ats` (apiClient already uses `/api/v1`).
 */

export async function analyzeResume(resumeText, jobDescription, jobId) {
  const { data } = await apiClient.post('/ats/analyze', {
    resumeText,
    jobDescription,
    ...(jobId != null && String(jobId).trim() !== '' ? { jobId: String(jobId) } : {}),
  })
  return data.data
}

export async function getAtsHistory(page = 1, limit = 20) {
  const { data } = await apiClient.get('/ats/history', {
    params: { page, limit },
  })
  return data.data
}

export async function getAtsUsage() {
  const { data } = await apiClient.get('/ats/usage')
  return data.data
}

export async function getAtsCheck(checkId) {
  const { data } = await apiClient.get(`/ats/history/${checkId}`)
  return data.data
}
