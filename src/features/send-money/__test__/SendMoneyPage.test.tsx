import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { SendMoneyPage } from '../SendMoneyPage'

describe('SendMoneyPage', () => {
  it('moves focus to the new step heading when advancing to the next step', async () => {
    const user = userEvent.setup()
    render(<SendMoneyPage />)

    expect(screen.getByRole('heading', { name: 'Who are you sending to?' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Next' }))

    expect(screen.getByRole('heading', { name: 'How much?' })).toHaveFocus()
  })

  it('disables Back on the first step and Next on the last step', async () => {
    const user = userEvent.setup()
    render(<SendMoneyPage />)

    expect(screen.getByRole('button', { name: 'Back' })).toBeDisabled()

    await user.click(screen.getByRole('button', { name: 'Next' }))
    await user.click(screen.getByRole('button', { name: 'Next' }))
    await user.click(screen.getByRole('button', { name: 'Next' }))

    expect(screen.getByRole('heading', { name: 'Confirm' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled()
  })

  it('moves back to the previous step heading', async () => {
    const user = userEvent.setup()
    render(<SendMoneyPage />)

    await user.click(screen.getByRole('button', { name: 'Next' }))
    expect(screen.getByRole('heading', { name: 'How much?' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Back' }))
    expect(screen.getByRole('heading', { name: 'Who are you sending to?' })).toHaveFocus()
  })
})
