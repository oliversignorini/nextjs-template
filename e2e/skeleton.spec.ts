import { expect, test } from '@playwright/test'

const DEMO_PASSWORD = 'demo-password-123'

async function login(page: import('@playwright/test').Page, email: string) {
  await page.goto('/login')
  await page.getByLabel('Email', { exact: true }).fill(email)
  await page.getByLabel('Password').fill(DEMO_PASSWORD)
  await page.getByRole('button', { name: 'Sign in' }).click()
}

// @baseline @skeleton -- proves every layer: auth -> protected layout ->
// RLS-backed service -> UI, then sign-out.
test('@baseline member can sign in, create a note, and sign out', async ({ page }) => {
  await login(page, 'member@demo.test')
  await expect(page).toHaveURL(/\/notes/)
  await expect(page.getByRole('heading', { name: 'Notes' })).toBeVisible()

  const title = `e2e note ${Date.now()}`
  await page.getByLabel('Title').fill(title)
  await page.getByRole('button', { name: 'Add note' }).click()
  await expect(page.getByText(title)).toBeVisible()

  await page.getByRole('button', { name: 'Sign out' }).click()
  await expect(page).toHaveURL(/\/login/)
})

test("@rls-negative a member cannot see another member's note in the UI", async ({ page }) => {
  await login(page, 'member2@demo.test')
  await expect(page).toHaveURL(/\/notes/)
  // Assert the list actually rendered before asserting absence -- otherwise
  // "not visible" passes vacuously while the page is still loading.
  await expect(page.getByTestId('notes-list')).toBeVisible()
  await expect(page.getByText('Welcome')).not.toBeVisible()
})
