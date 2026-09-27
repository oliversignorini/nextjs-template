import { describe, expect, it } from 'vitest'
import { safeNext } from '@/lib/safe-redirect'

describe('safeNext', () => {
  it('passes through an ordinary relative path', () => {
    expect(safeNext('/notes', '/login')).toBe('/notes')
  })

  it('preserves query and hash on a same-origin path', () => {
    expect(safeNext('/notes?tab=all#top', '/login')).toBe('/notes?tab=all#top')
  })

  it('falls back on null/undefined/empty', () => {
    expect(safeNext(null, '/login')).toBe('/login')
    expect(safeNext(undefined, '/login')).toBe('/login')
    expect(safeNext('', '/login')).toBe('/login')
  })

  it('rejects an absolute URL to another host', () => {
    expect(safeNext('https://evil.com', '/login')).toBe('/login')
    expect(safeNext('http://evil.com/notes', '/login')).toBe('/login')
  })

  it('rejects a protocol-relative URL', () => {
    expect(safeNext('//evil.com', '/login')).toBe('/login')
    expect(safeNext('///evil.com', '/login')).toBe('/login')
  })

  // N-3 regression: WHATWG URL parsing treats `\` as `/` for special
  // schemes, so a naive `startsWith("/") && !startsWith("//")` check lets
  // this resolve to `//evil.com` (a network-path reference) once handed to
  // an actual browser/URL consumer.
  it('rejects backslash variants of a protocol-relative URL', () => {
    expect(safeNext('/\\evil.com', '/login')).toBe('/login')
    expect(safeNext('\\\\evil.com', '/login')).toBe('/login')
    expect(safeNext('/\\/evil.com', '/login')).toBe('/login')
  })

  it('rejects a value containing control characters', () => {
    expect(safeNext('/notes\t/evil.com', '/login')).toBe('/login')
    expect(safeNext('/notes\n/evil.com', '/login')).toBe('/login')
  })

  it('round-1 M-6 regression: a bare "@host" never reaches ${origin}${next} unsafely -- it resolves to a same-origin path', () => {
    // The original bug concatenated `${origin}${next}` directly with no
    // leading-slash requirement, so next="@evil.com" produced
    // "http://localhost:3400@evil.com" (evil.com as the host, with
    // everything before "@" read as discarded userinfo). Routing it
    // through safeNext first means it resolves relative to our own origin
    // instead, landing on the harmless path "/@evil.com".
    expect(safeNext('@evil.com', '/login')).toBe('/@evil.com')
  })
})
