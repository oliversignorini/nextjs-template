import { test, expect } from '@playwright/test'

test.describe('Navigation', () => {
  test('home page loads with heading', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('h1')).toBeVisible()
  })

  test('navigate to Guide page', async ({ page }) => {
    await page.goto('/')
    await page.click('a:has-text("Guide")')
    await expect(page).toHaveURL('/guide')
    await expect(page.locator('h1')).toBeVisible()
  })

  test('navigate to Login page', async ({ page }) => {
    await page.goto('/')
    await page.click('a:has-text("Login")')
    await expect(page).toHaveURL('/login')
    await expect(page.locator('h1')).toContainText('Welcome Back')
  })

  test('unauthenticated user is redirected from dashboard to login', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL('/login')
  })

  test('header is present on all pages', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('header')).toBeVisible()

    await page.goto('/guide')
    await expect(page.locator('header')).toBeVisible()

    await page.goto('/login')
    await expect(page.locator('header')).toBeVisible()
  })

  test('footer is present on all pages', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('footer')).toBeVisible()

    await page.goto('/guide')
    await expect(page.locator('footer')).toBeVisible()

    await page.goto('/login')
    await expect(page.locator('footer')).toBeVisible()
  })
})
