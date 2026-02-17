import { test, expect } from '@playwright/test'

async function loginViaCookie(page: import('@playwright/test').Page) {
  await page.context().addCookies([
    {
      name: 'app-template-session',
      value: 'true',
      domain: 'localhost',
      path: '/',
    },
  ])
}

test.describe('Trips Page', () => {
  test('page heading loads', async ({ page }) => {
    await loginViaCookie(page)
    await page.goto('/dashboard/trips')
    await expect(page.getByRole('heading', { name: 'My Trips' })).toBeVisible()
    await expect(page.getByText('All your travel plans in one place.')).toBeVisible()
  })

  test('trip cards load after data fetch', async ({ page }) => {
    await loginViaCookie(page)
    await page.goto('/dashboard/trips')
    await expect(page.getByText('Tokyo & Kyoto Explorer')).toBeVisible({ timeout: 15000 })
    await expect(page.getByText('Greek Island Hopping')).toBeVisible()
    await expect(page.getByText('Patagonia Trek')).toBeVisible()
  })

  test('status and priority badges are visible', async ({ page }) => {
    await loginViaCookie(page)
    await page.goto('/dashboard/trips')
    await expect(page.getByText('Tokyo & Kyoto Explorer')).toBeVisible({ timeout: 15000 })
    await expect(page.getByText('Booked').first()).toBeVisible()
    await expect(page.getByText('Bucket List').first()).toBeVisible()
  })
})
