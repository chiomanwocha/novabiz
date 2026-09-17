import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { formatKobo, toKobo } from '../../../../lib/money'
import { setControls } from '../../../../mocks/controls'
import { setupMockServer } from '../../../../mocks/handlers/__test__/setupMockServer'
import { renderWithQueryClient } from '../../../../testUtils/renderWithQueryClient'
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

  it('caps typed input at 2 decimal places instead of accepting a 3rd digit', async () => {
    const user = userEvent.setup()
    renderWithQueryClient(<AmountStep onBack={vi.fn()} onNext={vi.fn()} />)
    await screen.findByLabelText('Amount')

    const field = screen.getByLabelText('Amount')
    await user.type(field, '1.234')

    expect(field).toHaveValue('1.23')
  })

  it('strips letters and symbols and groups the integer part with commas as it is typed', async () => {
    const user = userEvent.setup()
    renderWithQueryClient(<AmountStep onBack={vi.fn()} onNext={vi.fn()} />)
    await screen.findByLabelText('Amount')

    const field = screen.getByLabelText('Amount')
    await user.type(field, '50a00b0')

    expect(field).toHaveValue('50,000')
  })

  it('rejects an amount over the single-transfer limit, naming the actual limit', async () => {
    const user = userEvent.setup()
    renderWithQueryClient(<AmountStep onBack={vi.fn()} onNext={vi.fn()} />)
    await screen.findByLabelText('Amount')

    await fillAmount(user, '5,500.00')

    expect(
      await screen.findByText(
        `This is more than you can send in one transfer. You can send up to ${formatKobo(toKobo(500_000))} at a time.`,
      ),
    ).toBeInTheDocument()
  })

  it('rejects an amount over the available balance, naming the actual balance', async () => {
    const user = userEvent.setup()
    renderWithQueryClient(<AmountStep onBack={vi.fn()} onNext={vi.fn()} />)
    await screen.findByLabelText('Amount')

    await fillAmount(user, '400,000.00')

    expect(
      await screen.findByText(
        `This is more than your available balance of ${formatKobo(toKobo(31_450_075))}`,
      ),
    ).toBeInTheDocument()
  })

  it('keeps Next disabled while the amount is invalid, live as it is typed — not just after blur or a submit attempt', async () => {
    const user = userEvent.setup()
    renderWithQueryClient(<AmountStep onBack={vi.fn()} onNext={vi.fn()} />)
    await screen.findByLabelText('Amount')

    const field = screen.getByLabelText('Amount')
    const nextButton = screen.getByRole('button', { name: 'Next' })
    expect(nextButton).toBeDisabled()

    // Still over the single-transfer limit — Next must stay disabled without needing a blur.
    await user.type(field, '5,500.00')
    expect(nextButton).toBeDisabled()

    await user.clear(field)
    await user.type(field, '1,000.50')
    expect(nextButton).toBeEnabled()
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
