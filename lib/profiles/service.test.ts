import { describe, expect, it, vi } from 'vitest'
import { getOwnProfile } from '@/lib/profiles/service'

function fakeSupabase(profile: unknown) {
  const builder = {
    select: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    maybeSingle: vi.fn(() => Promise.resolve({ data: profile, error: null })),
  }
  return { from: vi.fn(() => builder) } as any // eslint-disable-line @typescript-eslint/no-explicit-any
}

describe('getOwnProfile', () => {
  it('returns the profile row for the given user id', async () => {
    const profile = { id: 'u1', email: 'a@test.local', role: 'member' }
    const supabase = fakeSupabase(profile)

    await expect(getOwnProfile(supabase, 'u1')).resolves.toEqual(profile)
  })

  it('throws a not_found ApiError when no profile row exists', async () => {
    const supabase = fakeSupabase(null)

    await expect(getOwnProfile(supabase, 'missing')).rejects.toMatchObject({
      status: 404,
      code: 'not_found',
    })
  })
})
