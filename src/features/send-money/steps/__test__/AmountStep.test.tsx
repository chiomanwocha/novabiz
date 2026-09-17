import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { setControls } from '../../../../mocks/controls'
import { setupMockServer } from '../../../../mocks/handlers/__test__/setupMockServer'
import { renderWithQueryClient } from '../../../../test/renderWithQueryClient'
import { AmountStep } from '../AmountStep'

setupMockServer()

// The seeded merchant (src/mocks/db/seed.ts): balance ₦314,500.75, single-transfer limit
// ₦5,000, daily limit ₦20,000 with ₦3,000 already used today (₦17,000 remaining).
async function fillAmount(user: ReturnType<typeof userEvent.setup>, value: string): Promise<void> {
  const field = screen.getByLabelText('Amount')
  await user.clear(field)
  await user.type(field, value)
  await user.tab()
}

describe('AmountStep', () => {
  beforeEach(() => {
    setControls({ fixedLatencyMs: 0, failRate: 0, timeoutMode: false })
  })

  it('rejects zero', async () => {
    const user = userEvent.setup()
    renderWithQueryClient(<AmountStep onBack={vi.fn()} onNext={vi.fn()} />)
    await screen.findByLabelText('Amount')

    await fillAmount(user, '0')

    expect(await screen.findByText('Enter an amount greater than zero')).toBeInTheDocument()
  })

  it('rejects an amount with 3 decimal places', async () => {
    const user = userEvent.setup()
    renderWithQueryClient(<AmountStep onBack={vi.fn()} onNext={vi.fn()} />)
    await screen.findByLabelText('Amount')

    await fillAmount(user, '1.234')

    expect(await screen.findByText('Enter an amount greater than zero')).toBeInTheDocument()
  })

  it('rejects an amount over the single-transfer limit', async () => {
    const user = userEvent.setup()
    renderWithQueryClient(<AmountStep onBack={vi.fn()} onNext={vi.fn()} />)
    await screen.findByLabelText('Amount')

    await fillAmount(user, '5,500.00')

    expect(
      await screen.findByText('This is more than you can send in one transfer'),
    ).toBeInTheDocument()
  })

  it('rejects an amount over the available balance', async () => {
    const user = userEvent.setup()
    renderWithQueryClient(<AmountStep onBack={vi.fn()} onNext={vi.fn()} />)
    await screen.findByLabelText('Amount')

    await fillAmount(user, '400,000.00')

    expect(await screen.findByText('This is more than your available balance')).toBeInTheDocument()
  })

  it('accepts 1,000.50 and submits 100050 kobo', async () => {
    const user = userEvent.setup()
    const onNext = vi.fn()
    renderWithQueryClient(<AmountStep onBack={vi.fn()} onNext={onNext} />)
    await screen.findByLabelText('Amount')

    await fillAmount(user, '1,000.50')
    await user.click(screen.getByRole('button', { name: 'Next' }))

    expect(onNext).toHaveBeenCalledWith({ amountKobo: 100050, narration: '' })
  })

  it('calls onBack when Back is clicked', async () => {
    const user = userEvent.setup()
    const onBack = vi.fn()
    renderWithQueryClient(<AmountStep onBack={onBack} onNext={vi.fn()} />)
    await screen.findByLabelText('Amount')

    await user.click(screen.getByRole('button', { name: 'Back' }))

    expect(onBack).toHaveBeenCalledTimes(1)
  })
})
