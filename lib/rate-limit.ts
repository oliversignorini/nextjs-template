/**
 * In-memory sliding window rate limiter.
 *
 * Tracks request timestamps per identifier in a Map. Entries outside the
 * current window are pruned on each call. Suitable for single-instance
 * deployments — swap for a Redis-backed solution in distributed setups.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RateLimitResult {
  /** Whether the request is allowed. */
  success: boolean
  /** Maximum requests allowed in the window. */
  limit: number
  /** Remaining requests in the current window. */
  remaining: number
  /** Unix timestamp (ms) when the window resets. */
  reset: number
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

const store = new Map<string, number[]>()

// ---------------------------------------------------------------------------
// Rate Limiter
// ---------------------------------------------------------------------------

/**
 * Check whether a request from `identifier` is within the rate limit.
 *
 * @param identifier - Unique key (e.g. IP address or user ID).
 * @param limit      - Maximum requests allowed per window. Defaults to `60`.
 * @param windowMs   - Window size in milliseconds. Defaults to `60_000` (1 min).
 */
export function rateLimit(
  identifier: string,
  limit = 60,
  windowMs = 60_000,
): RateLimitResult {
  const now = Date.now()
  const windowStart = now - windowMs

  // Get existing timestamps and prune those outside the window
  const timestamps = (store.get(identifier) ?? []).filter(
    (ts) => ts > windowStart,
  )

  const remaining = Math.max(0, limit - timestamps.length)
  const reset = now + windowMs

  if (timestamps.length >= limit) {
    store.set(identifier, timestamps)
    return { success: false, limit, remaining: 0, reset }
  }

  timestamps.push(now)
  store.set(identifier, timestamps)

  return { success: true, limit, remaining: remaining - 1, reset }
}

/**
 * Clear all stored rate-limit data. Useful for testing.
 */
export function resetRateLimitStore(): void {
  store.clear()
}
