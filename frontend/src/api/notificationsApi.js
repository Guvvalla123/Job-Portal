import { apiClient } from './apiClient.js'

/**
 * Notifications API — base path `/notifications` (apiClient already uses `/api/v1`).
 * Each method returns the API `data` payload from `response.data.data`.
 */

export async function getNotifications(page = 1, limit = 20) {
  const { data } = await apiClient.get('/notifications', {
    params: { page, limit },
  })
  return data.data
}

export async function getUnreadCount() {
  const { data } = await apiClient.get('/notifications/unread-count')
  return data.data
}

export async function markAsRead(notificationId) {
  const { data } = await apiClient.patch(`/notifications/${notificationId}/read`)
  return data.data
}

export async function markAllAsRead() {
  const { data } = await apiClient.patch('/notifications/read-all')
  return data.data
}

export async function deleteNotification(notificationId) {
  const { data } = await apiClient.delete(`/notifications/${notificationId}`)
  return data.data
}
