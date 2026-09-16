import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { setControls } from '../../../mocks/controls'
import { setupMockServer } from '../../../mocks/handlers/__test__/setupMockServer'
import { renderWithQueryClient } from '../../../test/renderWithQueryClient'
import { SendMoneyPage } from '../SendMoneyPage'

setupMockServer()

const RECIPIENT_ACCOUNT_NUMBER = '0102030400'
const RECIPIENT_BANK_CODE = '011'
// RecipientStep fetches both the bank list and the merchant on mount — the very first
// render in a test file can take longer than RTL's default 1000ms wait from test-runtime
// overhead alone, even with mock latency pinned to 0, so this wait uses a longer timeout.
const BANK_LIST_TIMEOUT_MS = 5000

describe('SendMoneyPage', () => {
  it('shows RecipientStep first, with focus on its heading', async () => {
    setControls({ fixedLatencyMs: 0, failRate: 0, timeoutMode: false })
    renderWithQueryClient(<SendMoneyPage />)

    expect(await screen.findByRole('heading', { name: 'Who are you sending to?' })).toHaveFocus()
  })

  it('advances to the Amount step once a recipient resolves, moving focus to its heading', async () => {
    setControls({ fixedLatencyMs: 0, failRate: 0, timeoutMode: false })
    const user = userEvent.setup()
    renderWithQueryClient(<SendMoneyPage />)

    const bankSelect = screen.getByLabelText('Bank')
    await within(bankSelect).findByRole(
      'option',
      { name: 'First Bank of Nigeria' },
      { timeout: BANK_LIST_TIMEOUT_MS },
    )
    await user.selectOptions(bankSelect, RECIPIENT_BANK_CODE)
    await user.type(screen.getByLabelText('Account number'), RECIPIENT_ACCOUNT_NUMBER)

    const nextButton = await screen.findByRole('button', { name: 'Next' })
    await waitFor(() => {
      expect(nextButton).toBeEnabled()
    })
    await user.click(nextButton)

    expect(await screen.findByRole('heading', { name: 'How much?' })).toHaveFocus()
  })

  it('goes back from the Amount placeholder to a fresh Recipient step', async () => {
    setControls({ fixedLatencyMs: 0, failRate: 0, timeoutMode: false })
    const user = userEvent.setup()
    renderWithQueryClient(<SendMoneyPage />)

    const bankSelect = screen.getByLabelText('Bank')
    await within(bankSelect).findByRole(
      'option',
      { name: 'First Bank of Nigeria' },
      { timeout: BANK_LIST_TIMEOUT_MS },
    )
    await user.selectOptions(bankSelect, RECIPIENT_BANK_CODE)
    await user.type(screen.getByLabelText('Account number'), RECIPIENT_ACCOUNT_NUMBER)

    const nextButton = await screen.findByRole('button', { name: 'Next' })
    await waitFor(() => {
      expect(nextButton).toBeEnabled()
    })
    await user.click(nextButton)
    await screen.findByRole('heading', { name: 'How much?' })

    await user.click(screen.getByRole('button', { name: 'Back' }))

    expect(await screen.findByRole('heading', { name: 'Who are you sending to?' })).toHaveFocus()
    expect(screen.getByLabelText('Account number')).toHaveValue('')
  })
})
