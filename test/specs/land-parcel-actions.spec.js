import { test, expect } from '@playwright/test'
import { authenticateTo } from '../utils/auth.js'
import { clearApplicationData } from '../utils/backend.js'

const CRN = '1103313150'
const SBI = '106514040'
const GRANT_CODE = 'grasslands'
const PARCEL_ID = 'SK0971-5761'

test.describe('Grasslands select actions for land parcel', () => {
  test.beforeEach(async () => {
    await clearApplicationData(SBI, GRANT_CODE)
  })

  test('selecting an action for a land parcel correctly enables and disables other actions', { tag: ['@cdp', '@ci', '@runme'] }, async ({ page }) => {
    await test.step('authentication', async () => {
      await authenticateTo(page, 'grasslands', CRN)
    })

    await test.step('reach select-actions-for-land-parcel', async () => {
      await page.getByRole('link', { name: 'Are these details correct?' }).click()

      await expect(page).toHaveURL('/grasslands/check-details')
      await page.getByRole('radio', { name: 'Yes' }).click()
      await page.getByRole('button', { name: 'Continue' }).click()

      await expect(page).toHaveURL('/grasslands/check-your-land-details')
      await page.getByRole('radio', { name: 'Yes' }).click()
      await page.getByRole('button', { name: 'Save and continue' }).click()

      await expect(page).toHaveURL('/grasslands/management-control-of-land')
      await page.getByRole('radio', { name: 'Yes' }).click()
      await page.getByRole('button', { name: 'Save and continue' }).click()

      await expect(page).toHaveURL('/grasslands/tasks')
      await page.getByRole('link', { name: 'Select the land and actions you want to apply for' }).click()

      await expect(page).toHaveURL('/grasslands/select-land-parcel')
      await selectParcelOnMap(page, PARCEL_ID)
      await expect(page.locator('#parcel-selection-summary')).toHaveText(`Selected: ${PARCEL_ID}`)
      await page.locator('#map-select-continue').click()

      await expect(page).toHaveURL(/\/grasslands\/select-actions-for-land-parcel/)
      await expect(page.getByRole('heading', { level: 1 })).toContainText('Select actions for this land parcel')
    })

    await test.step('selecting a total area action disables all other actions', async () => {
      const cligCheckbox = page.getByRole('checkbox', { name: /CLIG3/ })
      const otherCheckboxes = await page.locator('input[type="checkbox"][name="landAction"]:not([value="CLIG3"])').all()

      const landGrantsResponse = page.waitForResponse((res) => res.url().includes('/api/land-grants/actions/'))
      await cligCheckbox.check()
      await landGrantsResponse
      await expect(cligCheckbox).toBeChecked()
      for (const checkbox of otherCheckboxes) {
        await expect(checkbox).toBeDisabled()
      }
    })
  })
})

async function selectParcelOnMap(page, parcelId) {
  // parcel-selection-summary starts hidden and is only unhidden once the map's
  // 'parcel-map:ready' handler has run - by then the page's own selection
  // listener is guaranteed to be attached too.
  await page.locator('#parcel-selection-summary').waitFor({ state: 'visible' })
  await page.evaluate(
    (id) =>
      document
        .getElementById('parcel-map')
        .dispatchEvent(new CustomEvent('parcel-map:selection', { bubbles: true, detail: { selectedIds: [id] } })),
    parcelId
  )
}
