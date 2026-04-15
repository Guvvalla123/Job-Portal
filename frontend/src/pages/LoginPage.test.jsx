import { describe, it, expect, beforeEach, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { __resetRefreshStateForTests } from '../api/apiClient.js'
import { LoginPage } from './LoginPage.jsx'
import { renderWithAppProviders } from '../__tests__/setup/testUtils.jsx'

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}))

describe('LoginPage', () => {
  beforeEach(() => {
    localStorage.clear()
    __resetRefreshStateForTests()
    vi.clearAllMocks()
  })

  it('should render email input, password input, sign-in button, forgot password and create account links', async () => {
    renderWithAppProviders(<LoginPage />)

    await waitFor(() => {
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument()
    })

    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /forgot password/i })).toHaveAttribute('href', '/forgot-password')
    expect(screen.getByRole('link', { name: /create an account/i })).toHaveAttribute('href', '/register')
  })

  it('should show validation error when submitting empty form', async () => {
    const user = userEvent.setup()
    renderWithAppProviders(<LoginPage />)

    await waitFor(() => expect(screen.getByLabelText(/email address/i)).toBeInTheDocument())

    await user.click(screen.getByRole('button', { name: /sign in/i }))

    expect(await screen.findByText(/valid email/i)).toBeInTheDocument()
    expect(await screen.findByText(/password is required/i)).toBeInTheDocument()
  })
})
