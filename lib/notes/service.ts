import 'server-only'
import { createHash } from 'node:crypto'
import type { SupabaseClient } from '@supabase/supabase-js'
import { ApiErrors, mapDbError } from '@/lib/api/errors'
import { decodeCursor, encodeCursor, type Page, type PaginationQuery } from '@/lib/api/pagination'
import type { CreateNoteInput, Note } from '@/lib/notes/schemas'
import type { Database } from '@/types/database'

/**
 * Every capability the app has lives here. Route handlers (app/api/v1/notes)
 * and the UI's Server Components / Server Actions both call these functions
 * directly with a client scoped to the caller -- never a different path, so
 * the HTTP API always has parity with the UI. Callers are responsible for
 * authentication; `supabase` here is already scoped to the acting user and
 * RLS is the backstop, not the only check.
 */

type Client = SupabaseClient<Database>

export async function listNotes(supabase: Client, query: PaginationQuery): Promise<Page<Note>> {
  let builder = supabase
    .from('notes')
    .select('id, user_id, title, body, created_at')
    // Keyset pagination needs a total order: created_at alone ties on rows
    // inserted in the same transaction/batch, and `lt(created_at)` silently
    // skips tied rows. id (uuid) breaks every tie.
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(query.limit + 1)

  if (query.cursor) {
    const { created_at, id } = decodeCursor(query.cursor)
    builder = builder.or(`created_at.lt.${created_at},and(created_at.eq.${created_at},id.lt.${id})`)
  }

  const { data, error } = await builder
  if (error) throw mapDbError(error)

  const rows = data ?? []
  const hasMore = rows.length > query.limit
  const page = hasMore ? rows.slice(0, query.limit) : rows
  const last = page[page.length - 1]

  return {
    data: page,
    next_cursor: hasMore && last ? encodeCursor(last) : null,
  }
}

export async function getNote(supabase: Client, id: string): Promise<Note> {
  const { data, error } = await supabase
    .from('notes')
    .select('id, user_id, title, body, created_at')
    .eq('id', id)
    .maybeSingle()

  if (error) throw mapDbError(error)
  if (!data) throw ApiErrors.notFound('Note')
  return data
}

function hashRequest(input: CreateNoteInput): string {
  return createHash('sha256').update(JSON.stringify(input)).digest('hex')
}

export async function createNote(
  supabase: Client,
  userId: string,
  input: CreateNoteInput,
  opts: { idempotencyKey?: string } = {}
): Promise<Note> {
  const requestHash = opts.idempotencyKey ? hashRequest(input) : undefined

  if (opts.idempotencyKey && requestHash) {
    // Claim the key first (unique on (user_id, key), response starts null).
    // Whichever concurrent request wins this insert is the one that creates
    // the note; the other gets 23505 and looks up what the winner did.
    const { error: claimError } = await supabase.from('idempotency_keys').insert({
      user_id: userId,
      key: opts.idempotencyKey,
      request_hash: requestHash,
      response: null,
    })

    if (claimError) {
      if (claimError.code !== '23505') throw mapDbError(claimError)

      const { data: existing } = await supabase
        .from('idempotency_keys')
        .select('request_hash, response')
        .eq('user_id', userId)
        .eq('key', opts.idempotencyKey)
        .maybeSingle()

      if (existing?.request_hash !== requestHash) {
        throw ApiErrors.conflict(
          'This Idempotency-Key was already used with a different request body.'
        )
      }
      if (existing.response === null) {
        throw ApiErrors.conflict('A request with this Idempotency-Key is already in progress.')
      }
      return existing.response as Note
    }
  }

  const { data, error } = await supabase
    .from('notes')
    .insert({ user_id: userId, title: input.title, body: input.body })
    .select('id, user_id, title, body, created_at')
    .single()

  if (error) throw mapDbError(error)

  if (opts.idempotencyKey) {
    await supabase
      .from('idempotency_keys')
      .update({ response: data })
      .eq('user_id', userId)
      .eq('key', opts.idempotencyKey)
  }

  return data
}

export async function deleteNote(supabase: Client, id: string): Promise<void> {
  const { error, count } = await supabase.from('notes').delete({ count: 'exact' }).eq('id', id)
  if (error) throw mapDbError(error)
  if (!count) throw ApiErrors.notFound('Note')
}
