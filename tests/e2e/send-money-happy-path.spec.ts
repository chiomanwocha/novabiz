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
  // { exact: true }: the success view also shows a distinct "Transfer sent!" headline —
  // Playwright's getByText is substring-matching by default, so without this it'd match both.
  await expect(page.getByText('Transfer sent', { exact: true })).toBeVisible()

  // A client-side nav, not page.goto('/') — the mock server's data lives entirely in this
  // page's JS memory (no real backend), so a hard navigation would reset it and lose the
  // transfer that was just made. Via the sidebar nav specifically (not the success view's own
  // "Back to dashboard" button, which also matches "Dashboard" as a substring) — { exact: true }
  // disambiguates the two.
  await page.getByRole('link', { name: 'Dashboard', exact: true }).click()
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
