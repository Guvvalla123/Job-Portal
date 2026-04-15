import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { Input } from '../Input.jsx'

describe('Input', () => {
  it('should render label', () => {
    render(<Input id="email" label="Email" />)
    expect(screen.getByText('Email')).toBeInTheDocument()
  })

  it('should render error message', () => {
    render(<Input id="email" label="Email" error="Email is required" />)
    expect(screen.getByText('Email is required')).toBeInTheDocument()
  })

  it('should render hint text', () => {
    render(<Input id="password" label="Password" hint="Min 8 characters" />)
    expect(screen.getByText('Min 8 characters')).toBeInTheDocument()
  })

  it('should call onChange on input', () => {
    const onChange = vi.fn()
    render(<Input id="name" label="Name" onChange={onChange} />)
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'John' } })
    expect(onChange).toHaveBeenCalled()
  })

  it('should be disabled when disabled prop', () => {
    render(<Input id="email" label="Email" disabled />)
    expect(screen.getByRole('textbox')).toBeDisabled()
  })
})
