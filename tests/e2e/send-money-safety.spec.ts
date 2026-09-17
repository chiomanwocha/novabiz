import { expect, test } from '@playwright/test'

import {
  BANK_NAME,
  VALID_ACCOUNT_NUMBER,
  completeAmountStep,
  completeRecipientStep,
  completeReviewStep,
} from './support/sendMoneyFlow'

test('a double-click on Send produces exactly one POST', async ({ page }) => {
  await page.goto('/send')
  await completeRecipientStep(page)
  await completeAmountStep(page)
  await completeReviewStep(page)

  let postCount = 0
  page.on('request', (request) => {
    if (request.method() === 'POST' && request.url().includes('/api/transfers')) {
      postCount += 1
    }
  })

  await page.getByRole('button', { name: 'Send money' }).dblclick()
  await expect(page.getByText('Transfer sent')).toBeVisible()

  expect(postCount).toBe(1)
})

test('editing a digit after the name resolves clears it and disables Next', async ({ page }) => {
  await page.goto('/send')
  await page.getByLabel('Bank').selectOption({ label: BANK_NAME })
  const accountField = page.getByLabel('Account number')
  await accountField.fill(VALID_ACCOUNT_NUMBER)

  const nextButton = page.getByRole('button', { name: 'Next' })
  await expect(nextButton).toBeEnabled()

  await accountField.press('Backspace')
  await accountField.type('9')

  await expect(nextButton).toBeDisabled()
})

test('a stale or mismatched nameEnquiryRef is rejected with the confirm-again message', async ({
  page,
}) => {
  await page.goto('/send')
  await completeRecipientStep(page)
  await completeAmountStep(page)
  await completeReviewStep(page)

  // page.route() intercepts at the browser/CDP level, upstream of (or in conflict with,
  // depending on timing) the MSW service worker that actually serves these mock responses —
  // unreliable here. Patching window.fetch inside the page's own JS realm instead runs at
  // the exact call site, before the request ever reaches the service worker, so it can't
  // race with it.
  await page.evaluate(() => {
    const originalFetch = window.fetch
    window.fetch = async (input, init) => {
      const url = typeof input === 'string' ? input : input.toString()
      if (
        url.includes('/api/transfers') &&
        init?.method === 'POST' &&
        typeof init.body === 'string'
      ) {
        const body = JSON.parse(init.body) as Record<string, unknown>
        body.nameEnquiryRef = 'stale-ref-does-not-exist'
        return originalFetch(url, { ...init, body: JSON.stringify(body) })
      }
      return originalFetch(input, init)
    }
  })

  await page.getByRole('button', { name: 'Send money' }).click()

  await expect(page.getByText('Please confirm the recipient again')).toBeVisible()
})
