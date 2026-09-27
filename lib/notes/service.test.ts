import { describe, expect, it, vi } from 'vitest'
import { encodeCursor } from '@/lib/api/pagination'
import { createNote, listNotes } from '@/lib/notes/service'

const VALID_ID = '11111111-1111-4111-8111-111111111111'

/** Minimal chainable fake matching the subset of the supabase-js query
 * builder the service uses. Keeps this suite DB-free (test:unit contract). */
function fakeSupabase(overrides: { selectResult?: unknown; insertResult?: unknown } = {}) {
  const notesBuilder = {
    select: vi.fn(() => notesBuilder),
    order: vi.fn(() => notesBuilder),
    limit: vi.fn(() => notesBuilder),
    or: vi.fn(() => notesBuilder),
    eq: vi.fn(() => notesBuilder),
    insert: vi.fn(() => ({
      select: () => ({
        single: () => Promise.resolve({ data: overrides.insertResult, error: null }),
      }),
    })),
    then: (resolve: (v: { data: unknown; error: null }) => void) =>
      resolve({ data: overrides.selectResult ?? [], error: null }),
  }
  const idempotencyBuilder = {
    select: vi.fn(() => idempotencyBuilder),
    eq: vi.fn(() => idempotencyBuilder),
    update: vi.fn(() => idempotencyBuilder),
    maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: null })),
    insert: vi.fn(() => Promise.resolve({ data: null, error: null })),
  }
  return {
    from: vi.fn((table: string) => (table === 'notes' ? notesBuilder : idempotencyBuilder)),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any
}

describe('listNotes', () => {
  it('returns a page with no next_cursor when fewer rows than the limit come back', async () => {
    const rows = [
      { id: '1', user_id: 'u1', title: 'a', body: '', created_at: '2026-01-01T00:00:00.000Z' },
    ]
    const supabase = fakeSupabase({ selectResult: rows })

    const page = await listNotes(supabase, { limit: 20 })

    expect(page.data).toEqual(rows)
    expect(page.next_cursor).toBeNull()
  })

  it('sets next_cursor and trims the extra row when there are more pages', async () => {
    const rows = Array.from({ length: 3 }, (_, i) => ({
      id: String(i),
      user_id: 'u1',
      title: `note ${i}`,
      body: '',
      created_at: `2026-01-0${i + 1}T00:00:00.000Z`,
    }))
    const supabase = fakeSupabase({ selectResult: rows })

    const page = await listNotes(supabase, { limit: 2 })

    expect(page.data).toHaveLength(2)
    expect(page.next_cursor).toBe(encodeCursor(rows[1]!))
  })

  // m-7 / M-3 regression: the keyset filter must use both created_at *and*
  // id, not created_at alone (which silently skips tied rows), and the
  // decoded values must reach the filter unchanged (N-1's validation is
  // what makes that safe -- see lib/api/pagination.test.ts).
  it('builds a two-part keyset filter from the decoded cursor', async () => {
    const supabase = fakeSupabase({ selectResult: [] })
    const cursor = encodeCursor({ created_at: '2026-01-01T00:00:00.000Z', id: VALID_ID })

    await listNotes(supabase, { limit: 20, cursor })

    const notesBuilder = supabase.from('notes')
    expect(notesBuilder.or).toHaveBeenCalledWith(
      `created_at.lt.2026-01-01T00:00:00.000Z,and(created_at.eq.2026-01-01T00:00:00.000Z,id.lt.${VALID_ID})`
    )
  })
})

describe('createNote', () => {
  it('inserts a note scoped to the acting user', async () => {
    const created = {
      id: 'n1',
      user_id: 'u1',
      title: 'hi',
      body: '',
      created_at: '2026-01-01T00:00:00.000Z',
    }
    const supabase = fakeSupabase({ insertResult: created })

    const note = await createNote(supabase, 'u1', { title: 'hi', body: '' })

    expect(note).toEqual(created)
  })

  it('returns the original note when a claimed Idempotency-Key already has a response', async () => {
    const existing = {
      id: 'n1',
      user_id: 'u1',
      title: 'hi',
      body: '',
      created_at: '2026-01-01T00:00:00.000Z',
    }
    const input = { title: 'hi', body: '' }
    // request_hash must match exactly what the service computes for this
    // input -- compute it the same way.
    const { createHash } = await import('node:crypto')
    const hash = createHash('sha256').update(JSON.stringify(input)).digest('hex')

    const supabase = {
      from: vi.fn(() => ({
        select: () => ({
          eq: () => ({
            eq: () => ({
              maybeSingle: () =>
                Promise.resolve({ data: { request_hash: hash, response: existing }, error: null }),
            }),
          }),
        }),
        insert: () => Promise.resolve({ data: null, error: { code: '23505' } }),
      })),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any

    const note = await createNote(supabase, 'u1', input, { idempotencyKey: 'k1' })
    expect(note).toEqual(existing)
  })

  it('rejects a reused Idempotency-Key with a different body as a conflict', async () => {
    const supabase = fakeSupabase()
    supabase.from = vi.fn((table: string) => {
      if (table !== 'idempotency_keys') throw new Error('unexpected notes access')
      return {
        select: () => ({
          eq: () => ({
            eq: () => ({
              maybeSingle: () =>
                Promise.resolve({
                  data: { request_hash: 'different-hash', response: {} },
                  error: null,
                }),
            }),
          }),
        }),
        insert: () => Promise.resolve({ data: null, error: { code: '23505' } }),
      }
    })

    await expect(
      createNote(supabase, 'u1', { title: 'hi', body: '' }, { idempotencyKey: 'k1' })
    ).rejects.toMatchObject({ status: 409 })
  })

  // N-4 regression: losing the atomic reclaim race (another request's
  // UPDATE already changed the row, so ours matches zero rows) must be a
  // 409, and must never fall through to creating a note. This is the unit
  // half of the pgTAP CAS test in supabase/tests/000_rls.test.sql, which
  // proves the UPDATE...WHERE...RETURNING itself has at most one winner.
  it('rejects with a conflict when it loses the atomic stale-claim reclaim race, without creating a note', async () => {
    const input = { title: 'hi', body: '' }
    const { createHash } = await import('node:crypto')
    const hash = createHash('sha256').update(JSON.stringify(input)).digest('hex')
    let notesInsertCalled = false

    const supabase = {
      from: (table: string) => {
        if (table !== 'idempotency_keys') {
          notesInsertCalled = true
          throw new Error('must not attempt to create a note after losing the reclaim race')
        }
        return {
          insert: () => Promise.resolve({ data: null, error: { code: '23505' } }),
          select: () => ({
            eq: () => ({
              eq: () => ({
                maybeSingle: () =>
                  Promise.resolve({ data: { request_hash: hash, response: null }, error: null }),
              }),
            }),
          }),
          update: () => ({
            eq: () => ({
              eq: () => ({
                is: () => ({
                  lt: () => ({
                    select: () => ({
                      // The reclaim UPDATE matched no rows: someone else
                      // already reclaimed it (or it wasn't actually stale).
                      maybeSingle: () => Promise.resolve({ data: null, error: null }),
                    }),
                  }),
                }),
              }),
            }),
          }),
        }
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any

    await expect(createNote(supabase, 'u1', input, { idempotencyKey: 'k1' })).rejects.toMatchObject(
      {
        status: 409,
      }
    )
    expect(notesInsertCalled).toBe(false)
  })

  // N-2 regression: a failed create must release its claimed key so a
  // retry with the same Idempotency-Key can actually succeed, instead of
  // getting 409 "already in progress" forever.
  it('releases a claimed Idempotency-Key when the note insert fails, so a retry can succeed', async () => {
    const idempotencyRows = new Map<string, { request_hash: string; response: unknown }>()
    const input = { title: 'hi', body: '' }
    let notesInsertShouldFail = true

    // A chainable stub whose .eq() calls can nest arbitrarily deep (the
    // real code scopes writes by user_id + key + claim_token), resolving
    // only once a terminal method is awaited.
    function eqChain(resolve: () => unknown) {
      const node = {
        eq: () => node,
        maybeSingle: () => Promise.resolve(resolve()),
        then: (onResolve: (v: unknown) => void) => onResolve(resolve()),
      }
      return node
    }

    const supabase = {
      from: (table: string) => {
        if (table === 'idempotency_keys') {
          return {
            insert: (row: { key: string; request_hash: string; response: unknown }) => {
              if (idempotencyRows.has(row.key))
                return Promise.resolve({ data: null, error: { code: '23505' } })
              idempotencyRows.set(row.key, row)
              return Promise.resolve({ data: null, error: null })
            },
            update: (values: { response: unknown }) =>
              eqChain(() => {
                const row = idempotencyRows.get('k1')
                if (row) row.response = values.response
                return { error: null }
              }),
            delete: () =>
              eqChain(() => {
                idempotencyRows.delete('k1')
                return { error: null }
              }),
            select: () => eqChain(() => ({ data: idempotencyRows.get('k1') ?? null, error: null })),
          }
        }
        return {
          insert: () => ({
            select: () => ({
              single: () => {
                if (notesInsertShouldFail)
                  return Promise.resolve({ data: null, error: { code: '08000' } })
                return Promise.resolve({
                  data: {
                    id: 'n1',
                    user_id: 'u1',
                    ...input,
                    created_at: '2026-01-01T00:00:00.000Z',
                  },
                  error: null,
                })
              },
            }),
          }),
        }
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any

    await expect(createNote(supabase, 'u1', input, { idempotencyKey: 'k1' })).rejects.toMatchObject(
      {
        status: 500,
      }
    )
    expect(idempotencyRows.has('k1')).toBe(false) // claim released, not stuck

    notesInsertShouldFail = false
    const note = await createNote(supabase, 'u1', input, { idempotencyKey: 'k1' })
    expect(note.id).toBe('n1')
  })
})
