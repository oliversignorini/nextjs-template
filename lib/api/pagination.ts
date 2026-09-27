import { z } from 'zod'
import { ApiErrors } from '@/lib/api/errors'

export const paginationQuerySchema = z.object({
  // Opaque: callers must treat this as a token, not a parseable date. It is
  // base64url(created_at|id) -- see encodeCursor/decodeCursor. A plain ISO
  // string here (the previous shape) breaks on its own output: zod's
  // datetime() rejects the numeric-offset form PostgREST returns
  // (2026-09-27T01:08:52.123456+00:00), and an unencoded "+" in a query
  // string decodes to a space.
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

export type PaginationQuery = z.infer<typeof paginationQuerySchema>

export type Page<T> = {
  data: T[]
  next_cursor: string | null
}

export type CursorKey = { created_at: string; id: string }

// The decoded parts get interpolated straight into a PostgREST `or=` filter
// string in lib/notes/service.ts (there is no parameterised-filter API in
// supabase-js), so they must be validated to an exact, comma/paren-free
// shape *before* that happens -- an ISO datetime and a UUID can't contain
// the characters (",", "(", ")") a crafted cursor would need to inject
// extra filter clauses. Never relax this to a bare z.string().
const cursorPartsSchema = z.tuple([z.iso.datetime({ offset: true }), z.uuid()])

export function encodeCursor(row: CursorKey): string {
  return Buffer.from(`${row.created_at}|${row.id}`, 'utf8').toString('base64url')
}

export function decodeCursor(cursor: string): CursorKey {
  const decoded = Buffer.from(cursor, 'base64url').toString('utf8')
  // Exactly one "|": a crafted cursor can't smuggle extra segments that a
  // naive split('|') would silently discard.
  const match = /^([^|]+)\|([^|]+)$/.exec(decoded)
  if (!match) throw ApiErrors.validation('Invalid cursor.', 'cursor')

  const result = cursorPartsSchema.safeParse([match[1], match[2]])
  if (!result.success) throw ApiErrors.validation('Invalid cursor.', 'cursor')

  const [created_at, id] = result.data
  return { created_at, id }
}
