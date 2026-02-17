import { test, expect } from '@playwright/test'

// Helper to set dummy auth cookie before visiting dashboard
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

test.describe('Dashboard', () => {
  test('displays summary cards', async ({ page }) => {
    await loginViaCookie(page)
    await page.goto('/dashboard')
    await expect(page.getByText('Total Trips')).toBeVisible()
    await expect(page.getByText('Booked or planning')).toBeVisible()
    await expect(page.getByText('Total trip budget')).toBeVisible()
    await expect(page.getByText('Completed trips')).toBeVisible()
  })

  test('trips table loads', async ({ page }) => {
    await loginViaCookie(page)
    await page.goto('/dashboard')
    await expect(page.getByText('Tokyo & Kyoto Explorer')).toBeVisible()
    await expect(page.getByText('Greek Island Hopping')).toBeVisible()
  })

  test('sidebar navigation works', async ({ page }) => {
    await loginViaCookie(page)
    await page.goto('/dashboard')
    await page.click('a:has-text("Trips")')
    await expect(page).toHaveURL('/dashboard/trips')

    await page.click('a:has-text("Destinations")')
    await expect(page).toHaveURL('/dashboard/destinations')
  })

  test('sidebar collapse and expand', async ({ page }) => {
    await loginViaCookie(page)
    await page.goto('/dashboard')

    const collapseButton = page.getByRole('button', { name: /collapse sidebar/i })
    await expect(collapseButton).toBeVisible()

    await collapseButton.click()
    await expect(page.locator('aside').getByText('Dashboard')).toBeHidden({ timeout: 5000 })
  })
})
