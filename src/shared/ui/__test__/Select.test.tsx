import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { Select } from '../Select'

const BANK_OPTIONS = [
  { value: '011', label: 'First Bank of Nigeria' },
  { value: '058', label: 'Guaranty Trust Bank' },
]

describe('Select', () => {
  it('associates the label and lists every option', () => {
    render(<Select label="Bank" options={BANK_OPTIONS} />)

    const select = screen.getByLabelText('Bank')
    expect(select).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'First Bank of Nigeria' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Guaranty Trust Bank' })).toBeInTheDocument()
  })

  it('shows a disabled placeholder option when given one', () => {
    render(<Select label="Bank" options={BANK_OPTIONS} placeholder="Choose a bank" />)
    expect(screen.getByRole('option', { name: 'Choose a bank' })).toBeDisabled()
  })

  it('lets the user choose an option', async () => {
    const user = userEvent.setup()
    render(<Select label="Bank" options={BANK_OPTIONS} />)

    const select = screen.getByLabelText('Bank')
    await user.selectOptions(select, '058')

    expect(select).toHaveValue('058')
  })

  it('marks the select invalid and links the error message', () => {
    render(<Select label="Bank" options={BANK_OPTIONS} error="Choose a bank" />)

    const select = screen.getByLabelText('Bank')
    expect(select).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByRole('alert')).toHaveTextContent('Choose a bank')
  })
})
