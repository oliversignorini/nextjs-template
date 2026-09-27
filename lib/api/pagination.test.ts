import { describe, expect, it } from 'vitest'
import { decodeCursor, encodeCursor } from '@/lib/api/pagination'

const VALID_TIMESTAMP = '2026-09-27T01:08:52.123456+00:00'
const VALID_ID = '11111111-1111-4111-8111-111111111111'

function b64(s: string) {
  return Buffer.from(s, 'utf8').toString('base64url')
}

describe('encodeCursor / decodeCursor', () => {
  it('round-trips a real row shape', () => {
    const row = { created_at: VALID_TIMESTAMP, id: VALID_ID }
    expect(decodeCursor(encodeCursor(row))).toEqual(row)
  })

  it('rejects a cursor with the wrong number of parts', () => {
    expect(() => decodeCursor(b64(VALID_TIMESTAMP))).toThrow()
    expect(() => decodeCursor(b64(`${VALID_TIMESTAMP}|${VALID_ID}|extra`))).toThrow()
  })

  it('rejects an id that is not a UUID', () => {
    expect(() => decodeCursor(b64(`${VALID_TIMESTAMP}|not-a-uuid`))).toThrow()
  })

  it('rejects a created_at that is not a valid offset ISO datetime', () => {
    expect(() => decodeCursor(b64(`not-a-date|${VALID_ID}`))).toThrow()
  })

  it('rejects garbage / non-base64 input instead of throwing an unhandled error', () => {
    expect(() => decodeCursor('!!!not base64!!!')).toThrow()
  })

  // N-1 regression: a cursor crafted to inject extra PostgREST filter
  // clauses once decodeCursor's parts are interpolated into an `or=`
  // string. Every one of these must be rejected by validation, never
  // reach the query builder.
  it('rejects cursors crafted to inject extra PostgREST filter clauses', () => {
    const hostile = [
      `x),id.not.is.null,and(id.eq.x|${VALID_ID}`,
      `${VALID_TIMESTAMP}|x),id.not.is.null,and(id.eq.x`,
      `${VALID_TIMESTAMP}|${VALID_ID}),or(1.eq.1`,
      `2026-01-01,id.eq.1|${VALID_ID}`,
    ]
    for (const payload of hostile) {
      expect(() => decodeCursor(b64(payload)), payload).toThrow()
    }
  })
})
