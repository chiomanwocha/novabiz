import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { postNameEnquiry } from '../../../../api/endpoints/nameEnquiry'
import { toKobo } from '../../../../lib/money'
import { setControls } from '../../../../mocks/controls'
import { setupMockServer } from '../../../../mocks/handlers/__test__/setupMockServer'
import { renderWithQueryClient } from '../../../../test/renderWithQueryClient'
import { ConfirmStep } from '../ConfirmStep'
import type { ResolvedRecipient } from '../RecipientStep'

setupMockServer()

const BANK_CODE = '011'
const ACCOUNT_NUMBER = '0102030400'
const AMOUNT = { amountKobo: toKobo(100_050), narration: 'Stock top-up' }

async function resolveRecipient(): Promise<ResolvedRecipient> {
  const { accountName, nameEnquiryRef } = await postNameEnquiry({
    accountNumber: ACCOUNT_NUMBER,
    bankCode: BANK_CODE,
  })
  return {
    bankCode: BANK_CODE,
    bankName: 'First Bank of Nigeria',
    accountNumber: ACCOUNT_NUMBER,
    accountName,
    nameEnquiryRef,
  }
}

describe('ConfirmStep', () => {
  beforeEach(() => {
    setControls({ fixedLatencyMs: 0, failRate: 0, timeoutMode: false })
  })

  it('disables Send immediately after the first press', async () => {
    const recipient = await resolveRecipient()
    const user = userEvent.setup()
    renderWithQueryClient(
      <ConfirmStep recipient={recipient} amount={AMOUNT} idempotencyKey="key-1" onBack={vi.fn()} />,
    )

    const sendButton = screen.getByRole('button', { name: 'Send money' })
    await user.click(sendButton)

    expect(sendButton).toBeDisabled()
  })

  it('announces "Transfer sent" on success', async () => {
    const recipient = await resolveRecipient()
    const user = userEvent.setup()
    renderWithQueryClient(
      <ConfirmStep recipient={recipient} amount={AMOUNT} idempotencyKey="key-2" onBack={vi.fn()} />,
    )

    await user.click(screen.getByRole('button', { name: 'Send money' }))

    expect(await screen.findByText('Transfer sent')).toBeInTheDocument()
  })

  it('shows a Try again button and the server message on a definite failure', async () => {
    const recipient = await resolveRecipient()
    setControls({ fixedLatencyMs: 0, failRate: 1, timeoutMode: false })
    const user = userEvent.setup()
    renderWithQueryClient(
      <ConfirmStep recipient={recipient} amount={AMOUNT} idempotencyKey="key-3" onBack={vi.fn()} />,
    )

    await user.click(screen.getByRole('button', { name: 'Send money' }))

    expect(
      await screen.findByText('The transfer could not be completed. Please try again.'),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Try again' })).toBeEnabled()
  })

  it('disables Back once Send has been pressed, and re-enables it after a failure', async () => {
    const recipient = await resolveRecipient()
    setControls({ fixedLatencyMs: 0, failRate: 1, timeoutMode: false })
    const user = userEvent.setup()
    renderWithQueryClient(
      <ConfirmStep recipient={recipient} amount={AMOUNT} idempotencyKey="key-4" onBack={vi.fn()} />,
    )

    await user.click(screen.getByRole('button', { name: 'Send money' }))

    await screen.findByRole('button', { name: 'Try again' })
    expect(screen.getByRole('button', { name: 'Back' })).toBeEnabled()
  })

  it('calls onBack when Back is clicked before Send', async () => {
    const recipient = await resolveRecipient()
    const user = userEvent.setup()
    const onBack = vi.fn()
    renderWithQueryClient(
      <ConfirmStep recipient={recipient} amount={AMOUNT} idempotencyKey="key-5" onBack={onBack} />,
    )

    await user.click(screen.getByRole('button', { name: 'Back' }))

    expect(onBack).toHaveBeenCalledTimes(1)
  })
})
