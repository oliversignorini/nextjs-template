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

  // N-3 regression (round 2 -> reopened in round 3): new URL() collapses
  // "."/".." path segments *after* the origin check has already passed, so
  // "/.//evil.com" has origin unchanged but a pathname of "//evil.com" --
  // still protocol-relative once handed to redirect(). The fix validates
  // the resolved *output*, not just the resolved origin.
  it('rejects dot-segment tricks that resolve to a protocol-relative path', () => {
    expect(safeNext('/.//evil.com', '/login')).toBe('/login')
    expect(safeNext('/..//evil.com', '/login')).toBe('/login')
    expect(safeNext('/%2e//evil.com', '/login')).toBe('/login')
    expect(safeNext('/a/..//evil.com', '/login')).toBe('/login')
  })

  // %2f/%5c (any case) are kept as literal, undecoded path characters by
  // the URL parser -- they are not treated as path separators, so these
  // resolve harmlessly to a same-origin path with the percent-escape
  // preserved verbatim. Asserting the exact safe output (rather than just
  // "not the fallback") pins this down against a future parser/runtime
  // change silently starting to decode them.
  it('keeps percent-encoded slash/backslash variants as a literal, safe same-origin path', () => {
    expect(safeNext('/%2f%2fevil.com', '/login')).toBe('/%2f%2fevil.com')
    expect(safeNext('/%5c%5cevil.com', '/login')).toBe('/%5c%5cevil.com')
    expect(safeNext('/%2F%2Fevil.com', '/login')).toBe('/%2F%2Fevil.com')
    expect(safeNext('/%5C%5Cevil.com', '/login')).toBe('/%5C%5Cevil.com')
  })

  it('rejects tabs/newlines hidden inside an otherwise-plausible path', () => {
    expect(safeNext('/\t/evil.com', '/login')).toBe('/login')
    expect(safeNext('/\n/evil.com', '/login')).toBe('/login')
    expect(safeNext('/\r/evil.com', '/login')).toBe('/login')
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
