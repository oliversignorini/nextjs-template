/** Only a same-origin relative path is a safe redirect target for
 * caller-controlled `next`/`redirect` query or form input; anything else
 * (an absolute URL, a protocol-relative `//evil.com`, a backslash variant
 * like `/\evil.com`, or a dot-segment trick like `/.//evil.com`) is an
 * open-redirect vector. Shared by the login action and the auth callback
 * route: resolve against a fixed fake base and require the origin to come
 * back unchanged, rather than pattern-matching the input string.
 *
 * That origin check alone is not enough (round-2 N-3): `new URL()` collapses
 * `.`/`..` path segments *after* the origin check has already passed, so
 * `/.//evil.com` resolves with origin unchanged but a `pathname` of
 * `//evil.com` -- still protocol-relative once handed to `redirect()`, which
 * a browser reads as a network-path reference to a different host. The fix
 * is to also validate the *resolved output*, not just the resolved origin:
 * reject unless it starts with exactly one `/` (never `//` or `/\`). */
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

  const out = `${resolved.pathname}${resolved.search}${resolved.hash}`
  // Must be exactly one leading "/": "//..." and "/\\..." are both
  // network-path references a browser/WHATWG consumer treats as
  // host-replacing, even though the origin check above saw no problem.
  if (!out.startsWith('/') || out.startsWith('//') || out.startsWith('/\\')) return fallback
  return out
}
