import { apiClient } from './apiClient.js'

export async function listMyApplications(params = {}) {
  const { data } = await apiClient.get('/applications/me', { params })
  return data.data
}

export async function applyToJob({ jobId, coverLetter }) {
  const { data } = await apiClient.post('/applications', { jobId, coverLetter })
  return data.data
}

export async function listApplicationsForJob(jobId, params = {}) {
  const { data } = await apiClient.get(`/applications/job/${jobId}`, { params })
  return data.data
}

export async function getApplication(applicationId) {
  const { data } = await apiClient.get(`/applications/${applicationId}`)
  return data.data
}

export async function updateApplicationStatus(applicationId, status) {
  const { data } = await apiClient.patch(`/applications/${applicationId}/status`, { status })
  return data.data
}

export async function updateRecruiterNotes(applicationId, recruiterNotes) {
  const { data } = await apiClient.patch(`/applications/${applicationId}/notes`, { recruiterNotes })
  return data.data
}

export async function updateInterview(applicationId, body) {
  const { data } = await apiClient.patch(`/applications/${applicationId}/interview`, body)
  return data.data
}

export async function listUpcomingInterviews() {
  const { data } = await apiClient.get('/applications/interviews/upcoming')
  return data.data
}

/** Raw axios response — caller handles blob / errors (see openApplicationResumeTab). */
export function fetchApplicationResume(applicationId, config = {}) {
  return apiClient.get(`/applications/${applicationId}/resume`, {
    responseType: 'blob',
    timeout: 120000,
    ...config,
  })
}
