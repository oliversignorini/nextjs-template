import { expect, test } from '@playwright/test'

const MAILPIT_URL = process.env.E2E_MAILPIT_URL!

type MailpitMessage = { ID: string; To: { Address: string }[] }

async function latestMessageTo(request: import('@playwright/test').APIRequestContext, to: string) {
  const deadline = Date.now() + 15_000
  while (Date.now() < deadline) {
    const res = await request.get(`${MAILPIT_URL}/api/v1/messages?limit=50`)
    const { messages } = (await res.json()) as { messages: MailpitMessage[] }
    const match = messages.find((m) => m.To?.some((t) => t.Address === to))
    if (match) {
      const full = await request.get(`${MAILPIT_URL}/api/v1/message/${match.ID}`)
      return (await full.json()) as { Text: string; HTML: string }
    }
    await new Promise((r) => setTimeout(r, 500))
  }
  throw new Error(`no Mailpit message to ${to} within 15s`)
}

function firstLink(body: string): string {
  const match = body.match(/https?:\/\/[^\s"<)]+/)
  if (!match) throw new Error('no link found in email body')
  // An HTML body's href is &amp;-encoded between query params; a Text body
  // never is. Decode either way so this doesn't silently request a URL
  // with a literal "&amp;" in it if the Text part is ever empty/missing.
  return match[0].replace(/&amp;/g, '&')
}

// @baseline @magic-link -- proves the local magic-link flow actually
// completes: send -> read the real link out of Mailpit -> follow it ->
// land signed in on the protected page. Regression test for M-1 (the
// redirect allowlist previously didn't match NEXT_PUBLIC_APP_URL's host).
test('@baseline magic link signs the user in via Mailpit', async ({ page, request }) => {
  const email = `magic-link-${Date.now()}@demo.test`

  await page.goto('/login')
  await page.getByLabel('Magic link email').fill(email)
  await page.getByRole('button', { name: 'Email me a magic link' }).click()
  await expect(page.getByText('Check Mailpit for your sign-in link.')).toBeVisible()

  const message = await latestMessageTo(request, email)
  const link = firstLink(message.Text || message.HTML)

  await page.goto(link)
  await expect(page).toHaveURL(/\/notes/)
  await expect(page.getByRole('heading', { name: 'Notes' })).toBeVisible()
})
