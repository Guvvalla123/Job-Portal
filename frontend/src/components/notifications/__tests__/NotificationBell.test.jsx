import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { renderWithProviders } from '../../../__tests__/setup/testUtils.jsx'
import { NotificationBell } from '../NotificationBell.jsx'

describe('NotificationBell', () => {
  it('should render bell icon', () => {
    renderWithProviders(<NotificationBell />, { isAuthenticated: true, route: '/jobs' })
    expect(screen.getByRole('button', { name: /notifications/i })).toBeInTheDocument()
  })

  it('should show badge when unread > 0', async () => {
    renderWithProviders(<NotificationBell />, { isAuthenticated: true, route: '/jobs' })
    const badge = await screen.findByText('3')
    expect(badge).toBeInTheDocument()
  })

  it('should toggle dropdown on click', async () => {
    renderWithProviders(<NotificationBell />, { isAuthenticated: true, route: '/jobs' })
    const button = screen.getByRole('button', { name: /notifications/i })
    fireEvent.click(button)
    expect(await screen.findByText('Notifications')).toBeInTheDocument()
  })
})
