import { expect } from '@playwright/test'

export async function authenticateTo(page, path, crn) {
  await page.goto(path)
  const crnInput = page.locator('input#crn')
  if (await crnInput.isVisible({ timeout: 30_000 }).catch(() => false)) {
    await crnInput.fill(crn)
    await page.locator('input#password').fill('x')
    await page.locator('button[type="submit"]').click()

    await expect(page).toHaveURL(/\/grasslands/, { timeout: 30_000 })
  }
}
