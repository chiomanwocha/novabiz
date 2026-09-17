import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { setControls } from '../../../mocks/controls'
import { setupMockServer } from '../../../mocks/handlers/__test__/setupMockServer'
import { renderWithQueryClient } from '../../../testUtils/renderWithQueryClient'
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

  it('going back to Recipient preserves the bank and account number already entered', async () => {
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
    expect(screen.getByLabelText('Account number')).toHaveValue(RECIPIENT_ACCOUNT_NUMBER)
    expect(screen.getByLabelText('Bank')).toHaveValue(RECIPIENT_BANK_CODE)
  })

  it('going back to Amount from Review preserves the amount already entered', async () => {
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
    const recipientNextButton = await screen.findByRole('button', { name: 'Next' })
    await waitFor(() => {
      expect(recipientNextButton).toBeEnabled()
    })
    await user.click(recipientNextButton)
    await screen.findByRole('heading', { name: 'How much?' })

    await user.type(screen.getByLabelText('Amount'), '1,000.50')
    await user.click(screen.getByRole('button', { name: 'Next' }))
    await screen.findByRole('heading', { name: 'Review your transfer' })

    await user.click(screen.getByRole('button', { name: 'Back' }))

    expect(await screen.findByRole('heading', { name: 'How much?' })).toHaveFocus()
    expect(screen.getByLabelText('Amount')).toHaveValue('1,000.50')
  })

  it('shows the resolved recipient and amount on Review, then again on Confirm', async () => {
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
    const recipientNextButton = await screen.findByRole('button', { name: 'Next' })
    await waitFor(() => {
      expect(recipientNextButton).toBeEnabled()
    })
    await user.click(recipientNextButton)
    await screen.findByRole('heading', { name: 'How much?' })

    await user.type(screen.getByLabelText('Amount'), '1,000.50')
    await user.click(screen.getByRole('button', { name: 'Next' }))
    await screen.findByRole('heading', { name: 'Review your transfer' })

    expect(screen.getByText('₦1,000.50')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Continue to confirm' }))

    expect(await screen.findByRole('heading', { name: 'Confirm' })).toHaveFocus()
    expect(screen.getByText('₦1,000.50')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Send money' })).toBeEnabled()
  })

  // Regression case: ConfirmStep used to call useSendMoney() itself, so navigating away from
  // it and back again remounted the hook and silently reset `status` to idle — a failed send
  // would quietly forget it had failed. useSendMoney() is now instantiated once here in
  // SendMoneyPage and passed down, so the same mutation instance (and its status) survives
  // a Back-then-Forward navigation through Confirm.
  it('keeps a failed send status after navigating Back from Confirm and forward again', async () => {
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
    const recipientNextButton = await screen.findByRole('button', { name: 'Next' })
    await waitFor(() => {
      expect(recipientNextButton).toBeEnabled()
    })
    await user.click(recipientNextButton)
    await screen.findByRole('heading', { name: 'How much?' })

    await user.type(screen.getByLabelText('Amount'), '1,000.50')
    await user.click(screen.getByRole('button', { name: 'Next' }))
    await screen.findByRole('heading', { name: 'Review your transfer' })
    await user.click(screen.getByRole('button', { name: 'Continue to confirm' }))
    await screen.findByRole('heading', { name: 'Confirm' })

    // The send itself must fail — only a 'failed' status re-enables Back (a genuinely
    // 'sending' one disables it, by design, so it can't be navigated away from mid-flight).
    setControls({ fixedLatencyMs: 0, failRate: 1, timeoutMode: false })
    await user.click(screen.getByRole('button', { name: 'Send money' }))
    await screen.findByText('The transfer could not be completed. Please try again.')

    await user.click(screen.getByRole('button', { name: 'Back' }))
    await screen.findByRole('heading', { name: 'Review your transfer' })
    await user.click(screen.getByRole('button', { name: 'Continue to confirm' }))
    await screen.findByRole('heading', { name: 'Confirm' })

    expect(
      screen.getByText('The transfer could not be completed. Please try again.'),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Send money' })).not.toBeInTheDocument()
  })
})
