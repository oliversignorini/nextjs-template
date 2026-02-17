/**
 * Dummy authentication helpers.
 *
 * Uses a simple cookie to track login state. When Supabase is configured,
 * the real auth flow in lib/auth-actions.ts takes over instead.
 */

export const DUMMY_AUTH_COOKIE = 'app-template-session'

/**
 * Checks whether the dummy auth cookie is present (client-side).
 * Returns true if the user has a session cookie.
 */
export function hasDummyAuth(): boolean {
  if (typeof document === 'undefined') return false
  return document.cookie.split(';').some((c) => c.trim().startsWith(`${DUMMY_AUTH_COOKIE}=`))
}

/**
 * Sets the dummy auth cookie (client-side).
 */
export function setDummyAuth(): void {
  document.cookie = `${DUMMY_AUTH_COOKIE}=true; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`
}

/**
 * Removes the dummy auth cookie (client-side).
 */
export function clearDummyAuth(): void {
  document.cookie = `${DUMMY_AUTH_COOKIE}=; path=/; max-age=0`
}
