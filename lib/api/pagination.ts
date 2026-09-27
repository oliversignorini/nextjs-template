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

export function encodeCursor(row: CursorKey): string {
  return Buffer.from(`${row.created_at}|${row.id}`, 'utf8').toString('base64url')
}

export function decodeCursor(cursor: string): CursorKey {
  const [created_at, id] = Buffer.from(cursor, 'base64url').toString('utf8').split('|')
  if (!created_at || !id) throw ApiErrors.validation('Invalid cursor.', 'cursor')
  return { created_at, id }
}
