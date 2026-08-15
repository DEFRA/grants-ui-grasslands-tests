import { test, expect } from '@playwright/test'
import Ajv2020 from 'ajv/dist/2020.js'
import { authenticateTo } from '../utils/auth.js'
import { clearApplicationData } from '../utils/backend.js'
import { analyzeAccessibility } from '../utils/accessibility.js'
import { getApplicationSubmission } from '../utils/gas.js'

const CRN = '1103171356'
const SBI = '107214733'
const GRANT_CODE = 'grasslands'

test.describe('Grasslands application', () => {
  test.beforeEach(async () => {
    await clearApplicationData(SBI, GRANT_CODE)
  })

  test('submits a Grasslands application exploring all pages from start to confirmation', { tag: ['@cdp', '@ci'] }, async ({ page }) => {
    let referenceNumber
    await test.step('authentication', async () => {
      await authenticateTo(page, 'grasslands', CRN)
    })

    await test.step('tasks', async () => {
      await expect(page).toHaveURL('/grasslands/tasks')
      await expect(page.getByRole('heading', { level: 1 })).toContainText('Apply for a Grasslands agreement')
      await analyzeAccessibility(page)
      await page.getByRole('link', { name: 'Are these details correct?' }).click()
    })

    await test.step('check-details', async () => {
      await expect(page).toHaveURL('/grasslands/check-details')
      await expect(page.getByRole('heading', { level: 1 })).toContainText('Check your details')
      await analyzeAccessibility(page)
    })

    await test.step('check-details -> update-details -> check-details', async () => {
      await page.getByRole('radio', { name: 'No' }).click()
      await page.getByRole('button', { name: 'Continue' }).click()

      await expect(page).toHaveURL('/grasslands/update-details')
      await expect(page.getByRole('heading', { level: 1 })).toContainText('Update your business details')
      await analyzeAccessibility(page)
      await page.getByRole('link', { name: 'Back', exact: true }).click()

      await expect(page).toHaveURL('/grasslands/check-details')
      await expect(page.getByRole('heading', { level: 1 })).toContainText('Check your details')
    })

    await test.step('check-details -> check-your-land-details', async () => {
      await page.getByRole('radio', { name: 'Yes' }).click()
      await page.getByRole('button', { name: 'Continue' }).click()

      await expect(page).toHaveURL('/grasslands/check-your-land-details')
      await expect(page.getByRole('heading', { level: 1 })).toContainText('Check your land details')
      await analyzeAccessibility(page)
    })

    await test.step('check-your-land-details -> update-your-land-details -> check-your-land-details', async () => {
      await page.getByRole('radio', { name: 'No' }).click()
      await page.getByRole('button', { name: 'Save and continue' }).click()

      await expect(page).toHaveURL('/grasslands/update-your-land-details')
      await expect(page.getByRole('heading', { level: 1 })).toContainText('Update your land details')
      await analyzeAccessibility(page)
      await page.getByRole('link', { name: 'Back', exact: true }).click()

      await expect(page).toHaveURL('/grasslands/check-your-land-details')
      await expect(page.getByRole('heading', { level: 1 })).toContainText('Check your land details')
    })

    await test.step('check-your-land-details -> management-control-of-land', async () => {
      await page.getByRole('radio', { name: 'Yes' }).click()
      await page.getByRole('button', { name: 'Save and continue' }).click()

      await expect(page).toHaveURL('/grasslands/management-control-of-land')
      await expect(page.getByRole('heading', { level: 1 })).toContainText('Management control of land')
      await analyzeAccessibility(page)
    })

    await test.step('management-control-of-land -> not-eligible -> management-control-of-land', async () => {
      await page.getByRole('radio', { name: 'No' }).click()
      await page.getByRole('button', { name: 'Save and continue' }).click()

      await expect(page).toHaveURL('/grasslands/not-eligible')
      await expect(page.getByRole('heading', { level: 1 })).toContainText('You are not eligible to apply')
      await analyzeAccessibility(page)
      await page.getByRole('link', { name: 'Back', exact: true }).click()

      await expect(page).toHaveURL('/grasslands/management-control-of-land')
      await expect(page.getByRole('heading', { level: 1 })).toContainText('Management control of land')
    })

    await test.step('management-control-of-land -> tasks', async () => {
      await page.getByRole('radio', { name: 'Yes' }).click()
      await page.getByRole('button', { name: 'Save and continue' }).click()

      await expect(page).toHaveURL('/grasslands/tasks')
      await assertTaskStatuses(page, [
        { name: 'Are these details correct?', status: 'Completed' },
        { name: 'Confirm your land details are up to date', status: 'Completed' },
        { name: 'Confirm management control of the land', status: 'Completed' },
        { name: 'Select the land and actions you want to apply for', status: 'Not started' },
      ])
      await page.getByRole('link', { name: 'Select the land and actions you want to apply for' }).click()
    })

    await test.step('select-land-parcel', async () => {
      await expect(page).toHaveURL('/grasslands/select-land-parcel')
      await expect(page.getByRole('heading', { level: 1 })).toContainText('Select land for your actions')
      await analyzeAccessibility(page)

      await selectParcelOnMap(page, 'SD8545-7357', 11.1006)
      await page.locator('#map-select-continue').click()
    })

    await test.step('select-actions-for-land-parcel', async () => {
      await expect(page).toHaveURL(/\/grasslands\/select-actions-for-land-parcel/)
      await expect(page.getByRole('heading', { level: 1 })).toContainText('Select actions for this land parcel')
      await analyzeAccessibility(page)

      await test.step('actions are listed in the correct order', async () => {
        const actionCheckboxes = page.locator('.govuk-checkboxes__item .govuk-checkboxes__input')
        const values = await actionCheckboxes.evaluateAll((inputs) => inputs.map((input) => input.value))
        expect(values).toEqual(['CSAM3', 'CLIG3', 'SCR2'])
      })

      const csam3Checkbox = page.getByRole('checkbox', { name: /CSAM3/ })
      const scr2Checkbox = page.getByRole('checkbox', { name: /SCR2/ })
      const cligCheckbox = page.getByRole('checkbox', { name: /CLIG3/ })

      await test.step('select CSAM3', async () => {
        await csam3Checkbox.click()
        await expect(csam3Checkbox).toBeChecked()
        await expect(page.locator('#landActionQuantity_CSAM3-hint')).toHaveText('11.5033 hectares available')

        const landGrantsResponse = page.waitForResponse((res) => res.url().includes('/api/land-grants/actions/'))
        await page.locator('#landActionQuantity_CSAM3').fill('1.5')
        await page.locator('#landActionQuantity_CSAM3').blur()
        await landGrantsResponse
      })

      await test.step('select SCR2 ', async () => {
        await scr2Checkbox.click()
        await expect(scr2Checkbox).toBeChecked()
        await expect(page.locator('#landActionQuantity_SCR2-hint')).toHaveText('10.0033 hectares available')

        const landGrantsResponse = page.waitForResponse((res) => res.url().includes('/api/land-grants/actions/'))
        await page.locator('#landActionQuantity_SCR2').fill('2')
        await page.locator('#landActionQuantity_SCR2').blur()
        await landGrantsResponse
      })

      await test.step('select CLIG3', async () => {
        await expect(page.locator('#landActionQuantity_CLIG3-hint')).toHaveText('8.0033 hectares available')

        const landGrantsResponse = page.waitForResponse((res) => res.url().includes('/api/land-grants/actions/'))
        await cligCheckbox.click()
        await landGrantsResponse
        await expect(cligCheckbox).toBeChecked()
      })

      await test.step('all actions now show 0 hectares are available', async () => {
        await expect(page.locator('#landActionQuantity_CSAM3-hint')).toHaveText('0 hectares available')
        await expect(page.locator('#landActionQuantity_SCR2-hint')).toHaveText('0 hectares available')
        await expect(page.locator('#landActionQuantity_CLIG3-hint')).toHaveText('0 hectares available')
      })

      await page.getByRole('button', { name: 'Save and continue' }).click()
    })

    await test.step('select-actions-for-land-parcel -> tasks', async () => {
      await expect(page).toHaveURL('/grasslands/tasks')
      await assertTaskStatuses(page, [
        { name: 'Are these details correct?', status: 'Completed' },
        { name: 'Confirm your land details are up to date', status: 'Completed' },
        { name: 'Confirm management control of the land', status: 'Completed' },
        { name: 'Select the land and actions you want to apply for', status: 'Completed' },
        { name: 'Check your answers', status: 'Not started' },
      ])
      await page.getByRole('link', { name: 'Check your answers' }).click()
    })

    await test.step('summary', async () => {
      await expect(page).toHaveURL('/grasslands/summary')
      await expect(page.getByRole('heading', { level: 1 })).toContainText('Check your answers')
      await analyzeAccessibility(page)
      await page.getByRole('button', { name: 'Continue' }).click()
    })

    await test.step('declaration', async () => {
      await expect(page).toHaveURL('/grasslands/declaration')
      await expect(page.getByRole('heading', { level: 1 })).toContainText('Submit your application')
      await analyzeAccessibility(page)
      await page.getByRole('button', { name: 'Confirm and submit' }).click()
    })

    await test.step('confirmation', async () => {
      await expect(page).toHaveURL('/grasslands/confirmation')
      await expect(page.getByRole('heading', { level: 1 })).toContainText('Application submitted')
      await analyzeAccessibility(page)
      await expect(page.locator('.govuk-panel__body')).toContainText(/GLD-[A-Z0-9]+-[A-Z0-9]+/)
      referenceNumber = await page.locator('.govuk-panel__body strong').textContent()
    })

    await test.step('print-submitted-application', async () => {
      const [printTab] = await Promise.all([
        page.context().waitForEvent('page'),
        page.getByRole('link', { name: 'View / Print submitted application' }).click(),
      ])
      await printTab.waitForLoadState()
      await expect(printTab).toHaveURL('/grasslands/print-submitted-application')
      await expect(printTab.getByRole('heading', { level: 1 })).toContainText('Apply for a Grasslands agreement')
      await expect(printTab.getByText(referenceNumber)).toBeVisible()
      await expect(printTab.getByRole('button', { name: 'Print this page' })).toBeVisible()
      await printTab.close()
    })

    if (CI()) {
      await test.step('verify GAS submission', async () => {
        const request = await getApplicationSubmission(referenceNumber)
        expect(request).not.toBeNull()

        expect(request.body.json.metadata.clientRef).toEqual(referenceNumber.toLowerCase())
        expect(request.body.json.metadata.sbi).toEqual(SBI)
        expect(request.body.json.metadata.crn).toEqual(CRN)
        expect(request.body.json.metadata.frn).toBeTruthy()
        expect(request.body.json.metadata.configVersion).toMatch(/^\d+\.\d+\.\d+$/)

        const gasSchemaFile = await import('../schemas/gas.schema.json', { with: { type: 'json' } })
        const ajv = new Ajv2020({ strict: false, formats: { 'date-time': true } })
        const validate = ajv.compile(gasSchemaFile.default.phases[0].questions)
        const valid = validate(request.body.json.answers)
        expect(valid, ajv.errorsText(validate.errors)).toBe(true)
      })
    }
  })
})

function CI() {
  return !!process.env.MOCKSERVER_HOST
}

function assertTaskStatuses(page, tasks) {
  return Promise.all(
    tasks.map(({ name, status }) => {
      const item = page.locator('.govuk-task-list__item', { hasText: name })
      return expect(item.locator('.govuk-task-list__status')).toContainText(status)
    })
  )
}

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
