import { expect, test } from '@playwright/test'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const DEMO_PASSWORD = 'demo-password-123'

async function tokenFor(request: import('@playwright/test').APIRequestContext, email: string) {
  const res = await request.post(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    headers: { apikey: ANON_KEY, 'content-type': 'application/json' },
    data: { email, password: DEMO_PASSWORD },
  })
  expect(res.ok(), await res.text()).toBeTruthy()
  const { access_token } = await res.json()
  return access_token as string
}

// @baseline -- API-only CRUD with no browser, an agent could run this exact
// sequence against a deployed instance with a bearer token.
test.describe('@baseline notes API (no browser)', () => {
  test('member can create, list and delete their own note over HTTP', async ({
    request,
    baseURL,
  }) => {
    const token = await tokenFor(request, 'member2@demo.test')
    const auth = { Authorization: `Bearer ${token}` }

    const create = await request.post(`${baseURL}/api/v1/notes`, {
      headers: auth,
      data: { title: 'api-test note', body: 'created over HTTP' },
    })
    expect(create.status(), await create.text()).toBe(201)
    const note = await create.json()
    expect(note.title).toBe('api-test note')

    const list = await request.get(`${baseURL}/api/v1/notes`, { headers: auth })
    expect(list.ok()).toBeTruthy()
    const page = await list.json()
    expect(page.data.some((n: { id: string }) => n.id === note.id)).toBe(true)

    const del = await request.delete(`${baseURL}/api/v1/notes/${note.id}`, { headers: auth })
    expect(del.status()).toBe(204)
  })

  test('idempotency key returns the same note instead of creating a duplicate', async ({
    request,
    baseURL,
  }) => {
    const token = await tokenFor(request, 'member2@demo.test')
    const headers = { Authorization: `Bearer ${token}`, 'Idempotency-Key': 'test-fixed-key-1' }

    const first = await request.post(`${baseURL}/api/v1/notes`, {
      headers,
      data: { title: 'idem', body: '' },
    })
    const second = await request.post(`${baseURL}/api/v1/notes`, {
      headers,
      data: { title: 'idem', body: '' },
    })

    const firstBody = await first.json()
    const secondBody = await second.json()
    expect(secondBody.id).toBe(firstBody.id)
  })

  test("@rls-negative a different role cannot modify another user's note", async ({
    request,
    baseURL,
  }) => {
    const memberToken = await tokenFor(request, 'member@demo.test')
    const list = await request.get(`${baseURL}/api/v1/notes`, {
      headers: { Authorization: `Bearer ${memberToken}` },
    })
    const { data: memberNotes } = await list.json()
    expect(memberNotes.length).toBeGreaterThan(0)
    const targetId = memberNotes[0].id

    const adminToken = await tokenFor(request, 'admin@demo.test')
    const del = await request.delete(`${baseURL}/api/v1/notes/${targetId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    })
    // RLS has no delete policy for admin on someone else's row: the delete
    // affects zero rows, which the service reports as not_found (no policy
    // means "not visible for this write", so it never leaks a 403 vs 404
    // distinction an attacker could use to enumerate rows).
    expect(del.status()).toBe(404)

    const stillThere = await request.get(`${baseURL}/api/v1/notes/${targetId}`, {
      headers: { Authorization: `Bearer ${memberToken}` },
    })
    expect(stillThere.ok()).toBeTruthy()
  })
})
