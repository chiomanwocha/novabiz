import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { setControls } from '../../../../mocks/controls'
import { getMerchant } from '../../../../mocks/db/store'
import { setupMockServer } from '../../../../mocks/handlers/__test__/setupMockServer'
import { renderWithQueryClient } from '../../../../testUtils/renderWithQueryClient'
import { RecipientStep } from '../RecipientStep'

// The real REQUEST_TIMEOUT_MS is 10s — mocked small so the 9999 (timeout) case doesn't
// make the suite slow. Hoisted above other statements, so no outer-variable reference.
vi.mock('../../../../config/constants', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../../../config/constants')>()),
  REQUEST_TIMEOUT_MS: 400,
}))

const mockTimeoutMs = 400

setupMockServer()

const BANK_CODE = '011'
const BANK_NAME = 'First Bank of Nigeria'
const VALID_ACCOUNT_NUMBER = '0102030400'

// RecipientStep also fetches the merchant (for the own-account check) alongside the bank
// list, and the very first render in a test file can take longer than RTL's default 1000ms
// wait purely from test-environment/module overhead, not application latency (mock latency
// is already pinned to 0) — so these waits use a longer explicit timeout.
const BANK_LIST_TIMEOUT_MS = 5000

async function selectBank(user: ReturnType<typeof userEvent.setup>): Promise<void> {
  const bankSelect = screen.getByLabelText('Bank')
  await within(bankSelect).findByRole(
    'option',
    { name: BANK_NAME },
    { timeout: BANK_LIST_TIMEOUT_MS },
  )
  await user.selectOptions(bankSelect, BANK_CODE)
}

describe('RecipientStep', () => {
  it('keeps Next disabled until the name resolves', async () => {
    setControls({ fixedLatencyMs: 0, failRate: 0, timeoutMode: false })
    const user = userEvent.setup()
    renderWithQueryClient(<RecipientStep onNext={vi.fn()} />)

    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled()

    await selectBank(user)
    await user.type(screen.getByLabelText('Account number'), VALID_ACCOUNT_NUMBER)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Next' })).toBeEnabled()
    })
  })

  it('shows the account-not-found message for an account ending in 0000', async () => {
    setControls({ fixedLatencyMs: 0, failRate: 0, timeoutMode: false })
    const user = userEvent.setup()
    renderWithQueryClient(<RecipientStep onNext={vi.fn()} />)

    await selectBank(user)
    await user.type(screen.getByLabelText('Account number'), '0000000000')

    expect(
      await screen.findByText('Account not found. Please check the details.'),
    ).toBeInTheDocument()
  })

  it("shows the can't-receive-funds message for an account ending in 1111", async () => {
    setControls({ fixedLatencyMs: 0, failRate: 0, timeoutMode: false })
    const user = userEvent.setup()
    renderWithQueryClient(<RecipientStep onNext={vi.fn()} />)

    await selectBank(user)
    await user.type(screen.getByLabelText('Account number'), '0000021111')

    expect(await screen.findByText("This account can't receive funds.")).toBeInTheDocument()
  })

  it('shows a timeout message for an account ending in 9999', async () => {
    setControls({ fixedLatencyMs: 0, failRate: 0, timeoutMode: false })
    const user = userEvent.setup()
    renderWithQueryClient(<RecipientStep onNext={vi.fn()} />)

    await selectBank(user)
    await user.type(screen.getByLabelText('Account number'), '0000089999')

    expect(
      await screen.findByText(
        "We couldn't confirm this account in time.",
        {},
        { timeout: mockTimeoutMs * 10 },
      ),
    ).toBeInTheDocument()
  })

  // Regression case: the Retry button was stretching to the full width of the card — traced
  // to it being a lone child of the card's `flex flex-col` container, which stretches a
  // single item across the cross axis by default. Pairing it with the status text in its
  // own row (not the card's own column layout) keeps it sized to its label, sitting beside
  // the text instead of spanning underneath it.
  it('shows a small, inline Retry button beside the message on a timeout, not a full-width one', async () => {
    setControls({ fixedLatencyMs: 0, failRate: 0, timeoutMode: false })
    const user = userEvent.setup()
    renderWithQueryClient(<RecipientStep onNext={vi.fn()} />)

    await selectBank(user)
    await user.type(screen.getByLabelText('Account number'), '0000089999')

    const retryButton = await screen.findByRole(
      'button',
      { name: 'Retry' },
      { timeout: mockTimeoutMs * 10 },
    )
    expect(retryButton).toHaveClass('shrink-0')
    expect(retryButton).not.toHaveClass('w-full')
  })

  it('sanitises a pasted account number', async () => {
    const user = userEvent.setup()
    renderWithQueryClient(<RecipientStep onNext={vi.fn()} />)

    const field = screen.getByLabelText('Account number')
    field.focus()
    await user.paste('0123 456 789')

    expect(field).toHaveValue('0123456789')
  })

  it('clears the resolved name and disables Next when a digit is edited after resolving', async () => {
    setControls({ fixedLatencyMs: 0, failRate: 0, timeoutMode: false })
    const user = userEvent.setup()
    renderWithQueryClient(<RecipientStep onNext={vi.fn()} />)

    await selectBank(user)
    const field = screen.getByLabelText('Account number')
    await user.type(field, VALID_ACCOUNT_NUMBER)
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Next' })).toBeEnabled()
    })

    await user.type(field, '{backspace}9')

    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled()
  })

  it('clears the account number (and any resolved name) when the bank is changed', async () => {
    setControls({ fixedLatencyMs: 0, failRate: 0, timeoutMode: false })
    const user = userEvent.setup()
    renderWithQueryClient(<RecipientStep onNext={vi.fn()} />)

    await selectBank(user)
    const field = screen.getByLabelText('Account number')
    await user.type(field, VALID_ACCOUNT_NUMBER)
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Next' })).toBeEnabled()
    })

    const bankSelect = screen.getByLabelText('Bank')
    await within(bankSelect).findByRole(
      'option',
      { name: 'Guaranty Trust Bank' },
      { timeout: BANK_LIST_TIMEOUT_MS },
    )
    await user.selectOptions(bankSelect, '058')

    expect(field).toHaveValue('')
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled()
  })

  it('renders a hostile resolved name (account ending in 2222) as literal text', async () => {
    setControls({ fixedLatencyMs: 0, failRate: 0, timeoutMode: false })
    const user = userEvent.setup()
    const { container } = renderWithQueryClient(<RecipientStep onNext={vi.fn()} />)

    await selectBank(user)
    await user.type(screen.getByLabelText('Account number'), '0000042222')

    const hostileName = '<b>Ade</b><img src=x onerror=alert(1)>'
    expect(await screen.findByText(hostileName)).toBeInTheDocument()
    expect(container.querySelector('img')).not.toBeInTheDocument()
  })

  it("blocks the merchant's own account once it resolves, and disables Next", async () => {
    setControls({ fixedLatencyMs: 0, failRate: 0, timeoutMode: false })
    const user = userEvent.setup()
    renderWithQueryClient(<RecipientStep onNext={vi.fn()} />)

    const merchant = getMerchant()
    const bankSelect = screen.getByLabelText('Bank')
    await waitFor(
      () => {
        expect(within(bankSelect).getAllByRole('option').length).toBeGreaterThan(1)
      },
      { timeout: BANK_LIST_TIMEOUT_MS },
    )
    await user.selectOptions(bankSelect, merchant.bankCode)
    await user.type(screen.getByLabelText('Account number'), merchant.accountNumber)

    expect(await screen.findByText("You can't send money to your own account")).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled()
  })
})
