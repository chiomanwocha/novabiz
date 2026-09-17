import { expect, test } from '@playwright/test'

import {
  completeAmountStep,
  completeRecipientStep,
  completeReviewStep,
} from './support/sendMoneyFlow'

test('rolls back with a Failed message on a simulated failure, and Try again reuses the same Idempotency-Key', async ({
  page,
}) => {
  // Not `?failRate=1` — that flag applies to every mock endpoint (CLAUDE.md 6.2), which
  // would also break the bank list and name-enquiry calls this same flow needs first.
  // Instead, complete Recipient/Amount/Review normally, then dial the failure rate up to
  // 100% live via DevControls right before pressing Send — the one request this test
  // actually wants to fail.
  await page.goto('/send')
  await completeRecipientStep(page)
  await completeAmountStep(page)
  await completeReviewStep(page)

  await page.getByLabel('Mock controls').click()
  const failureRateSlider = page.getByLabel(/Failure rate/)
  await failureRateSlider.focus()
  // "End" jumps a range input straight to its max — a real, native key event React's
  // controlled-input tracking handles correctly, unlike writing `.value` directly via the
  // DOM and dispatching a synthetic event (React's input-value tracker can silently ignore
  // that on a controlled element).
  await page.keyboard.press('End')
  await expect(page.getByText('Failure rate: 100%')).toBeVisible()
  // Close the panel again — at 360px it's tall enough, still open, to sit over the Confirm
  // step's own Send button below it.
  await page.getByLabel('Mock controls').click()

  const idempotencyKeys: string[] = []
  page.on('request', (request) => {
    if (request.method() === 'POST' && request.url().includes('/api/transfers')) {
      const key = request.headers()['idempotency-key']
      if (key) {
        idempotencyKeys.push(key)
      }
    }
  })

  await page.getByRole('button', { name: 'Send money' }).click()
  await expect(
    page.getByText('The transfer could not be completed. Please try again.'),
  ).toBeVisible()
  const tryAgainButton = page.getByRole('button', { name: 'Try again' })
  await expect(tryAgainButton).toBeVisible()

  await tryAgainButton.click()
  await expect(
    page.getByText('The transfer could not be completed. Please try again.'),
  ).toBeVisible()

  expect(idempotencyKeys).toHaveLength(2)
  expect(idempotencyKeys[0]).toBe(idempotencyKeys[1])
})
