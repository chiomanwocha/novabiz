import { expect, type Page } from '@playwright/test'

/** A NUBAN with a valid check digit for First Bank (011) — same fixture the unit/component tests use. */
export const BANK_NAME = 'First Bank of Nigeria'
export const VALID_ACCOUNT_NUMBER = '0102030400'

export async function completeRecipientStep(
  page: Page,
  accountNumber: string = VALID_ACCOUNT_NUMBER,
): Promise<void> {
  // The bank list loads asynchronously from the mock server — selecting before the real
  // <option>s arrive would silently no-op against whatever the <select> starts with.
  await page.getByRole('option', { name: BANK_NAME }).waitFor({ state: 'attached' })
  await page.getByLabel('Bank').selectOption({ label: BANK_NAME })
  await page.getByLabel('Account number').fill(accountNumber)
  const nextButton = page.getByRole('button', { name: 'Next' })
  await expect(nextButton).toBeEnabled()
  await nextButton.click()
}

export async function completeAmountStep(page: Page, amountNaira = '1,000.50'): Promise<void> {
  await expect(page.getByRole('heading', { name: 'How much?' })).toBeVisible()
  await page.getByLabel('Amount').fill(amountNaira)
  await page.getByRole('button', { name: 'Next' }).click()
}

export async function completeReviewStep(page: Page): Promise<void> {
  await expect(page.getByRole('heading', { name: 'Review your transfer' })).toBeVisible()
  await page.getByRole('button', { name: 'Continue to confirm' }).click()
}
