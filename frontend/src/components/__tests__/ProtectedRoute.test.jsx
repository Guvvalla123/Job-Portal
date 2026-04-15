import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
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
      <MemoryRouter initialEntries={['/candidate/dashboard']}>
        <Routes>
          <Route path="/login" element={<div>Login page</div>} />
          <Route
            path="/candidate/dashboard"
            element={
              <ProtectedRoute roles={['candidate']}>
                <div>Protected content</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>,
    )
    expect(screen.queryByText('Protected content')).not.toBeInTheDocument()
    expect(screen.getByText('Login page')).toBeInTheDocument()
  })
})
