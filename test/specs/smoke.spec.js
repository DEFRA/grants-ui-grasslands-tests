import { test, expect } from '@playwright/test'

test.describe('Grasslands', () => {
  test('reaches the grasslands start page', { tag: ['@cdp', '@ci', '@runme'] }, async ({ page }) => {
    const response = await page.goto('/grasslands/check-details')
    expect(response, 'grasslands URL should be reachable').not.toBeNull()
    expect(response.status(), 'grasslands URL should not error').toBeLessThan(400)
  })
})
