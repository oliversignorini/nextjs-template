import 'server-only'
import { createHash, randomUUID } from 'node:crypto'
import type { SupabaseClient } from '@supabase/supabase-js'
import { z } from 'zod'
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

// A claim (response still null) older than this is treated as abandoned --
// the process that made it almost certainly crashed or lost its connection
// before it could record a response -- and is reclaimable instead of
// rejecting every future retry forever.
//
// N-5: this must exceed how long a *live* request can possibly still be
// running, or a reclaim can race a request that is merely slow, not dead --
// Vercel's function default is 300s, so 600s leaves headroom without
// configuring maxDuration explicitly. Override via IDEMPOTENCY_STALE_AFTER_S
// if your deploy target's max duration differs; see AGENTS.md.
//
// m-14: an unvalidated env var here is dangerous in two specific ways --
// a non-numeric value produces NaN, and `new Date(NaN).toISOString()` in
// the reclaim path throws (every reclaim attempt 500s); an empty string
// coerces to 0, which makes every in-flight claim reclaimable immediately
// and reopens N-5 (a live request gets reclaimed out from under itself).
// Validate at module load and fail fast with a clear error instead of
// letting either failure mode surface only under concurrent load.
const staleAfterSSchema = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v === undefined || v === '' ? 600 : Number(v)))
  .pipe(
    z
      .number()
      .int()
      .min(
        360,
        'IDEMPOTENCY_STALE_AFTER_S must be an integer >= 360 (above the max request duration)'
      )
  )

/** Exported for unit testing the validation directly against arbitrary env
 * values; the module-level STALE_AFTER_MS below is what the service uses. */
export function loadStaleAfterS(): number {
  const result = staleAfterSSchema.safeParse(process.env.IDEMPOTENCY_STALE_AFTER_S)
  if (!result.success) {
    throw new Error(
      `Invalid IDEMPOTENCY_STALE_AFTER_S=${JSON.stringify(process.env.IDEMPOTENCY_STALE_AFTER_S)}: ${result.error.issues[0]?.message}`
    )
  }
  return result.data
}

const STALE_AFTER_MS = loadStaleAfterS() * 1000

/** m-11: the reclaim's staleness check and the row's own claimed-at
 * timestamp must come from the same clock, or a skew between this
 * instance's clock and the DB's (or another instance's) can make a
 * *fresh* claim look stale. `created_at` is only ever written by Postgres
 * itself (a trigger stamps it with `now()` whenever claim_token changes --
 * see supabase/migrations/20260926100100_notes.sql), so this reads that
 * same clock via a trivial RPC instead of the app's Date.now(). */
async function dbNow(supabase: Client): Promise<Date> {
  const { data, error } = await supabase.rpc('db_now')
  if (error) throw mapDbError(error)
  return new Date(data)
}

/** m-13: a compensating delete that silently no-ops (0 rows, RLS or a
 * concurrent delete) or errors would leave an orphan note behind while the
 * caller believes cleanup succeeded. Log it so an operator can find the
 * row, and let the caller decide how to fail instead of ever reporting
 * success (or a success-shaped 409) over an orphan that is still there. */
async function deleteOrphanNote(supabase: Client, noteId: string): Promise<boolean> {
  const { error, count } = await supabase.from('notes').delete({ count: 'exact' }).eq('id', noteId)
  if (error || !count) {
    console.error('failed to delete orphan note after a lost idempotency claim', { noteId, error })
    return false
  }
  return true
}

type ClaimResult = { done: true; note: Note } | { done: false; token: string }

/** claim_token identifies which in-flight attempt owns a pending row. The
 * reclaim below is a single `UPDATE ... WHERE response is null AND
 * created_at < threshold ... RETURNING claim_token`: Postgres re-checks that
 * WHERE clause against the row's latest committed state when it takes the
 * row lock, so of two concurrent reclaim attempts on the same stale row,
 * exactly one gets a row back (the first to commit changes created_at,
 * which makes the second's WHERE clause no longer match). N-4: the previous
 * delete-then-insert reclaim had no such guarantee -- two concurrent
 * retries of a stale claim could both "win" and both create a note. */
async function claimIdempotencyKey(
  supabase: Client,
  userId: string,
  key: string,
  requestHash: string
): Promise<ClaimResult> {
  const token = randomUUID()
  const { error: claimError } = await supabase
    .from('idempotency_keys')
    .insert({ user_id: userId, key, request_hash: requestHash, response: null, claim_token: token })

  if (!claimError) return { done: false, token } // claimed it fresh; caller proceeds to create the note
  if (claimError.code !== '23505') throw mapDbError(claimError)

  const { data: existing, error: lookupError } = await supabase
    .from('idempotency_keys')
    .select('request_hash, response')
    .eq('user_id', userId)
    .eq('key', key)
    .maybeSingle()

  if (lookupError) throw mapDbError(lookupError)
  if (!existing) {
    // Raced with a delete (another request's failed attempt just released
    // it) -- caller can retry the claim itself.
    throw ApiErrors.conflict('A request with this Idempotency-Key is already in progress.')
  }
  if (existing.request_hash !== requestHash) {
    throw ApiErrors.conflict('This Idempotency-Key was already used with a different request body.')
  }
  if (existing.response !== null) return { done: true, note: existing.response as Note }

  // In progress and (maybe) stale. Attempt the atomic reclaim directly --
  // its WHERE clause is the real gate, not a separate age check beforehand:
  // that would leave a window between checking and acting for another
  // request to reclaim first. created_at is deliberately not set here: the
  // touch_idempotency_claim trigger stamps it with the DB's own now() the
  // moment claim_token changes, so the write side uses the same clock as
  // the dbNow() read side below.
  const staleBefore = new Date((await dbNow(supabase)).getTime() - STALE_AFTER_MS).toISOString()
  const { data: reclaimed, error: reclaimError } = await supabase
    .from('idempotency_keys')
    .update({ request_hash: requestHash, response: null, claim_token: token })
    .eq('user_id', userId)
    .eq('key', key)
    .is('response', null)
    .lt('created_at', staleBefore)
    .select('claim_token')
    .maybeSingle()

  if (reclaimError) throw mapDbError(reclaimError)
  if (!reclaimed) {
    // Not stale yet, or another request reclaimed it a moment ago -- either
    // way, this caller does not hold the claim.
    throw ApiErrors.conflict('A request with this Idempotency-Key is already in progress.')
  }
  return { done: false, token }
}

export async function createNote(
  supabase: Client,
  userId: string,
  input: CreateNoteInput,
  opts: { idempotencyKey?: string } = {}
): Promise<Note> {
  const requestHash = opts.idempotencyKey ? hashRequest(input) : undefined
  let claimToken: string | undefined

  if (opts.idempotencyKey && requestHash) {
    const claim = await claimIdempotencyKey(supabase, userId, opts.idempotencyKey, requestHash)
    if (claim.done) return claim.note
    claimToken = claim.token
  }

  const { data, error } = await supabase
    .from('notes')
    .insert({ user_id: userId, title: input.title, body: input.body })
    .select('id, user_id, title, body, created_at')
    .single()

  if (error) {
    // N-2: without this, a transient failure here (network blip, a
    // constraint violation) leaves the claimed key permanently at
    // response=null -- every retry, forever, gets 409 "already in
    // progress" for a request that never actually completed. Release the
    // claim so a retry with the same key gets a clean second attempt.
    //
    // Scoped by claim_token (N-4): if someone else has since reclaimed
    // this key (our own claim went stale before we got here), this delete
    // must not touch their live row -- eq('claim_token', claimToken)
    // affects zero rows in that case, exactly as intended.
    if (opts.idempotencyKey && claimToken) {
      await supabase
        .from('idempotency_keys')
        .delete()
        .eq('user_id', userId)
        .eq('key', opts.idempotencyKey)
        .eq('claim_token', claimToken)
    }
    throw mapDbError(error)
  }

  if (opts.idempotencyKey && claimToken) {
    const { data: finalized, error: updateError } = await supabase
      .from('idempotency_keys')
      .update({ response: data })
      .eq('user_id', userId)
      .eq('key', opts.idempotencyKey)
      .eq('claim_token', claimToken)
      .select('claim_token')
      .maybeSingle()

    if (updateError) {
      // m-12: this request's note (`data`) was already created; if we only
      // release the claim and not the note, a retry sees an unclaimed key,
      // creates a *second* note, and both survive -- exactly the duplicate
      // idempotency is supposed to prevent. Delete it before releasing the
      // claim so the two writes can't leak independently of each other.
      const deleted = await deleteOrphanNote(supabase, data.id)
      await supabase
        .from('idempotency_keys')
        .delete()
        .eq('user_id', userId)
        .eq('key', opts.idempotencyKey)
        .eq('claim_token', claimToken)
      if (!deleted) {
        throw ApiErrors.internal(
          'Failed to clean up after a failed idempotency finalize; see server logs.'
        )
      }
      throw mapDbError(updateError)
    }

    // N-5: `.eq('claim_token', claimToken)` matching zero rows means this
    // request is no longer the owner -- it stalled past STALE_AFTER_MS
    // (still alive, just slow: a full GC pause, a starved connection pool,
    // a slow upstream) and a retry already reclaimed the key and created
    // its own note under a new token. Without this check, PostgREST's
    // silent 0-row update would let this stale-but-live request return its
    // own note anyway: two notes for one key, and every future replay of
    // this Idempotency-Key would return the *other* one. There is no
    // multi-table transaction available from the service layer without an
    // RPC (which the architecture rule reserves for infra, not business
    // logic, and this is the create path, not infra) -- compensate instead:
    // delete the orphan note this request just created and surface the
    // conflict so the caller's retry reads the actual winner.
    if (!finalized) {
      const deleted = await deleteOrphanNote(supabase, data.id)
      if (!deleted) {
        // m-13: an orphan we failed to remove is worse than a 409 --
        // returning IDEMPOTENCY_CONFLICT here would tell the caller "retry
        // and you'll get the real result", but the orphan note (and the
        // fact that cleanup itself failed) needs an operator, not a retry.
        throw ApiErrors.internal(
          'Failed to compensate for a lost idempotency claim; see server logs.'
        )
      }
      throw ApiErrors.idempotencyLost()
    }
  }

  return data
}

export async function deleteNote(supabase: Client, id: string): Promise<void> {
  const { error, count } = await supabase.from('notes').delete({ count: 'exact' }).eq('id', id)
  if (error) throw mapDbError(error)
  if (!count) throw ApiErrors.notFound('Note')
}
