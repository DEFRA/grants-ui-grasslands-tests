import { defineConfig, devices } from '@playwright/test'

process.env.BASE_BACKEND_URL = `https://grants-ui-backend.${process.env.ENVIRONMENT}.cdp-int.defra.cloud`

export default defineConfig({
  testDir: './test/specs',
  testMatch: '**/*.spec.js',
  grep: /@cdp/,
  timeout: 60_000,
  expect: { timeout: 55_000 },
  fullyParallel: false,
  workers: 3,
  reporter: [['html', { open: 'never', outputFolder: 'playwright-report' }]],
  use: {
    baseURL: `https://grants-ui.${process.env.ENVIRONMENT}.cdp-int.defra.cloud`,
    headless: true,
    screenshot: 'only-on-failure'
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    }
  ]
})
