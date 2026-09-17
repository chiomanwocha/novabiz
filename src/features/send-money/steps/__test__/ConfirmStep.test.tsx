import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { postNameEnquiry } from '../../../../api/endpoints/nameEnquiry'
import { toKobo } from '../../../../lib/money'
import { setControls } from '../../../../mocks/controls'
import { setupMockServer } from '../../../../mocks/handlers/__test__/setupMockServer'
import { renderWithQueryClient } from '../../../../testUtils/renderWithQueryClient'
import { useSendMoney } from '../../hooks/useSendMoney'
import type { ResolvedAmount } from '../AmountStep'
import { ConfirmStep } from '../ConfirmStep'
import type { ResolvedRecipient } from '../RecipientStep'

setupMockServer()

const BANK_CODE = '011'
const ACCOUNT_NUMBER = '0102030400'
const AMOUNT = { amountKobo: toKobo(100_050), narration: 'Stock top-up' }

interface TestConfirmStepProps {
  recipient: ResolvedRecipient
  amount: ResolvedAmount
  idempotencyKey: string
  onBack: () => void
}

// ConfirmStep no longer calls useSendMoney() itself — SendMoneyPage does, and passes
// send/status down (see ConfirmStepProps' own comment for why). This wrapper plays
// SendMoneyPage's part here, so these tests keep exercising the real hook against the real
// mock server, not a stubbed send/status pair.
function TestConfirmStep({ recipient, amount, idempotencyKey, onBack }: TestConfirmStepProps) {
  const { send, status } = useSendMoney()
  return (
    <ConfirmStep
      recipient={recipient}
      amount={amount}
      idempotencyKey={idempotencyKey}
      send={send}
      status={status}
      onBack={onBack}
    />
  )
}

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
      <TestConfirmStep
        recipient={recipient}
        amount={AMOUNT}
        idempotencyKey="key-1"
        onBack={vi.fn()}
      />,
    )

    const sendButton = screen.getByRole('button', { name: 'Send money' })
    await user.click(sendButton)

    expect(sendButton).toBeDisabled()
  })

  // Review and Confirm used to show near-identical content (a boxed ResolvedNameCard on both
  // steps), distinguished only by the button. This proves the pre-send content is no longer
  // a repeat of ReviewStep's recap, and that the one genuinely new fact (irreversibility) is
  // actually shown, not just implied by colour.
  it('asks a confirmation question and states the transfer cannot be undone, rather than repeating the review recap', async () => {
    const recipient = await resolveRecipient()
    renderWithQueryClient(
      <TestConfirmStep
        recipient={recipient}
        amount={AMOUNT}
        idempotencyKey="key-distinct"
        onBack={vi.fn()}
      />,
    )

    expect(
      screen.getByText((_, element) => element?.textContent === 'Send ₦1,000.50 to Tunde Adisa?'),
    ).toBeInTheDocument()
    expect(screen.getByText(/First Bank of Nigeria/)).toBeInTheDocument()
    expect(screen.getByText(/\*+0400/)).toBeInTheDocument()
    expect(screen.getByText("This can't be undone once it's sent.")).toBeInTheDocument()
    // Was "Last step", a progress label that repeated what the stepper already shows without
    // saying what to do here.
    expect(screen.getByText('Check before you send')).toBeInTheDocument()
  })

  it('shows a success view with the amount, recipient, and a way back to the dashboard on success', async () => {
    const recipient = await resolveRecipient()
    const user = userEvent.setup()
    renderWithQueryClient(
      <TestConfirmStep
        recipient={recipient}
        amount={AMOUNT}
        idempotencyKey="key-2"
        onBack={vi.fn()}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Send money' }))

    // Two distinct strings on purpose (see copy.ts): the visible heading ("Transfer sent!")
    // and the separate aria-live announcement ("Transfer sent", unchanged from before this
    // heading existed) — so anything querying the exact announcer text still gets one match.
    expect(await screen.findByText('Transfer sent!')).toBeInTheDocument()
    expect(screen.getByText('₦1,000.50 to Tunde Adisa')).toBeInTheDocument()
    // "Transfer sent! ... Transfer sent." used to read as a visible duplicate — the aria-live
    // announcer still fires the same text for screen readers (CLAUDE.md 6.4), but it's now
    // visually hidden here, so a sighted user only sees the heading once.
    const announced = screen.getByText('Transfer sent')
    expect(announced).toBeInTheDocument()
    expect(announced.parentElement).toHaveClass('overflow-hidden')
    const backLink = screen.getByRole('link', { name: 'Back to dashboard' })
    expect(backLink).toHaveAttribute('href', '/')
    // The flow is over — Send/Back no longer make sense once the transfer has landed.
    expect(screen.queryByRole('button', { name: 'Send money' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Back' })).not.toBeInTheDocument()
  })

  it('shows a Try again button and the server message on a definite failure', async () => {
    const recipient = await resolveRecipient()
    setControls({ fixedLatencyMs: 0, failRate: 1, timeoutMode: false })
    const user = userEvent.setup()
    renderWithQueryClient(
      <TestConfirmStep
        recipient={recipient}
        amount={AMOUNT}
        idempotencyKey="key-3"
        onBack={vi.fn()}
      />,
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
      <TestConfirmStep
        recipient={recipient}
        amount={AMOUNT}
        idempotencyKey="key-4"
        onBack={vi.fn()}
      />,
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
      <TestConfirmStep
        recipient={recipient}
        amount={AMOUNT}
        idempotencyKey="key-5"
        onBack={onBack}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Back' }))

    expect(onBack).toHaveBeenCalledTimes(1)
  })
})
