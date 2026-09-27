/** Only a same-origin relative path is a safe redirect target for
 * caller-controlled `next`/`redirect` query or form input; anything else
 * (an absolute URL, a protocol-relative `//evil.com`, or a backslash
 * variant like `/\evil.com` -- the WHATWG URL parser treats `\` the same
 * as `/` for special schemes, so it resolves to `//evil.com`, a
 * network-path reference that replaces the host) is an open-redirect
 * vector. Shared by the login action and the auth callback route: resolve
 * against a fixed fake base and require the origin to come back unchanged,
 * rather than pattern-matching the input string, which is what let
 * `/\evil.com` slip past an earlier `startsWith("/") && !startsWith("//")`
 * check. */
const SAFE_BASE = 'http://safe-redirect.internal'

export function safeNext(next: string | null | undefined, fallback: string): string {
  if (!next) return fallback
  // Literal control characters (tab, newline, CR, ...) are stripped or
  // reinterpreted by URL parsers in ways that vary by consumer -- reject
  // them outright rather than relying on this parser's specific behaviour.
  if (/[\u0000-\u001f]/.test(next)) return fallback

  let resolved: URL
  try {
    resolved = new URL(next, SAFE_BASE)
  } catch {
    return fallback
  }

  if (resolved.origin !== SAFE_BASE) return fallback
  return `${resolved.pathname}${resolved.search}${resolved.hash}`
}
