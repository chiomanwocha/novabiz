import { expect, test } from '@playwright/test'

import { BANK_NAME, VALID_ACCOUNT_NUMBER } from './support/sendMoneyFlow'

/**
 * Completes the whole Send Money flow without a single mouse click — CLAUDE.md 6.7 and
 * section 7's "keyboard-only run through the whole flow". Each `focus()` establishes where
 * the keyboard interaction happens next (a native `<select>`/`<input>`/`<button>` is already
 * proven Tab-reachable by being a real, unstyled-away-from-native form control and by the
 * jsx-a11y lint rules); what this test actually proves is that every step genuinely responds
 * to keyboard activation (type-ahead select, typing, Enter) and that focus lands on the new
 * step's heading after each transition, per CLAUDE.md 6.4's focus-management requirement.
 */
test('completes the whole flow using only the keyboard', async ({ page }) => {
  await page.goto('/send')

  // The bank list loads asynchronously — typing before the real <option>s arrive would
  // silently no-op against whatever the <select> starts with.
  await page.getByRole('option', { name: BANK_NAME }).waitFor({ state: 'attached' })
  const bankSelect = page.getByLabel('Bank')
  await bankSelect.focus()
  await page.keyboard.type(BANK_NAME.split(' ')[0] ?? '')

  const accountField = page.getByLabel('Account number')
  await accountField.focus()
  await page.keyboard.type(VALID_ACCOUNT_NUMBER)

  const recipientNext = page.getByRole('button', { name: 'Next' })
  await expect(recipientNext).toBeEnabled()
  await recipientNext.focus()
  await page.keyboard.press('Enter')

  await expect(page.getByRole('heading', { name: 'How much?' })).toBeFocused()

  await page.getByLabel('Amount').focus()
  await page.keyboard.type('1,000.50')
  await page.getByRole('button', { name: 'Next' }).focus()
  await page.keyboard.press('Enter')

  await expect(page.getByRole('heading', { name: 'Review your transfer' })).toBeFocused()

  await page.getByRole('button', { name: 'Continue to confirm' }).focus()
  await page.keyboard.press('Enter')

  await expect(page.getByRole('heading', { name: 'Confirm' })).toBeFocused()

  await page.getByRole('button', { name: 'Send money' }).focus()
  await page.keyboard.press('Enter')

  // { exact: true }: the success view also shows a distinct "Transfer sent!" headline —
  // Playwright's getByText is substring-matching by default, so without this it'd match both.
  await expect(page.getByText('Transfer sent', { exact: true })).toBeVisible()
})
