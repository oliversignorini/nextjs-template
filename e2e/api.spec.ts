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
    const key = `test-idem-${Date.now()}`
    const headers = { Authorization: `Bearer ${token}`, 'Idempotency-Key': key }

    const first = await request.post(`${baseURL}/api/v1/notes`, {
      headers,
      data: { title: 'idem', body: '' },
    })
    expect(first.status(), await first.text()).toBe(201)
    const firstBody = await first.json()

    const second = await request.post(`${baseURL}/api/v1/notes`, {
      headers,
      data: { title: 'idem', body: '' },
    })
    expect(second.status()).toBe(201)
    const secondBody = await second.json()
    expect(secondBody.id).toBe(firstBody.id)

    const list = await request.get(`${baseURL}/api/v1/notes?limit=100`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    const { data } = await list.json()
    expect(data.filter((n: { id: string }) => n.id === firstBody.id)).toHaveLength(1)
  })

  test('reusing an Idempotency-Key with a different body returns 409', async ({
    request,
    baseURL,
  }) => {
    const token = await tokenFor(request, 'member2@demo.test')
    const key = `test-idem-conflict-${Date.now()}`
    const headers = { Authorization: `Bearer ${token}`, 'Idempotency-Key': key }

    const first = await request.post(`${baseURL}/api/v1/notes`, {
      headers,
      data: { title: 'a', body: '' },
    })
    expect(first.status()).toBe(201)

    const second = await request.post(`${baseURL}/api/v1/notes`, {
      headers,
      data: { title: 'b', body: '' },
    })
    expect(second.status()).toBe(409)
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

  test("GET /api/v1/me returns the caller's own role", async ({ request, baseURL }) => {
    const token = await tokenFor(request, 'admin@demo.test')
    const res = await request.get(`${baseURL}/api/v1/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(res.ok()).toBeTruthy()
    const profile = await res.json()
    expect(profile.email).toBe('admin@demo.test')
    expect(profile.role).toBe('admin')
  })
})

// B-1 regression: a self-registered user must never get admin rights just
// because they set user_metadata (the only thing a public signUp() with the
// anon key can set) to role:'admin'.
test('@baseline @security self-signup cannot grant admin via user_metadata', async ({
  request,
  baseURL,
}) => {
  const email = `escalation-${Date.now()}@demo.test`
  const signUp = await request.post(`${SUPABASE_URL}/auth/v1/signup`, {
    headers: { apikey: ANON_KEY, 'content-type': 'application/json' },
    data: { email, password: DEMO_PASSWORD, data: { role: 'admin' } },
  })
  expect(signUp.ok(), await signUp.text()).toBeTruthy()
  const { access_token } = await signUp.json()
  expect(
    access_token,
    'expected an immediate session (email confirmations are off locally)'
  ).toBeTruthy()

  const me = await request.get(`${baseURL}/api/v1/me`, {
    headers: { Authorization: `Bearer ${access_token}` },
  })
  expect(me.ok()).toBeTruthy()
  const profile = await me.json()
  expect(profile.role).toBe('member')

  // And the resulting session really can't see another user's notes the
  // way an admin could -- proves the escalation attempt has no effect
  // beyond the profiles.role column.
  const list = await request.get(`${baseURL}/api/v1/notes`, {
    headers: { Authorization: `Bearer ${access_token}` },
  })
  const { data } = await list.json()
  expect(data).toEqual([])
})
