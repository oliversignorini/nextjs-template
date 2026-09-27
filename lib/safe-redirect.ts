/** Only a same-origin relative path is a safe redirect target for
 * caller-controlled `next`/`redirect` query or form input: anything else
 * (an absolute URL, or a protocol-relative `//evil.com`) is an open-redirect
 * vector. Shared by the login action and the auth callback route. */
export function safeNext(next: string | null | undefined, fallback: string): string {
  if (next && next.startsWith('/') && !next.startsWith('//')) return next
  return fallback
}
