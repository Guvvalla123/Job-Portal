import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useCountUp } from '../useCountUp.js'

describe('useCountUp', () => {
  beforeEach(() => {
    vi.spyOn(window, 'matchMedia').mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should start at 0 and reach target', () => {
    let now = 0
    vi.spyOn(performance, 'now').mockImplementation(() => now)
    const queue = []
    vi.stubGlobal('requestAnimationFrame', (cb) => {
      queue.push(cb)
      return queue.length
    })
    vi.stubGlobal('cancelAnimationFrame', vi.fn())

    const { result } = renderHook(() => useCountUp(100, { duration: 1000 }))

    expect(result.current).toBe(0)

    act(() => {
      let safety = 0
      while (queue.length > 0 && safety++ < 200) {
        const cb = queue.shift()
        now = Math.min(1000, now + 100)
        cb(now)
      }
    })

    expect(result.current).toBe(100)
  })

  it('should show target immediately when prefers-reduced-motion is true', () => {
    window.matchMedia = vi.fn().mockReturnValue({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })
    const { result } = renderHook(() => useCountUp(50, { duration: 1000 }))
    expect(result.current).toBe(50)
  })

  it('should handle 0 as target', () => {
    const { result } = renderHook(() => useCountUp(0))
    expect(result.current).toBe(0)
  })
})
