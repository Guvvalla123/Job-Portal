import { apiClient } from './apiClient.js'

/** Current session user — same payload as AuthContext bootstrap. */
export async function getMe() {
  const { data } = await apiClient.get('/auth/me')
  return data.data.user
}

export async function updateProfile(payload) {
  const { data } = await apiClient.patch('/users/profile', payload)
  return data.data
}

export async function uploadProfileImage(file) {
  const formData = new FormData()
  formData.append('image', file)
  const { data } = await apiClient.post('/users/profile/image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data.data
}

export async function uploadResume(file) {
  const formData = new FormData()
  formData.append('resume', file)
  const { data } = await apiClient.post('/users/profile/resume', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data.data
}

export async function deleteResume() {
  const { data } = await apiClient.delete('/users/profile/resume')
  return data.data
}

export async function getSavedJobs() {
  const { data } = await apiClient.get('/users/saved-jobs')
  return data.data
}

/** Toggle bookmark; returns `{ saved, savedJobs }`. */
export async function toggleSavedJob(jobId) {
  const { data } = await apiClient.post(`/users/saved-jobs/${jobId}`)
  return data.data
}

export async function deleteAccount() {
  const { data } = await apiClient.delete('/users/account')
  return data.data
}

export async function changePassword(body) {
  const { data } = await apiClient.patch('/users/change-password', body)
  return data.data
}
