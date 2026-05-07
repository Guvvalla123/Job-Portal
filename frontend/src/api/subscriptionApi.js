import { apiClient } from './apiClient.js'

/**
 * Subscription / Razorpay — base path `/subscriptions` (apiClient already uses `/api/v1`).
 */

export async function createOrder() {
  const { data } = await apiClient.post('/subscriptions/create-order')
  return data.data
}

export async function verifyPayment(paymentData) {
  const { data } = await apiClient.post('/subscriptions/verify-payment', paymentData)
  return data.data
}

export async function getSubscriptionStatus() {
  const { data } = await apiClient.get('/subscriptions/status')
  return data.data
}

export async function cancelSubscription(reason) {
  const { data } = await apiClient.delete('/subscriptions/cancel', {
    data: reason != null && reason !== '' ? { reason } : {},
  })
  return data.data
}
