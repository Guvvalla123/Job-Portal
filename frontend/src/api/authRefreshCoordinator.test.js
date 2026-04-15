import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createAuthRefreshCoordinator } from './authRefreshCoordinator.js'

function createCoordinator(overrides = {}) {
  const postRefreshRequest = vi.fn()
  const applySession = vi.fn()
  const clearClientAuth = vi.fn()
  const markSessionEnded = vi.fn()
  const coord = createAuthRefreshCoordinator({
    postRefreshRequest,
    applySession,
    clearClientAuth,
    markSessionEnded,
    isSessionIntentionallyEnded: () => false,
    isDev: false,
    ...overrides,
  })
  return {
    ...coord,
    postRefreshRequest,
    applySession,
    clearClientAuth,
    markSessionEnded,
  }
}

describe('authRefreshCoordinator', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('Test 1 — parallel getRefreshPromise: only one POST /auth/refresh (postRefreshRequest called once)', async () => {
    const { getRefreshPromise, postRefreshRequest, resetForTests, applySession } = createCoordinator()

    postRefreshRequest.mockImplementation(() =>
      Promise.resolve({
        status: 200,
        data: { data: { accessToken: 'access-xyz', user: { id: '1', role: 'candidate' } } },
      }),
    )

    const n = 10
    const results = await Promise.all(Array.from({ length: n }, () => getRefreshPromise()))

    expect(postRefreshRequest).toHaveBeenCalledTimes(1)
    expect(results.every((r) => r.accessToken === 'access-xyz')).toBe(true)
    expect(applySession).toHaveBeenCalledTimes(1)
    resetForTests()
  })

  it('Test 2 — refresh failure clears auth, marks session ended, and rejects', async () => {
    const { getRefreshPromise, postRefreshRequest, clearClientAuth, markSessionEnded, resetForTests } =
      createCoordinator()

    const networkErr = new Error('network')
    networkErr.code = 'ERR_NETWORK'
    postRefreshRequest.mockRejectedValue(networkErr)

    await expect(getRefreshPromise()).rejects.toThrow()

    expect(clearClientAuth).toHaveBeenCalled()
    expect(markSessionEnded).toHaveBeenCalled()
    resetForTests()
  })

  it('Test 2b — 401 from refresh endpoint fails cleanly', async () => {
    const { getRefreshPromise, postRefreshRequest, markSessionEnded, resetForTests } = createCoordinator()

    postRefreshRequest.mockResolvedValue({ status: 401, data: {} })

    await expect(getRefreshPromise()).rejects.toBeDefined()
    expect(markSessionEnded).toHaveBeenCalled()
    resetForTests()
  })

  it('Test 3 — missing accessToken in 200 body is treated as failure', async () => {
    const { getRefreshPromise, postRefreshRequest, clearClientAuth, resetForTests } = createCoordinator()

    postRefreshRequest.mockResolvedValue({ status: 200, data: { data: {} } })

    await expect(getRefreshPromise()).rejects.toThrow()
    expect(clearClientAuth).toHaveBeenCalled()
    resetForTests()
  })

  it('Test 4 — cooldown after failure prevents immediate refresh stampede', async () => {
    const { getRefreshPromise, postRefreshRequest, resetForTests } = createCoordinator()

    postRefreshRequest.mockRejectedValue(new Error('fail'))

    await expect(getRefreshPromise()).rejects.toThrow()
    expect(postRefreshRequest).toHaveBeenCalledTimes(1)

    await expect(getRefreshPromise()).rejects.toThrow()
    expect(postRefreshRequest).toHaveBeenCalledTimes(1)

    resetForTests()
  })

  it('peekInFlightRefresh returns null when idle', () => {
    const { peekInFlightRefresh, resetForTests } = createCoordinator()
    expect(peekInFlightRefresh()).toBeNull()
    resetForTests()
  })

  it('peekInFlightRefresh returns same promise while refresh in flight', async () => {
    const { getRefreshPromise, peekInFlightRefresh, postRefreshRequest, resetForTests } = createCoordinator()

    let resolvePost
    postRefreshRequest.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolvePost = resolve
        }),
    )

    const p1 = getRefreshPromise()
    const peeked = peekInFlightRefresh()
    expect(peeked).not.toBeNull()
    expect(peeked).toBe(p1)

    resolvePost({
      status: 200,
      data: { data: { accessToken: 't', user: null } },
    })
    await p1
    expect(peekInFlightRefresh()).toBeNull()
    resetForTests()
  })

  it('does not start refresh when session intentionally ended', async () => {
    const { getRefreshPromise, postRefreshRequest, resetForTests } = createCoordinator({
      isSessionIntentionallyEnded: () => true,
    })

    await expect(getRefreshPromise()).rejects.toThrow()
    expect(postRefreshRequest).not.toHaveBeenCalled()
    resetForTests()
  })
})
