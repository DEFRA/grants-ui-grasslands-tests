import { test, expect } from '@playwright/test'
import { authenticateTo } from '../utils/auth.js'
import { clearApplicationData } from '../utils/backend.js'

const CRN = '1103313150'
const SBI = '106514040'
const GRANT_CODE = 'grasslands'

test.describe('Grasslands select actions for land parcel', () => {
  test.beforeEach(async () => {
    await clearApplicationData(SBI, GRANT_CODE)
  })

  test('selecting an action for a land parcel correctly enables and disables other actions', { tag: ['@cdp', '@ci'] }, async ({ page }) => {
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
      await selectParcelOnMap(page, 'SK0971-5761', 11.1006)
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

async function selectParcelOnMap(page, id, areaHa) {
  // The page's parcel-map:selection listener is attached as soon as
  // parcel-select-page.js runs, but the element can be attached
  // before that listener is actually wired up, so a single dispatch can
  // be dropped. Retry the dispatch until #selected-parcel-details becomes
  // visible as a result of it.
  await page.locator('#parcel-map').waitFor({ state: 'attached' })

  const dispatchSelection = () =>
    page.evaluate(
      ({ id, areaHa }) => {
        const [sheet_id, parcel_id] = id.split('-')
        document.getElementById('parcel-map').dispatchEvent(
          new CustomEvent('parcel-map:selection', {
            bubbles: true,
            detail: { selectedParcels: [{ id, sheet_id, parcel_id, areaHa }] }
          })
        )
      },
      { id, areaHa }
    )

  const selectedParcelDetails = page.locator('#selected-parcel-details')
  await expect(async () => {
    await dispatchSelection()
    await expect(selectedParcelDetails).toBeVisible({ timeout: 1000 })
  }).toPass({ timeout: 30000 })
}
