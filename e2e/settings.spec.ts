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

test.describe('Settings Page', () => {
  test('loads from sidebar navigation', async ({ page }) => {
    await loginViaCookie(page)
    await page.goto('/dashboard')
    await page.click('a:has-text("Settings")')
    await expect(page).toHaveURL('/dashboard/settings')
    await expect(page.getByText('Traveler Profile')).toBeVisible()
  })

  test('displays pre-filled form fields', async ({ page }) => {
    await loginViaCookie(page)
    await page.goto('/dashboard/settings')
    await expect(page.getByLabel('Name')).toHaveValue('Jane Doe')
    await expect(page.getByLabel('Email')).toHaveValue('jane.doe@example.com')
  })

  test('shows validation errors on empty submit', async ({ page }) => {
    await loginViaCookie(page)
    await page.goto('/dashboard/settings')

    await page.getByLabel('Name').fill('')
    await page.getByLabel('Email').fill('')

    await page.getByRole('button', { name: 'Save Changes' }).click()

    await expect(page.getByText('Name must be at least 2 characters')).toBeVisible()
  })

  test('submits form successfully with valid data', async ({ page }) => {
    await loginViaCookie(page)
    await page.goto('/dashboard/settings')

    await page.getByRole('button', { name: 'Save Changes' }).click()

    await expect(page.getByText('Profile saved successfully')).toBeVisible()
  })
})
