import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { toKobo } from '../../../../lib/money'
import type { ResolvedAmount } from '../AmountStep'
import { ConfirmStep } from '../ConfirmStep'
import type { ResolvedRecipient } from '../RecipientStep'

const RECIPIENT: ResolvedRecipient = {
  bankCode: '011',
  bankName: 'First Bank of Nigeria',
  accountNumber: '0102030400',
  accountName: 'Amaka Okafor',
  nameEnquiryRef: 'ref-123',
}

const AMOUNT: ResolvedAmount = { amountKobo: toKobo(100050), narration: '' }

describe('ConfirmStep', () => {
  it('disables Send after the first press and never re-enables it', async () => {
    const user = userEvent.setup()
    render(<ConfirmStep recipient={RECIPIENT} amount={AMOUNT} onBack={vi.fn()} />)

    const sendButton = screen.getByRole('button', { name: 'Send money' })
    expect(sendButton).toBeEnabled()

    await user.click(sendButton)

    expect(sendButton).toBeDisabled()
  })

  it('disables Back once Send has been pressed', async () => {
    const user = userEvent.setup()
    render(<ConfirmStep recipient={RECIPIENT} amount={AMOUNT} onBack={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: 'Send money' }))

    expect(screen.getByRole('button', { name: 'Back' })).toBeDisabled()
  })

  it('calls onBack when Back is clicked before Send', async () => {
    const user = userEvent.setup()
    const onBack = vi.fn()
    render(<ConfirmStep recipient={RECIPIENT} amount={AMOUNT} onBack={onBack} />)

    await user.click(screen.getByRole('button', { name: 'Back' }))

    expect(onBack).toHaveBeenCalledTimes(1)
  })
})
