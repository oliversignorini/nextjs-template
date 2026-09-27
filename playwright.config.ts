import { defineConfig, devices } from '@playwright/test'

const baseURL = process.env.E2E_BASE_URL ?? `http://localhost:${process.env.PORT ?? 3000}`

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  // 0 everywhere, even in CI: a retry that passes hides a real flake
  // instead of surfacing it. Keep a trace on the one attempt instead.
  retries: 0,
  reporter: 'list',
  use: {
    baseURL,
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  // The factory's scripts/factory/factory.mjs starts/stops dev itself
  // (per-slot ports); Playwright never launches its own webServer.
})
