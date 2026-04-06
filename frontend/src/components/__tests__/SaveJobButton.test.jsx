/**
 * Unit test: SaveJobButton component
 * Run: npm test
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SaveJobButton } from '../SaveJobButton.jsx'

vi.mock('sonner', () => ({
  toast: Object.assign(vi.fn(), {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
    message: vi.fn(),
  }),
}))

vi.mock('../../context/useAuth.jsx', () => ({
  useAuth: () => ({
    user: { role: 'candidate', savedJobs: [] },
    updateUser: vi.fn(),
  }),
}))

vi.mock('../../api/userApi.js', () => ({
  toggleSavedJob: vi.fn(() => Promise.resolve({ saved: true, savedJobs: [] })),
}))

const queryClient = new QueryClient({
  defaultOptions: {
    // Avoid gc timers that keep Vitest/Node from exiting after tests.
    queries: { retry: false, gcTime: 0 },
    mutations: { retry: false, gcTime: 0 },
  },
})

afterEach(() => {
  queryClient.clear()
})

function Wrapper({ children }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

describe('SaveJobButton', () => {
  it('renders Save button when user is candidate and job not saved', () => {
    render(
      <Wrapper>
        <SaveJobButton jobId="job1" />
      </Wrapper>
    )
    expect(screen.getByRole('button', { name: /bookmark job/i })).toBeInTheDocument()
  })

})
