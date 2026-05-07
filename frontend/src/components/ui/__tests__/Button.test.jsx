import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { Button } from '../Button.jsx'

describe('Button', () => {
  it('should render children', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })

  it('should call onClick when clicked', () => {
    const onClick = vi.fn()
    render(
      <Button onClick={onClick}>
        Click
      </Button>,
    )
    fireEvent.click(screen.getByText('Click'))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('should not call onClick when disabled', () => {
    const onClick = vi.fn()
    render(
      <Button onClick={onClick} disabled>
        Click
      </Button>,
    )
    fireEvent.click(screen.getByText('Click'))
    expect(onClick).not.toHaveBeenCalled()
  })

  it('should show loading state', () => {
    render(<Button loading>Submit</Button>)
    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
  })

  it('should render as link when `to` is set', () => {
    render(
      <MemoryRouter>
        <Button to="/jobs">Browse</Button>
      </MemoryRouter>,
    )
    const link = screen.getByRole('link', { name: 'Browse' })
    expect(link).toHaveAttribute('href', '/jobs')
  })

  it('should call onClick for link button when provided', () => {
    const onClick = vi.fn()
    render(
      <MemoryRouter>
        <Button to="/x" onClick={onClick}>
          Go
        </Button>
      </MemoryRouter>,
    )
    fireEvent.click(screen.getByRole('link', { name: 'Go' }))
    expect(onClick).toHaveBeenCalledTimes(1)
  })
})
