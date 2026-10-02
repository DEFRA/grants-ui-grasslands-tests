import { defineConfig, devices } from '@playwright/test'
import { loadEnvFile } from 'node:process'

try { loadEnvFile('.env') } catch { /* no .env file */ }

process.env.MOCKSERVER_HOST ??= 'localhost'
process.env.MOCKSERVER_PORT ??= '1080'
process.env.GRANTS_UI_BACKEND_AUTH_TOKEN ??= 'auth_token'
process.env.GRANTS_UI_BACKEND_ENCRYPTION_KEY ??= 'encryption_key'
process.env.BASE_BACKEND_URL ??= 'http://localhost:3001'

export default defineConfig({
  testDir: './.grasslands-config/test/grants-ui/test/specs',
  testMatch: '**/*.spec.js',
  grep: /@runme/,
  timeout: 120_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['html', { open: 'on-failure', outputFolder: 'playwright-report' }]],
  use: {
    baseURL: 'http://localhost:3000',
    headless: false,
    screenshot: 'only-on-failure',
    actionTimeout: 10_000,
    navigationTimeout: 10_000
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    }
  ]
})
