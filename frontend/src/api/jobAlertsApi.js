import { apiClient } from './apiClient.js'

export async function listJobAlerts() {
  const { data } = await apiClient.get('/job-alerts')
  return data.data.alerts ?? []
}

export async function createJobAlert(payload) {
  const { data } = await apiClient.post('/job-alerts', payload)
  return data.data
}

export async function deleteJobAlert(id) {
  const { data } = await apiClient.delete(`/job-alerts/${id}`)
  return data.data
}
