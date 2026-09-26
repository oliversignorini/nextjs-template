import { describe, expect, it, vi } from 'vitest'
import { createNote, listNotes } from '@/lib/notes/service'

/** Minimal chainable fake matching the subset of the supabase-js query
 * builder the service uses. Keeps this suite DB-free (test:unit contract). */
function fakeSupabase(
  overrides: { selectResult?: unknown; insertResult?: unknown; idempotentResult?: unknown } = {}
) {
  const notesBuilder = {
    select: vi.fn(() => notesBuilder),
    order: vi.fn(() => notesBuilder),
    limit: vi.fn(() => notesBuilder),
    lt: vi.fn(() => notesBuilder),
    eq: vi.fn(() => notesBuilder),
    maybeSingle: vi.fn(() =>
      Promise.resolve({ data: overrides.idempotentResult ?? null, error: null })
    ),
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
    expect(page.next_cursor).toBe(rows[1]!.created_at)
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
})
