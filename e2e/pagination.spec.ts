import { expect, test } from '@playwright/test'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// B-3 regression: the API's own next_cursor must be accepted back and
// return the next page, not 422. Uses a freshly signed-up user (not a
// shared demo account) so the note count here is exact and this test is
// safe to run alongside others.
test("@baseline @pagination paginates to the end using the API's own next_cursor", async ({
  request,
  baseURL,
}) => {
  const email = `pagination-${Date.now()}@demo.test`
  const signUp = await request.post(`${SUPABASE_URL}/auth/v1/signup`, {
    headers: { apikey: ANON_KEY, 'content-type': 'application/json' },
    data: { email, password: 'demo-password-123' },
  })
  const { access_token } = await signUp.json()
  const auth = { Authorization: `Bearer ${access_token}` }

  const titles = ['page-note-1', 'page-note-2', 'page-note-3']
  const createdIds: string[] = []
  for (const title of titles) {
    const res = await request.post(`${baseURL}/api/v1/notes`, {
      headers: auth,
      data: { title, body: '' },
    })
    expect(res.status()).toBe(201)
    createdIds.push((await res.json()).id)
  }

  const seenIds: string[] = []
  let cursor: string | undefined
  for (let page = 0; page < titles.length + 1; page++) {
    const url = new URL(`${baseURL}/api/v1/notes`)
    url.searchParams.set('limit', '1')
    if (cursor) url.searchParams.set('cursor', cursor)

    const res = await request.get(url.toString(), { headers: auth })
    expect(res.status(), await res.text()).toBe(200)
    const body = await res.json()
    expect(body.data.length).toBeLessThanOrEqual(1)
    seenIds.push(...body.data.map((n: { id: string }) => n.id))

    if (!body.next_cursor) break
    cursor = body.next_cursor
  }

  expect(new Set(seenIds).size).toBe(seenIds.length) // no duplicates across pages
  expect(seenIds.sort()).toEqual(createdIds.sort())
})
