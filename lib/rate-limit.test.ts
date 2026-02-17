/**
 * Unit tests for the in-memory sliding window rate limiter.
 */

import { rateLimit, resetRateLimitStore } from './rate-limit'

beforeEach(() => {
  resetRateLimitStore()
})

describe('rateLimit()', () => {
  it('allows requests within the limit', () => {
    const result = rateLimit('user-1', 5, 60_000)
    expect(result.success).toBe(true)
    expect(result.remaining).toBe(4)
    expect(result.limit).toBe(5)
  })

  it('blocks requests exceeding the limit', () => {
    for (let i = 0; i < 3; i++) {
      rateLimit('user-2', 3, 60_000)
    }
    const result = rateLimit('user-2', 3, 60_000)
    expect(result.success).toBe(false)
    expect(result.remaining).toBe(0)
  })

  it('tracks identifiers independently', () => {
    for (let i = 0; i < 3; i++) {
      rateLimit('user-a', 3, 60_000)
    }
    const resultA = rateLimit('user-a', 3, 60_000)
    const resultB = rateLimit('user-b', 3, 60_000)

    expect(resultA.success).toBe(false)
    expect(resultB.success).toBe(true)
  })

  it('resets after the window expires', () => {
    vi.useFakeTimers()

    for (let i = 0; i < 3; i++) {
      rateLimit('user-3', 3, 1_000)
    }
    expect(rateLimit('user-3', 3, 1_000).success).toBe(false)

    // Advance past the window
    vi.advanceTimersByTime(1_100)

    expect(rateLimit('user-3', 3, 1_000).success).toBe(true)

    vi.useRealTimers()
  })

  it('returns correct reset timestamp', () => {
    const before = Date.now()
    const result = rateLimit('user-4', 10, 30_000)
    const after = Date.now()

    expect(result.reset).toBeGreaterThanOrEqual(before + 30_000)
    expect(result.reset).toBeLessThanOrEqual(after + 30_000)
  })

  it('uses default limit and window when not specified', () => {
    const result = rateLimit('user-5')
    expect(result.success).toBe(true)
    expect(result.limit).toBe(60)
    expect(result.remaining).toBe(59)
  })
})
