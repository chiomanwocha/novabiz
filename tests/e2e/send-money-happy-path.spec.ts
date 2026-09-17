import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

import {
  completeAmountStep,
  completeRecipientStep,
  completeReviewStep,
} from './support/sendMoneyFlow'

test('completes a transfer end to end and shows it in the feed', async ({ page }) => {
  await page.goto('/send')
  await completeRecipientStep(page)
  await completeAmountStep(page)
  await completeReviewStep(page)

  await expect(page.getByRole('heading', { name: 'Confirm' })).toBeVisible()
  await page.getByRole('button', { name: 'Send money' }).click()
  await expect(page.getByText('Transfer sent')).toBeVisible()

  // A client-side nav, not page.goto('/') — the mock server's data lives entirely in this
  // page's JS memory (no real backend), so a hard navigation would reset it and lose the
  // transfer that was just made.
  await page.getByRole('link', { name: 'Dashboard' }).click()
  await expect(page.getByText('-₦1,000.50').first()).toBeVisible()
})

test('dashboard has no serious or critical accessibility violations', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('main')).toBeVisible()

  const results = await new AxeBuilder({ page }).analyze()
  const seriousOrCritical = results.violations.filter(
    (violation) => violation.impact === 'serious' || violation.impact === 'critical',
  )
  expect(seriousOrCritical, JSON.stringify(seriousOrCritical, null, 2)).toEqual([])
})

test('the recipient step has no serious or critical accessibility violations', async ({ page }) => {
  await page.goto('/send')
  await expect(page.getByLabel('Bank')).toBeVisible()

  const results = await new AxeBuilder({ page }).analyze()
  const seriousOrCritical = results.violations.filter(
    (violation) => violation.impact === 'serious' || violation.impact === 'critical',
  )
  expect(seriousOrCritical, JSON.stringify(seriousOrCritical, null, 2)).toEqual([])
})
