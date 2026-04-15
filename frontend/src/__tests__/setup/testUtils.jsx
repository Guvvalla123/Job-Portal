import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import { BrowserRouter, MemoryRouter } from 'react-router-dom'
import { vi } from 'vitest'
import { AuthContext, AuthProvider } from '../../context/AuthContext.jsx'

export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: 0, gcTime: 0 },
      mutations: { retry: false },
    },
  })
}

export function renderWithAppProviders(ui, { route = '/login', queryClient } = {}) {
  const qc = queryClient ?? createTestQueryClient()
  return {
    ...render(
      <QueryClientProvider client={qc}>
        <MemoryRouter initialEntries={[route]}>
          <AuthProvider>{ui}</AuthProvider>
        </MemoryRouter>
      </QueryClientProvider>,
    ),
    queryClient: qc,
  }
}

/**
 * Query + Router + optional AuthContext stub (no full AuthProvider bootstrap).
 * Use for components that call useAuth() and need MSW-backed fetches.
 */
export function renderWithProviders(
  ui,
  { route = '/', user = null, isAuthenticated = false, queryClient } = {},
) {
  const qc = queryClient ?? createTestQueryClient()
  window.history.pushState({}, '', route)

  const authValue = {
    user: user ?? (isAuthenticated ? { id: 'user-123', role: 'candidate', fullName: 'Test User' } : null),
    loading: false,
    isLoading: false,
    isAuthenticated,
    login: vi.fn(),
    logout: vi.fn(),
    updateUser: vi.fn(),
  }

  return {
    ...render(
      <QueryClientProvider client={qc}>
        <BrowserRouter>
          <AuthContext.Provider value={authValue}>{ui}</AuthContext.Provider>
        </BrowserRouter>
      </QueryClientProvider>,
    ),
    queryClient: qc,
  }
}
