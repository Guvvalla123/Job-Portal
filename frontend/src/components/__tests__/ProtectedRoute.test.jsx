import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ProtectedRoute } from '../ProtectedRoute.jsx'

vi.mock('sonner', () => ({ toast: { error: vi.fn() } }))
vi.mock('../../context/useAuth.jsx', () => ({
  useAuth: () => ({
    user: null,
    isAuthenticated: false,
    loading: false,
  }),
}))

describe('ProtectedRoute', () => {
  it('redirects to login when not authenticated', () => {
    render(
      <MemoryRouter>
        <ProtectedRoute roles={['candidate']}>
          <div>Protected content</div>
        </ProtectedRoute>
      </MemoryRouter>
    )
    expect(screen.queryByText('Protected content')).not.toBeInTheDocument()
  })
})
