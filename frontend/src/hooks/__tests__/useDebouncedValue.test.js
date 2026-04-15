import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useDebouncedValue } from '../useDebouncedValue.js'

describe('useDebouncedValue', () => {
  it('should return initial value immediately', () => {
    const { result } = renderHook(() => useDebouncedValue('hello', 300))
    expect(result.current).toBe('hello')
  })

  it('should debounce value changes', () => {
    vi.useFakeTimers()
    const { result, rerender } = renderHook(({ value }) => useDebouncedValue(value, 300), {
      initialProps: { value: 'initial' },
    })
    rerender({ value: 'updated' })
    expect(result.current).toBe('initial')
    act(() => {
      vi.advanceTimersByTime(300)
    })
    expect(result.current).toBe('updated')
    vi.useRealTimers()
  })

  it('should use latest value after delay', () => {
    vi.useFakeTimers()
    const { result, rerender } = renderHook(({ value }) => useDebouncedValue(value, 300), {
      initialProps: { value: 'a' },
    })
    rerender({ value: 'b' })
    rerender({ value: 'c' })
    act(() => {
      vi.advanceTimersByTime(300)
    })
    expect(result.current).toBe('c')
    vi.useRealTimers()
  })
})
