import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import { ApiErrors } from '@/lib/api/errors'
import type { Page, PaginationQuery } from '@/lib/api/pagination'
import type { CreateNoteInput, Note } from '@/lib/notes/schemas'

/**
 * Every capability the app has lives here. Route handlers (app/api/v1/notes)
 * and the UI's Server Components / Server Actions both call these functions
 * directly with a client scoped to the caller -- never a different path, so
 * the HTTP API always has parity with the UI. Callers are responsible for
 * authentication; `supabase` here is already scoped to the acting user and
 * RLS is the backstop, not the only check.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Client = SupabaseClient<any, any, any>

export async function listNotes(supabase: Client, query: PaginationQuery): Promise<Page<Note>> {
  let builder = supabase
    .from('notes')
    .select('id, user_id, title, body, created_at')
    .order('created_at', { ascending: false })
    .limit(query.limit + 1)

  if (query.cursor) {
    builder = builder.lt('created_at', query.cursor)
  }

  const { data, error } = await builder
  if (error) throw ApiErrors.validation(error.message)

  const rows = (data ?? []) as Note[]
  const hasMore = rows.length > query.limit
  const page = hasMore ? rows.slice(0, query.limit) : rows

  return {
    data: page,
    next_cursor: hasMore ? page[page.length - 1]!.created_at : null,
  }
}

export async function getNote(supabase: Client, id: string): Promise<Note> {
  const { data, error } = await supabase
    .from('notes')
    .select('id, user_id, title, body, created_at')
    .eq('id', id)
    .maybeSingle()

  if (error) throw ApiErrors.validation(error.message)
  if (!data) throw ApiErrors.notFound('Note')
  return data as Note
}

export async function createNote(
  supabase: Client,
  userId: string,
  input: CreateNoteInput,
  opts: { idempotencyKey?: string } = {}
): Promise<Note> {
  if (opts.idempotencyKey) {
    const { data: existing } = await supabase
      .from('idempotency_keys')
      .select('response')
      .eq('key', opts.idempotencyKey)
      .maybeSingle()
    if (existing) return existing.response as Note
  }

  const { data, error } = await supabase
    .from('notes')
    .insert({ user_id: userId, title: input.title, body: input.body })
    .select('id, user_id, title, body, created_at')
    .single()

  if (error) throw ApiErrors.validation(error.message)

  if (opts.idempotencyKey) {
    await supabase
      .from('idempotency_keys')
      .insert({ key: opts.idempotencyKey, user_id: userId, response: data })
  }

  return data as Note
}

export async function deleteNote(supabase: Client, id: string): Promise<void> {
  const { error, count } = await supabase.from('notes').delete({ count: 'exact' }).eq('id', id)
  if (error) throw ApiErrors.validation(error.message)
  if (!count) throw ApiErrors.notFound('Note')
}
