import { apiClient } from './apiClient.js'

export async function listMyCompanies() {
  const { data } = await apiClient.get('/companies/me')
  return data.data.companies
}

export async function createCompany(payload) {
  const { data } = await apiClient.post('/companies', payload)
  return data.data
}

export async function updateCompany(id, payload) {
  const { data } = await apiClient.patch(`/companies/${id}`, payload)
  return data.data
}

export async function deleteCompany(id) {
  const { data } = await apiClient.delete(`/companies/${id}`)
  return data.data
}

export async function uploadCompanyLogo(id, file) {
  const formData = new FormData()
  formData.append('logo', file)
  const { data } = await apiClient.post(`/companies/${id}/logo`, formData)
  return data.data
}
