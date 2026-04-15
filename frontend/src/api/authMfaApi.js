import { apiClient } from './apiClient.js'

export async function postMfaSetup() {
  const { data } = await apiClient.post('/auth/mfa/setup')
  return data.data
}

export async function postMfaEnable(body) {
  const { data } = await apiClient.post('/auth/mfa/enable', body)
  return data.data
}

export async function postMfaDisable(body) {
  const { data } = await apiClient.post('/auth/mfa/disable', body)
  return data.data
}
