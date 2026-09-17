import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { toKobo } from '../../../../lib/money'
import type { ResolvedAmount } from '../AmountStep'
import type { ResolvedRecipient } from '../RecipientStep'
import { ReviewStep } from '../ReviewStep'

const RECIPIENT: ResolvedRecipient = {
  bankCode: '011',
  bankName: 'First Bank of Nigeria',
  accountNumber: '0102030400',
  accountName: 'Amaka Okafor',
  nameEnquiryRef: 'ref-123',
}

const AMOUNT: ResolvedAmount = { amountKobo: toKobo(100050), narration: 'Stock top-up' }

describe('ReviewStep', () => {
  it('shows the resolved recipient, masked account number, amount, and narration', () => {
    render(<ReviewStep recipient={RECIPIENT} amount={AMOUNT} onBack={vi.fn()} onNext={vi.fn()} />)

    expect(screen.getByText('Amaka Okafor')).toBeInTheDocument()
    expect(screen.getByText(/First Bank of Nigeria/)).toBeInTheDocument()
    expect(screen.getByText(/\*+0400/)).toBeInTheDocument()
    expect(screen.getByText('₦1,000.50')).toBeInTheDocument()
    expect(screen.getByText(/Stock top-up/)).toBeInTheDocument()
  })

  it('omits the narration line when there is none', () => {
    render(
      <ReviewStep
        recipient={RECIPIENT}
        amount={{ amountKobo: toKobo(100050), narration: '' }}
        onBack={vi.fn()}
        onNext={vi.fn()}
      />,
    )

    expect(screen.queryByText(/For:/)).not.toBeInTheDocument()
  })

  it('calls onNext when Continue to confirm is clicked', async () => {
    const user = userEvent.setup()
    const onNext = vi.fn()
    render(<ReviewStep recipient={RECIPIENT} amount={AMOUNT} onBack={vi.fn()} onNext={onNext} />)

    await user.click(screen.getByRole('button', { name: 'Continue to confirm' }))

    expect(onNext).toHaveBeenCalledTimes(1)
  })

  it('calls onBack when Back is clicked', async () => {
    const user = userEvent.setup()
    const onBack = vi.fn()
    render(<ReviewStep recipient={RECIPIENT} amount={AMOUNT} onBack={onBack} onNext={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: 'Back' }))

    expect(onBack).toHaveBeenCalledTimes(1)
  })
})
