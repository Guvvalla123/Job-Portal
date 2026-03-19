/**
 * Unit test: SaveJobButton component
 * Run: npm test
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SaveJobButton } from '../SaveJobButton.jsx'

vi.mock('../../context/useAuth.jsx', () => ({
  useAuth: () => ({
    user: { role: 'candidate', savedJobs: [] },
    updateUser: vi.fn(),
  }),
}))

vi.mock('../../api/apiClient.js', () => ({
  apiClient: { post: vi.fn(() => Promise.resolve({ data: { data: { savedJobs: [] } } })) },
}))

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
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
    expect(screen.getByRole('button', { name: /save job/i })).toBeInTheDocument()
  })

})
